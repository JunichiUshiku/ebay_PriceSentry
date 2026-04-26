# コードスタイル・規約

## TypeScript

### 基本ルール
- **strict mode**: 有効（tsconfig.jsonで設定済み）
- **型定義**: 明示的な型注釈を推奨
- **インポート**: ES Modules形式 (`import/export`)

### ファイル命名規則
- **コンポーネント**: ケバブケース（例: `button.tsx`, `sidebar.tsx`）
- **ページ**: `page.tsx`（Next.js App Router規約）
- **レイアウト**: `layout.tsx`
- **ユーティリティ**: ケバブケース（例: `utils.ts`）

### コンポーネント記述スタイル
```tsx
// 関数コンポーネント形式を使用
function ComponentName({
  prop1,
  prop2,
  ...props
}: ComponentProps) {
  return (
    <div>
      {/* JSX */}
    </div>
  )
}

// エクスポート
export { ComponentName }
```

### 型定義
```tsx
// React.ComponentPropsを活用
type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "default" | "destructive" | "outline"
  size?: "default" | "sm" | "lg"
}
```

## スタイリング（Tailwind CSS）

### クラス管理
- **clsx**: 条件付きクラス結合に使用
- **tailwind-merge (cn関数)**: クラスの重複解決
- **class-variance-authority (cva)**: バリアント管理

```tsx
// cn関数の使用例
import { cn } from "@/lib/utils"

<div className={cn("base-class", conditional && "conditional-class", className)} />
```

### バリアント定義（CVA）
```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center ...", // 基本クラス
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground ...",
        destructive: "bg-destructive ...",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

## ファイル構成

### コンポーネント配置
```
src/components/
├── ui/           # shadcn/ui 基本コンポーネント
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
└── layout/       # レイアウト関連
    └── sidebar.tsx
```

### ページ配置（App Router）
```
src/app/
├── page.tsx           # /（ルート）
├── layout.tsx         # ルートレイアウト
├── listings/
│   └── page.tsx       # /listings
└── settings/
    └── page.tsx       # /settings
```

## パスエイリアス
- `@/*` → `./src/*`

```tsx
// 推奨
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// 非推奨（相対パス）
import { Button } from "../../components/ui/button"
```

## ESLint
- Next.js推奨設定 (`eslint-config-next`) を使用
- `npm run lint` で実行
