# 開発コマンド

## フロントエンド（frontend/ディレクトリ）

### 基本コマンド
```bash
# ディレクトリ移動（frontendで作業する場合）
cd frontend

# 依存パッケージのインストール
npm install

# 開発サーバー起動（http://localhost:3000）
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動（ビルド後）
npm run start

# ESLint実行
npm run lint
```

### shadcn/uiコンポーネント追加
```bash
# 新しいUIコンポーネントを追加
npx shadcn@latest add <component-name>

# 例: ボタンコンポーネント追加
npx shadcn@latest add button
```

## システムユーティリティ（macOS/Darwin）

### ファイル操作
```bash
# ファイル一覧
ls -la

# ファイル検索
find . -name "*.tsx"

# テキスト検索
grep -r "検索文字列" .
```

### Git操作
```bash
# 状態確認
git status

# 差分確認
git diff

# コミット
git add .
git commit -m "メッセージ"

# プッシュ
git push
```

## 開発時の注意
- フロントエンドの作業は必ず `frontend/` ディレクトリで行う
- コンポーネント追加時は `src/components/ui/` に配置
- ページ追加時は `src/app/` 配下に適切なルートを作成

## トラブルシューティング
```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install

# Next.jsキャッシュクリア
rm -rf .next
npm run dev
```
