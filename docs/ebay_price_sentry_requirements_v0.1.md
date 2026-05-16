# eBay Price Sentry 要件定義書 v0.1

## 1. 目的

自分が手動でONにしたeBayリスティングについて、ライバルセラーの同一商品の **商品価格＋送料の合計価格** を取得し、自分の商品が設定範囲内で最安値になるように価格を自動調整する。

価格調整は、グローバル設定を基本とし、必要に応じてリスティング単位のローカル設定で上書きできる。

---

## 2. 前提条件

| 項目 | 内容 |
|---|---|
| 対象マーケット | 初期は eBay US |
| 対象出品 | 手動で価格調整対象ONにしたリスティングのみ |
| 管理単位 | Item ID |
| SKU管理 | 初期版では不要 |
| バリエーション | 初期版では非対応 |
| 出品経路 | Seller Hub通常出品、Trading API作成出品 |
| 価格取得 | eBay Browse API |
| 価格更新 | eBay Trading API `ReviseInventoryStatus` |
| 実行頻度 | デフォルト1日3回 |

---

## 3. MVPで実装する機能

### 3-1. 対象リスティング管理

ユーザーが手動で価格調整対象ONにしたItem IDのみ価格調整対象にする。

重要：

```text
価格調整対象ON/OFF = そのリスティングを価格調整処理に参加させるか
自動反映ON/OFF = 処理対象になったリスティングの推奨価格を自動で反映するか
```

各リスティングは、デフォルトでは価格調整対象OFF。  
ユーザーが明示的にONにしたリスティングだけが価格チェック・価格調整の対象になる。

価格調整対象をONにした場合、デフォルトでは条件を満たせば自動反映する。  
ただし、ローカル設定でそのリスティングだけ自動反映OFF（手動承認）に変更できる。

価格調整対象ONにしたリスティングは、次回チェックから価格調整対象となり、デフォルトでは自動反映ONとして処理する。  
ただし、有効な最低価格が未設定、最低価格割れ、5%以上の値下げ、セール中、送料込み価格不明、同一商品判定不十分、更新直前の価格差異がある場合は、自動反映せずスキップまたは手動承認に回す。

| 機能 | 内容 |
|---|---|
| 価格調整対象ON/OFF | リスティング単位で設定。デフォルトはOFF |
| Item ID登録 | 手動入力、CSV取込、またはAPI取得一覧から選択 |
| バリエーション対応 | 初期版では非対応 |
| SKU | 初期版では使用しない |

---

### 3-2. グローバル設定

全リスティングに共通で適用される初期設定。

| 設定項目 | デフォルト | 内容 |
|---|---:|---|
| 値下げ幅 | $0.01 | ライバル最安より何ドル安くするか |
| 最低価格 | 未設定 | ローカル最低価格がない場合に使用。ただし自動反映には有効な最低価格が必要 |
| チェック頻度 | 1日3回 | 価格チェック頻度 |
| 自動反映 | ON | 価格調整対象ONのリスティングで、条件を満たせば自動で価格更新 |
| コンディション一致 | ON | 自分と同じコンディションを対象 |
| For parts等除外 | ON | Junk / For parts / Not working を除外 |
| セール中スキップ | ON | Sale event / Markdown sale中の商品は停止 |
| 5%以上下落 | 手動承認 | 一度に5%以上下がる場合は自動更新しない |
| AI信頼度低 | 手動承認 | AI判定が低信頼なら手動確認 |
| 海外セラー除外 | OFF | 商品所在地ベースで海外を除外 |
| 値上げ | OFF | ライバル価格上昇時の値上げ処理 |

---

### 3-3. ローカル設定

リスティングごとにグローバル設定を上書きできる。

| 設定項目 | 内容 |
|---|---|
| 価格調整対象ON/OFF | この商品を価格調整処理の対象にするか。デフォルトOFF |
| 最低価格 | この商品専用の最低価格 |
| 値下げ幅 | この商品専用の値下げ幅 |
| 自動反映ON/OFF | この商品だけ自動反映OFF（手動承認）にできる |
| 値上げON/OFF | この商品だけ値上げ対象にできる |
| 値上げ方式 | ライバル価格差 / 値上げ範囲 |
| チェック頻度 | この商品専用の頻度 |
| コンディション比較無視 | ONならコンディションを無視 |
| 海外セラー除外 | この商品だけON/OFF |
| 対象セラーID | 特定セラーのみ対象 |
| 除外セラーID | 特定セラーを除外 |
| タイトル必須キーワード | 含まれていない候補を除外 |
| タイトル除外キーワード | 含まれている候補を除外 |
| AI判定ON/OFF | この商品でAI判定を使うか |

---

## 4. ライバル検索仕様

### 4-1. 基本検索

Browse APIでキーワード検索を行う。

```text
keyword = 自分の商品タイトル、またはユーザー指定キーワード
sort = price
deliveryCountry = US
deliveryPostalCode = 90001 または 10001
conditionIds / conditions = 自分のコンディションに合わせる
```

---

### 4-2. 送料込み価格の扱い

比較価格は以下で計算する。

```text
ライバル合計価格 = ライバル商品価格 + ライバル送料
```

自分の価格は以下で計算する。

```text
目標合計価格 = ライバル合計価格 - 値下げ幅

新しい自分の商品価格 = 目標合計価格 - 自分の送料
```

例：

```text
ライバル商品価格：$100
ライバル送料：$30
ライバル合計：$130

値下げ幅：$0.01
目標合計：$129.99

自分の送料：$25

新しい商品価格：$104.99
```

---

## 5. 同一商品判定仕様

### 5-1. デフォルト判定

初期版では、以下の条件を通過した最安候補をライバルとして採用する。

```text
1. Browse APIで価格＋送料込みの安い順に取得
2. 自分自身のItem IDを除外
3. 除外セラーを除外
4. タイトル除外キーワードを除外
5. 必須キーワードが設定されていればチェック
6. コンディション一致設定を確認
7. For parts / Junk / Not working を除外
8. 必要ならAI判定
9. 最初に合格した候補を採用
```

---

### 5-2. コンディション判定

| 条件 | 仕様 |
|---|---|
| デフォルト | 自分のリスティングと同じコンディションを対象 |
| ローカル設定 | コンディション比較を無視可能 |
| 強制除外 | For parts / Junk / Not working |

---

### 5-3. 付属品判定

初期版では無視する。

将来拡張ではAI判定で以下を検出できるようにする。

```text
with remote
no remote
manual included
box included
cable missing
body only
```

---

### 5-4. セラーID条件

リスティングごと、またはグローバル設定で以下を設定可能にする。

| 設定 | 内容 |
|---|---|
| 対象セラーID | 指定したセラーのみ比較対象 |
| 除外セラーID | 指定したセラーを除外 |

---

### 5-5. 海外セラー除外

「海外セラー除外」は、初期版では **商品所在地ベース** で判定する。

例：

```text
自分が日本発送の商品として運用する場合：
itemLocationCountry = JP の商品のみ対象
```

注意点として、これは「セラーの国籍」ではなく、**商品所在地** による判定。  
そのため、厳密な意味での海外セラー除外とは少し違う。

---

## 6. AI判定仕様

### 6-1. 使用タイミング

AI判定は、初期版ではオプション。

| 状況 | AI判定 |
|---|---|
| 型番完全一致 | AI判定なしでも可 |
| タイトルが微妙に違う | AI判定 |
| 価格が極端に安い | AI判定または手動承認 |
| 画像が似ているか確認したい | AI判定 |
| 付属品差がありそう | AI判定 |

---

### 6-2. AIに渡す情報

```json
{
  "own_listing": {
    "item_id": "1234567890",
    "title": "Pioneer FH-P7000MD Car Audio Used Tested",
    "condition": "Used",
    "image_urls": ["https://..."],
    "price": 120.00,
    "shipping": 30.00
  },
  "competitor_listing": {
    "item_id": "9876543210",
    "title": "Pioneer FH-P7000MD MD CD Receiver Tested",
    "condition": "Used",
    "image_urls": ["https://..."],
    "price": 115.00,
    "shipping": 25.00
  }
}
```

---

### 6-3. AIの返却形式

AI判定は必ずJSONで返す。

```json
{
  "is_same_product": true,
  "confidence": 0.87,
  "reason": "型番と外観が一致しており、同一商品と判断できる。",
  "risk_flags": []
}
```

---

### 6-4. AI判定しきい値

| confidence | 処理 |
|---:|---|
| 0.85以上 | 自動更新可 |
| 0.65〜0.84 | 手動承認 |
| 0.64以下 | 対象外 |

---

## 7. 価格更新仕様

### 7-1. 更新API

初期版では Trading API `ReviseInventoryStatus` を使う。

更新対象：

```text
ItemID
StartPrice
```

---

### 7-2. Inventory API管理商品への対応

初期版では、Inventory API管理の商品は対象外。

価格更新に失敗した場合は、以下のようにログへ残す。

```text
価格更新失敗：Inventory API管理商品の可能性あり。初期版ではスキップ。
```

---

## 8. ガード仕様

### 8-1. 最低価格ガード

デフォルトでは、最低価格を下回る場合はスキップ。

```text
新価格 < ローカル最低価格
または
新価格 < グローバル最低価格

→ スキップ
```

ログ理由：

```text
最低価格を下回るためスキップ
```

---

### 8-2. セール中スキップ

Sale event / Markdown sale 中の商品は価格調整しない。

理由：

- セール中価格と通常価格の関係が複雑になる
- 意図しない二重値下げになる可能性がある
- eBay側で価格編集制限が出る可能性がある

ログ理由：

```text
セール中商品のためスキップ
```

---

### 8-3. 5%以上下落ガード

現在価格から5%以上下がる場合は、デフォルトで手動承認に回す。

```text
下落率 = (現在価格 - 新価格) / 現在価格 * 100
```

```text
下落率 >= 5%

→ 手動承認
```

---

### 8-4. AI信頼度ガード

AI判定を使った場合、信頼度が低ければ手動承認にする。

```text
confidence < 0.85

→ 手動承認
```

---

## 9. 値上げ仕様

### 9-1. 初期設定

値上げはデフォルトOFF。

理由：

- 値上げは販売機会を減らす可能性がある
- 値上げロジックは値下げより複雑
- 最初は安全性重視

---

### 9-2. ローカル設定

リスティング単位で値上げON/OFF可能。

値上げ方式は2種類。

| 方式 | 内容 |
|---|---|
| ライバル価格差方式 | ライバル合計価格との差を保つ |
| 値上げ範囲方式 | 最大値上げ幅の範囲内で上げる |

---

### 9-3. 値上げ例

現在：

```text
自分合計価格：$120
ライバル最安合計：$140
値下げ幅：$0.01
```

値上げONの場合：

```text
目標合計価格 = $139.99
```

ただし、最大値上げ幅が `$10` の場合：

```text
現在合計 $120 → 最大 $130 まで
```

この場合、新しい合計価格は `$130` に制限する。

---

## 10. 実行頻度仕様

### 10-1. デフォルト

```text
1日3回
```

例：

```text
09:00
15:00
21:00
```

---

### 10-2. 設定

| 設定場所 | 内容 |
|---|---|
| グローバル設定 | 全体のデフォルト頻度 |
| ローカル設定 | 商品ごとの頻度上書き |

---

### 10-3. API制限の目安

```text
1商品1回検索
1日3回チェック

5000 ÷ 3 = 約1666商品
```

ただし、実際には自分の商品取得・詳細取得・リトライなどもあるため、初期運用は **数十〜数百商品** から開始するのが安全。

---

## 11. DB設計案

### 11-1. global_settings

```sql
CREATE TABLE global_settings (
  id INTEGER PRIMARY KEY,
  default_undercut_amount DECIMAL(10,2) DEFAULT 0.01,
  default_min_price DECIMAL(10,2),
  default_check_frequency_per_day INTEGER DEFAULT 3,
  default_auto_update_enabled BOOLEAN DEFAULT TRUE,

  default_marketplace TEXT DEFAULT 'EBAY_US',
  default_delivery_country TEXT DEFAULT 'US',
  default_delivery_postal_code TEXT DEFAULT '90001',

  condition_match BOOLEAN DEFAULT TRUE,
  exclude_for_parts BOOLEAN DEFAULT TRUE,
  exclude_foreign_sellers BOOLEAN DEFAULT FALSE,
  skip_sale_items BOOLEAN DEFAULT TRUE,

  max_drop_percent_before_approval DECIMAL(5,2) DEFAULT 5.00,
  ai_confidence_auto_threshold DECIMAL(4,2) DEFAULT 0.85,
  ai_confidence_reject_threshold DECIMAL(4,2) DEFAULT 0.64,

  allow_price_increase BOOLEAN DEFAULT FALSE,
  created_at DATETIME,
  updated_at DATETIME
);
```

---

### 11-2. listing_settings

```sql
CREATE TABLE listing_settings (
  id INTEGER PRIMARY KEY,
  item_id TEXT UNIQUE NOT NULL,

  price_adjustment_enabled BOOLEAN DEFAULT FALSE,
  local_min_price DECIMAL(10,2),
  local_undercut_amount DECIMAL(10,2),
  auto_update_enabled BOOLEAN,
  check_frequency_per_day INTEGER,

  ignore_condition BOOLEAN DEFAULT FALSE,
  exclude_foreign_sellers BOOLEAN,
  use_ai_judgement BOOLEAN DEFAULT FALSE,

  allow_price_increase BOOLEAN DEFAULT FALSE,
  price_increase_mode TEXT,
  max_price_increase_amount DECIMAL(10,2),

  required_title_keywords TEXT,
  excluded_title_keywords TEXT,
  include_seller_ids TEXT,
  exclude_seller_ids TEXT,

  created_at DATETIME,
  updated_at DATETIME
);
```

`price_adjustment_enabled` は、そのリスティングを価格調整処理の対象にするかを表す。  
デフォルトは `FALSE` で、ユーザーが手動でONにした場合のみ `TRUE` になる。

`auto_update_enabled` は、価格調整対象になった後に推奨価格を自動反映するかを表す。  
未設定の場合は `global_settings.default_auto_update_enabled` を使う。

`required_title_keywords` などは、初期版ではJSON文字列で保存してもよい。

例：

```json
["FH-P7000MD", "Pioneer"]
```

---

### 11-3. listing_cache

自分のリスティング情報をキャッシュするテーブル。

```sql
CREATE TABLE listing_cache (
  item_id TEXT PRIMARY KEY,
  title TEXT,
  current_price DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  condition_id TEXT,
  condition_name TEXT,
  image_url TEXT,
  seller_id TEXT,
  marketplace TEXT,
  listing_status TEXT,
  is_on_sale BOOLEAN DEFAULT FALSE,
  last_fetched_at DATETIME
);
```

---

### 11-4. competitor_snapshots

ライバル候補の取得結果を保存するテーブル。

```sql
CREATE TABLE competitor_snapshots (
  id INTEGER PRIMARY KEY,
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
  fetched_at DATETIME
);
```

---

### 11-5. price_check_logs

価格判定・更新ログ。

```sql
CREATE TABLE price_check_logs (
  id INTEGER PRIMARY KEY,
  checked_at DATETIME,

  item_id TEXT NOT NULL,
  own_title TEXT,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  own_shipping DECIMAL(10,2),

  competitor_item_id TEXT,
  competitor_title TEXT,
  competitor_price DECIMAL(10,2),
  competitor_shipping DECIMAL(10,2),
  competitor_total_price DECIMAL(10,2),
  competitor_seller_id TEXT,

  decision TEXT,
  reason TEXT,

  ai_used BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(4,2),
  ai_reason TEXT,

  api_update_status TEXT,
  api_error_message TEXT
);
```

`decision` の値：

```text
updated
skipped
pending_approval
failed
no_competitor
```

---

### 11-6. approval_queue

手動承認が必要な価格変更を保存する。

```sql
CREATE TABLE approval_queue (
  id INTEGER PRIMARY KEY,
  item_id TEXT NOT NULL,

  old_price DECIMAL(10,2),
  proposed_price DECIMAL(10,2),

  competitor_item_id TEXT,
  competitor_title TEXT,
  competitor_total_price DECIMAL(10,2),

  reason TEXT,
  status TEXT DEFAULT 'pending',

  created_at DATETIME,
  approved_at DATETIME,
  rejected_at DATETIME
);
```

`status` の値：

```text
pending
approved
rejected
expired
```

---

## 12. 処理フロー仕様

### 12-1. 全体フロー

```text
1. `price_adjustment_enabled = true` のItem ID一覧を取得
↓
2. グローバル設定とローカル設定を統合
↓
3. 自分の商品情報を取得 / キャッシュ更新
↓
4. セール中ならスキップ
↓
5. Browse APIでライバル候補を取得
↓
6. 除外条件を適用
↓
7. コンディション条件を適用
↓
8. 必要ならAI判定
↓
9. 採用ライバルを決定
↓
10. 推奨価格を計算
↓
11. ガード判定
↓
12. 自動更新 or 手動承認
↓
13. ログ保存
```

---

### 12-2. 設定統合ルール

```text
有効設定 = グローバル設定
↓
ローカル設定が存在する項目だけ上書き
```

ただし、価格調整対象ON/OFFはグローバル設定ではなくリスティング単位で管理する。  
`price_adjustment_enabled = false` のリスティングは、他の設定に関係なく価格チェック・価格更新の対象外。

`auto_update_enabled` は、`price_adjustment_enabled = true` の場合だけ意味を持つ。

例：

| 項目 | グローバル | ローカル | 実際に使う値 |
|---|---:|---:|---:|
| 価格調整対象 | なし | OFF | 処理対象外 |
| 価格調整対象 | なし | ON | 処理対象 |
| 値下げ幅 | $0.01 | 未設定 | $0.01 |
| 最低価格 | $80 | $100 | $100 |
| 自動反映 | ON | OFF | OFF |
| チェック頻度 | 1日3回 | 1日1回 | 1日1回 |

---

### 12-3. ライバル採用ロジック

```text
candidates = Browse APIの検索結果

for candidate in candidates:
    if candidate.item_id == own.item_id:
        continue

    if candidate.seller_id in exclude_seller_ids:
        continue

    if include_seller_ids is not empty:
        if candidate.seller_id not in include_seller_ids:
            continue

    if contains_excluded_keyword(candidate.title):
        continue

    if not contains_required_keywords(candidate.title):
        continue

    if condition_match is ON:
        if candidate.condition != own.condition:
            continue

    if exclude_foreign_sellers is ON:
        if candidate.item_location_country != allowed_country:
            continue

    if use_ai_judgement is ON:
        ai_result = judge_by_ai(own, candidate)
        if ai_result.is_same_product == false:
            continue
        if ai_result.confidence < reject_threshold:
            continue

    return candidate
```

---

### 12-4. 価格計算ロジック

```text
competitor_total = competitor_price + competitor_shipping
target_total = competitor_total - undercut_amount
new_own_price = target_total - own_shipping
```

---

### 12-5. ガード判定ロジック

```text
if own.is_on_sale:
    decision = skipped
    reason = "セール中商品のためスキップ"

elif effective_min_price is not set:
    decision = pending_approval
    reason = "有効な最低価格が未設定のため手動承認"

elif new_own_price < effective_min_price:
    decision = skipped
    reason = "最低価格を下回るためスキップ"

elif own_shipping is unknown or competitor_shipping is unknown:
    decision = pending_approval
    reason = "送料込み価格が不明のため手動承認"

elif drop_percent >= max_drop_percent_before_approval:
    decision = pending_approval
    reason = "1回の下落率が5%以上のため手動承認"

elif ai_used and ai_confidence < ai_confidence_auto_threshold:
    decision = pending_approval
    reason = "AI判定の信頼度が低いため手動承認"

elif same_product_confidence_is_insufficient:
    decision = pending_approval
    reason = "同一商品判定が不十分のため手動承認"

elif current_price_changed_before_update:
    decision = pending_approval
    reason = "更新直前に現在価格が変わったため手動承認"

elif auto_update_enabled == false:
    decision = pending_approval
    reason = "手動承認設定のため承認待ち"

else:
    update_price()
    decision = updated
```

---

## 13. 画面設計案

### 13-1. ダッシュボード

| 項目 | 内容 |
|---|---|
| Item ID | 自分の商品 |
| 商品名 | 自分の商品タイトル |
| 現在価格 | 現在の商品価格 |
| 送料 | 自分の送料 |
| 合計価格 | 商品価格＋送料 |
| ライバル最安 | ライバル合計価格 |
| 推奨価格 | 新しい商品価格 |
| 状態 | 更新済み / スキップ / 承認待ち |
| 最終チェック | 最後に確認した日時 |

---

### 13-2. リスティング設定画面

Item IDごとに以下を設定。

```text
価格調整対象ON/OFF
最低価格
値下げ幅
自動反映ON/OFF
値上げON/OFF
コンディション比較無視
海外セラー除外
対象セラーID
除外セラーID
必須キーワード
除外キーワード
AI判定ON/OFF
チェック頻度
```

---

### 13-3. 承認待ち画面

| 項目 | 内容 |
|---|---|
| 商品名 | 自分の商品 |
| 現在価格 | 変更前 |
| 提案価格 | 変更後 |
| 下落率 | 何%下がるか |
| ライバル商品 | 比較対象 |
| 理由 | なぜ承認待ちになったか |
| 操作 | 承認 / 却下 |

---

### 13-4. ログ画面

```text
日時
Item ID
商品名
旧価格
新価格
ライバルItem ID
ライバル価格
ライバル送料
ライバル合計
判定結果
理由
AI信頼度
APIエラー
```

---

## 14. 開発フェーズ

### Phase 1：監視専用

価格更新はしない。

実装内容：

```text
Item ID登録
自分の商品情報取得
Browse API検索
ライバル最安取得
推奨価格計算
ログ保存
ダッシュボード表示
```

目的：

> 誤判定がどれくらいあるかを確認する。

---

### Phase 2：手動承認更新

承認ボタンを押したときだけ価格更新する。

実装内容：

```text
承認待ちキュー
承認 / 却下
ReviseInventoryStatusで価格更新
更新ログ保存
```

目的：

> 実際の価格更新APIを安全にテストする。

---

### Phase 3：自動更新

ガード条件を満たしたものだけ自動更新する。

実装内容：

```text
自動反映ON
最低価格ガード
5%以上下落ガード
セール中スキップ
AI信頼度ガード
```

目的：

> 低リスク商品から自動化する。

---

### Phase 4：AI判定

タイトル・画像比較で同一商品判定を強化する。

実装内容：

```text
AI判定API連携
画像URL取得
confidence判定
リスクフラグ表示
```

目的：

> ノイズ商品を減らし、誤値下げを防ぐ。

---

## 15. MVPで後回しにするもの

| 項目 | 理由 |
|---|---|
| バリエーション商品 | Item IDだけでは管理が難しい |
| 付属品差の厳密判定 | 複雑すぎるためAI拡張で対応 |
| Inventory API管理商品の更新 | まずはTrading API系に集中 |
| 関税 / VAT / Import charges込み比較 | 初期版は商品価格＋送料のみ |
| 送料自動計算 | 初期版は自分の送料取得または保存で対応 |
| 複数マーケット同時対応 | まずはUS基準で固定 |
| 完全AI主導判定 | コストと誤判定リスクが高い |

---

## 16. 実装前に決める最後の項目

### A. 送料込み比較の基準ZIP

| ZIP | 特徴 |
|---|---|
| 90001 | 米国西海岸基準 |
| 10001 | 米国東海岸基準 |

初期版では `90001` を推奨。

---

### B. 自分の送料取得方法

| 方法 | おすすめ度 |
|---|---:|
| APIから取得し、listing_cacheに保存 | 高 |
| 手動で送料を登録 | 中 |
| 重量・配送方法から毎回計算 | 後回し |

---

## 17. Claude Code / 開発者に渡す指示文

```text
eBayセラー向けの価格自動調整ツールを作成したい。

目的：
手動でONにした自分のeBayリスティングについて、Browse APIでライバル商品の商品価格＋送料の合計価格を取得し、自分の商品が設定範囲内で最安値になるように価格を調整する。

前提：
- Browse APIは利用可能
- 自分の商品はItem IDで管理
- SKUは初期版では使わない
- バリエーション商品は初期版では非対応
- 対象はSeller Hub通常出品とTrading API作成出品
- 価格更新はTrading API ReviseInventoryStatusを使う
- 比較対象は商品価格＋送料
- デフォルトではライバルより$0.01安くする
- 各リスティングはデフォルトでは価格調整対象OFF
- 対象はユーザーが手動で価格調整対象ONにしたリスティングのみ
- チェック頻度はデフォルト1日3回
- 価格調整対象ONのリスティングは、デフォルトでは条件を満たせば自動反映
- ローカル設定で自動反映OFF（手動承認）に切り替え可能
- ログは必ず保存する

必要機能：
1. グローバル設定
2. リスティングごとのローカル設定
3. Item ID登録・管理
4. 自分の商品情報取得
5. Browse APIによるライバル検索
6. コンディション一致判定
7. For parts / Junk / Not working 除外
8. セラーID指定・除外
9. 商品所在地ベースの海外セラー除外
10. AI判定オプション
11. 推奨価格計算
12. 最低価格ガード
13. セール中スキップ
14. 5%以上下落時の手動承認
15. AI低信頼度時の手動承認
16. ReviseInventoryStatusによる価格更新
17. 更新ログ
18. 承認待ちキュー
19. ダッシュボード
20. ログ画面

まずはPhase 1として、価格更新はせず、Item ID登録、商品情報取得、ライバル検索、推奨価格計算、ログ保存、ダッシュボード表示までを実装する。
```

---

## 18. 最終結論

この仕様なら、MVP開発へ進める。

推奨順序は以下。

```text
Phase 1：価格監視・推奨価格表示
Phase 2：手動承認更新
Phase 3：自動更新
Phase 4：AI判定
```
