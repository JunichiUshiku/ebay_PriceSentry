# PriceSentry 実装タスク（MVP → 本運用）

> 目標：3,000リスト / 1日5巡回 / 毎巡回最大1,500改定に対応できるMVPを2–4週間で。  
> スタック想定：Next.js + Node(FastAPIでも可) + Redis + PostgreSQL + Docker + GitHub Actions

## 0. プロジェクト初期化
- [ ] リポジトリ作成（frontend / api / workers / infra）
- [ ] Docker Compose（web/api/worker/redis/db）
- [ ] CI/CD（lint, test, build, push, deploy）
- [ ] 環境変数・Secrets設計（.env, KMS, GitHub Secrets）

## 1. 認証・接続（eBay）
- [ ] OAuth/Auth’n’Auth フロー（リダイレクト/Token保存）
- [ ] KMS暗号化保管（refresh_token, client_secret）
- [ ] Marketplace-ID / EndUserCtxの選択UI
- [ ] トークン更新の定期ジョブ & 期限通知

## 2. ルール管理（MVP）
- [ ] ルールCRUD（ID監視 or 検索条件）
- [ ] セーフティ（下限価格/最低利益/改定幅）
- [ ] ε（アンダーカット幅）設定
- [ ] テスト実行（単発チェック）

## 3. 巡回ジョブ（CHECK）
- [ ] スケジューラ（5回/日、A/B/C配分は固定で開始）
- [ ] **リクエスト集約**：同一検索条件のルールをグルーピングし、APIコール数を削減
- [ ] Browse `/item_summary/search` 呼び出し（JP限定/価格順/送料込み）
  - [ ] ヘッダー `X-EBAY-C-ENDUSERCTX` (`contextualLocation`) の実装
- [ ] **自社除外**：レスポンスから自分のSeller IDを持つ商品を除外するフィルタ処理
- [ ] 合計コスト算出（price + shippingOptions 最小）
- [ ] 判定→REPRICEキュー投入
- [ ] API消費メータ（Browse/Trading/Inventory 別カウント）

## 4. 改定ジョブ（REPRICE）
- [ ] Trading `ReviseInventoryStatus` **4件/コール**でバッチ化
- [ ] POSTのスロットリング（50req/5秒以内）
- [ ] 改定失敗のリトライ/遅延キュー（指数バックオフ）
- [ ] 1リスティング/日250回の制限ガード

## 5. フロントエンド（MVP画面）
- [ ] ダッシュボード（最安維持率/当日改定/失敗/API消費）
- [ ] 在庫一覧（差額・最終改定・有効状態）
- [ ] ルール編集（ID監視/検索条件、セーフティ、ε）
- [ ] 改定履歴（CSV出力）
- [ ] 通知設定（Slack/Email）

## 6. 運用・監視
- [ ] OpenTelemetry + Sentry + Prometheus/Grafana
- [ ] アラート（上限接近/失敗連鎖/トークン期限）
- [ ] 監査ログ（設定変更/手動実行）
- [ ] バックアップ（DBスナップショット）

## 7. スケール/最適化（本運用）
- [ ] A/B/C優先度の導入（A=短周期、B/C=長周期）
- [ ] バックオフ（最安維持中の間隔延長）
- [ ] 差分監視（上位変化なし→スキップ）
- [ ] Browse増枠申請（15k〜30k/day）対応・水平スケール
- [ ] Notification API（ITEM_PRICE_REVISION）対応市場の実装（任意）

## 8. 品質保証
- [ ] ユニット：価格判定、送料合算、セーフティガード
- [ ] 連携：トークン更新→API呼び出し、改定の一括更新
- [ ] 負荷：3,000件×5回/日のジョブスループット
- [ ] E2E：ルール→巡回→改定→履歴→通知の一連

## 付録：見積り（概算・初期MVP）
- 期間：2–4週（1–2名）
- 主なリスク：API増枠審査、送料算出の差異、検索→結果の不一致
- 回避策：キャッシュ＆テレメトリ、A/B/C分配、Browse/Tradingの切替柔軟性
