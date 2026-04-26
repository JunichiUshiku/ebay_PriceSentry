# 技術スタック

## フロントエンド（現在実装中）

### フレームワーク / ライブラリ
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 15.5.6 | App Router ベースのReactフレームワーク |
| React | 19.2.0 | UIライブラリ |
| TypeScript | 5.x | 型安全な開発 |
| Tailwind CSS | 4.x | ユーティリティファーストCSS |

### UIコンポーネント
| ライブラリ | 用途 |
|-----------|------|
| Radix UI | アクセシブルなUIプリミティブ（Dialog, Select, Tabs等） |
| shadcn/ui | Radix UIベースのコンポーネントライブラリ |
| Lucide React | アイコンライブラリ |
| Recharts | グラフ・チャート |

### ユーティリティ
| ライブラリ | 用途 |
|-----------|------|
| class-variance-authority | コンポーネントのバリアント管理 |
| clsx | 条件付きクラス名結合 |
| tailwind-merge | Tailwindクラスのマージ |

## バックエンド（計画中・未実装）
設計上の予定：
- **APIサーバー**: Node.js (NestJS/Express) or Python (FastAPI)
- **ジョブキュー**: Redis + BullMQ (Node) or Celery (Python)
- **DB**: PostgreSQL (RDS系)
- **KMS/Secrets**: クラウドKMS + .env

## 外部サービス連携（計画中）
- **eBay API**
  - Browse API: 競合価格取得
  - Trading API (ReviseInventoryStatus): 価格改定
  - Inventory API: 代替の価格改定手段
- **通知**: Slack / Email
- **監視**: Prometheus + Grafana / Sentry

## ディレクトリ構成
```
frontend/
├── src/
│   ├── app/           # Next.js App Router ページ
│   │   ├── page.tsx            # ダッシュボード
│   │   ├── layout.tsx          # ルートレイアウト
│   │   ├── listings/page.tsx   # 出品管理
│   │   ├── rules/page.tsx      # ルール設定
│   │   ├── logs/page.tsx       # ログ
│   │   └── settings/page.tsx   # 設定
│   ├── components/
│   │   ├── ui/        # shadcn/ui コンポーネント
│   │   └── layout/    # レイアウトコンポーネント（sidebar等）
│   └── lib/           # ユーティリティ関数
├── public/            # 静的アセット
├── package.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
└── postcss.config.mjs
```

## TypeScript設定
- **strict**: true（厳格な型チェック有効）
- **target**: ES2017
- **パスエイリアス**: `@/*` → `./src/*`
