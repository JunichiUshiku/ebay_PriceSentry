# eBay Price Sentry 設計仕様書 v1.0

作成日: 2026-04-30
ステータス: ドラフト（ユーザーレビュー待ち）

## 1. 概要

eBayセラー向けマルチテナント型の価格自動調整SaaSツール。各セラーが手動でONにしたeBayリスティングについて、ライバル商品の "商品価格＋送料の合計価格" を取得し、設定範囲内で最安値になるように価格を自動調整する。

ベースは `docs/ebay_price_sentry_requirements_v0.1.md`（要件定義 v0.1）。

## 2. 前提条件

| 項目 | 内容 |
|---|---|
| 対象マーケット | eBay US |
| 対象出品 | 各ユーザーが手動で価格調整対象ONにしたリスティング |
| 管理単位 | Item ID |
| SKU管理 | 初期版では不要 |
| バリエーション | 初期版では非対応 |
| 出品経路 | Seller Hub通常出品、Trading API作成出品（Inventory API管理商品は対象外） |
| 価格取得 | eBay Browse API |
| 価格更新 | eBay Trading API `ReviseInventoryStatus` |
| デフォルト実行頻度 | 1日3回（ユーザー設定可、0〜5回）|
| eBay API利用枠 | **ユーザー個別App ID方式**（各ユーザーが自分のApp IDで Browse API 5,000 calls/日を取得、Application Growth Check 通過後に最大 10,000 calls/日へ引き上げ可能） |
| 想定規模 | 1ユーザーあたり 2,000〜3,000 リスティング（Growth Check 通過済みを前提）|

## 3. 技術スタック

| レイヤー | 技術 |
|---|---|
| 言語 | TypeScript |
| フロントエンド | Next.js (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| バリデーション | zod |
| DB | Supabase PostgreSQL（初期は Supabase Free 前提） |
| ORM | Drizzle ORM (PostgreSQL adapter) |
| 認証 | Supabase Auth |
| Web ホスティング | Vercel |
| バックグラウンドワーカー | Google Cloud Run Jobs |
| スケジューラ | Google Cloud Scheduler |
| シークレット管理 | Vercel 環境変数 + Google Secret Manager |
| HTTPクライアント | ofetch（リトライ組込み） |
| デザインシステム | `docs/design-system/` 参照（E バリエーション準拠） |

## 4. アーキテクチャ

```
┌──────────────────────────────────────────────────────────────┐
│                ユーザー（マルチテナント）                       │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTPS (Supabase Auth)
                        ▼
┌──────────────────────────────────────────────────────────────┐
│  Vercel: Next.js App Router                                   │
│  - 画面層（Dashboard / Approvals / Settings / Logs）          │
│  - API Routes（設定保存・トグル切替・URL登録・承認/却下）       │
│  - 手動チェック実行（Cloud Run Jobs を即時起動）                │
└───────┬──────────────────────────────┬───────────────────────┘
        │ Drizzle ORM                   │ Cloud Run API
        ▼                               ▼
┌─────────────────────────┐  ┌────────────────────────────────┐
│  Supabase                │  │  Google Cloud                   │
│  - PostgreSQL            │  │  - Cloud Scheduler              │
│  - Auth（マルチテナント）│  │  - Cloud Run Jobs（ワーカー）   │
│  - Row Level Security    │  │  - Secret Manager               │
│  - Realtime（通知）      │  │                                 │
└──────────▲──────────────┘  └─────────────┬──────────────────┘
           │                                │
           └────────────────────────────────┤
                                            ▼
                              ┌──────────────────────────────┐
                              │  eBay APIs                    │
                              │  - Trading API（出品・更新）  │
                              │  - Browse API（ライバル検索）│
                              └──────────────────────────────┘
```

### 責務分担

| コンポーネント | 責務 |
|---|---|
| Vercel Web | UI表示、ユーザー操作、設定管理、軽量API（手動操作の即時処理） |
| Supabase PostgreSQL | 全データの永続化（設定・キャッシュ・ログ・承認キュー） |
| Supabase Auth | ユーザー認証、セッション管理 |
| Cloud Scheduler | グローバル時刻プリセットの定刻トリガー |
| Cloud Run Jobs | 巡回処理本体（eBay API 呼び出し、価格計算、DB更新） |
| Secret Manager | アプリ全体のシークレット保存 |

## 5. ユーザー認証と eBay API 連携

### 5-1. ユーザー認証

- Supabase Auth（メール+パスワード、または Magic Link）
- 全テーブルが `user_id` カラムを持ち、Row Level Security でデータ分離
- バックグラウンドジョブは Service Role Key を使用、明示的に `user_id` を指定してクエリ

### 5-2. eBay API 認証情報の登録（ユーザー個別App ID方式）

各ユーザーが自分で eBay Developer Portal に登録し、以下の認証情報をツールに登録：

| 項目 | 取得元 | 保存方法 |
|---|---|---|
| App ID (Client ID) | eBay Developer Portal | DB平文 |
| Cert ID (Client Secret) | eBay Developer Portal | **Google Secret Manager 保存（参照IDのみDB保存）** |
| Dev ID | eBay Developer Portal | DB平文 |

設定画面に「eBay Developer登録ガイド」を併設（取得手順を画像付きで案内）。
登録後は接続診断を実行し、App ID / Cert ID / Dev ID、OAuth Token、必要スコープ、Browse API、Trading API の利用可否を自動確認する。

### 5-3. OAuth User Token フロー（Authorization Code Grant）

```
1. ユーザーが「eBayと連携」ボタンをクリック
2. ツールが OAuth 認可URLを生成（state に user_id を含めて改ざん防止）
3. ユーザーが eBay でログイン → 必要なスコープを承認
   （sell.inventory, sell.account, buy.browse 等）
4. eBay から Authorization Code がコールバックURL（/auth/ebay/callback）に送られる
5. ツールが Authorization Code を Access Token + Refresh Token に交換
6. Refresh Token を DB に暗号化保存
```

### 5-4. トークン管理

| 種別 | 用途 | 寿命 | 保存方法 |
|---|---|---|---|
| Application Token | Browse API（公開データ検索） | 約2時間 | メモリキャッシュ |
| Access Token | Trading API（出品操作） | 約2時間 | メモリキャッシュ |
| Refresh Token | Access Token の更新 | 18ヶ月 | Google Secret Manager 保存（参照IDのみDB保存） |

API 呼び出し前に有効期限を確認し、期限切れなら Refresh Token で自動更新。Refresh Token 自体が期限切れの場合はユーザーに再認可を促す通知。

### 5-5. 自ストア除外の安全ルール

eBay 連携時に自分の Seller ID を取得し、ライバル候補から自ストアの商品を無条件で除外する。新品/中古、付属品有無、同型番の別出品などが検索結果に含まれても、自分の商品同士で価格競争させない。

- Browse API の候補は `legacyItemId` と自分の Item ID を比較して除外
- 候補の Seller ID が自分の Seller ID と一致する場合は除外
- この除外ルールは安全ガードとして固定し、ユーザー設定では解除不可

## 6. 自分の出品取得とリスティング登録

### 6-1. 自分の出品取得（US限定）

- **API**: Trading API `GetMyeBaySelling`（または `GetSellerList`）
- **SiteID**: 0（US）— 米国向け出品のみ取得
- **同期タイミング**:
  - 自動同期: 1日1回バッチ（深夜 03:00 などの巡回時間帯外）
  - 手動同期: ダッシュボードの「同期」ボタンで即時実行
- **取得項目**: ItemID、Title、CurrentPrice、ShippingCost、ConditionID、ImageURL、SellerID、ListingStatus、IsOnSale 等
- **差分処理**:
  - DB に存在し API に無い → `listing_status = 'Ended'` に更新
  - 新規出品 → `listing_cache` に追加、`price_adjustment_enabled = false`（無効状態）

### 6-2. ダッシュボード上の表示と有効化

- 取得した出品をダッシュボードに表示（フィルタで価格調整ON/OFF/Ended切替可）
- 各行にトグル（価格調整対象 ON/OFF）
- デフォルト OFF。OFF→ON を試みると **URL入力モーダル**起動

### 6-3. 検索URL方式の登録フロー

ユーザーは eBay で検索した結果ページの URL をそのまま登録する。これによりシームレスに検索条件を設定できる。

#### URL バリデーションルール

| チェック項目 | エラーメッセージ |
|---|---|
| eBay.com ドメインか | "eBay.comのURLではありません" |
| `_nkw` パラメータが存在するか | "検索キーワードが含まれていません" |
| `_nkw` の値が空でないか | "検索キーワードが空です" |
| `LH_Sold=1` が含まれていないか | "Sold listings 検索URLは使用できません" |

#### URL パーサ仕様

| URLパラメータ | 抽出後 | listing_settings カラム |
|---|---|---|
| `_nkw` の本体 | 検索キーワード | `search_keyword` |
| `_nkw` 内の `-word` | 除外語 | `excluded_title_keywords`（JSON配列） |
| `_nkw` 内の `"phrase"` | 必須フレーズ | `required_title_keywords`（JSON配列） |
| `_sacat` | カテゴリID | `category_id` |
| `_udlo` / `_udhi` | 価格範囲 | `price_min` / `price_max` |
| `LH_ItemCondition` | コンディション | `condition_filter`（JSON配列） |
| `LH_PrefLoc` | 商品所在地 | `location_filter` |
| `LH_BIN` | Buy It Now | `buying_options`（"FIXED_PRICE"） |

抽出結果はリスティング設定画面でユーザーが手動編集可能。

### 6-4. CSV取込（バルク登録）

```csv
item_id,search_url
406875760195,https://www.ebay.com/sch/i.html?_nkw=FH-P077MD&...
406875760203,https://www.ebay.com/sch/i.html?_nkw=Sony+XAV-AX1000&...
```

各 URL をバリデーションし、エラー行は除外。成功/失敗のレポートを表示。

## 7. 価格チェック巡回処理

### 7-1. 巡回方式（タイムスロット方式）

#### グローバル設定の時刻プリセット

- 各ユーザーが **最大5つ**の時刻プリセットを登録（例: 09:00, 13:00, 17:00, 20:00, 23:00）
- デフォルト時刻（新規リスティング初期値）は、プリセットからユーザーが選択

#### ローカル設定（リスティング個別）

- リスティングごとに、グローバルプリセットの時刻から **0〜5個を任意選択**
- 「巡回回数」という概念は廃止し、選んだ時刻の個数 = 巡回回数
- 0個選択 = 自動巡回しない（手動のみ）

#### 時刻変更時の影響範囲表示

グローバルプリセットの時刻削除/変更時、その時刻を `local_check_time_slots` に含むリスティングを検出し、確認モーダルで影響範囲を表示。承認後にローカル設定からも自動削除。

### 7-2. 手動実行

- 個別リスティング単位で手動チェック可能
- ダッシュボードのリスティング行から実行（または詳細モーダル内のボタン）
- 自動実行とは独立、即時に Cloud Run Jobs を起動

### 7-3. Cloud Scheduler ジョブ生成（マルチテナント横断）

時刻はユーザーのタイムゾーンを考慮し、内部では UTC で正規化して保存・スケジューリングする。
ジョブはユーザーごとではなく、**全ユーザーの時刻プリセットを合算したユニークな UTC 時刻ごと**に1本ずつ作成する。

```typescript
// 全ユーザーの time_slot_presets を UTC 正規化して合算
const allUtcSlots = await db.query(`
  SELECT DISTINCT
    to_char(
      (date '2000-01-01' + slot::time) AT TIME ZONE g.timezone AT TIME ZONE 'UTC',
      'HH24:MI'
    ) AS utc_slot
  FROM global_settings g,
       jsonb_array_elements_text(g.time_slot_presets::jsonb) AS slot
`);

// 各ユニーク UTC 時刻に対して Cloud Scheduler ジョブを upsert
for (const { utc_slot } of allUtcSlots) {
  upsertCronJob({
    name: `price-check-${utc_slot.replace(':', '')}-utc`,
    schedule: cronExpressionFor(utc_slot, 'UTC'),
    target: 'cloud-run-jobs:price-check-worker',
    payload: { slot_time_utc: utc_slot }
  });
}
```

ユーザーが時刻プリセットを変更した時、`upsertCronJob` で必要なジョブを追加し、不要になったジョブ（どのユーザーも持たない時刻）は削除する。

### 7-4. 対象リスティング抽出（Cloud Run Jobs 起動時）

ジョブは1つの UTC 時刻に対して全ユーザーを横断的に処理する。各ユーザーのタイムゾーンに変換した時刻が一致するリスティングを抽出。

```sql
-- :slot_time_utc はジョブのペイロード（例: "00:00"）
SELECT l.*, g.timezone
FROM listing_settings l
JOIN global_settings g ON g.user_id = l.user_id
WHERE l.price_adjustment_enabled = true
  AND to_char(
    (date '2000-01-01' + :slot_time_utc::time) AT TIME ZONE 'UTC' AT TIME ZONE g.timezone,
    'HH24:MI'
  ) = ANY(
    COALESCE(l.local_check_time_slots, g.default_check_time_slots)::text[]
  );
```

ユーザーごとに `scheduler_lock` を取得してから処理を開始する（10-1 参照）。

### 7-5. 巡回処理フロー（1ユーザー1リスティング単位）

```
1. price_adjustment_enabled = true かつスロット時刻に該当するリスティング取得
2. グローバル設定とローカル設定を統合
3. listing_cache を確認、必要なら GetItem で更新
4. セール中ならスキップ
5. Browse API でライバル候補を取得（保存済み検索パラメータ使用）
6. 候補から除外条件を適用（除外セラー / キーワード / コンディション 等）
7. 必要なら AI判定（オプション）
8. 採用ライバルを決定
9. 推奨価格を計算
10. ガード判定
11. 自動更新 / 承認待ち / 即スキップ
12. price_check_logs にログ保存
```

### 7-6. ライバル検索（Browse API）

```typescript
const params = {
  q: search_keyword,
  category_ids: category_id,
  filter: [
    `price:[${price_min}..${price_max}]`,
    `conditionIds:{${condition_filter.join(',')}}`,
    `itemLocationCountry:${location_filter}`,
    `buyingOptions:{FIXED_PRICE}`
  ].join(','),
  sort: 'price',
  limit: 50,
  delivery_country: 'US',
  delivery_postal_code: '90001'
};
```

Browse API では最大50件を取得するが、初期版ではDB容量節約のため全件を長期保存しない。

- ダッシュボード/詳細表示用: 最新チェック分のトップ10のみ `competitor_snapshots` に保存
- 長期ログ用: 採用ライバル、推奨価格、判定理由、結果のみ `price_check_logs` に保存
- 古い `competitor_snapshots` は短期保持（例: 7日）で自動削除
- Supabase Free 運用中は、ログ保存量がDB容量を圧迫しないよう保持件数/期間を優先的に制御する

### 7-7. 同一商品判定

初期版では、リスティングごとに登録した eBay 検索URLの条件を「同一商品の候補範囲」として扱う。厳密な同一商品判定をシステム側でガチガチに自動化しすぎず、ユーザーが設定した検索キーワード、価格範囲、コンディション、除外/対象セラー、必須/除外キーワードを信頼する。

AI判定は初期版では補助的なオプションまたは後続フェーズとし、MVPの必須条件にはしない。

```typescript
for (const candidate of candidates) {
  if (candidate.legacy_item_id === own.item_id) continue;
  if (candidate.seller_id === own.seller_id) continue;
  if (excludeSellerIds.includes(candidate.seller_id)) continue;
  if (includeSellerIds.length > 0 && !includeSellerIds.includes(candidate.seller_id)) continue;
  if (containsExcludedKeyword(candidate.title)) continue;
  if (!containsRequiredKeywords(candidate.title)) continue;
  if (conditionMatch && candidate.condition !== own.condition) continue;
  if (excludeForeignSellers && candidate.location_country !== allowedCountry) continue;
  
  if (useAi) {
    const aiResult = await judgeByAi(own, candidate);
    if (!aiResult.is_same_product) continue;
    if (aiResult.confidence < REJECT_THRESHOLD) continue;
  }
  
  return candidate;  // 最初に合格した候補を採用
}
```

### 7-8. 価格計算

送料は「送料込み最安」を絶対条件として扱う。Free Shipping は送料 0 として扱い、Flat Shipping は取得した固定送料で比較する。Calculated Shipping は初期版では地域別計算を行わず、取得できる固定表示送料がない場合は自動更新しない。

```typescript
const competitorTotal = competitor.price + competitor.shipping;
const targetTotal = competitorTotal - undercutAmount;
const newOwnPrice = targetTotal - own.shipping;
```

### 7-9. ガード判定

優先順位の高い順に判定し、最初にヒットしたものでスキップ/承認待ち：

```typescript
if (own.is_on_sale) → skipped: "セール中商品のためスキップ"
else if (!effectiveMinPrice) → pending_approval: "有効な最低価格が未設定"
else if (newOwnPrice < effectiveMinPrice) → skipped: "最低価格を下回る"
else if (own.shipping == null || competitor.shipping == null) → pending_approval: "送料込み価格が不明"
else if (dropPercent >= maxDropPercent) → pending_approval: "1回の下落率が5%以上"
else if (aiUsed && aiConfidence < AI_AUTO_THRESHOLD) → pending_approval: "AI判定信頼度低"
else if (currentPriceChangedBeforeUpdate) → pending_approval: "更新直前に価格変動"
else if (!autoUpdateEnabled) → pending_approval: "手動承認設定"
else → updated（更新実行）
```

### 7-10. 価格更新（Trading API）

`ReviseInventoryStatus` を使用：

```xml
<ReviseInventoryStatusRequest>
  <InventoryStatus>
    <ItemID>406875760195</ItemID>
    <StartPrice>104.99</StartPrice>
  </InventoryStatus>
</ReviseInventoryStatusRequest>
```

更新前の二重チェック: `GetItem` で現在価格を再取得し、`listing_cache` の値と一致しなければ承認待ちに昇格。

## 8. 画面構成

### 8-1. ナビゲーション（左サイドバー、168px、Navy背景）

```
🛡 eBay Price Sentry
─────────────────
🏠 ダッシュボード
📥 承認待ち [N]
⚙ 設定
📝 ログ
─────────────────
◀ 折りたたむ
```

### 8-2. トップバー（44px）

```
                                          自動反映 [● ON]   ⏰ 最終同期 10:16
```

検索バーは廃止（テーブル内検索で代替）。

### 8-3. Dashboard

#### KPIストリップ（8カード）

```
[対象 1,248] [承認待ち 23] [本日更新 312] [スキップ 87]
[エラー 5] [推定削減 $1,142] [API使用 4,127/5,000] [次回巡回 15:00]
```

#### フィルタタブ（2系統）

- 状態フィルタ: すべて / 承認待ち / 更新済 / スキップ / エラー
- 対象フィルタ: すべて / 価格調整ON / 価格調整OFF / Ended

#### テーブル列（9列）

| # | 列 | 内容 |
|---|---|---|
| 1 | ☑ | 一括選択 |
| 2 | ▌ | 状態カラーバー（4色: 緑/黄/赤/灰） |
| 3 | 商品 | thumb + タイトル |
| 4 | Item No | 12桁、mono |
| 5 | 現在 | 商品価格 |
| 6 | 送料 | 送料 |
| 7 | 合計 | 商品価格 + 送料 |
| 8 | 時刻 | 最終チェック時刻 |
| 9 | (アクション列なし、行クリックでモーダル) | |

詳細表示はテーブルではなく、行クリック時のモーダルで提供（ライバル/推奨/差額/変動%/AI/状態は詳細モーダルで参照）。

#### ヘッダーアクション

- 巡回: 手動巡回トリガー
- 同期: eBay から出品リスト再取得
- 追加: CSV取込・URL一括登録モーダル

### 8-4. 詳細モーダル（行クリック時、900px幅）

タブ構成:

#### 詳細タブ
- ヘッダー: 状態バッジ + 商品タイトル + Item ID + ✕閉じる
- 比較ストリップ: 自分合計 / ライバル合計 / 推奨価格 / 変動
- ガード判定: 5項目（最低価格 / 5%下落 / セール中 / 送料取得 / AI同一商品）
- 価格ランキング（1行構成、トップ10、自分の位置を強調）

#### 設定タブ

リスティングごとのローカル設定をすべてその場で編集可能。

**価格関連**
- 価格調整対象トグル
- 検索URL（編集ボタン）
- 最低価格
- 値下げ幅
- 自動反映トグル

**巡回**
- チェック時刻（グローバルプリセットからチェックボックスで選択）

**値上げ**（要件定義書 9 準拠、デフォルト OFF）
- 値上げ ON/OFF
- 値上げ方式（ライバル価格差 / 値上げ範囲）
- 最大値上げ幅

**フィルタ**
- コンディション比較無視
- 海外セラー除外
- 対象セラーID（カンマ区切り入力）
- 除外セラーID（カンマ区切り入力）
- 必須キーワード（URLからの自動抽出値の追加・編集）
- 除外キーワード（URLからの自動抽出値の追加・編集）

**判定**
- AI判定 ON/OFF

#### 操作
- 連続操作: 「← 前の行」「次の行 →」ボタン
- 閉じる: ✕ボタン / Escapeキー / 背景クリック
- 承認待ち時: 「承認して更新」「却下」ボタン（フッター）

### 8-5. 価格ランキング（モーダル内）

合計価格の安い順、トップ10。自分の順位を強調表示。

```
順位 | ★ | セラーID | 商品価格 | 送料 | 合計 | 差
#1   | ★ | Seller…  | $130.00 | $9.99 | $139.99 | -$10.01
#2   |   | Audio…   | $135.00 | $7.50 | $142.50 | -$7.50
...
▶ あなた #4 | $120.00 | $30.00 | $150.00 | ─
#5   | DealsByDoug | $148.00 | $7.25 | $155.25 | +$5.25
...
```

- 自分が #11 以下: トップ10下に別ブロックで「あなた #N」と表示
- 採用ライバル（同一商品判定で採用された競合）に ★ マーク
- 価格差の符号: 競合-自分（自分より安い=赤、自分より高い=緑）

### 8-6. Approvals 画面

- 上部: 理由内訳KPI（5%下落 / 最低価格 / AI信頼度 / 送料不明 / 価格変動）
- フィルタ: 理由別タブ
- テーブル: 商品 / Item No / 現在 / 推奨 / 変動% / 理由 / 待機時間 / 承認(✓) / 却下(✕)
- ヘッダーアクション: 一括承認、一括却下
- 行クリック → 詳細モーダル

### 8-7. Settings 画面（3タブ）

#### グローバル設定タブ
- 巡回時刻プリセット（最大5つ）
- デフォルト時刻（新規リスティング初期値）
- ガード設定（5%下落・AI閾値・コンディション一致 等）
- デフォルト値（値下げ幅・最低価格）
- 全体設定（タイムゾーン・Automation 緊急停止）

#### ローカル設定一覧タブ
- ローカル上書きされたリスティングの一覧
- 列: 商品 / Item No / 上書き項目数 / 上書き項目（ピル）/ メニュー
- フィルタ: 上書き項目別（最低価格 / 値下げ幅 / 時刻 / AI判定 等）
- メニュー: 「ローカル設定をリセット（グローバルに戻す）」
- 行クリック → 詳細モーダルの設定タブ

#### 全般タブ（3サブタブ）

##### eBay 連携サブタブ
- App ID / Cert ID / Dev ID 登録
- OAuth 連携ステータス + 再認可ボタン
- Refresh Token 期限表示
- eBay Developer 登録ガイドへのリンク

##### 通知サブタブ
- チャンネル: アプリ内 / メール / Slack / Discord
- 通知タイミング: 即時 / 日次サマリー
- 通知種別: 承認待ち発生 / APIエラー / トークン期限切れ / 出品同期エラー

##### データ管理サブタブ
- ログ保持期間（30/90/180/365 日、デフォルト 90日）
- 承認待ち期限（24時間/7日/30日/期限なし、デフォルト 7日）
- データエクスポート（CSV ダウンロード）
- アカウント削除（確認モーダル付き、復元不可）

#### 時刻プリセット変更時の警告モーダル

```
プリセット時刻 "08:00" を削除しようとしています
影響を受けるリスティング: 35件
適用するとローカル設定からも自動削除されます。
[キャンセル][変更を適用]
```

### 8-8. Logs 画面

- 上部フィルタ: 期間 / Item ID / 判定結果 / APIエラーのみ
- テーブル列: 日時 / ▌ / Item No / 商品 / 旧価格 / 新価格 / ライバル / 判定 / AI / メニュー
- 行クリック → 読み取り専用詳細モーダル

### 8-9. 共通ステータス色

| 色 | 状態 |
|---|---|
| 緑 | 更新済 / 承認済 / 成功 |
| 黄 | 承認待ち |
| 赤 | エラー / 失敗 |
| 灰 | スキップ / OFF / Ended / ライバル無し |

## 9. データモデル

要件定義書 v0.1 のスキーマをマルチテナント対応に拡張：

### 9-1. 全テーブル共通

```sql
user_id UUID NOT NULL REFERENCES auth.users(id)
```

RLS ポリシー: `user_id = auth.uid()`

### 9-2. global_settings

```sql
CREATE TABLE global_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  default_undercut_amount DECIMAL(10,2) DEFAULT 0.01,
  default_min_price DECIMAL(10,2),
  
  time_slot_presets JSON NOT NULL DEFAULT '[]',           -- 例: ["08:00", "12:00", "17:00"]
  default_check_time_slots JSON NOT NULL DEFAULT '[]',    -- 例: ["12:00", "17:00"]
  
  default_marketplace TEXT DEFAULT 'EBAY_US',
  default_delivery_country TEXT DEFAULT 'US',
  default_delivery_postal_code TEXT DEFAULT '90001',
  timezone TEXT DEFAULT 'Asia/Tokyo',
  
  condition_match BOOLEAN DEFAULT TRUE,
  exclude_for_parts BOOLEAN DEFAULT TRUE,
  exclude_foreign_sellers BOOLEAN DEFAULT FALSE,
  skip_sale_items BOOLEAN DEFAULT TRUE,
  
  max_drop_percent_before_approval DECIMAL(5,2) DEFAULT 5.00,
  ai_confidence_auto_threshold DECIMAL(4,2) DEFAULT 0.85,
  ai_confidence_reject_threshold DECIMAL(4,2) DEFAULT 0.64,
  
  allow_price_increase BOOLEAN DEFAULT FALSE,
  automation_enabled BOOLEAN DEFAULT TRUE,                -- 緊急停止スイッチ
  
  log_retention_days INTEGER DEFAULT 90,
  approval_expiration_days INTEGER DEFAULT 7,
  
  created_at DATETIME,
  updated_at DATETIME
);
```

### 9-3. ebay_credentials

```sql
CREATE TABLE ebay_credentials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  app_id TEXT NOT NULL,
  cert_secret_ref TEXT NOT NULL,            -- Google Secret Manager の参照ID
  dev_id TEXT NOT NULL,
  refresh_token_secret_ref TEXT,
  refresh_token_expires_at DATETIME,
  oauth_status TEXT DEFAULT 'pending',      -- pending / active / expired / revoked
  created_at DATETIME,
  updated_at DATETIME
);
```

### 9-4. listing_settings

```sql
CREATE TABLE listing_settings (
  id INTEGER PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  item_id TEXT NOT NULL,
  
  price_adjustment_enabled BOOLEAN DEFAULT FALSE,
  local_min_price DECIMAL(10,2),
  local_undercut_amount DECIMAL(10,2),
  auto_update_enabled BOOLEAN,
  local_check_time_slots JSON,              -- NULL ならグローバルの default_check_time_slots を使用
  
  search_url TEXT,                          -- ユーザーが登録した eBay 検索結果 URL
  search_keyword TEXT,                      -- _nkw から抽出
  category_id TEXT,                         -- _sacat から抽出
  price_min DECIMAL(10,2),                  -- _udlo から抽出
  price_max DECIMAL(10,2),                  -- _udhi から抽出
  condition_filter JSON,                    -- LH_ItemCondition から抽出
  location_filter TEXT,                     -- LH_PrefLoc から抽出
  buying_options TEXT,                      -- LH_BIN から抽出
  
  ignore_condition BOOLEAN DEFAULT FALSE,
  exclude_foreign_sellers BOOLEAN,
  use_ai_judgement BOOLEAN DEFAULT FALSE,
  
  allow_price_increase BOOLEAN DEFAULT FALSE,
  price_increase_mode TEXT,
  max_price_increase_amount DECIMAL(10,2),
  
  required_title_keywords JSON,
  excluded_title_keywords JSON,
  include_seller_ids JSON,
  exclude_seller_ids JSON,
  
  created_at DATETIME,
  updated_at DATETIME,
  UNIQUE(user_id, item_id)
);
```

### 9-5. listing_cache

```sql
CREATE TABLE listing_cache (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  item_id TEXT NOT NULL,
  title TEXT,
  current_price DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  condition_id TEXT,
  condition_name TEXT,
  image_url TEXT,
  seller_id TEXT,
  marketplace TEXT,
  listing_status TEXT,                      -- Active / Ended
  is_on_sale BOOLEAN DEFAULT FALSE,
  last_fetched_at DATETIME,
  PRIMARY KEY (user_id, item_id)
);
```

### 9-6. competitor_snapshots

```sql
CREATE TABLE competitor_snapshots (
  id INTEGER PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  own_item_id TEXT NOT NULL,
  competitor_item_id TEXT,
  competitor_title TEXT,
  competitor_price DECIMAL(10,2),
  competitor_shipping DECIMAL(10,2),
  competitor_total_price DECIMAL(10,2),
  competitor_seller_id TEXT,
  competitor_condition TEXT,
  competitor_location_country TEXT,
  competitor_url TEXT,
  rank_position INTEGER,
  is_adopted BOOLEAN DEFAULT FALSE,         -- 同一商品判定で採用されたか
  fetched_at DATETIME
);
```

### 9-7. price_check_logs

要件定義書 11-5 のスキーマに `user_id` を追加。

### 9-8. approval_queue

要件定義書 11-6 のスキーマに `user_id` を追加。`expired` ステータスの判定は `global_settings.approval_expiration_days` を使用。

### 9-9. scheduler_lock

```sql
CREATE TABLE scheduler_lock (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  locked_at DATETIME NOT NULL,
  released_at DATETIME
);
```

ジョブ開始時に `INSERT ... ON CONFLICT DO NOTHING` でロック取得。失敗時はスキップ。60分以上経過した古いロックは強制解放。

## 10. 運用ポリシー

### 10-0. 初期運用コスト方針

初期運用は、運営者1名・初期利用者3名程度を想定し、無料枠中心で開始する。

- DB/Auth: Supabase Free
- Web: Vercel Hobby または無料枠
- ジョブ実行: Google Cloud Run 無料枠中心
- スケジューラー: Google Cloud Scheduler 無料枠中心
- キュー: Google Cloud Tasks 無料枠中心
- シークレット: Google Secret Manager 無料枠/少額課金範囲

正式な商用提供や利用者増加により、DB容量、ログ保持、バックアップ、実行時間、チーム運用が無料枠を超える場合に有料プランへ移行する。無料運用中は `competitor_snapshots` の保存量を抑え、必要最小限のログを優先して残す。

### 10-1. 同時実行制御

正式版は SaaS 側で実行し、ユーザーPCの常時起動には依存しない。スケジュール時刻は数分程度のズレを許容し、Cloud Scheduler は処理対象をキューへ投入する役割、Cloud Run Jobs / Workers はキューを並列処理する役割とする。

初期実装では1つの UTC 時刻トリガーに対して全ユーザーを横断処理してもよいが、SaaS提供を前提に、早い段階で「ユーザー単位またはリスティング単位のキュー処理」へ移行する。200ユーザー x 1,000〜2,000リスティング規模では、全件を1本のジョブで順番に処理しない。

各ユーザーごとに `scheduler_lock` を取得してから処理を開始：

```typescript
for (const userId of targetUserIds) {
  const lock = await acquireSchedulerLock(userId);
  if (!lock) {
    log.warn(`User ${userId}: 前回の巡回がまだ走行中、今回のスロットはスキップ`);
    continue;
  }
  try {
    await processUserListings(userId, slotTimeUtc);
  } finally {
    await releaseSchedulerLock(userId);
  }
}
```

`scheduler_lock` の挙動:
- ユーザー単位（PRIMARY KEY = user_id）
- ロック取得失敗 → そのユーザーのみスキップ + 警告ログ
- 60分以上経過したロックは古いロックとみなし強制解放（前回ジョブの異常終了に備える）

### 10-2. APIエラー時のリトライ

- 指数バックオフで最大3回リトライ（1秒 → 2秒 → 4秒）
- HTTP 429（Rate Limit）: 60秒待機後リトライ、3回失敗で `deferred_quota` として巡回延期
- HTTP 5xx: 通常リトライ
- HTTP 4xx（認証以外）: リトライせずスキップしてログ記録
- HTTP 401（認証エラー）: リトライ停止、ユーザーに再認可通知

### 10-2-1. API利用枠管理

ユーザー個別App ID方式を前提に、ユーザーごとのAPI利用枠を管理する。グローバル設定とローカル設定の巡回時刻から、1日の予想API使用量を設定画面に表示する。

- API使用量が上限の90%を超えた場合: ダッシュボード上で警告
- API上限を超える見込みの場合: 保存制限は行わず、警告表示のみ
- 実行中にAPI上限へ到達した場合: まだ価格提案を作れていないリスティングは承認待ちではなく `deferred_quota` として次回以降へ延期
- 価格提案作成後、価格更新APIの上限や一時エラーで更新できない場合: `pending_approval` または更新失敗ログとして扱う

承認待ちは「ユーザーが判断できる価格提案が存在する状態」に限定する。API上限でライバル価格を取得できない場合は、提案価格がないため承認待ちに入れない。

### 10-3. 価格更新失敗時の挙動

1. 1回目失敗: 次回チェック時に再試行
2. 3回連続失敗: 承認待ちキューに移動、ユーザーに通知
3. Inventory API管理商品エラーの場合: 即承認待ちに移動

### 10-4. ログ保持

- デフォルト 90日（ユーザー設定で 30/90/180/365日 から選択可）
- 期限切れは自動削除（cron ジョブで日次実行）

### 10-5. 承認待ち期限

- デフォルト 7日（ユーザー設定で 24時間/7日/30日/期限なし）
- 期限切れは `expired` ステータスに自動変更

### 10-6. 通知

- チャンネル: アプリ内通知 / メール / Slack / Discord（ユーザー任意で選択）
- タイミング: 即時 / 日次サマリー
- 種別:
  - 承認待ち発生
  - API エラー（Rate Limit / 認証エラー）
  - トークン期限切れ警告
  - 出品同期エラー

## 11. 開発フェーズ

要件定義書 14 を踏襲：

| Phase | 内容 |
|---|---|
| Phase 1 | 監視専用（価格更新なし、ログ保存とダッシュボード表示まで） |
| Phase 2 | 手動承認更新（承認ボタンで `ReviseInventoryStatus` 実行） |
| Phase 3 | 自動更新（ガード条件を満たしたものだけ自動更新） |
| Phase 4 | AI判定（タイトル・画像比較で同一商品判定を強化） |

## 12. 後回しにする項目（YAGNI）

要件定義書 15 を踏襲：

- バリエーション商品
- 付属品差の厳密判定
- Inventory API 管理商品の更新
- 関税 / VAT / Import charges 込み比較
- 重量・配送方法から送料を毎回計算（Calculated Shipping 対応）
- 複数マーケット同時対応（US 以外）
- 完全 AI 主導判定

## 13. デザインシステム

`docs/design-system/` に格納されているデザインパッケージを参照。

### 採用デザイン
**E バリエーション（Dense Classic）**
- 配色・レイアウト: A バリエーション（Navy サイドバー / 白カード / Blue アクセント）
- 情報密度: D バリエーション（行高 20px、フォント 11.5px〜12.5px）

### 主要寸法
| 要素 | 寸法 |
|---|---|
| サイドバー幅 | 168px |
| トップバー高 | 44px |
| テーブル行高 | 20px |
| ベースフォント | 11.5px〜12.5px |
| 詳細モーダル幅 | 900px |

詳細は `docs/design-system/components.md` および `docs/design-system/claude-design-export/project/variations/E_dense.jsx` を参照。

## 14. 関連ドキュメント

- `docs/ebay_price_sentry_requirements_v0.1.md` — 要件定義書 v0.1（このドキュメントのベース）
- `docs/design-system/` — デザインシステム（カラー・タイポグラフィ・コンポーネント仕様）
- `docs/design-system/claude-design-export/` — Claude Design 生成物（Eバリエーション実装）
