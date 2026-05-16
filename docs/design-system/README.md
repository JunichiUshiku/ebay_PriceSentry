# Design System Package — eBay Price Sentry

このフォルダはこのツールのデザインシステムをまとめたパッケージ。

## ステータス

✅ **Claude Design でデザイン方向性が確定**（2026-04-29）

採用された最終デザインは **E バリエーション（Dense Classic）** — A の配色/レイアウト × D の高密度の組み合わせ。

## ファイル構成

```
docs/design-system/
├── README.md                      ← このファイル（パッケージ概要）
├── colors.json                    ← カラーパレット定義
├── typography.json                ← タイポグラフィ仕様
├── components.md                  ← コンポーネント仕様（Eバリエーション準拠）
├── mockups/
│   └── dashboard.png              ← 初期モックアップ画像（ユーザー提供）
└── claude-design-export/          ← Claude Design からのエクスポート
    ├── README.md                  ← Claude Design からの引き継ぎ説明
    ├── chats/
    │   └── chat1.md               ← デザイン議論のチャット履歴
    └── project/
        ├── Dashboard Variations.html   ← エントリポイント
        ├── design-canvas.jsx           ← キャンバスフレームワーク
        ├── shared/
        │   ├── tokens.css              ← 共有デザイントークン
        │   ├── chrome.jsx              ← Sidebar / TopBar
        │   ├── icons.jsx               ← Lucide風アイコンセット
        │   └── data.jsx                ← サンプルデータ
        ├── variations/
        │   ├── A_classic.jsx           ← クラシックテーブル（参考）
        │   ├── B_triage.jsx            ← トリアージ型（参考）
        │   ├── C_compare.jsx           ← 比較ビュー（参考）
        │   ├── D_command.jsx           ← コマンドセンター（参考）
        │   └── E_dense.jsx             ← ★採用：Dense Classic
        └── reference/
            └── dashboard_existing.png  ← 参考画像
```

## 採用デザインの要点（E バリエーション）

### コンセプト
- **A バリエーション** の配色/レイアウト（明るいUI、Navy サイドバー + 白カード + Blue アクセント）
- **D バリエーション** の情報密度（高密度な数値表示、コンパクトな行）
- **狙い**: 一目で多くのリスティングを俯瞰できる業務オペレーター向け密度

### 重要な寸法
| 要素 | 寸法 |
|---|---|
| サイドバー幅 | 168px |
| トップバー高 | 44px |
| テーブル行高 | 20px |
| ベースフォント | 11.5px〜12.5px |
| KPI ストリップ | 8列 |
| 右パネル幅 | 320px |

詳細は `components.md` 参照。

## 実装フェーズで使う方法

1. **デザイントークンの取り込み**: `claude-design-export/project/shared/tokens.css` を Tailwind config に変換、または直接 CSS として import
2. **ブレイクポイント・コンポーネント参照**: `claude-design-export/project/variations/E_dense.jsx` を React + shadcn/ui に再実装
3. **アイコンの再利用**: Lucide React パッケージで同等アイコンを使用（icons.jsx は HTML プロトタイプ用）
4. **データ構造の確認**: `claude-design-export/project/shared/data.jsx` のサンプルデータ構造を参考に DB スキーマと整合させる

## 他画面の展開

ダッシュボード以外の画面（リスティング一覧 / 承認待ち / 設定 / ログ）は同じデザイン言語で展開する。
- 同じ密度感（行高 20px、サイドバー 168px）
- 同じカラートークン
- 同じステータス表現（ドット+テキスト、4色）
- 同じテーブル構成原則

## 参考: 関連ドキュメント

- `docs/ebay_price_sentry_requirements_v0.1.md` — 機能要件定義書
- `docs/superpowers/specs/` — 仕様書（ブレインストーミング後に作成予定）
