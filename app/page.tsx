"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  Clock3,
  FileText,
  Home,
  Inbox,
  Link2,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import clsx from "clsx";
import { initialListings, initialLogs } from "@/lib/data";
import { parseEbaySearchUrl } from "@/lib/ebay-url";
import { compactNumber, formatMoney, formatPercent } from "@/lib/format";
import { calculatePriceDecision } from "@/lib/price-engine";
import type { Listing, ListingStatus, LogEntry, PageKey } from "@/lib/types";

const navItems: Array<{ key: PageKey; label: string; icon: React.ElementType }> = [
  { key: "dashboard", label: "ダッシュボード", icon: Home },
  { key: "approvals", label: "承認待ち", icon: Inbox },
  { key: "settings", label: "設定", icon: Settings },
  { key: "logs", label: "ログ", icon: FileText },
];

const statusMeta: Record<
  ListingStatus,
  { label: string; tone: "success" | "warning" | "error" | "neutral" }
> = {
  updated: { label: "更新済", tone: "success" },
  pending: { label: "承認待ち", tone: "warning" },
  skipped: { label: "スキップ", tone: "neutral" },
  error: { label: "エラー", tone: "error" },
  off: { label: "OFF", tone: "neutral" },
  ended: { label: "Ended", tone: "neutral" },
};

const resultLabel: Record<LogEntry["result"], string> = {
  updated: "更新済",
  pending_approval: "承認待ち",
  skipped: "スキップ",
  error: "エラー",
};

const resultTone: Record<LogEntry["result"], "success" | "warning" | "error" | "neutral"> = {
  updated: "success",
  pending_approval: "warning",
  skipped: "neutral",
  error: "error",
};

type EbayCredentialStatus = {
  ebayEnv: "production";
  redirectUri: string;
  compatibilityLevel: string;
  configured: {
    clientId: boolean;
    clientSecret: boolean;
    devId: boolean;
    refreshToken: boolean;
    redirectUri: boolean;
  };
  masked: {
    clientId: string;
    clientSecret: string;
    devId: string;
    refreshToken: string;
  };
  ready: boolean;
};

type EbayCredentialForm = {
  clientId: string;
  clientSecret: string;
  devId: string;
  refreshToken: string;
  redirectUri: string;
};

const emptyCredentialForm: EbayCredentialForm = {
  clientId: "",
  clientSecret: "",
  devId: "",
  refreshToken: "",
  redirectUri: "http://localhost:3000/api/auth/ebay/callback",
};

export default function PriceSentryApp() {
  const [page, setPage] = useState<PageKey>("dashboard");
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(initialListings[0].itemId);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"detail" | "settings">("detail");
  const [dashboardStatusFilter, setDashboardStatusFilter] = useState("すべて");
  const [dashboardTargetFilter, setDashboardTargetFilter] = useState("すべて");
  const [settingsTab, setSettingsTab] = useState<"global" | "local" | "general">("global");
  const [generalTab, setGeneralTab] = useState<"ebay" | "notify" | "data">("ebay");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState(
    "https://www.ebay.com/sch/i.html?_nkw=FH-P077MD+-junk&_sacat=0&_udlo=90&_udhi=210&LH_BIN=1",
  );
  const [urlMessage, setUrlMessage] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [credentialStatus, setCredentialStatus] = useState<EbayCredentialStatus | null>(null);
  const [credentialForm, setCredentialForm] = useState<EbayCredentialForm>(emptyCredentialForm);
  const [credentialMessage, setCredentialMessage] = useState<string | null>(null);
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.itemId === selectedItemId) ?? listings[0],
    [listings, selectedItemId],
  );

  const approvals = useMemo(
    () => listings.filter((listing) => listing.status === "pending"),
    [listings],
  );

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const meta = statusMeta[listing.status];
      const statusOk =
        dashboardStatusFilter === "すべて" || meta.label === dashboardStatusFilter;
      const targetOk =
        dashboardTargetFilter === "すべて" ||
        (dashboardTargetFilter === "価格調整ON" && listing.settings.enabled) ||
        (dashboardTargetFilter === "価格調整OFF" && !listing.settings.enabled) ||
        (dashboardTargetFilter === "Ended" && listing.listingStatus === "Ended");
      return statusOk && targetOk;
    });
  }, [dashboardStatusFilter, dashboardTargetFilter, listings]);

  const kpis = useMemo(() => {
    const count = (status: ListingStatus) =>
      listings.filter((listing) => listing.status === status).length;
    return [
      { label: "対象", value: compactNumber(listings.filter((l) => l.settings.enabled).length), sub: "今週 +12", tone: "info" },
      { label: "承認待ち", value: compactNumber(count("pending")), sub: "優先度高 8", tone: "warning" },
      { label: "本日更新", value: compactNumber(count("updated")), sub: "平均 -4.2%", tone: "success" },
      { label: "スキップ", value: compactNumber(count("skipped")), sub: "最低価格 41", tone: "neutral" },
      { label: "エラー", value: compactNumber(count("error")), sub: "直近24時間", tone: "error" },
      { label: "推定削減", value: "$1,142", sub: "本日合計", tone: "info" },
      { label: "API使用", value: "4,127", sub: "/ 5,000", tone: "neutral" },
      { label: "次回巡回", value: "15:00", sub: "あと 4h44m", tone: "neutral" },
    ];
  }, [listings]);

  function openDetail(listing: Listing, tab: "detail" | "settings" = "detail") {
    setSelectedItemId(listing.itemId);
    setDetailTab(tab);
    setIsDetailOpen(true);
  }

  function updateListing(itemId: string, updater: (listing: Listing) => Listing) {
    setListings((current) =>
      current.map((listing) => (listing.itemId === itemId ? updater(listing) : listing)),
    );
  }

  function runPriceChecks(targetItemId?: string) {
    setIsRunning(true);
    const checkedAt = new Date().toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setListings((current) => {
      const nextLogs: LogEntry[] = [];
      const nextListings = current.map((listing) => {
        if (targetItemId && listing.itemId !== targetItemId) return listing;
        if (!listing.settings.enabled || listing.listingStatus === "Ended") return listing;

        const adopted = listing.competitors.find((competitor) => competitor.adopted);
        const competitorPrice = adopted?.itemPrice ?? null;
        const competitorShipping = adopted?.shipping ?? null;
        const decision = calculatePriceDecision({
          ownPrice: listing.currentPrice,
          ownShipping: listing.shipping,
          competitorPrice,
          competitorShipping,
          minPrice: listing.settings.minPrice,
          undercutAmount: listing.settings.undercutAmount,
          maxDropPercent: 5,
          autoUpdateEnabled: listing.settings.autoUpdateEnabled,
          isOnSale: listing.isOnSale,
          aiUsed: listing.settings.aiJudgeEnabled,
          aiConfidence: listing.aiConfidence,
          aiAutoThreshold: 0.85,
        });

        const nextStatus: ListingStatus =
          decision.result === "updated"
            ? "updated"
            : decision.result === "pending_approval"
              ? "pending"
              : decision.result === "skipped"
                ? "skipped"
                : "error";
        const currentPrice =
          decision.result === "updated" && decision.suggestedPrice != null
            ? decision.suggestedPrice
            : listing.currentPrice;
        const total =
          listing.shipping == null ? null : Number((currentPrice + listing.shipping).toFixed(2));

        nextLogs.push({
          id: `log-${Date.now()}-${listing.itemId}`,
          at: new Date().toLocaleString("ja-JP"),
          itemId: listing.itemId,
          title: listing.title,
          previousPrice: listing.currentPrice,
          newPrice: decision.result === "updated" ? decision.suggestedPrice : null,
          competitorTotal: decision.competitorTotal,
          result: decision.result,
          reason: decision.reason,
          aiConfidence: listing.aiConfidence,
        });

        return {
          ...listing,
          currentPrice,
          total,
          competitorTotal: decision.competitorTotal,
          suggestedPrice: decision.suggestedPrice,
          changePercent:
            decision.suggestedPrice == null
              ? null
              : Number(
                  (((decision.suggestedPrice - listing.currentPrice) / listing.currentPrice) * 100).toFixed(2),
                ),
          status: nextStatus,
          reason: decision.reason,
          lastCheckedAt: checkedAt,
        };
      });
      setLogs((currentLogs) => [...nextLogs, ...currentLogs]);
      return nextListings;
    });

    window.setTimeout(() => setIsRunning(false), 450);
  }

  function approveListing(itemId: string) {
    updateListing(itemId, (listing) => {
      if (listing.suggestedPrice == null) return listing;
      const nextTotal =
        listing.shipping == null ? null : Number((listing.suggestedPrice + listing.shipping).toFixed(2));
      return {
        ...listing,
        currentPrice: listing.suggestedPrice,
        total: nextTotal,
        status: "updated",
        reason: "承認済み",
      };
    });
  }

  function rejectListing(itemId: string) {
    updateListing(itemId, (listing) => ({
      ...listing,
      status: "skipped",
      reason: "却下済み",
    }));
  }

  function addListingFromUrl() {
    const parsed = parseEbaySearchUrl(urlDraft);
    if (!parsed.ok) {
      setUrlMessage(parsed.error);
      return;
    }

    const itemId = String(406875761000 + listings.length);
    const listing: Listing = {
      ...initialListings[0],
      itemId,
      title: `${parsed.value.searchKeyword} Search Registered`,
      currentPrice: 0,
      shipping: 0,
      total: 0,
      competitorTotal: null,
      suggestedPrice: null,
      changePercent: null,
      status: "off",
      reason: "URL登録済み・価格調整OFF",
      lastCheckedAt: "-",
      aiConfidence: null,
      isOnSale: false,
      listingStatus: "Active",
      settings: {
        ...initialListings[0].settings,
        enabled: false,
        searchUrl: urlDraft,
        searchKeyword: parsed.value.searchKeyword,
        requiredTitleKeywords: parsed.value.requiredTitleKeywords,
        excludedTitleKeywords: parsed.value.excludedTitleKeywords,
      },
      competitors: [],
    };

    setListings((current) => [listing, ...current]);
    setSelectedItemId(itemId);
    setUrlMessage("検索URLを解析して登録しました");
    setIsAddOpen(false);
  }

  async function loadPersistedListings() {
    const response = await fetch("/api/listings", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { listings?: Listing[] };
    if (data.listings?.length) {
      setListings(data.listings);
      setSelectedItemId((current) => current ?? data.listings?.[0]?.itemId ?? null);
    }
  }

  async function loadCredentialStatus() {
    const response = await fetch("/api/settings/ebay-credentials", { cache: "no-store" });
    if (!response.ok) return;
    const status = (await response.json()) as EbayCredentialStatus;
    setCredentialStatus(status);
    setCredentialForm((current) => ({
      ...current,
      redirectUri: status.redirectUri,
    }));
  }

  useEffect(() => {
    void loadPersistedListings();
    void loadCredentialStatus();
  }, []);

  async function saveCredentials() {
    setIsSavingCredentials(true);
    setCredentialMessage(null);
    try {
      const response = await fetch("/api/settings/ebay-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentialForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "保存に失敗しました");
      setCredentialStatus(data as EbayCredentialStatus);
      setCredentialForm((current) => ({
        ...emptyCredentialForm,
        redirectUri: current.redirectUri,
      }));
      setCredentialMessage(".env.local に保存しました。秘密情報は再表示しません。");
    } catch (error) {
      setCredentialMessage(error instanceof Error ? error.message : "保存に失敗しました");
    } finally {
      setIsSavingCredentials(false);
    }
  }

  async function diagnoseConnection() {
    setIsDiagnosing(true);
    setCredentialMessage(null);
    try {
      const response = await fetch("/api/ebay/diagnose", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "接続診断に失敗しました");
      setCredentialMessage(
        `接続成功: ${data.result?.userId ?? "seller"} / production`,
      );
    } catch (error) {
      setCredentialMessage(error instanceof Error ? error.message : "接続診断に失敗しました");
    } finally {
      setIsDiagnosing(false);
    }
  }

  async function syncListingsFromEbay() {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const response = await fetch("/api/ebay/listings/sync", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "eBay同期に失敗しました");
      const syncedListings = data.listings as Listing[];
      setListings(syncedListings);
      setSelectedItemId(syncedListings[0]?.itemId ?? null);
      setSyncMessage(`${syncedListings.length} 件のActive出品を同期しました`);
      setLogs((currentLogs) => [
        {
          id: `log-sync-${Date.now()}`,
          at: new Date().toLocaleString("ja-JP"),
          itemId: "-",
          title: "eBay 出品同期",
          previousPrice: null,
          newPrice: null,
          competitorTotal: null,
          result: "updated",
          reason: `${syncedListings.length} 件を同期`,
          aiConfidence: null,
        },
        ...currentLogs,
      ]);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "eBay同期に失敗しました");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} pendingCount={approvals.length} onPageChange={setPage} />
      <main className="main">
        <TopBar />
        <div className="content">
          {page === "dashboard" && (
            <DashboardPage
              listings={filteredListings}
              allCount={listings.length}
              kpis={kpis}
              statusFilter={dashboardStatusFilter}
              targetFilter={dashboardTargetFilter}
              isRunning={isRunning}
              isSyncing={isSyncing}
              syncMessage={syncMessage}
              onStatusFilter={setDashboardStatusFilter}
              onTargetFilter={setDashboardTargetFilter}
              onOpenDetail={openDetail}
              onRun={() => runPriceChecks()}
              onSync={syncListingsFromEbay}
              onAdd={() => {
                setUrlMessage(null);
                setIsAddOpen(true);
              }}
            />
          )}

          {page === "approvals" && (
            <ApprovalsPage
              approvals={approvals}
              onOpenDetail={openDetail}
              onApprove={approveListing}
              onReject={rejectListing}
            />
          )}

          {page === "settings" && (
            <SettingsPage
              listings={listings}
              settingsTab={settingsTab}
              generalTab={generalTab}
              onSettingsTab={setSettingsTab}
              onGeneralTab={setGeneralTab}
              onOpenSettings={(listing) => openDetail(listing, "settings")}
              credentialStatus={credentialStatus}
              credentialForm={credentialForm}
              credentialMessage={credentialMessage}
              isSavingCredentials={isSavingCredentials}
              isDiagnosing={isDiagnosing}
              onCredentialFormChange={setCredentialForm}
              onSaveCredentials={saveCredentials}
              onDiagnoseConnection={diagnoseConnection}
            />
          )}

          {page === "logs" && <LogsPage logs={logs} />}
        </div>
      </main>

      <MobileBottomNav page={page} pendingCount={approvals.length} onPageChange={setPage} />

      {selectedListing && (
        <DetailModal
          listing={selectedListing}
          open={isDetailOpen}
          tab={detailTab}
          listings={listings}
          onTabChange={setDetailTab}
          onClose={() => setIsDetailOpen(false)}
          onRun={() => runPriceChecks(selectedListing.itemId)}
          onApprove={() => approveListing(selectedListing.itemId)}
          onReject={() => rejectListing(selectedListing.itemId)}
          onNavigate={(direction) => {
            const index = listings.findIndex((listing) => listing.itemId === selectedListing.itemId);
            const nextIndex =
              direction === "previous"
                ? Math.max(0, index - 1)
                : Math.min(listings.length - 1, index + 1);
            setSelectedItemId(listings[nextIndex].itemId);
          }}
          onUpdate={(next) => updateListing(selectedListing.itemId, () => next)}
        />
      )}

      <AddUrlModal
        open={isAddOpen}
        url={urlDraft}
        message={urlMessage}
        onUrlChange={setUrlDraft}
        onClose={() => setIsAddOpen(false)}
        onSubmit={addListingFromUrl}
      />
    </div>
  );
}

function Sidebar({
  page,
  pendingCount,
  onPageChange,
}: {
  page: PageKey;
  pendingCount: number;
  onPageChange: (page: PageKey) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <ShieldCheck size={15} />
        </span>
        <span>eBay Price Sentry</span>
      </div>
      <nav className="nav" aria-label="メインメニュー">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={clsx("nav-button", page === item.key && "active")}
              onClick={() => onPageChange(item.key)}
            >
              <Icon size={15} />
              <span>{item.label}</span>
              {item.key === "approvals" && pendingCount > 0 && (
                <span className="badge-count">{pendingCount}</span>
              )}
            </button>
          );
        })}
      </nav>
      <button className="collapse-button" title="折りたたむ">
        <ChevronLeft size={15} />
        折りたたむ
      </button>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="topbar">
      <div className="mobile-title">eBay Price Sentry</div>
      <div className="auto-pill">
        自動反映 <span className="switch on" aria-hidden="true" /> ON
      </div>
      <div className="muted topbar-sync">
        <Clock3 size={13} /> 最終同期 10:16
      </div>
    </header>
  );
}

function MobileBottomNav({
  page,
  pendingCount,
  onPageChange,
}: {
  page: PageKey;
  pendingCount: number;
  onPageChange: (page: PageKey) => void;
}) {
  return (
    <nav className="mobile-bottom-nav" aria-label="モバイルメニュー">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            className={page === item.key ? "active" : undefined}
            onClick={() => onPageChange(item.key)}
          >
            <Icon size={16} />
            <span>{item.label}</span>
            {item.key === "approvals" && pendingCount > 0 && (
              <span className="mobile-nav-count">{pendingCount}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function DashboardPage({
  listings,
  allCount,
  kpis,
  statusFilter,
  targetFilter,
  isRunning,
  isSyncing,
  syncMessage,
  onStatusFilter,
  onTargetFilter,
  onOpenDetail,
  onRun,
  onSync,
  onAdd,
}: {
  listings: Listing[];
  allCount: number;
  kpis: Array<{ label: string; value: string; sub: string; tone: string }>;
  statusFilter: string;
  targetFilter: string;
  isRunning: boolean;
  isSyncing: boolean;
  syncMessage: string | null;
  onStatusFilter: (filter: string) => void;
  onTargetFilter: (filter: string) => void;
  onOpenDetail: (listing: Listing) => void;
  onRun: () => void;
  onSync: () => void;
  onAdd: () => void;
}) {
  return (
    <section>
      <PageHead
        title="ダッシュボード"
        meta="5月4日 ・ 1日3巡回 ・ 最終 10:16"
        actions={
          <>
            <button className="btn" onClick={onRun}>
              {isRunning ? <Loader2 className="spin" size={14} /> : <RefreshCcw size={14} />}
              巡回
            </button>
            <button className="btn" onClick={onSync} disabled={isSyncing}>
              {isSyncing ? <Loader2 className="spin" size={14} /> : <Upload size={14} />}
              同期
            </button>
            <button className="btn primary" onClick={onAdd}>
              <Plus size={14} />
              追加
            </button>
          </>
        }
      />
      {syncMessage && (
        <div className={clsx("notice", syncMessage.includes("失敗") || syncMessage.includes("不足") ? "error" : "success")}>
          {syncMessage}
        </div>
      )}
      <KpiStrip kpis={kpis} />
      <div className="card table-shell desktop-table">
        <div className="table-tools">
          <span className="table-title">リスティング</span>
          <span className="table-count">{compactNumber(allCount)}</span>
          <span className="muted">状態</span>
          <FilterTabs
            options={["すべて", "承認待ち", "更新済", "スキップ", "エラー"]}
            active={statusFilter}
            onChange={onStatusFilter}
          />
          <span className="muted">対象</span>
          <FilterTabs
            options={["すべて", "価格調整ON", "価格調整OFF", "Ended"]}
            active={targetFilter}
            onChange={onTargetFilter}
          />
          <div className="table-search">
            <Search size={13} />
            <span>商品名・Item ID</span>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="check-col">
                  <input type="checkbox" aria-label="一括選択" />
                </th>
                <th className="bar-col" />
                <th>商品</th>
                <th>Item No</th>
                <th className="num">現在</th>
                <th className="num">送料</th>
                <th className="num">合計</th>
                <th>時刻</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <ListingRow key={listing.itemId} listing={listing} onOpen={onOpenDetail} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="footer-line">
          <span>{compactNumber(allCount)} 件中 1〜{Math.min(listings.length, 20)} 件</span>
          <span>1 2 3 4 5 ... 63</span>
        </div>
      </div>
      <div className="mobile-list">
        {listings.map((listing) => (
          <MobileListingRow key={listing.itemId} listing={listing} onOpen={onOpenDetail} />
        ))}
      </div>
    </section>
  );
}

function ApprovalsPage({
  approvals,
  onOpenDetail,
  onApprove,
  onReject,
}: {
  approvals: Listing[];
  onOpenDetail: (listing: Listing) => void;
  onApprove: (itemId: string) => void;
  onReject: (itemId: string) => void;
}) {
  const reasonCounts = ["5%下落", "最低価格", "AI信頼度", "送料不明", "価格変動"].map(
    (label, index) => ({
      label,
      value: String(Math.max(0, approvals.length - index * 2)),
      sub: "理由内訳",
      tone: "warning",
    }),
  );

  return (
    <section>
      <PageHead
        title="承認待ち"
        meta="期限切れは設定に従って自動変更"
        actions={
          <>
            <button className="btn primary" onClick={() => approvals.forEach((item) => onApprove(item.itemId))}>
              <Check size={14} />
              一括承認
            </button>
            <button className="btn danger" onClick={() => approvals.forEach((item) => onReject(item.itemId))}>
              <X size={14} />
              一括却下
            </button>
          </>
        }
      />
      <KpiStrip kpis={reasonCounts} />
      <div className="card table-shell desktop-table">
        <div className="table-tools">
          <span className="table-title">承認キュー</span>
          <span className="table-count">{approvals.length}</span>
          <FilterTabs
            options={["すべて", "5%下落", "最低価格", "AI信頼度", "送料不明", "価格変動"]}
            active="すべて"
            onChange={() => undefined}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>商品</th>
                <th>Item No</th>
                <th className="num">現在</th>
                <th className="num">推奨</th>
                <th className="num">変動%</th>
                <th>理由</th>
                <th>待機時間</th>
                <th>承認</th>
                <th>却下</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((listing, index) => (
                <tr key={listing.itemId} onClick={() => onOpenDetail(listing)}>
                  <td>
                    <ItemTitle listing={listing} />
                  </td>
                  <td className="mono muted">{listing.itemId}</td>
                  <td className="num mono">{formatMoney(listing.currentPrice)}</td>
                  <td className="num mono primary-text">{formatMoney(listing.suggestedPrice)}</td>
                  <td className="num mono danger-text">{formatPercent(listing.changePercent)}</td>
                  <td>
                    <span className="pill warning">{listing.reason}</span>
                  </td>
                  <td className="mono muted">{index + 2}h</td>
                  <td>
                    <button
                      className="icon-btn success"
                      title="承認"
                      onClick={(event) => {
                        event.stopPropagation();
                        onApprove(listing.itemId);
                      }}
                    >
                      <Check size={14} />
                    </button>
                  </td>
                  <td>
                    <button
                      className="icon-btn danger"
                      title="却下"
                      onClick={(event) => {
                        event.stopPropagation();
                        onReject(listing.itemId);
                      }}
                    >
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mobile-list">
        {approvals.map((listing) => (
          <article key={listing.itemId} className="mobile-row" onClick={() => onOpenDetail(listing)}>
            <StatusBar status={listing.status} />
            <div className="mobile-copy">
              <div className="mobile-title-text">{listing.title}</div>
              <div className="mobile-meta mono">
                {listing.itemId} / {formatMoney(listing.currentPrice)} {"->"} {formatMoney(listing.suggestedPrice)} /{" "}
                {formatPercent(listing.changePercent)}
              </div>
              <span className="pill warning">{listing.reason}</span>
            </div>
            <div className="mobile-actions">
              <button
                className="icon-btn success"
                onClick={(event) => {
                  event.stopPropagation();
                  onApprove(listing.itemId);
                }}
              >
                <Check size={14} />
              </button>
              <button
                className="icon-btn danger"
                onClick={(event) => {
                  event.stopPropagation();
                  onReject(listing.itemId);
                }}
              >
                <X size={14} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsPage({
  listings,
  settingsTab,
  generalTab,
  credentialStatus,
  credentialForm,
  credentialMessage,
  isSavingCredentials,
  isDiagnosing,
  onSettingsTab,
  onGeneralTab,
  onOpenSettings,
  onCredentialFormChange,
  onSaveCredentials,
  onDiagnoseConnection,
}: {
  listings: Listing[];
  settingsTab: "global" | "local" | "general";
  generalTab: "ebay" | "notify" | "data";
  credentialStatus: EbayCredentialStatus | null;
  credentialForm: EbayCredentialForm;
  credentialMessage: string | null;
  isSavingCredentials: boolean;
  isDiagnosing: boolean;
  onSettingsTab: (tab: "global" | "local" | "general") => void;
  onGeneralTab: (tab: "ebay" | "notify" | "data") => void;
  onOpenSettings: (listing: Listing) => void;
  onCredentialFormChange: (form: EbayCredentialForm) => void;
  onSaveCredentials: () => void;
  onDiagnoseConnection: () => void;
}) {
  const localOverrides = listings.filter(
    (listing) =>
      listing.settings.minPrice !== 90 ||
      listing.settings.undercutAmount !== 0.01 ||
      listing.settings.localCheckTimeSlots.length !== 3 ||
      !listing.settings.autoUpdateEnabled,
  );

  return (
    <section>
      <PageHead
        title="設定"
        meta="グローバル設定・ローカル設定一覧・全般"
        actions={<button className="btn primary">保存</button>}
      />
      <div className="tabs section-tabs">
        <TabButton active={settingsTab === "global"} onClick={() => onSettingsTab("global")}>
          グローバル設定
        </TabButton>
        <TabButton active={settingsTab === "local"} onClick={() => onSettingsTab("local")}>
          ローカル設定一覧
        </TabButton>
        <TabButton active={settingsTab === "general"} onClick={() => onSettingsTab("general")}>
          全般
        </TabButton>
      </div>

      {settingsTab === "global" && (
        <div className="card settings-card">
          <Section title="巡回時刻プリセット">
            <div className="form-grid">
              <Field label="時刻プリセット（最大5つ）">
                <div className="chips">
                  {["09:00", "13:00", "17:00", "20:00", "23:00"].map((slot) => (
                    <span className="chip" key={slot}>
                      {slot}
                    </span>
                  ))}
                </div>
              </Field>
              <Field label="デフォルト時刻">
                <div className="chips">
                  {["09:00", "17:00", "20:00"].map((slot) => (
                    <span className="chip active" key={slot}>
                      {slot}
                    </span>
                  ))}
                </div>
              </Field>
            </div>
          </Section>
          <Section title="ガード設定">
            <div className="form-grid">
              <Field label="5%下落">
                <input className="control" defaultValue="5.00%" />
              </Field>
              <Field label="AI閾値">
                <input className="control" defaultValue="0.85" />
              </Field>
              <Field label="コンディション一致">
                <select className="control" defaultValue="ON">
                  <option>ON</option>
                  <option>OFF</option>
                </select>
              </Field>
              <Field label="For parts等除外">
                <select className="control" defaultValue="ON">
                  <option>ON</option>
                  <option>OFF</option>
                </select>
              </Field>
            </div>
          </Section>
          <Section title="デフォルト値・全体設定">
            <div className="form-grid">
              <Field label="値下げ幅">
                <input className="control" defaultValue="$0.01" />
              </Field>
              <Field label="最低価格">
                <input className="control" defaultValue="$90.00" />
              </Field>
              <Field label="タイムゾーン">
                <input className="control" defaultValue="Asia/Tokyo" />
              </Field>
              <Field label="Automation 緊急停止">
                <select className="control" defaultValue="OFF">
                  <option>OFF</option>
                  <option>ON</option>
                </select>
              </Field>
            </div>
          </Section>
        </div>
      )}

      {settingsTab === "local" && (
        <>
          <div className="card table-shell desktop-table">
            <div className="table-tools">
              <span className="table-title">ローカル設定一覧</span>
              <span className="table-count">{localOverrides.length}</span>
              <FilterTabs
                options={["すべて", "最低価格", "値下げ幅", "時刻", "AI判定"]}
                active="すべて"
                onChange={() => undefined}
              />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>商品</th>
                    <th>Item No</th>
                    <th className="num">上書き項目数</th>
                    <th>上書き項目</th>
                    <th>メニュー</th>
                  </tr>
                </thead>
                <tbody>
                  {localOverrides.map((listing) => (
                    <tr key={listing.itemId} onClick={() => onOpenSettings(listing)}>
                      <td>
                        <ItemTitle listing={listing} />
                      </td>
                      <td className="mono muted">{listing.itemId}</td>
                      <td className="num mono">4</td>
                      <td>
                        <span className="pill">最低価格</span>{" "}
                        <span className="pill">時刻</span>{" "}
                        <span className="pill">AI判定</span>
                      </td>
                      <td>
                        <button className="btn" onClick={(event) => event.stopPropagation()}>
                          リセット
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mobile-list">
            {localOverrides.map((listing) => (
              <article key={listing.itemId} className="mobile-row" onClick={() => onOpenSettings(listing)}>
                <StatusBar status={listing.status} />
                <div className="mobile-copy">
                  <div className="mobile-title-text">{listing.title}</div>
                  <div className="mobile-meta mono">{listing.itemId}</div>
                  <div className="chips">
                    <span className="chip">最低価格</span>
                    <span className="chip">時刻</span>
                    <span className="chip">AI判定</span>
                  </div>
                </div>
                <MoreHorizontal size={16} />
              </article>
            ))}
          </div>
        </>
      )}

      {settingsTab === "general" && (
        <div>
          <div className="tabs section-tabs">
            <TabButton active={generalTab === "ebay"} onClick={() => onGeneralTab("ebay")}>
              eBay 連携
            </TabButton>
            <TabButton active={generalTab === "notify"} onClick={() => onGeneralTab("notify")}>
              通知
            </TabButton>
            <TabButton active={generalTab === "data"} onClick={() => onGeneralTab("data")}>
              データ管理
            </TabButton>
          </div>
          {generalTab === "ebay" && (
            <div className="card settings-card">
              <Section title="eBay 連携">
                <div className="connection-summary">
                  <span className={clsx("pill", credentialStatus?.ready ? "success" : "warning")}>
                    {credentialStatus?.ready ? "API認証情報 設定済み" : "API認証情報 未完了"}
                  </span>
                  <span className="muted">
                    production API固定 / 保存先: .env.local / 表示はマスクのみ / 出品同期はTrading API GetMyeBaySelling
                  </span>
                </div>
                <div className="form-grid">
                  <Field label="App ID / Client ID">
                    <input
                      className="control"
                      value={credentialForm.clientId}
                      placeholder={credentialStatus?.masked.clientId ?? "未設定"}
                      onChange={(event) =>
                        onCredentialFormChange({ ...credentialForm, clientId: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Cert ID / Client Secret">
                    <input
                      className="control"
                      type="password"
                      value={credentialForm.clientSecret}
                      placeholder={credentialStatus?.masked.clientSecret ?? "未設定"}
                      onChange={(event) =>
                        onCredentialFormChange({ ...credentialForm, clientSecret: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Dev ID">
                    <input
                      className="control"
                      value={credentialForm.devId}
                      placeholder={credentialStatus?.masked.devId ?? "未設定"}
                      onChange={(event) =>
                        onCredentialFormChange({ ...credentialForm, devId: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Refresh Token">
                    <textarea
                      className="control textarea secret-textarea"
                      value={credentialForm.refreshToken}
                      placeholder={credentialStatus?.masked.refreshToken ?? "未設定"}
                      onChange={(event) =>
                        onCredentialFormChange({ ...credentialForm, refreshToken: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Redirect URI / RuName">
                    <input
                      className="control"
                      value={credentialForm.redirectUri}
                      onChange={(event) =>
                        onCredentialFormChange({ ...credentialForm, redirectUri: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="登録状態">
                    <div className="credential-grid">
                      <span>Client ID: {credentialStatus?.masked.clientId ?? "未設定"}</span>
                      <span>Client Secret: {credentialStatus?.masked.clientSecret ?? "未設定"}</span>
                      <span>Dev ID: {credentialStatus?.masked.devId ?? "未設定"}</span>
                      <span>Refresh Token: {credentialStatus?.masked.refreshToken ?? "未設定"}</span>
                    </div>
                  </Field>
                </div>
                <div className="settings-actions">
                  <button className="btn primary" onClick={onSaveCredentials} disabled={isSavingCredentials}>
                    {isSavingCredentials ? <Loader2 className="spin" size={14} /> : <Check size={14} />}
                    .env.local に保存
                  </button>
                  <button className="btn" onClick={onDiagnoseConnection} disabled={isDiagnosing}>
                    {isDiagnosing ? <Loader2 className="spin" size={14} /> : <RefreshCcw size={14} />}
                    接続診断
                  </button>
                  <a
                    className="btn"
                    href="https://developer.ebay.com/api-docs/static/oauth-tokens.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Link2 size={14} />
                    OAuthガイド
                  </a>
                </div>
                {credentialMessage && (
                  <div className={clsx("notice", credentialMessage.includes("成功") || credentialMessage.includes("保存") ? "success" : "error")}>
                    {credentialMessage}
                  </div>
                )}
              </Section>
            </div>
          )}
          {generalTab === "notify" && (
            <div className="card settings-card">
              <Section title="通知">
                <div className="form-grid">
                  <Field label="チャンネル">
                    <div className="chips">
                      <span className="chip active">アプリ内</span>
                      <span className="chip">メール</span>
                      <span className="chip">Slack</span>
                      <span className="chip">Discord</span>
                    </div>
                  </Field>
                  <Field label="通知タイミング">
                    <div className="chips">
                      <span className="chip active">即時</span>
                      <span className="chip">日次サマリー</span>
                    </div>
                  </Field>
                  <Field label="通知種別">
                    <div className="chips">
                      <span className="chip">承認待ち発生</span>
                      <span className="chip">APIエラー</span>
                      <span className="chip">トークン期限切れ</span>
                    </div>
                  </Field>
                </div>
              </Section>
            </div>
          )}
          {generalTab === "data" && (
            <div className="card settings-card">
              <Section title="データ管理">
                <div className="form-grid">
                  <Field label="ログ保持期間">
                    <select className="control" defaultValue="90日">
                      <option>30日</option>
                      <option>90日</option>
                      <option>180日</option>
                    </select>
                  </Field>
                  <Field label="承認待ち期限">
                    <select className="control" defaultValue="7日">
                      <option>24時間</option>
                      <option>7日</option>
                      <option>期限なし</option>
                    </select>
                  </Field>
                  <Field label="データエクスポート">
                    <button className="btn">CSV ダウンロード</button>
                  </Field>
                  <Field label="アカウント削除">
                    <button className="btn danger">確認モーダルを開く</button>
                  </Field>
                </div>
              </Section>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function LogsPage({ logs }: { logs: LogEntry[] }) {
  return (
    <section>
      <PageHead
        title="ログ"
        meta="価格判定・更新・APIエラー"
        actions={
          <>
            <button className="btn">期間</button>
            <button className="btn">判定結果</button>
            <button className="btn danger">
              <AlertTriangle size={14} />
              APIエラーのみ
            </button>
          </>
        }
      />
      <div className="card table-shell desktop-table">
        <div className="table-tools">
          <span className="table-title">実行ログ</span>
          <span className="table-count">{logs.length}</span>
          <div className="table-search">
            <Search size={13} />
            <span>Item ID</span>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>日時</th>
                <th className="bar-col" />
                <th>Item No</th>
                <th>商品</th>
                <th className="num">旧価格</th>
                <th className="num">新価格</th>
                <th className="num">ライバル</th>
                <th>判定</th>
                <th className="num">AI</th>
                <th>メニュー</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="mono muted">{log.at}</td>
                  <td>
                    <span className={clsx("statusbar", resultTone[log.result])} />
                  </td>
                  <td className="mono muted">{log.itemId}</td>
                  <td>
                    <span className="ellipsis">{log.title}</span>
                  </td>
                  <td className="num mono">{formatMoney(log.previousPrice)}</td>
                  <td className="num mono primary-text">{formatMoney(log.newPrice)}</td>
                  <td className="num mono">{formatMoney(log.competitorTotal)}</td>
                  <td>
                    <span className={clsx("status", resultTone[log.result])}>
                      <span className={clsx("dot", resultTone[log.result])} />
                      {resultLabel[log.result]}
                    </span>
                  </td>
                  <td className="num mono">{log.aiConfidence == null ? "-" : log.aiConfidence.toFixed(2)}</td>
                  <td>
                    <button className="icon-btn" title="詳細">
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mobile-list">
        {logs.map((log) => (
          <article key={log.id} className="mobile-row">
            <span className={clsx("statusbar", resultTone[log.result])} />
            <div className="mobile-copy">
              <div className="mobile-title-text">{log.title}</div>
              <div className="mobile-meta mono">
                {log.at} / {log.itemId} / {formatMoney(log.previousPrice)} {"->"} {formatMoney(log.newPrice)}
              </div>
              <span className="muted">{log.reason}</span>
            </div>
            <span className={clsx("pill", resultTone[log.result])}>{resultLabel[log.result]}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function DetailModal({
  listing,
  open,
  tab,
  listings,
  onTabChange,
  onClose,
  onRun,
  onApprove,
  onReject,
  onNavigate,
  onUpdate,
}: {
  listing: Listing;
  open: boolean;
  tab: "detail" | "settings";
  listings: Listing[];
  onTabChange: (tab: "detail" | "settings") => void;
  onClose: () => void;
  onRun: () => void;
  onApprove: () => void;
  onReject: () => void;
  onNavigate: (direction: "previous" | "next") => void;
  onUpdate: (listing: Listing) => void;
}) {
  if (!open) return null;
  const meta = statusMeta[listing.status];
  const currentIndex = listings.findIndex((item) => item.itemId === listing.itemId);

  return (
    <div className="modal-backdrop open" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <span className={clsx("pill", meta.tone)}>{meta.label}</span>
          <div className="modal-title">
            <strong>{listing.title}</strong>
            <span className="mono muted">Item ID {listing.itemId}</span>
          </div>
          <button className="icon-btn" onClick={onClose} title="閉じる">
            <X size={15} />
          </button>
        </div>
        <div className="tabs modal-tabs">
          <TabButton active={tab === "detail"} onClick={() => onTabChange("detail")}>
            詳細
          </TabButton>
          <TabButton active={tab === "settings"} onClick={() => onTabChange("settings")}>
            設定
          </TabButton>
        </div>
        <div className="modal-body">
          {tab === "detail" && (
            <div className="modal-pane">
              <div className="compare-strip">
                <Metric label="自分合計" value={formatMoney(listing.total)} />
                <Metric label="ライバル合計" value={formatMoney(listing.competitorTotal)} tone="warning" />
                <Metric label="推奨価格" value={formatMoney(listing.suggestedPrice)} tone="primary" />
                <Metric label="変動" value={formatPercent(listing.changePercent)} tone={listing.changePercent != null && listing.changePercent < 0 ? "danger" : "success"} />
              </div>

              <div className="guard-grid">
                <Guard label="最低価格" value={formatMoney(listing.settings.minPrice)} ok={listing.settings.minPrice != null && listing.status !== "skipped"} />
                <Guard label="5%下落" value={listing.reason.includes("5%") ? "抵触" : "OK"} ok={!listing.reason.includes("5%")} />
                <Guard label="セール中" value={listing.isOnSale ? "ON" : "OFF"} ok={!listing.isOnSale} />
                <Guard label="送料取得" value={listing.shipping == null ? "不明" : formatMoney(listing.shipping)} ok={listing.shipping != null} />
                <Guard label="AI同一商品" value={listing.aiConfidence == null ? "-" : listing.aiConfidence.toFixed(2)} ok={listing.aiConfidence == null || listing.aiConfidence >= 0.85} />
              </div>

              <div className="rank-table cardless-table">
                <div className="subhead">価格ランキング</div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>順位</th>
                        <th>セラーID</th>
                        <th className="num">商品価格</th>
                        <th className="num">送料</th>
                        <th className="num">合計</th>
                        <th className="num">差</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listing.competitors.slice(0, 10).map((competitor) => (
                        <tr
                          key={`${competitor.rank}-${competitor.sellerId}`}
                          className={clsx(competitor.adopted && "adopted-rival", competitor.sellerId === "あなた" && "own-rank")}
                        >
                          <td className="mono">#{competitor.rank}</td>
                          <td className={clsx("seller-cell", competitor.adopted && "adopted-note")}>
                            {competitor.sellerId}
                          </td>
                          <td className="num mono">{formatMoney(competitor.itemPrice)}</td>
                          <td className="num mono">{formatMoney(competitor.shipping)}</td>
                          <td className="num mono">{formatMoney(competitor.total)}</td>
                          <td className={clsx("num mono", competitor.deltaFromOwn != null && competitor.deltaFromOwn < 0 ? "danger-text" : "success-text")}>
                            {formatMoney(competitor.deltaFromOwn)}
                          </td>
                        </tr>
                      ))}
                      {listing.competitors.length === 0 && (
                        <tr>
                          <td colSpan={6} className="empty-cell">
                            ライバル候補はまだ保存されていません
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="modal-pane">
              <Section title="価格関連">
                <div className="form-grid">
                  <Field label="価格調整対象">
                    <SwitchField
                      checked={listing.settings.enabled}
                      onChange={(enabled) =>
                        onUpdate({
                          ...listing,
                          status: enabled ? "updated" : "off",
                          settings: { ...listing.settings, enabled },
                        })
                      }
                    />
                  </Field>
                  <Field label="検索URL">
                    <input
                      className="control"
                      value={listing.settings.searchUrl}
                      onChange={(event) =>
                        onUpdate({
                          ...listing,
                          settings: { ...listing.settings, searchUrl: event.target.value },
                        })
                      }
                    />
                  </Field>
                  <Field label="最低価格">
                    <input
                      className="control"
                      type="number"
                      value={listing.settings.minPrice ?? ""}
                      onChange={(event) =>
                        onUpdate({
                          ...listing,
                          settings: {
                            ...listing.settings,
                            minPrice: event.target.value ? Number(event.target.value) : null,
                          },
                        })
                      }
                    />
                  </Field>
                  <Field label="値下げ幅">
                    <input
                      className="control"
                      type="number"
                      step="0.01"
                      value={listing.settings.undercutAmount}
                      onChange={(event) =>
                        onUpdate({
                          ...listing,
                          settings: { ...listing.settings, undercutAmount: Number(event.target.value) },
                        })
                      }
                    />
                  </Field>
                  <Field label="自動反映">
                    <SwitchField
                      checked={listing.settings.autoUpdateEnabled}
                      onChange={(autoUpdateEnabled) =>
                        onUpdate({
                          ...listing,
                          settings: { ...listing.settings, autoUpdateEnabled },
                        })
                      }
                    />
                  </Field>
                </div>
              </Section>
              <Section title="巡回">
                <div className="chips">
                  {["09:00", "13:00", "17:00", "20:00", "23:00"].map((slot) => {
                    const checked = listing.settings.localCheckTimeSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        className={clsx("chip button-chip", checked && "active")}
                        onClick={() => {
                          const nextSlots = checked
                            ? listing.settings.localCheckTimeSlots.filter((item) => item !== slot)
                            : [...listing.settings.localCheckTimeSlots, slot];
                          onUpdate({
                            ...listing,
                            settings: { ...listing.settings, localCheckTimeSlots: nextSlots },
                          });
                        }}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </Section>
              <Section title="値上げ・フィルタ・判定">
                <div className="form-grid">
                  <Field label="値上げ">
                    <SwitchField
                      checked={listing.settings.priceRaiseEnabled}
                      onChange={(priceRaiseEnabled) =>
                        onUpdate({
                          ...listing,
                          settings: { ...listing.settings, priceRaiseEnabled },
                        })
                      }
                    />
                  </Field>
                  <Field label="値上げ方式">
                    <select className="control" defaultValue={listing.settings.priceRaiseMode}>
                      <option value="competitor_gap">ライバル価格差</option>
                      <option value="range">値上げ範囲</option>
                    </select>
                  </Field>
                  <Field label="最大値上げ幅">
                    <input className="control" defaultValue={listing.settings.maxRaiseAmount} />
                  </Field>
                  <Field label="コンディション比較無視">
                    <SwitchField checked={listing.settings.ignoreConditionComparison} onChange={() => undefined} />
                  </Field>
                  <Field label="海外セラー除外">
                    <SwitchField checked={listing.settings.excludeForeignSellers} onChange={() => undefined} />
                  </Field>
                  <Field label="AI判定">
                    <SwitchField
                      checked={listing.settings.aiJudgeEnabled}
                      onChange={(aiJudgeEnabled) =>
                        onUpdate({
                          ...listing,
                          settings: { ...listing.settings, aiJudgeEnabled },
                        })
                      }
                    />
                  </Field>
                  <Field label="対象セラーID">
                    <input className="control" defaultValue={listing.settings.includeSellerIds.join(", ")} />
                  </Field>
                  <Field label="除外セラーID">
                    <input className="control" defaultValue={listing.settings.excludeSellerIds.join(", ")} />
                  </Field>
                  <Field label="必須キーワード">
                    <input className="control" defaultValue={listing.settings.requiredTitleKeywords.join(", ")} />
                  </Field>
                  <Field label="除外キーワード">
                    <input className="control" defaultValue={listing.settings.excludedTitleKeywords.join(", ")} />
                  </Field>
                </div>
              </Section>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <div className="actions">
            <button className="btn" disabled={currentIndex === 0} onClick={() => onNavigate("previous")}>
              <ChevronLeft size={14} />
              前の行
            </button>
            <button className="btn" disabled={currentIndex === listings.length - 1} onClick={() => onNavigate("next")}>
              次の行
            </button>
            <button className="btn" onClick={onRun}>
              <RefreshCcw size={14} />
              手動チェック
            </button>
          </div>
          {listing.status === "pending" && (
            <div className="actions">
              <button className="btn primary" onClick={onApprove}>
                <Check size={14} />
                承認して更新
              </button>
              <button className="btn danger" onClick={onReject}>
                <X size={14} />
                却下
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddUrlModal({
  open,
  url,
  message,
  onUrlChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  url: string;
  message: string | null;
  onUrlChange: (url: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;
  const parsed = parseEbaySearchUrl(url);

  return (
    <div className="modal-backdrop open" onMouseDown={onClose}>
      <div className="modal small-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <span className="pill">URL登録</span>
          <div className="modal-title">
            <strong>検索URLを登録</strong>
            <span className="muted">eBay検索結果ページのURLから条件を抽出します</span>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        <div className="modal-pane">
          <Field label="eBay 検索URL">
            <textarea
              className="control textarea"
              value={url}
              onChange={(event) => onUrlChange(event.target.value)}
            />
          </Field>
          <div className={clsx("url-result", parsed.ok ? "success" : "error")}>
            {parsed.ok ? (
              <>
                <strong>抽出結果</strong>
                <span>キーワード: {parsed.value.searchKeyword}</span>
                <span>必須: {parsed.value.requiredTitleKeywords.join(", ") || "-"}</span>
                <span>除外: {parsed.value.excludedTitleKeywords.join(", ") || "-"}</span>
              </>
            ) : (
              parsed.error
            )}
          </div>
          {message && <div className="muted">{message}</div>}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>
            閉じる
          </button>
          <button className="btn primary" onClick={onSubmit}>
            登録
          </button>
        </div>
      </div>
    </div>
  );
}

function PageHead({
  title,
  meta,
  actions,
}: {
  title: string;
  meta: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div className="page-title">
        <h1>{title}</h1>
        <span className="muted">{meta}</span>
      </div>
      <div className="actions">{actions}</div>
    </div>
  );
}

function KpiStrip({
  kpis,
}: {
  kpis: Array<{ label: string; value: string; sub: string; tone: string }>;
}) {
  return (
    <div className="kpis">
      {kpis.map((kpi) => (
        <div className="card kpi" key={kpi.label}>
          <div className="kpi-label">
            <span className={clsx("dot", kpi.tone)} />
            {kpi.label}
          </div>
          <div className={clsx("kpi-value", `${kpi.tone}-text`)}>{kpi.value}</div>
          <div className="kpi-sub">{kpi.sub}</div>
        </div>
      ))}
    </div>
  );
}

function ListingRow({
  listing,
  onOpen,
}: {
  listing: Listing;
  onOpen: (listing: Listing) => void;
}) {
  const meta = statusMeta[listing.status];
  return (
    <tr onClick={() => onOpen(listing)}>
      <td>
        <input type="checkbox" aria-label={`${listing.itemId} を選択`} onClick={(event) => event.stopPropagation()} />
      </td>
      <td>
        <StatusBar status={listing.status} />
      </td>
      <td>
        <ItemTitle listing={listing} />
      </td>
      <td className="mono muted">{listing.itemId}</td>
      <td className="num mono">{formatMoney(listing.currentPrice)}</td>
      <td className="num mono muted">{formatMoney(listing.shipping)}</td>
      <td className="num mono strong">{formatMoney(listing.total)}</td>
      <td className="mono muted">{listing.lastCheckedAt}</td>
      <td>
        <span className={clsx("status", meta.tone)}>
          <span className={clsx("dot", meta.tone)} />
          {meta.label}
        </span>
      </td>
    </tr>
  );
}

function MobileListingRow({
  listing,
  onOpen,
}: {
  listing: Listing;
  onOpen: (listing: Listing) => void;
}) {
  const meta = statusMeta[listing.status];
  return (
    <article className="mobile-row" onClick={() => onOpen(listing)}>
      <StatusBar status={listing.status} />
      <div className="mobile-copy">
        <div className="mobile-title-text">{listing.title}</div>
        <div className="mobile-meta mono">
          {listing.itemId} / {listing.lastCheckedAt} / {meta.label}
        </div>
      </div>
      <div className="mobile-prices">
        <Metric label="現在" value={formatMoney(listing.currentPrice)} dense />
        <Metric label="送料" value={formatMoney(listing.shipping)} dense />
        <Metric label="合計" value={formatMoney(listing.total)} dense />
      </div>
    </article>
  );
}

function ItemTitle({ listing }: { listing: Listing }) {
  return (
    <span className="item-cell">
      <span className="thumb" />
      <span className="ellipsis">{listing.title}</span>
    </span>
  );
}

function StatusBar({ status }: { status: ListingStatus }) {
  return <span className={clsx("statusbar", statusMeta[status].tone)} />;
}

function FilterTabs({
  options,
  active,
  onChange,
}: {
  options: string[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="filter-tabs">
      {options.map((option) => (
        <TabButton key={option} active={active === option} onClick={() => onChange(option)}>
          {option}
        </TabButton>
      ))}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className={clsx("tab", active && "active")} onClick={onClick}>
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Metric({
  label,
  value,
  tone,
  dense,
}: {
  label: string;
  value: string;
  tone?: "primary" | "warning" | "success" | "danger";
  dense?: boolean;
}) {
  return (
    <div className={clsx("metric", dense && "dense")}>
      <span>{label}</span>
      <strong className={clsx(tone && `${tone}-text`)}>{value}</strong>
    </div>
  );
}

function Guard({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className={clsx("guard", ok ? "ok" : "warn")}>
      <span className={clsx("dot", ok ? "success" : "warning")} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SwitchField({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={clsx("switch-control", checked && "on")}
      onClick={(event) => {
        event.preventDefault();
        onChange(!checked);
      }}
      aria-pressed={checked}
    >
      <span />
      {checked ? "ON" : "OFF"}
    </button>
  );
}
