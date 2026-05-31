import { and, desc, eq, sql } from "drizzle-orm";
import { initialListings } from "../data";
import type { Listing, ListingSettings, ParsedEbaySearchUrl } from "../types";
import { getDatabase } from "./db/client";
import { listingCache, listingSettings } from "./db/schema";

const APP_USER_ID = process.env.APP_USER_ID ?? "00000000-0000-4000-8000-000000000001";
const APP_USER_EMAIL = process.env.APP_USER_EMAIL ?? "dev-user@ebay-price-sentry.local";

type SearchRegistrationInput = {
  itemId: string;
  searchUrl: string;
  parsed: ParsedEbaySearchUrl;
};

type ListingSettingsRow = typeof listingSettings.$inferSelect;
type ListingCacheRow = typeof listingCache.$inferSelect;

export function buildSearchRegistrationListing({
  itemId,
  searchUrl,
  parsed,
}: SearchRegistrationInput): Listing {
  return {
    ...initialListings[0],
    itemId,
    title: `${parsed.searchKeyword} Search Registered`,
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
      searchUrl,
      searchKeyword: parsed.searchKeyword,
      minPrice: parsed.priceMin,
      requiredTitleKeywords: parsed.requiredTitleKeywords,
      excludedTitleKeywords: parsed.excludedTitleKeywords,
    },
    competitors: [],
  };
}

export function mergeSyncedListingWithExistingSettings(
  synced: Listing,
  existing: Listing | null | undefined,
): Listing {
  if (!existing) return synced;
  return {
    ...synced,
    settings: existing.settings,
    competitors: existing.competitors.length > 0 ? existing.competitors : synced.competitors,
  };
}

export async function readDbListings(): Promise<Listing[] | null> {
  const db = getDatabase();
  if (!db) return null;

  const rows = await db
    .select({
      settings: listingSettings,
      cache: listingCache,
    })
    .from(listingSettings)
    .leftJoin(
      listingCache,
      and(
        eq(listingSettings.userId, listingCache.userId),
        eq(listingSettings.itemId, listingCache.itemId),
      ),
    )
    .where(eq(listingSettings.userId, APP_USER_ID))
    .orderBy(desc(listingSettings.updatedAt));

  return rows.map(({ settings, cache }) => mapRowsToListing(settings, cache));
}

export async function createDbListingFromSearchUrl(input: {
  searchUrl: string;
  parsed: ParsedEbaySearchUrl;
}) {
  const db = getDatabase();
  if (!db) return null;

  await ensureAppUser();

  const itemId = `search-${Date.now()}`;
  const listing = buildSearchRegistrationListing({
    itemId,
    searchUrl: input.searchUrl,
    parsed: input.parsed,
  });

  await db.insert(listingSettings).values(toListingSettingsRow(listing));

  return listing;
}

export async function updateDbListingSettings(itemId: string, settings: ListingSettings) {
  const db = getDatabase();
  if (!db) return null;

  await ensureAppUser();

  const [updated] = await db
    .insert(listingSettings)
    .values(toListingSettingsRow({ itemId, settings } as Listing))
    .onConflictDoUpdate({
      target: [listingSettings.userId, listingSettings.itemId],
      set: toListingSettingsUpdate(settings),
    })
    .returning();

  return updated;
}

export async function persistSyncedDbListings(syncedListings: Listing[]) {
  const db = getDatabase();
  if (!db) return null;

  await ensureAppUser();

  const existingListings = await readDbListings();
  const existingByItemId = new Map(
    (existingListings ?? []).map((listing) => [listing.itemId, listing]),
  );
  const mergedListings = syncedListings.map((listing) =>
    mergeSyncedListingWithExistingSettings(listing, existingByItemId.get(listing.itemId)),
  );

  for (const listing of mergedListings) {
    await db
      .insert(listingSettings)
      .values(toListingSettingsRow(listing))
      .onConflictDoUpdate({
        target: [listingSettings.userId, listingSettings.itemId],
        set: toListingSettingsUpdate(listing.settings),
      });

    await db
      .insert(listingCache)
      .values(toListingCacheRow(listing))
      .onConflictDoUpdate({
        target: [listingCache.userId, listingCache.itemId],
        set: {
          title: listing.title,
          currentPrice: nullableMoney(listing.currentPrice),
          shippingCost: nullableMoney(listing.shipping),
          conditionName: listing.condition,
          sellerId: listing.sellerId,
          marketplace: "EBAY_US",
          listingStatus: listing.listingStatus,
          isOnSale: listing.isOnSale,
          lastFetchedAt: new Date(),
        },
      });
  }

  return readDbListings();
}

async function ensureAppUser() {
  const db = getDatabase();
  if (!db) return;

  await db.execute(sql`
    insert into auth.users (
      id,
      aud,
      role,
      email,
      email_confirmed_at,
      confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    values (
      ${APP_USER_ID}::uuid,
      'authenticated',
      'authenticated',
      ${APP_USER_EMAIL},
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"eBay Price Sentry Dev User"}'::jsonb,
      now(),
      now()
    )
    on conflict (id) do nothing
  `);
}

function mapRowsToListing(settingsRow: ListingSettingsRow, cacheRow: ListingCacheRow | null) {
  const settings = mapSettingsRow(settingsRow);
  const currentPrice = numberOrDefault(cacheRow?.currentPrice, 0);
  const shipping = numberOrNull(cacheRow?.shippingCost);
  const total = shipping == null ? null : roundMoney(currentPrice + shipping);
  const listingStatus = cacheRow?.listingStatus === "Ended" ? "Ended" : "Active";

  return {
    itemId: settingsRow.itemId,
    title: cacheRow?.title || settings.searchKeyword || settingsRow.itemId,
    currentPrice,
    shipping,
    total,
    competitorTotal: null,
    suggestedPrice: null,
    changePercent: null,
    status: listingStatus === "Ended" ? "ended" : "off",
    reason: settings.enabled ? "DB保存済み・未巡回" : "DB保存済み・価格調整OFF",
    lastCheckedAt: cacheRow?.lastFetchedAt
      ? cacheRow.lastFetchedAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
      : "-",
    condition: cacheRow?.conditionName || "-",
    sellerId: cacheRow?.sellerId || "",
    aiConfidence: null,
    isOnSale: cacheRow?.isOnSale ?? false,
    listingStatus,
    settings,
    competitors: [],
  } satisfies Listing;
}

function mapSettingsRow(row: ListingSettingsRow): ListingSettings {
  return {
    ...initialListings[0].settings,
    enabled: row.priceAdjustmentEnabled,
    searchUrl: row.searchUrl ?? "",
    searchKeyword: row.searchKeyword ?? "",
    minPrice: numberOrNull(row.localMinPrice),
    undercutAmount: numberOrDefault(row.localUndercutAmount, 0.01),
    autoUpdateEnabled: row.autoUpdateEnabled ?? false,
    localCheckTimeSlots: stringArray(row.localCheckTimeSlots),
    priceRaiseEnabled: row.allowPriceIncrease,
    priceRaiseMode: row.priceIncreaseMode === "range" ? "range" : "competitor_gap",
    maxRaiseAmount: numberOrDefault(row.maxPriceIncreaseAmount, 5),
    ignoreConditionComparison: row.ignoreCondition,
    excludeForeignSellers: row.excludeForeignSellers ?? false,
    includeSellerIds: stringArray(row.includeSellerIds),
    excludeSellerIds: stringArray(row.excludeSellerIds),
    requiredTitleKeywords: stringArray(row.requiredTitleKeywords),
    excludedTitleKeywords: stringArray(row.excludedTitleKeywords),
    aiJudgeEnabled: row.useAiJudgement,
  };
}

function toListingSettingsRow(listing: Listing): typeof listingSettings.$inferInsert {
  return {
    userId: APP_USER_ID,
    itemId: listing.itemId,
    ...toListingSettingsUpdate(listing.settings),
  };
}

function toListingSettingsUpdate(settings: ListingSettings) {
  return {
    priceAdjustmentEnabled: settings.enabled,
    localMinPrice: nullableMoney(settings.minPrice),
    localUndercutAmount: nullableMoney(settings.undercutAmount),
    autoUpdateEnabled: settings.autoUpdateEnabled,
    localCheckTimeSlots: settings.localCheckTimeSlots,
    searchUrl: settings.searchUrl,
    searchKeyword: settings.searchKeyword,
    ignoreCondition: settings.ignoreConditionComparison,
    excludeForeignSellers: settings.excludeForeignSellers,
    useAiJudgement: settings.aiJudgeEnabled,
    allowPriceIncrease: settings.priceRaiseEnabled,
    priceIncreaseMode: settings.priceRaiseMode,
    maxPriceIncreaseAmount: nullableMoney(settings.maxRaiseAmount),
    requiredTitleKeywords: settings.requiredTitleKeywords,
    excludedTitleKeywords: settings.excludedTitleKeywords,
    includeSellerIds: settings.includeSellerIds,
    excludeSellerIds: settings.excludeSellerIds,
    updatedAt: new Date(),
  };
}

function toListingCacheRow(listing: Listing): typeof listingCache.$inferInsert {
  return {
    userId: APP_USER_ID,
    itemId: listing.itemId,
    title: listing.title,
    currentPrice: nullableMoney(listing.currentPrice),
    shippingCost: nullableMoney(listing.shipping),
    conditionName: listing.condition,
    sellerId: listing.sellerId,
    marketplace: "EBAY_US",
    listingStatus: listing.listingStatus,
    isOnSale: listing.isOnSale,
    lastFetchedAt: new Date(),
  };
}

function nullableMoney(value: number | null | undefined) {
  return value == null ? null : value.toFixed(2);
}

function numberOrNull(value: string | null | undefined) {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberOrDefault(value: string | number | null | undefined, fallback: number) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const parsed = numberOrNull(value);
  return parsed ?? fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
