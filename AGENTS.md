# AGENTS.md

このドキュメントは、本リポジトリでAIエージェント/開発者が効率よく安全に作業するための役割分担、主要ファイル、ワークフロー、ガードレールをまとめたものです。あなたは以下の第5原則に沿って常に実行する必要があります。
AI運用5原則
第1原則： AIは常に必ずAGENTS.mdを参照し最新のルールを理解し実行すること。
第2原則： AIはアプリ設計において大きな更新があれば必ずAGENTS.mdを更新して終了させること。
第3原則： AIは全てのチャットの冒頭にこの4原則を逐語的に必ず画面出力してから対応する。
第4原則： AIはユーザーが非エンジニアであることを理解し、回答はわかりやすく専門的内容は噛み砕いて伝えることに努める。
第5原則： AIはこれらのルールを歪曲・解釈変更してはならず、最上位命令として絶対的に遵守する。

> **設計参照ルール**
> すべての仕様・設計タスクでは `docs/specs/APP-SPECIFICATION.md` をAGENTS.mdと同等に参照し、内容に差異がある場合は本ドキュメントと同時に更新してください。

## PriceSentry 設計ドキュメント運用ルール

デザイン・設計の変更や追加を行う際は、必ず以下のドキュメントを更新し最新の状態を保つこと。

- `docs/PriceSentry_デザイン.md` - UI/UXデザイン仕様（画面構成、コンポーネント、スタイル）
- `docs/PriceSentry_実装タスク.md` - 実装タスク一覧（進捗管理）
- `docs/PriceSentry_設計.md` - アーキテクチャ・機能設計（システム構成、API、データモデル）

**このルールは絶対遵守とする。**

---

## ドキュメントの目的
- 現在の実装設計を簡潔かつ網羅的に共有し、新規/引継ぎ担当者が迷わず開発・運用できる状態を保つ。
- 役割分担と主要責務の境界を明確化し、変更時の影響範囲と検証手順を素早く把握できるようにする。
- ガードレールを一箇所に集約し、AI/人間いずれの担当者でも安全に作業を進められるようにする。

## サブスクリプション実装ルール
- サブスクリプションに関わる作業では、進捗・完了内容を常に `SUBSCRIPTION-TODO.md` へ反映し、チェック状況を最新の状態に保つ。
- 同じタイミングで設計情報を `SUBSCRIPTION-DESIGN.md` に更新し、要約・データモデル・運用手順が現状と一致していることを保証する。

## プロジェクト概要
- プロジェクト名: eBay販売 利益計算ツール (Beta)
- 目的: 仕入れ価格・販売価格・手数料・送料・為替・関税などを考慮した利益/利益率の計算、メモ管理、GoogleスプレッドシートおよびFirebase(Firestore)との同期
- ユーザー層: eBay越境EC販売者（個人/小規模事業）を想定
- 主要画面: ログイン (`src/index.html`)、メイン (`src/main.html`：計算/データ/設定/カテゴリー/送料タブ)
- プラットフォーム: Vite + Vanilla JS シングルページ（複数エントリ）アプリ、Firebase Hosting/Firebase Auth/Firebase Firestore、Google Apps Script(JSONP)連携、IndexedDB/LocalStorage キャッシュ

## 技術スタック / 外部サービス
- 言語: HTML5, Vanilla JS (ES Modules), CSS3
- ビルド/開発: Node.js 18+, Vite, npm scripts (`npm run dev/build/serve/emulate`)
- 認証/クラウド: Firebase Auth (email/password), Firestore (クラウド保存 & リアルタイムリスナー), Firebase Hosting
- バックエンド: Firebase Functions (Stripe連携・メール通知・認証クレーム更新)
- データ同期: Google Apps Script (JSONPエンドポイント), Google Spreadsheet (カテゴリ/メモテンプレ/送料データ等)
- ストレージ: IndexedDB (主要キャッシュ), LocalStorage (フォールバックと設定), Firestore (クラウド)
- 決済/課金: Stripe Billing (Checkout / Subscription / Billing Portal)、Stripe CLI（ローカル検証）
- メール通知: Mailgun（Functions経由での決済完了・支払い失敗メール送信）
- 通知/UI: `src/notification.{css,js}` によるトースト/バナー
- 関税計算: `src/customs/` 直下のルールベースエンジン (`engine.js` + `rules/*`)

## アーキテクチャ概要
```
Auth/Login → main-init.js → calculator-ui.js / shipping-calculator-ui.js
   ↓                    ↓
Firebase Auth      Firestore・IndexedDB・LocalStorage
   ↓                    ↓
cloud-storage.js   calculator-core.js / shipping-calculator-core.js / customs/engine.js
   ↓                    ↓
Google Apps Script(JSONP) ⇄ spreadsheet-*.js & modules/spreadsheet/*
   ↓
Stripe Checkout/Billing ⇄ Firebase Functions (functions/index.js) ⇄ Firestore pendingSignups / users.billing
```
- `src/main-init.js` が DOMContentLoaded 時に UI、ストレージ、同期モジュールの初期化を連結。
- 計算ロジックは `calculator-core.js` が利益計算の中枢として稼働し、送料 (`shipping-calculator-core.js`) と関税 (`customs/engine.js`) の結果を合算。
- UI 層 (`calculator-ui.js`, `shipping-calculator-ui.js`, `modules/calculator/calculator-form.js`) はフォーム検証、イベントハンドリング、表示更新を担当。
- データ同期は `spreadsheet-sync.js` と `modules/spreadsheet/**/*` が JSONP 経由で GAS にアクセスし、カテゴリ/メモテンプレ/料金テーブル等を取得・保存。
- クラウド保存は `cloud-storage.js` が Firestore CRUD / リスナー / オフラインキャッシュを管理。

## 主要画面・フロー
- **ログイン画面 (`src/index.html`, `src/login.js`)**
  - Firebase Auth で email/password 認証。成功後 `main.html` へ遷移。
  - 初回ログイン時に LocalStorage の旧データを Firestore へ移行。
- **新規登録/課金フロー (`src/register.html`, `src/register.js`)**
  - メール・パスワード・プランを入力 → Functions 経由で Stripe Checkout セッションを生成。
  - Stripe 決済後は `signup-complete.html` で処理状況をポーリングし、利用可能になり次第ログイン案内。
  - 決済キャンセル時は `signup-canceled.html` に遷移し、再登録導線を表示。
- **メイン画面 (`src/main.html`)**
  - タブ構成: 計算・データ・設定・カテゴリー・送料。
  - 初期化 (`main-init.js`): 通知UIロード、Firestore設定読込、IndexedDBキャッシュ構築、スプレッドシート同期ボタンセットアップ。
  - 設定タブにサブスクリプションカードを追加。`main-init.js` が Functions (`createBillingPortalSession`, `refreshSubscriptionStatus`) を呼び出し、`cloud-storage.subscribeToBilling` で Firestore `users.billing` の変更を監視。
  - 計算タブ: `calculator-ui.js` + `calculator-form.js` がフォーム入力と検証、`calculator-core.js` が利益指標（利益額/利益率/目標価格等）を算出。
  - 送料タブ: `shipping-calculator-ui.js` + `shipping-calculator-core.js` が複数配送プランの送料/容積重量/ラベルを算出。関税オプションON時は `customs/engine.js` の結果をカードへ統合。
  - データタブ: GAS連携によるカテゴリやテンプレの同期ステータス表示。
  - 設定タブ: GAS Web App URL、Spreadsheet ID、Firebase設定、DDP(関税)トグルなどを管理。

## 計算ドメイン別の実装要点
- **利益計算 (`src/calculator-core.js`)**
  - フロー: 入力検証 → カテゴリー手数料率の特定（カテゴリ同期データ優先 / 手入力 fallback）→ eBay 手数料 → 広告・Payoneer 手数料 → 為替換算 → コスト控除（仕入・国内送料・国際送料・関税）→ 利益/利益率算出。
  - 依存: `window.categoryData` (Spreadsheet同期後のカテゴリデータ), `settings` オブジェクト（`calculator-storage.js` で管理）。
  - 直接取引フラグON時は特定手数料を除外。
  - ログは `console.log` で主要ステップを追跡。
- **送料計算 (`src/shipping-calculator-core.js`)**
  - 複数配送プラン (EMS/DHL/FedEx/Economy 等) の重量・サイズ・容量計算と料金表検索を実装。
  - `shipping-calculator-ui.js` がカード表示、プラン切替、詳細モーダル、入力同期を担当。
- **関税・通関手数料 (`src/customs/`)**
  - `customs-config.js`: 各プラン・しきい値・定数管理。
  - `customs/engine.js`: ルールベース処理で関税、MPF、Duty Tax Paid 等を金額化。USD/JPY⇄基準通貨換算ユーティリティ付き。
  - ルールは `customs/rules/*.js` に分割（`dutyRule`, `usProcessingFeeRule` など）。プラン別ルール配列を `PLAN_RULES` で定義。
  - DDPトグル (`settings.ddpEnabled`) ON の場合のみ計算を実施し、結果を `customs.total` として利益計算へ渡す。
- **フォーム / 検証 (`modules/calculator/calculator-form.js`)**
  - DOMキャッシュ、入力検証、エラー表示、フォーマット (blur/input) を管理。
  - 正規表現チェック（URL, カテゴリNo）や数値検証、バリデーション結果のスタイル更新を提供。

## サブスクリプション / 決済実装要点
- **フロント (`src/register.js`, `src/signup-complete.js`, `src/login.js`, `src/main-init.js`)**
  - `register.js` が Firebase Functions の `createCheckoutSession` を呼び出し Stripe Checkout へ遷移。公開鍵は `VITE_STRIPE_PUBLISHABLE_KEY` 環境変数から取得。
  - `signup-complete.js` は Functions の `checkSignupStatus` をポーリングし、決済完了→アカウント有効化をユーザーへ通知。
  - `login.js` / `main-init.js` はカスタムクレーム `subscriptionStatus` を確認し、`active` / `lifetime` のみ利用許可。`past_due` 等は即座にサインアウト。
- **Cloud Functions (`functions/index.js`)**
  - `createCheckoutSession`: 未認証利用者向け Callable。Stripe Checkout セッション生成、Authユーザー作成（`disabled: true`）、`pendingSignups/{sessionId}` にサインアップ情報を保存。
  - `checkSignupStatus`: `pendingSignups` を参照し、決済完了状態を返却。
  - `createBillingPortalSession` / `refreshSubscriptionStatus`: 認証済ユーザー向け Callable。Stripe Billing Portal への導線と手動同期を提供。
  - `stripeWebhook`: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.*` を処理。Firestore `users/{uid}.billing` と Auth カスタムクレームを更新し、Mailgun 経由でメール通知。
  - Secretsは `functions/.env.<environment>` で管理（サンプル: `functions/.env.sample`）。デプロイ前に `firebase deploy --only functions --project <id>` が `.env.<projectId>` を読み取るため、プロジェクト毎にファイルを用意する。
- **Firestore**
  - `users/{uid}.billing`: `status`, `planType`, `planNickname`, `currentPeriodEnd`, `stripeCustomerId`, `stripeSubscriptionId`, `amountLastPaid` 等を保持。`cloud-storage.subscribeToBilling` がリアルタイムで監視。
  - `pendingSignups/{sessionId}`: 決済完了までのサインアップステータスを追跡。Functions からのみ書き込み。
- **運用スクリプト**
  - `functions/scripts/set-lifetime-claims.js`: 既存ユーザーを買切り（lifetime）としてカスタムクレームと Firestore `billing` を更新する一次移行スクリプト。`cd functions && node scripts/set-lifetime-claims.js --credentials path/to/serviceAccount.json` を実行。

## データ同期 & ストレージ
- **Firestore (`src/cloud-storage.js`)**
  - ユーザー単位のドキュメント構成: 設定、メモ、履歴等。リアルタイムリスナーで他端末更新を即時反映。
  - オフラインキャッシュ: IndexedDB (`storage-manager.js`) と連携し、接続断→再開時に差分同期。
  - 認証トークンは Firebase Auth が自動管理、`main-init.js` から `cloudStorage` を `window` に公開。
- **IndexedDB / LocalStorage**
  - IndexedDB: 設定/カテゴリ/送料表/履歴の主要キャッシュ。スキーマ更新時はマイグレーション処理要確認。
  - LocalStorage: GAS連携URL、直近設定、メモテンプレ等のフォールバック。キーは `STORAGE_KEY_` プレフィックスを必須。
- **Google Apps Script (GAS) 連携**
  - `spreadsheet-sync.js` が UIトリガ（同期/クリアボタン）と GAS API のインターフェース。
  - `modules/spreadsheet/spreadsheet-api.js`: JSONP リクエスト生成、タイムアウト/リトライ、コールバック名重複防止を担当。
  - `modules/spreadsheet/spreadsheet-storage.js`: GASから取得したデータを IndexedDB/LocalStorage へ保存。
  - `modules/spreadsheet/spreadsheet-ui.js`: 同期結果やエラー表示、ローディング状態の管理。
  - JSONP URL は `...?callback=?` 形式必須。コールバック名は実行時にユニーク生成し、タイムアウト後はクリーンアップ。
- **GAS サイド (`gas-scripts/`)**
  - `ProfitCalculation.gs`: Webアプリのエントリーポイント。`SPREADSHEET_HEADERS` を集中管理し、`doGet`/`doPost` によるアクションルーティング（データ取得・追加・更新・削除、カテゴリ/送料/メモテンプレ取得、ヘッダー検証）を実装。JSONP経由でフロントと通信し、応答には成功/失敗ステータスと詳細メッセージを含める。
    - `onOpen` で `addCsvUtilityMenu` / `addDataImportMenu` / `addInventoryMenu` を呼び出し、各ユーティリティスクリプト側が提供するメニューを統合表示する。
  - `CSV_Utility.gs`: スプレッドシートに「CSVユーティリティ」メニューを追加し、CSVインポート/エクスポート、ID生成、リスト同期チェッカー、HARU⇄データリスト双方向同期、アイテムID一括置換を提供。`CSV_Utility_Import.html`/`CSV_Utility_Export.html`/`CSV_Utility_Haru_ListSync.html`/`CSV_Utility_Change_ItemID.html`/`CSV_Utility_Delete_HaruID.html` のダイアログを呼び出し、`processMultipleItemIdReplacement` や HARU削除などのサーバ側処理を提供。
  - `DataImport.gs`: 「データインポート」メニューを追加し、別スプレッドシートからのデータ取り込みを単機能で実装。ユーザープロンプトでソースのSS ID/シート名を入力、12桁ID行のみ転送し、列マッピングとA/B列の秒刻み連番補正を自動処理。
  - `InventoryTransfer.gs`: 「在庫管理」メニューを追加し、`ebayツール受け取り` シートから外部スプレッドシート（有在庫管理表）へ ID マッチングで値を転送。実行前に確認ダイアログを表示し、更新件数を結果表示。
  - `CSV_Utility_Import.html`: CSVインポート用のダイアログ。ローカルファイルを `FileReader` で読み込み、選択したエンコーディング情報と共に `uploadCsv`（`CSV_Utility.gs`）へ送信。
  - `CSV_Utility_Export.html`: CSVエクスポートダイアログ。ロード時に `exportCsv` を実行し、生成したBlobをデータURIでダウンロード、完了後に自動クローズ。
  - `CSV_Utility_Haru_ListSync.html`: HARU→データリスト同期時の確認・オプション入力ダイアログ。削除オプションなどを指定して `runSyncHaruToDataList` を呼び出す。
  - `CSV_Utility_Change_ItemID.html`: アイテムID一括置換ダイアログ。最大5件の置換ペアを入力させ、確認後に `processMultipleItemIdReplacement` を呼び出し、HARUとデータリスト両シートのIDをまとめて更新。
  - `CSV_Utility_Delete_HaruID.html`: HARUリスト削除指定ダイアログ。削除対象IDを入力し、`deleteHaruRowsByIds` を介して HARU シートから該当行を削除。
  - `SPREADSHEET_HEADERS` を改変する場合は、フロント側のカラム依存（カテゴリ同期、送料表、メモテンプレ等）を必ず追随させる。

## 認証と起動シーケンス
0. 新規登録: `register.html` から Functions→Stripe Checkout を開始。成功時に Webhook が Auth ユーザーを有効化し、`subscriptionStatus` を `active`/`lifetime` に更新。
1. `index.html` で Firebase Auth SDK 読み込み → `login.js` がフォーム送信処理を実装。
2. 認証成功で `main.html` へ遷移。`login.js` は `subscriptionStatus` を先に確認し、無効ステータスの場合は即サインアウト。
3. `main-init.js` が DOMContentLoaded イベントで初期ロードし、`cloud-storage.subscribeToBilling` で Firestore `billing` を監視。未払い・解約ステータスであれば即サインアウトし再課金を促す。
3. Firestore からユーザー設定を取得 → IndexedDB と同期 → `calculator-ui.js` / `shipping-calculator-ui.js` に初期値を注入。
4. GAS URL が設定済みであれば自動同期ジョブを走らせ、カテゴリ/送料/メモテンプレデータを `window.categoryData` 等へ格納。
5. ユーザー操作に応じて `calculator-core.js` / `shipping-calculator-core.js` / `customs/engine.js` を呼び出し、結果を UI へ反映。

## 設定・永続化キー
- Firestore ドキュメント: `settings`, `memoTemplates`, `exchangeRates`, `shippingTables`, `userNotes` など（詳細は `cloud-storage.js` のコレクション構成を参照）。
- Firestore サブスクリプション情報: `users/{uid}.billing` に Stripe 顧客ID・サブスクリプションID・次回請求日などを保持。決済待ち情報は `pendingSignups/{sessionId}` に保存。
- IndexedDB: `storage-manager.js` でバージョン管理。新規スキーマ追加時は既存データ移行を実装する。
- LocalStorage キー例:
  - `STORAGE_KEY_GAS_APP_URL`
  - `STORAGE_KEY_MEMO_TEMPLATES`
  - `STORAGE_KEY_SETTINGS_CACHE`
  - カスタムキーも `STORAGE_KEY_` プレフィックスを必須。

## UI/UX ガイドライン
- キーカラー: #4682B4。主要ボタン・タブ・通知の配色は `src/styles.css` に準拠。
- 通知: `notification.js` の API (`showSuccess`, `showError` etc.) を利用する。操作結果は必ずユーザー通知。
- 入力補助: 数値入力はフォーマット (`formatNumberInput`) を利用し、小数/通貨の表示を統一。
- モーダル/ドロワー: 既存クラス/構造を再利用し、新規CSSの追加は最小限に抑える。

## コマンドとビルド/デプロイ
```bash
npm install        # 初回セットアップ
npm run dev        # Vite 開発サーバー (http://localhost:5173)
npm run build      # 本番ビルド (出力: /dist → Firebase Hosting配備に利用)
npm run serve      # ビルド結果プレビュー
npm run emulate    # Firebase エミュレータ (Hosting/Auth/Firestore)
firebase deploy    # デプロイ (事前に firebase login / use プロジェクト設定必須)
```
- `.env` には外部APIキー等を置くが、秘匿情報はコミット禁止。値をログ/画面へ出力しない。
- Firebase Hosting で公開する場合、`firebase.json` のポート/ホスティング設定と `vite.config` の publicDir を整合させる。
- GAS 側のデプロイは Script Editor から新しいバージョンを発行し、WebアプリURLを設定タブに反映。

## ローカル開発・検証手順（Firebase Emulator + Stripe CLI）

### 事前準備
1. **必要なツールのインストール**
   ```bash
   # Firebase CLI (インストール済みの場合はスキップ)
   npm install -g firebase-tools

   # Stripe CLI
   # macOS (Homebrew)
   brew install stripe/stripe-cli/stripe
   # その他のOSは https://stripe.com/docs/stripe-cli を参照
   ```

2. **認証確認**
   ```bash
   # Firebase にログイン
   firebase login
   firebase projects:list

   # Stripe にログイン
   stripe login
   ```

### ローカルエミュレータの起動

1. **Firebase Emulator Suite の起動**
   ```bash
   # プロジェクトルートで実行
   npm run emulate
   # または
   firebase emulators:start --import=./emulator-data --export-on-exit
   ```

   起動後、以下のURLでアクセス可能：
   - Emulator UI: http://localhost:4000
   - Auth: http://localhost:9099
   - Firestore: http://localhost:8080
   - Hosting: http://localhost:6001

2. **Stripe CLI による Webhook フォワーディング**

   新しいターミナルウィンドウで実行：
   ```bash
   # ステージング環境の場合
   stripe listen --forward-to http://localhost:5001/ebay-profit-tool-staging/us-central1/stripeWebhook

   # 本番環境の場合（通常は不要）
   stripe listen --forward-to http://localhost:5001/ebay-profit-tool/us-central1/stripeWebhook
   ```

   実行後、表示される `whsec_****` を `functions/.env.local` の `STRIPE_WEBHOOK_SECRET` に設定。

3. **Functions 環境変数の設定**

   `functions/.env.local` を作成（存在しない場合）：
   ```bash
   # .env.sample をコピー
   cp functions/.env.sample functions/.env.local
   ```

   以下の値を設定：
   ```
   STRIPE_SECRET_KEY=sk_test_****  # Stripe テストモードの秘密鍵
   STRIPE_WEBHOOK_SECRET=whsec_****  # stripe listen で表示されたシークレット
   STRIPE_PRICE_LIFETIME=price_****  # テスト用 Price ID（買切り）
   STRIPE_PRICE_MONTHLY=price_****   # テスト用 Price ID（月額）
   STRIPE_PRICE_ANNUAL=price_****    # テスト用 Price ID（年額）
   APP_BASE_URL=http://localhost:6001  # ローカルホスティングURL
   MAILGUN_API_KEY=****  # Mailgun API キー（メール送信テスト時）
   MAILGUN_DOMAIN=****   # Mailgun ドメイン
   MAILGUN_FROM=****     # 送信元メールアドレス
   ```

### サブスクリプション決済フローのローカルテスト

1. **新規登録フロー**
   ```
   1. http://localhost:6001/register.html にアクセス
   2. メールアドレス、パスワード、プランを入力
   3. Stripe Checkout に遷移（テストモード）
   4. テストカード番号 4242 4242 4242 4242 を使用
   5. 任意の有効期限・CVC・郵便番号を入力
   6. 決済完了後、signup-complete.html に遷移
   7. Stripe CLI のターミナルで Webhook イベントを確認
   8. Emulator UI (http://localhost:4000) で Firestore の pendingSignups / users.billing を確認
   9. ステータスが「利用可能」になったらログイン可能
   ```

2. **決済失敗シナリオのテスト**
   ```
   Stripe テストカード番号を使い分けて様々なシナリオを検証：
   - 4000 0000 0000 0341: カード認証失敗
   - 4000 0000 0000 9995: 残高不足
   - 4000 0000 0000 0002: カード拒否

   Webhook イベント（invoice.payment_failed）を確認し、
   Firestore の users.billing.status が past_due に更新されることを確認
   ```

3. **Billing Portal のテスト**
   ```
   1. ローカル環境でログイン
   2. ユーザー管理タブを開く
   3. 「お支払い方法を管理」ボタンをクリック
   4. Stripe Billing Portal（テストモード）に遷移
   5. プラン変更・支払い方法更新を実行
   6. Webhook イベント（customer.subscription.updated）を確認
   ```

### トラブルシューティング

**Webhook が受信されない**
- `stripe listen` が実行中か確認
- `functions/.env.local` の `STRIPE_WEBHOOK_SECRET` が正しいか確認
- Firebase Functions が起動しているか `firebase emulators:start` のログを確認

**メール送信が失敗する**
- Mailgun の API キーとドメインが正しいか確認
- `functions/.env.local` の `MAILGUN_*` 設定を確認
- Mailgun ダッシュボードでドメイン認証状態を確認

**決済完了後にステータスが更新されない**
- Stripe Webhook が正常に処理されているか Stripe CLI のログを確認
- Firestore Emulator UI で `pendingSignups/{sessionId}` の内容を確認
- Functions のログで `updateUserBillingState` の実行を確認

**環境変数が読み込まれない**
- `functions/.env.local` が存在するか確認
- Firebase Emulator を再起動（環境変数変更後は必須）
- ファイル名が正確か確認（`.env.local` であり `.env` ではない）

### 本番デプロイ前の最終チェック
- [ ] ステージング環境（release ブランチ）で全フローをテスト
- [ ] Stripe Webhook が正常に動作することを確認
- [ ] メール送信が正常に動作することを確認
- [ ] 決済失敗時の猶予期間動作を確認
- [ ] Firestore セキュリティルールが正しく機能することを確認
- [ ] 複数プラン（Lifetime/月額/年額）の決済を確認
- [ ] Billing Portal からのプラン変更を確認

---

## 役割分担（エージェント/担当者）
- **フロントエンド担当**
  - UI/動作: `src/main.html`, `src/styles.css`, `src/notification.*`, `src/calculator-ui.js`, `src/shipping-calculator-ui.js`
  - 入力検証: `src/modules/calculator/calculator-form.js`
  - DDP UI / モーダルなど新規要素のスタイル統一、ブラウザで主要フロー確認（計算→UI反映→通知）
- **計算ロジック担当（利益/送料/関税）**
  - 利益計算: `src/calculator-core.js`
  - 送料計算: `src/shipping-calculator-core.js`
  - 関税エンジン: `src/customs/engine.js`, `src/customs/rules/*.js`, `src/customs-config.js`
  - 料金表・係数更新時は UI/設定タブとの整合を確認し、境界値（重量/関税閾値）テストを実施
- **データ同期/GAS担当**
  - GAS API(JSONP): `src/modules/spreadsheet/spreadsheet-api.js`
  - UI/保存: `src/modules/spreadsheet/spreadsheet-{ui,storage}.js`, `src/spreadsheet-*.js`, `src/main-init.js`
  - GAS スクリプト: `gas-scripts/*.gs`, GASダイアログHTML
  - `SPREADSHEET_HEADERS` 改変時はカラムインデックス依存箇所 (カテゴリ読み込み, テンプレ表示, 送料表) を一貫更新
- **サブスクリプション/課金担当**
  - フロント導線: `src/register.html`, `src/register.js`, `src/signup-complete.js`, `src/login.js`, `src/main-init.js`
  - Cloud Functions: `functions/index.js`（Stripe Checkout/Billing、Mailgun通知、Authクレーム制御）、`functions/scripts/set-lifetime-claims.js`
  - Stripe 設定（Product/Price/Webhook）、Functions 環境変数（stripe.secret_key, price_* , webhook_secret, app.base_url, sendgrid.*）の管理
- **クラウド/認証担当**
  - Firestore: `src/cloud-storage.js`, `src/utils/storage-manager.js`
  - 認証/ルーティング: `src/index.html`, `src/login.js`, `src/main-init.js`
  - Firebase 設定 (`firebase.json`, `.firebaserc`)、エミュレータポートの整合を確認
- **ユーティリティ/基盤担当**
  - 共通エラー/例外: `src/utils/error-handler.js`, `src/utils/logger.js`, `src/utils/network.js` など
  - JSONP タイムアウト/リトライ戦略、IndexedDB マイグレーション、国際化（通貨/フォーマット）を継続監視

## 変更時の影響チェックリスト
- GASヘッダー (`SPREADSHEET_HEADERS`) を変更
  - → フロントの列インデックス参照を更新し、カテゴリ/送料/テンプレ同期が破綻しないか確認
- 計算式（利益/送料/関税）を変更
  - → `calculator-ui.js` / `shipping-calculator-ui.js` / `customs` UI の表示・丸め・通貨表記を確認し、境界値テストを実施
- 同期/通信まわりを変更
  - → JSONP コールバック衝突、タイムアウト、ネットワークリトライ、ローディング表示、通知メッセージを確認
- Firestore関連を変更
  - → オフラインキャッシュ、エミュレータ接続、セキュリティルール、ドキュメント構造、権限チェックを検証
- スタイル/テーマを変更
  - → #4682B4 を基調に、既存スタイルとの整合を `styles.css` で確認。アクセシビリティ (コントラスト/フォーカス) を再チェック
- DDP/関税設定に手を入れた
  - → DDP ON/OFF の挙動比較、`ddpDutyRatePct` 入力検証、各配送プランのモーダル表示と利益計算反映を確認
- IndexedDB スキーマ更新
  - → 既存ユーザーのデータ移行手順とロールバックプランを明文化し、`storage-manager.js` にマイグレーション実装
- サブスクリプション/Stripe連携を変更
  - → Cloud Functions のユニットテスト/Stripe CLI で Webhook フローを再確認。Auth カスタムクレーム・`users/{uid}.billing`・`pendingSignups` の整合性を必ずチェックし、`subscriptionStatus` が `active`/`lifetime` のみ利用可能であることを検証。

## セキュリティ / 運用ガードレール
- 機密情報（APIキー等）は `.env` にのみ保持し、リポジトリへコミットしない。ログ/画面で値を表示しない。
- Functions用 `.env` は `functions/.env.<projectId>`（例: `functions/.env.ebay-profit-tool`）として管理し、同梱の `functions/.env.sample` を雛形にする。ローカルエミュレータ用は `functions/.env.local` を併用。
- Stripe・Mailgun のキーは `functions/.env.sample` をベースにプロジェクト名に合わせた `.env` ファイル（例: `functions/.env.ebay-profit-tool`）を作成し、`STRIPE_SECRET_KEY` / `STRIPE_PRICE_*` / `STRIPE_WEBHOOK_SECRET` / `APP_BASE_URL` / `MAILGUN_API_KEY` / `MAILGUN_DOMAIN` / `MAILGUN_FROM` などを設定する。`.env` 系ファイルはコミット禁止。フロント公開キーは `.env` (`VITE_STRIPE_PUBLISHABLE_KEY`) にのみ保存。
- GAS 呼び出しは JSONP を利用。コールバック名を必ずユニーク化し、タイムアウト時はユーザーへ通知。
- Firestore 運用時は原則エミュレータで検証してから本番環境へ反映。ルール変更時は認可境界を手動確認。
- 破壊的操作（削除/上書き）はユーザー確認 UI もしくは詳細ログを残す。
- console.log に機密値を残さない。必要に応じて `logger.js` でロギングレベルを制御。
- 大規模変更前後で `AGENTS.md` / `CLAUDE.md` を更新し、引継ぎ可能な状態を担保する。

## 手動動作確認（最小+α）
1. `npm run dev` → ログイン画面表示（Firebase Auth フロー確認）
2. `register.html` から各プランで Stripe Checkout → 決済完了後 `signup-complete.html` にてステータスが `利用可能` になること、完了メールが送信されることを確認
3. 決済済みアカウントでログイン → メイン画面表示（タブ遷移・通知動作）
3. 計算タブ: 価格/送料/カテゴリー入力 → 利益額・利益率・目標価格が即時更新、エラー表示/バリデーション確認
4. 送料タブ: サイズ/重量入力 → 各配送プランの料金・容積重量を確認
5. DDP ON: 関税率入力変更でカード表示/利益再計算が反映、プラン詳細モーダルで内訳が正しいことを確認
6. スプレッドシート同期: 設定タブで GAS URL/シート設定 → 取得/更新 → カテゴリ/メモテンプレ表示
7. Firestore 保存: 設定/メモ保存 → 再読込/別端末でも反映（エミュレータ含む）
8. サブスク停止テスト: Stripe で支払い失敗状態を作成 → `subscriptionStatus` が `past_due` となり即座にログアウトされることを確認
9. オフライン時: ネットワーク遮断でローカル動作 → 復帰後に自動同期されるか確認

## 作業テンプレート（Pull Request / 作業報告）
- 目的: 変更の背景と狙い
- 影響範囲: 関連ファイル、データフロー、ユーザーフロー
- 検証: 再現手順、期待結果、確認結果、スクリーンショット/ログ（機密除く）
- ロールバック: 戻し方と副作用
- TODO: 後続改善、ドキュメント更新有無

## 参考ドキュメント / リンク
- Firebase設定/エミュレータポート: `firebase.json`
- 開発/デプロイ全体像: `CLAUDE.md`
- Stripe/サブスク連携: `functions/index.js`, `functions/scripts/set-lifetime-claims.js`
- 関税・通関手数料詳細設計: `DESIGN-CUSTOMS-FEES.md`
- その他仕様・議事録: リポジトリ内 `docs/` や過去PRを参照（存在する場合）

---

最新の実装を反映するため、仕様やアーキテクチャに大きな変更が入った場合は本ドキュメントを更新してから作業を終了してください。
