# eBay Price Sentry — コンポーネント仕様

このドキュメントはClaude Designで採用された **E バリエーション（Dense Classic）** の実装仕様を反映している。

完全な参照実装は `docs/design-system/claude-design-export/project/` 配下：
- `variations/E_dense.jsx` — 採用されたダッシュボード実装
- `shared/tokens.css` — 共有デザイントークン
- `shared/chrome.jsx` — Sidebar / TopBar の実装
- `shared/icons.jsx` — アイコンセット（Lucide風 stroke 1.5）
- `shared/data.jsx` — サンプルデータ
- `Dashboard Variations.html` — エントリポイント

## 採用デザインの方針

- **コンセプト**: A バリエーション（明るいUI / Navy サイドバー / 白カード / Blue アクセント）の配色 × D バリエーション（高密度数値中心）の情報密度
- **狙い**: 一目で多くのリスティングを俯瞰できる業務オペレーター向け密度
- **デザイン言語**: モダン SaaS ダッシュボード、professional / trustworthy / data-focused / scannable

## レイアウト寸法（E バリエーション固有）

```
┌────────────┬────────────────────────────────────────┐
│            │  TopBar  44px                            │
│  Sidebar   ├────────────────────────────────────────┤
│  168px     │                                         │
│  (固定)     │  メインコンテンツ                          │
│            │  - Header (h1 + メタ + actions)          │
│            │  - KPI strip (8列)                       │
│            │  - DataTable (行高 20px)                 │
│            │  - Pagination footer                    │
│            │                                         │
│            │  ─── Right Panel 320px ───              │
└────────────┴─────────────────────────┴───────────────┘
```

### 寸法サマリー
| 要素 | 寸法 |
|---|---|
| サイドバー幅 | **168px** |
| トップバー高 | **44px** |
| テーブル行高 | **20px** |
| ベースフォント | **11.5px**（テーブル）/ 12.5px（数値強調） |
| KPI カード | 8列、padding 8px 10px |
| 右パネル幅 | 320px |

## デザイントークン

`docs/design-system/claude-design-export/project/shared/tokens.css` を参照。主要トークン:

```css
/* Colors */
--bg: #FFFFFF;
--surface: #F9FAFB;
--border: #E5E7EB;
--text-1: #111827;
--text-2: #6B7280;
--text-3: #9CA3AF;

--sb-bg: #0F172A;        /* サイドバー背景 */
--sb-active: #2563EB;    /* アクティブ項目 */

--primary: #2563EB;
--primary-active: #1E40AF;
--primary-subtle: #DBEAFE;

/* Status (4-tone) */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--neutral-bg: #F3F4F6;

/* Radius */
--radius-card: 8px;
--radius-btn: 6px;
--radius-badge: 4px;
```

---

## コンポーネント仕様

### 1. Sidebar（左ナビゲーション）

```
幅: 168px (E密度) / 240px (デフォルト)
背景: --sb-bg (#0F172A)
ロゴ: shield アイコン 22px + ブランド名 13px
ナビ項目:
  - 通常: padding 6px 9px、font 12.5px、gap 9px
  - hover: --sb-bg-hover
  - active: --sb-active 背景 + 白テキスト
  - badge: 数値バッジ（10px）
```

ナビ項目（5つ、固定）:
1. ダッシュボード（Home アイコン）
2. 承認待ち（Inbox アイコン、件数バッジあり）
3. リスティング（Tag アイコン）
4. 設定（Settings アイコン）
5. ログ（FileText アイコン）

最下段: 折りたたみボタン（ChevronLeft アイコン）

### 2. TopBar（ヘッダー）

```
高さ: 44px
背景: 白 + 下部ボーダー
パディング: 0 14px

左: 検索バー (height 28px, max 280px)
   - 検索アイコン + プレースホルダ「商品名・Item ID・SKU で検索…」+ ⌘K キーバインド表示
右: 自動反映トグル（pill型）+ 最終同期時刻
```

### 3. KPI ストリップ（ダッシュボード上部）

```
8列グリッド (gap 6px)
各カード:
  - padding 8px 10px
  - 上段: 6pxドット + ラベル (10.5px, color text-2, semibold)
  - 中段: 値 (18px, bold, letter-spacing -0.02em, アクセント色)
  - 下段: サブテキスト (10.5px, color text-3)
```

8つの指標:
| ラベル | 例 | アクセント | サブテキスト |
|---|---|---|---|
| 対象 | 1,248 | info | 今週 +12 |
| 承認待ち | 23 | warning | 優先度高 8 |
| 本日更新 | 312 | success | 平均 −4.2% |
| スキップ | 87 | neutral | 最低価格 41 |
| エラー | 5 | error | 直近24時間 |
| 推定削減 | $1,142 | info | 本日合計 |
| API使用 | 4,127 | neutral | / 5,000 |
| 次回巡回 | 15:00 | neutral | あと 4h44m |

### 4. DataTable（リスティングテーブル）

```
ヘッダー行: padding 3px 8px, font 10.5px, semibold, white-space nowrap
データ行: padding 0 8px, height 20px, font 11.5px, white-space nowrap, vertical-align middle
hover: 行背景 rgba(37,99,235,0.04)
selected: 行背景 var(--primary-subtle)
```

#### テーブルヘッダー上部ツールバー

- 左側: タイトル「リスティング」+ 件数バッジ + フィルタタブ群
- フィルタタブ: ピル形式、active時は --primary-subtle 背景
  - すべて (1,248)
  - 承認待ち (23) — warning
  - 更新済 (312) — success
  - スキップ (87)
  - エラー (5) — error
- 右側: テーブル内検索 (max 200px) + ソートボタン（変動% ↓）

#### 列構成（15列）
| # | 列 | 幅/特徴 |
|---|---|---|
| 1 | チェックボックス | 24px |
| 2 | ステータスバー | 6px、左 3px 縦バー（4色） |
| 3 | 商品 | 14×14 thumb + タイトル（max 260px、ellipsis） |
| 4 | Item No | 12桁、mono フォント、color text-2、font 11px |
| 5 | 現在 | 数値、mono、12.5px |
| 6 | 送料 | 数値、mono、color text-3、12px |
| 7 | 合計 | 数値、mono、bold、12.5px |
| 8 | ライバル | 数値、mono、color text-2、12.5px |
| 9 | 推奨 | 数値、mono、bold、color primary-active、12.5px |
| 10 | 差額 | 数値、mono、変動色 |
| 11 | 変動% | 数値、mono、bold、変動色 |
| 12 | AI | 数値、mono、AI信頼度色（≥0.85 で success） |
| 13 | 状態 | ドット 6px + テキスト 11px、bold、状態色 |
| 14 | 時刻 | mono、11px、color text-3 |
| 15 | メニュー | 24px、More アイコン |

#### ステータス左ボーダー（列 #2）
3px幅 × 10px高、border-radius 2px、4色:
- success (#10B981) — 更新済
- warning (#F59E0B) — 承認待ち
- error (#EF4444) — エラー
- text-3 (#9CA3AF) — スキップ / ライバル無し

### 5. Pagination Footer

```
padding 6px 10px, border-top 1px var(--border)
font-size 11.5px, color text-2

左: 件数表示「1,248 件中 1〜14 件」
中央: ページネーション (‹ 1 2 3 4 5 … 125 ›)
   - active: --primary 背景、白テキスト
右: 表示件数 + CSV出力
```

### 6. RightPanel（詳細パネル）

```
幅: 320px
背景: 白
border-left: 1px var(--border)

セクション:
  1. Header (padding 10px 14px, border-bottom)
     - 上段: 「選択中」ラベル + ステータスバッジ + ✕ 閉じるアイコン
     - 商品タイトル (font 13px, semibold, line-height 1.3)
     - Item ID (mono, 10.5px, color text-3)

  2. 比較ストリップ (4セルグリッド 1fr 1fr × 2)
     - 自分の合計 / ライバル合計 / 推奨価格(big) / 変動

  3. ガード判定 (5項目)
     - 各項目: アイコン (12px) + ラベル + 値
     - 抵触時は warning 色

  4. ライバル候補 (4件)
     - 各項目: ドット + セラー名 + 価格 + 時刻
     - 採用ライバルは bold + success ドット

  5. Footer (padding 10px, border-top)
     - 「承認して更新」(primary) + ✕ ボタン
     - 「eBayで開く」(ghost) + 「設定」(ghost)
```

### 7. Status Badge

ステータス表示は **バッジではなくドット+テキスト** で行う（テーブル行高を抑えるため）：

```
display: inline-flex
gap 5px
font-size 11px, semibold
color: 状態に応じて success-text / warning-text / error-text / text-2
ドット: 6×6px, border-radius 3px, 状態色
white-space: nowrap
```

ステータスマッピング（日本語表示）:
- 更新済 → success
- 承認待ち → warning
- スキップ → neutral
- エラー → error
- ライバル無し → neutral

### 8. Toggle（自動反映スイッチ）

```
track: 36×20px、border-radius 999px
ON: --success 背景
OFF: --text-3 背景
thumb: 16×16px、白、shadow
transition 150ms ease-out
ラベル右側: ON=success-text, OFF=text-2
```

### 9. Button

```
高さ: sm (28px) / 通常 (32px)
角丸 6px
font 13px (通常) / 12px (sm), font-weight 500

variants:
  - primary: --primary 背景、白テキスト
  - default: 白背景、border、text-1
  - ghost: 透明、color text-2
  - danger: error-bg、error-text、error-border
```

### 10. Card

```
背景: 白
border: 1px var(--border)
border-radius: 8px
shadow: var(--shadow-sm)
padding: 用途による (8px 10px〜)

variant.subtle: 背景 surface、shadow なし
```

---

## アイコン

`docs/design-system/claude-design-export/project/shared/icons.jsx` を参照。Lucide 風の SVG コンポーネント、stroke-width 1.5。

利用するアイコン:
- ナビ: Home / Inbox / Tag / Settings / FileText
- アクション: Search / RefreshCw / Plus / Filter / Eye / More
- ステータス: Check / CheckCircle / AlertCircle / AlertTriangle / X
- データ: TrendingUp / TrendingDown / Activity / DollarSign / Target
- UI: ChevronLeft / ChevronRight / ChevronDown / ArrowUp / ArrowDown / Bell / Clock / Image / Shield / Zap

---

## 他画面の方向性（未実装）

ダッシュボード以外の画面（リスティング一覧 / 承認待ち / 設定 / ログ）は同じデザイン言語で展開する：

- **同じ密度感** — 行高 20px、サイドバー 168px、トップバー 44px
- **同じカラートークン** — 白背景 + Navy サイドバー + Blue アクセント
- **同じステータス表現** — ドット + テキスト、4色（success/warning/error/neutral）
- **同じテーブル構成原則** — 数値は mono フォント + tabular-nums、左にステータスバー
- **同じ右パネル設計** — 320px、選択中アイテムの詳細表示

実装時は `claude-design-export/project/variations/E_dense.jsx` をベースに、各画面の要件を当てはめる。

## アクセシビリティ

- focus-visible リング（primary 色 2px）
- 色だけでなくドット形・テキストでも区別
- ARIA ラベル必須
- キーボード操作対応（Tab / Enter / Escape）
- WCAG AA 準拠（コントラスト 4.5:1 以上）

## 参考画像

- `docs/design-system/mockups/dashboard.png` — 初期モックアップ（ユーザー提供、参考）
- `docs/design-system/claude-design-export/project/reference/dashboard_existing.png` — Claude Design 内で使用された参考画像
