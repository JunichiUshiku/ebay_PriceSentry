# PriceSentry 設計仕様（アーキテクチャ & 機能）

## 1. プロダクト概要
**PriceSentry** は、eBayセラー向けの自動リプライサー（最安維持ツール）。  
- 日本セラー（JP発送）を優先・限定して比較可能  
- 「価格＋送料」の合計で“本当の最安”を判定  
- 抜かれた直後の即時に近い追従（高優先度商品の短周期ポーリング、将来的にNotification API対応）  
- 最低利益・下限価格・改定幅の安全ガードで“値下げしすぎ”を防止

## 2. 想定ユーザー / 運用規模
- 3,000リスト規模、1日5巡回（優先度A/B/Cの可変）
- 毎巡回で最大1,500リストの価格改定発生に耐えるスループット
- 将来：Browse APIの増枠（目安 15,000〜30,000 calls/day）

## 3. システム構成（SaaS構成）
- **Webフロント**：Next.js（App Router）/ TypeScript / Tailwind / shadcn/ui
- **拡張機能（任意）**：URL→検索条件（_nkw, _sacat 等）の抽出→Webに送信
- **APIサーバー**：Node.js（NestJS/Express） or Python（FastAPI）
- **ジョブキュー**：Redis + BullMQ（Node） or Celery（Python）
- **ワーカー**：価格取得・判定・改定・記録のバッチ処理
- **DB**：PostgreSQL（RDS系）
- **KMS/Secrets**：クラウドKMS + .env(ローカルのみ)
- **メトリクス/ログ**：Prometheus + Grafana / OpenTelemetry / Sentry
- **通知**：Slack / Email
- **デプロイ**：Docker + CI/CD（GitHub Actions）

### 3.1 アーキテクチャ図（論理）
```
Browser(拡張) ──> Web(Next.js) ──> API(Gateway) ──┬─> Job Queue ──> Workers(競合取得/判定/改定)
                                                     ├─> DB(PostgreSQL)
                                                     ├─> Secrets(KMS)
                                                     └─> Notifier(Slack/Email)
```

## 4. eBay API利用ポリシー
- **競合価格取得**：Buy **Browse API** `/buy/browse/v1/item_summary/search`
  - `q` / `category_ids` / `filter=itemLocationCountry:JP,buyingOptions:{FIXED_PRICE}`
  - **送料計算の正確化**：`X-EBAY-C-ENDUSERCTX` ヘッダーで `contextualLocation=country:US`（またはターゲット国）を必須指定し、バイヤー視点の送料を取得。
  - 並び替え：`sort=price`（価格＋送料の合計）。
- **個別詳細（任意）**：`getItem` / `getItems(最大20件)` ※許可がある場合
- **価格改定（自分の出品）**：
  - Trading `ReviseInventoryStatus`（**最大4件/コール**でバッチ）
  - 代替：Inventory `updateOffer` / `bulkUpdatePriceQuantity`
- **制限**：1リスティング/日 **最大250回改定**、POSTは **50req/5秒** 目安 → レート制御必須

## 5. 価格判定ロジック
1. 該当ルールの取得（競合ItemID or 検索条件）
   - **最適化**：同一の検索条件（キーワード・絞り込み）を持つルールをグルーピングし、APIリクエストを1回に集約（Deduplication）。
2. **検索結果の取得とフィルタリング**
   - 日本発送・該当コンディションの上位を取得
   - **自社除外**：取得したリストから、**自分のSeller ID（username）** と一致する商品をリストから**除外**（自己競合による底なし沼防止）。
3. **合計コスト算出**
   - `Total Cost = item.price.value + item.shippingOptions[0].shippingCost.value`
   - ※APIリクエスト時の `contextualLocation` に基づく送料を使用。
4. **自分の現在価格**と比較  
5. 新価格候補＝`(競合最安合計 - ε)` を計算（ε=1円/1¢相当）
6. **セーフティ**：
   - 下限価格 or 最低利益を下回らないか
   - 改定幅（例：±1〜10%）を超えないか
   - 時間帯/回数制限（深夜改定禁止など）
7. OKなら改定キューへ投入

## 6. 巡回戦略（スケジューリング）
- デフォルト：**1日5巡回**（A/B/Cで粒度調整可）
- **優先度A**（売れ筋/高粗利/強競争）に短周期（例：1〜2h）を付与
- **バックオフ**：自分が最安維持中なら次回巡回を遅らせる
- **差分監視**：同一検索条件で上位セラー/価格が変わらなければ巡回延伸
- **（将来）プッシュ検知**：Notification API（ITEM_PRICE_REVISION）対応市場に限り導入

## 7. データモデル（例）
- **users**(id, email, plan, created_at …)
- **tokens**(user_id, ebay_user_id, refresh_token(enc), scopes, marketplace_id, updated_at)
- **listings**(id, user_id, item_id, sku, title, price, currency, condition_id, shipping_profile …)
- **rules**(listing_id, rule_type[ID|SEARCH], rival_item_ids[], query, category_ids[], filters, min_price, min_margin_pct, epsilon, enabled)
- **price_logs**(ts, listing_id, old_price, new_price, rival_source, rival_price_total, reason, status)
- **api_usage**(ts, api, count, job_id, user_id)
- **jobs**(id, type[CHECK|REPRICE], priority, status, next_run_at, payload, retries)

## 8. セキュリティ / 権限
- リフレッシュトークンは**KMSで暗号化**保管、アプリ側は最小権限スコープ
- PII最小化（氏名・住所は保存しない方針）
- 監査ログ（改定操作・閲覧・設定変更）
- RBAC（オーナー/メンバー）

## 9. 可観測性 / 運用
- メトリクス：最安維持率、1日改定回数、失敗率、API消費、ジョブ待ち時間
- アラート：API失敗連鎖、改定失敗、上限接近、トークン期限
- ロールバック：設定バージョン管理（ルールの差分復元）

## 10. スケール戦略
- Browse増枠申請（希望 2〜3万/day）
- **リクエスト集約（Request Batching）**：
  - 多数の商品が「同じキーワード」を監視している場合、1回のAPI検索結果をRedisにキャッシュし、該当する全商品の判定に使い回す。
  - これにより、API消費を `N商品` から `N検索条件` に削減。
- ワーカー水平分散、シャーディング（ユーザーID or カテゴリ）
- 曜日/時間帯の負荷分散（巡回時間のランダム化）
