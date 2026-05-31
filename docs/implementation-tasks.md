# eBay Price Sentry Implementation Tasks

> 要件定義書 `docs/ebay_price_sentry_requirements_v0.1.md` を、実装タスクと現在ステータスに落とし込んだ管理ドキュメント。

**作成日:** 2026-05-21
**調査範囲:** `app/`, `lib/`, `docs/`, `package.json`
**主な参照元:**
- `docs/ebay_price_sentry_requirements_v0.1.md`
- `docs/superpowers/specs/2026-04-30-ebay-price-sentry-design.md`
- `docs/design-system/`
- `docs/mock-ui/`

## ステータス定義

| 状 | 意味 |
|---|---|
| 完 | 完了している |
| 未 | 完了していない |
| 仮 | 一部要件は完了しているが、まだ未完了の部分がある |

## 現在の全体像

現在の実装は、**UIシェルとモック/開発用データによる操作体験が先行し、eBay Trading APIの認証診断と出品同期が一部つながっている段階**。

一方で、MVPの中核である **Browse APIによるライバル検索、ライバル採用、競合スナップショット保存、永続ログ、承認キュー、実価格更新API連携** は未実装またはモック状態。

| 領域 | 状 | 状況 |
|---|---|---|
| UI/画面 | 仮 | ダッシュボード、承認待ち、設定、ログの主要画面は存在 |
| eBay認証/同期 | 仮 | `.env.local` 保存、GetUser診断、GetMyeBaySelling同期は実装 |
| Browse API監視 | 未 | 競合検索・ライバル採用は未実装 |
| 価格計算/ガード | 仮 | 純粋関数と一部テストあり |
| 永続化 | 仮 | 開発用JSONのみ。DB設計は未実装 |
| 承認/更新 | 仮 | UI上の状態変更のみ。Trading API更新は未実装 |
| AI判定 | 仮 | 型/信頼度表示/ガードの一部のみ |
| テスト | 仮 | Vitestで価格計算とURL解析の一部のみ |

## Phase 1: 監視専用

目的: 価格更新は行わず、Item ID登録、自分の商品情報取得、ライバル検索、推奨価格計算、ログ保存、ダッシュボード表示までを実装する。

| 状 | ID | タスク | 残タスク | 現在の証跡 |
|---|---|---|---|---|
| 仮 | P1-01 | Item ID登録 | 直接Item ID入力、CSV取込、登録済み一覧の空状態UIを追加する | 検索URL登録API `app/api/listings/route.ts` とDB保存 `lib/server/listing-persistence.ts` を追加済み。 |
| 仮 | P1-02 | 価格調整対象ON/OFF | 同期後の保持を実データで検証し、設定保存失敗時のUI通知を追加する | 詳細モーダル変更は `app/api/listings/[itemId]/settings/route.ts` 経由でDB保存。eBay同期時は既存設定をマージ。 |
| 仮 | P1-03 | eBay認証情報の保存/状態表示 | OAuth取得フロー、トークン期限/スコープ診断、`.env.local` 未設定時の導線を整える | `lib/server/env-file.ts` と `app/api/settings/ebay-credentials/route.ts`。 |
| 仮 | P1-04 | 自分の商品情報取得 | 送料取得精度の検証、同期結果の差分ログ、DB保存失敗時の再試行を追加する | `GetMyeBaySelling` の結果を `listing_cache` へ保存し、`listing_settings` は既存ローカル設定を保持する。 |
| 未 | P1-05 | Browse APIによるライバル検索 | Browse APIクライアント、検索条件生成、送料込み価格取得、エラー/Rate Limit処理を実装する | `lib/server` と `app/api` にBrowse APIクライアントは確認できない。 |
| 未 | P1-06 | ライバル候補フィルタ | 自分Item ID除外、セラー除外/対象、タイトル必須/除外、コンディション、所在地フィルタを実装する | サンプル競合データは `lib/data.ts` にあるが、実検索候補の採用処理はない。 |
| 未 | P1-07 | ライバル最安採用 | フィルタ通過後の最安候補選定と採用理由を保存する | UIは採用済み候補を表示できるが、採用ロジックは未確認。 |
| 完 | P1-08 | 送料込み価格計算 | Browse API連携後の実データ入力に接続する | `calculatePriceDecision` が `ownPrice + ownShipping` と `competitorPrice + competitorShipping` を計算する。 |
| 仮 | P1-09 | 推奨価格計算 | 値上げケース、採用ライバル不在、通貨/丸め、実監視フローへの統合を追加する | `lib/price-engine.ts` が `competitorTotal - undercutAmount - ownShipping` を計算する。 |
| 仮 | P1-10 | 監視実行フロー | サーバー側ジョブ/APIとして実装し、Browse検索、ログ保存、承認キュー作成へ接続する | `app/page.tsx` の `runPriceChecks` は現在のリスト/サンプル競合から画面状態を更新する。 |
| 仮 | P1-11 | 価格判定ログ保存 | `price_check_logs` 相当の永続保存、APIエラー、競合Item ID/送料/タイトル等の項目を追加する | `LogEntry` 型と画面内メモリログはある。 |
| 未 | P1-12 | 競合スナップショット保存 | `competitor_snapshots` 相当の保存と最新トップ10取得を実装する | DB/ファイル保存は確認できない。 |
| 仮 | P1-13 | ダッシュボード表示 | 検索、実ページネーション、実API使用量、動的KPI、永続データ接続を実装する | `DashboardPage`、KPI、テーブル、モバイルリストは `app/page.tsx` に存在。 |
| 仮 | P1-14 | リスティング詳細/ランキング表示 | 実競合スナップショット、採用理由、検索条件、ログ履歴へ接続する | 詳細モーダル、ガード表示、価格ランキングUIは存在。 |
| 仮 | P1-15 | ログ画面 | 期間/判定/APIエラーフィルタ、詳細モーダル、永続ログAPIを実装する | `LogsPage` は存在し、メモリログを表示する。 |
| 仮 | P1-16 | eBay検索URL解析/設定反映 | 解析結果をDBの `listing_settings` 相当へ保存し、カテゴリ、価格範囲、所在地、購入形式をBrowse API検索条件へ接続する | `lib/ebay-url.ts` が `_nkw`、必須/除外キーワード、カテゴリ、価格範囲、コンディション、所在地、BINを解析する。 |

## Phase 2: 手動承認更新

目的: 承認ボタンを押したときだけ `ReviseInventoryStatus` で価格更新し、更新ログを保存する。

| 状 | ID | タスク | 残タスク | 現在の証跡 |
|---|---|---|---|---|
| 仮 | P2-01 | 承認待ちキュー作成 | `approval_queue` 相当の永続ストア、ステータス履歴、期限切れ処理を追加する | `status === "pending"` から承認待ちを導出し、承認待ち画面は存在。 |
| 仮 | P2-02 | 承認/却下UI | 理由フィルタ、確認ダイアログ、処理結果ログ、失敗時UIを追加する | `ApprovalsPage` と詳細モーダルに承認/却下ボタンがある。 |
| 仮 | P2-03 | 承認時の価格反映 | サーバーAPI化し、更新前GetItem再確認、Trading API更新、結果保存へ接続する | 現在は `approveListing` が画面内の `currentPrice` を更新するのみ。 |
| 未 | P2-04 | Trading API `ReviseInventoryStatus` | `ReviseInventoryStatus` XML生成、API呼び出し、Ack/Error解析を実装する | `callTradingApi` は `GetMyeBaySelling` と `GetUser` のみ。 |
| 未 | P2-05 | 更新ログ保存 | 成功/失敗、旧価格/新価格、APIエラー、承認者/時刻をログに保存する | 承認時の永続ログ保存は確認できない。 |
| 未 | P2-06 | Inventory API管理商品失敗時の扱い | Inventory API管理商品の可能性を検出し、初期版ではスキップログとして残す | 失敗分類は未実装。 |

## Phase 3: 自動更新

目的: ガード条件を満たしたものだけ自動更新する。

| 状 | ID | タスク | 残タスク | 現在の証跡 |
|---|---|---|---|---|
| 仮 | P3-01 | 自動反映ON/OFF | グローバル/ローカル統合、永続保存、自動更新APIとの接続を行う | `autoUpdateEnabled` 型と詳細モーダルの切替がある。 |
| 仮 | P3-02 | 最低価格ガード | 有効設定統合、ログ文言統一、グローバル/ローカル優先順位を実装する | `calculatePriceDecision` が最低価格未設定/下回りを判定する。 |
| 仮 | P3-03 | セール中スキップ | eBay上のセール判定精度確認、ログ保存、グローバル設定ON/OFFを実装する | `isOnSale` とガード判定はある。Trading同期時も `DiscountPriceInfo` を見る。 |
| 仮 | P3-04 | 5%以上下落ガード | 設定値の永続化、境界値テスト、承認キュー保存へ接続する | `dropPercent >= maxDropPercent` で承認待ちにする。 |
| 仮 | P3-05 | 送料不明ガード | Browse/Trading実データで送料不明ケースを検出し、UI/ログに保存する | 送料不明時は `shipping_unknown` 承認待ち。 |
| 未 | P3-06 | 同一商品判定不足ガード | ルール判定/AI判定の不確実ケースを承認待ちへ送る | ガードコードや判定結果は確認できない。 |
| 仮 | P3-07 | 更新直前価格差異ガード | 実更新前に `GetItem` 等で現在価格を再取得して比較する | `currentPriceChangedBeforeUpdate` の入力と判定はある。 |
| 未 | P3-08 | 自動更新API実行 | ガード通過時に `ReviseInventoryStatus` を実行し、ログを保存する | 価格更新APIが未実装。 |
| 仮 | P3-09 | 実行頻度/スケジューラ | cron/job/worker、グローバル頻度、ローカル頻度上書き、API上限制御を実装する | UI上の時刻スロットはある。 |
| 未 | P3-10 | API制限/リトライ | API使用量集計、上限時の延期、指数バックオフ、再試行ログを実装する | Rate Limitやリトライ処理は確認できない。 |

## Phase 4: AI判定

目的: タイトル・画像比較で同一商品判定を強化する。

| 状 | ID | タスク | 残タスク | 現在の証跡 |
|---|---|---|---|---|
| 仮 | P4-01 | AI判定ON/OFF | 設定永続化、実判定フローへの接続を行う | `aiJudgeEnabled` 型とUI切替はある。 |
| 未 | P4-02 | AI入力データ整形 | item_id、title、condition、image_urls、price、shippingを構築する | 自分/競合の商品情報をAI入力JSONへ整形する処理は確認できない。 |
| 未 | P4-03 | AI判定API連携 | AIクライアント、JSONレスポンス検証、エラー処理を実装する | AI API呼び出しは確認できない。 |
| 仮 | P4-04 | confidence判定 | `0.64以下は対象外`、`0.65〜0.84は承認待ち` の分岐を実装する | `aiConfidence < 0.85` は承認待ちになる。 |
| 未 | P4-05 | risk_flags表示 | AI理由、risk_flags、付属品差などを詳細画面/ログへ表示する | リスクフラグ型/UIは確認できない。 |
| 仮 | P4-06 | 画像URL取得/利用 | 自分/競合の画像URL保存、AI入力への接続、UI表示を実装する | `listing_cache`設計には画像URLがあり、Trading同期の型には現状反映されていない。 |

## Cross-cutting Tasks

| 状 | ID | タスク | 残タスク | 現在の証跡 |
|---|---|---|---|---|
| 仮 | X-01 | DB設計/永続化基盤 | 監視ログ、承認キュー、競合スナップショット、グローバル設定のDB読み書き置換を実装する | Supabase `ebay-price-sentry-dev` に初期SQL/RLS適用済み。`listing_settings`/`listing_cache` のDBアクセスと既存API接続を追加済み。 |
| 仮 | X-02 | 設定統合ルール | グローバル設定とローカル設定の優先順位をサーバー側で一元化する | 型とUIはあるが、統合処理は限定的。 |
| 仮 | X-03 | グローバル設定UI/保存 | 全項目の状態管理、保存API、読み込みAPIを実装する | グローバル設定画面はあるが多くは `defaultValue`。 |
| 仮 | X-04 | ローカル設定UI/保存 | no-op/defaultValueの項目を接続し、永続保存する | 一部の入力は `onUpdate` に接続済み。 |
| 仮 | X-05 | デザインシステム適用 | 行高等の差分、検索/ページネーション/詳細ログなど未実装UIを詰める | Dense Classicの色/ナビ/主要画面は反映。 |
| 仮 | X-06 | モバイル対応 | 実機/ブラウザで表示検証し、長い設定フォームの扱いを調整する | CSSでモバイルナビ/リスト/モーダル対応あり。 |
| 仮 | X-07 | テスト基盤 | ガード網羅、APIマッピング、候補フィルタ、永続化、UI操作、E2Eを追加する | Vitest、lint、typecheck、buildスクリプトは存在。 |
| 未 | X-08 | CI | lint/typecheck/test/buildをCIで実行する | `.github/workflows` は確認できない。 |
| 仮 | X-09 | 外部確認環境 | 固定URL運用、起動手順、検証チェックリストを文書化する | ngrok設定とNext dev/ngrok起動は確認済み。 |
| 未 | X-10 | ユーザー認証/マルチテナント分離 | Supabase Auth、全テーブルの `user_id`、RLS、Service Roleを使うバックグラウンド処理のユーザー指定を実装する | 現在のアプリにユーザー認証、`user_id`、RLSは確認できない。 |
| 未 | X-11 | シークレット管理 | Cert ID、Refresh Token、Service Role Key等をGoogle Secret Manager/Vercel環境変数に分離し、DBには参照IDのみ保存する | 現状は開発用 `.env.local` 読み書きが中心。Secret Manager連携は確認できない。 |
| 仮 | X-12 | OAuth/トークンライフサイクル管理 | Authorization Code Grant、state検証、Application Token/Access Tokenのキャッシュ、期限切れ再認可通知を実装する | Refresh TokenからAccess Tokenを取得する処理はあるが、OAuth認可フローや期限管理は未実装。 |
| 未 | X-13 | 本番インフラ/デプロイ基盤 | Vercel、Supabase PostgreSQL、Drizzle ORM、Cloud Run Jobs、Cloud Scheduler、Cloud Tasksの本番構成を実装する | Next.jsアプリと開発用JSONはあるが、本番DB/ORM/ワーカー/スケジューラ構成は確認できない。 |
| 未 | X-14 | 通知/保持期限/データ管理 | アプリ内/メール/Slack/Discord通知、ログ保持期限、承認待ち期限、CSVエクスポート、アカウント削除を実装する | 設定画面に通知/データ管理UIはあるが、処理は視覚要素中心。 |
| 未 | X-15 | 同時実行制御/運用ポリシー | `scheduler_lock`、古いロックの強制解放、ユーザー単位またはリスティング単位キュー、APIエラー時の延期/再試行を実装する | ロック、キュー、ジョブ並列処理、運用ログは確認できない。 |

## MVP後回し

| 状 | ID | 項目 | 残タスク | 現在の証跡 |
|---|---|---|---|---|
| 未 | D-01 | バリエーション商品 | MVP後に対応方針を決める | 要件定義書で初期版非対応。 |
| 未 | D-02 | 付属品差の厳密判定 | AI拡張時に対応する | 要件定義書でMVP後回し。 |
| 未 | D-03 | Inventory API管理商品の更新 | Trading API更新が安定した後に検討する | 要件定義書で初期版はTrading API系に集中。 |
| 未 | D-04 | 関税/VAT/Import charges込み比較 | 初期版後に比較価格へ含めるか決める | 要件定義書で初期版は商品価格+送料のみ。 |
| 未 | D-05 | 送料自動計算 | 送料自動計算の方式を決める | 初期版はAPI取得または保存送料を使う。 |
| 未 | D-06 | 複数マーケット同時対応 | US以外のマーケット対応を設計する | 初期はeBay US固定。 |
| 未 | D-07 | 完全AI主導判定 | コストと誤判定リスクを評価して再検討する | 要件定義書でMVP後回し。 |

## 推奨する次の実装順

1. **P1-04 / X-01 / X-02:** 出品同期データとローカル設定を壊さず保存できる永続化基盤を作る。
2. **P1-05〜P1-07:** Browse API検索、候補フィルタ、ライバル採用を実装する。
3. **P1-10〜P1-12:** 監視実行フローをサーバー側に移し、ログと競合スナップショットを保存する。
4. **P2-01〜P2-05:** 承認キューと手動承認更新を永続化し、`ReviseInventoryStatus` に接続する。
5. **P3-01〜P3-08:** 自動更新は手動承認更新が安定してから有効化する。

## 調査メモ

- UIはかなり広く作られているが、状態は主に `app/page.tsx` のクライアントstateに閉じている。
- eBay連携は Trading API の接続確認とActive出品同期が中心で、Browse API監視はまだない。
- `lib/price-engine.ts` は今後サーバー側監視フローでも再利用できる良い分離になっている。
- `lib/ebay-url.ts` は検索URL登録の入口として使えるが、Item ID登録やBrowse APIリクエスト生成までは未対応。
- 既存テストは少ないため、今後の実装ではガード条件とAPIマッピングからテストを増やすのが安全。
