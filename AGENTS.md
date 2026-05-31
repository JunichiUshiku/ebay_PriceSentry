# AGENTS.md

## Project

- Project name: `ebay-price-sentry`
- Repository path: `/Users/jushi/ツール開発/ebay_PriceSentry`
- Note: this folder is now the project repository. The previous temporary folder name `名称未設定フォルダ` should not be used for new work.

## Commands

Run from the repository root:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Database commands:

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
```

## Supabase

- Development project: `ebay-price-sentry-dev`
- Project ref: `wfkicsevvmydshygssmf`
- Region: `ap-northeast-1`
- Public schema has the initial Drizzle migration applied.
- RLS is enabled on the app tables with owner policies using `auth.uid() = user_id`.

Local env:

- `.env.local` is ignored by Git.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are configured.
- `DATABASE_URL` is configured locally for app/Drizzle database access.
- Do not commit or print secrets such as DB passwords, service role keys, eBay certs, refresh tokens, or OAuth secrets.

## Browser Automation

Use `agent-browser` for web automation unless Chrome login/session state is specifically required.

Core workflow:

```bash
agent-browser open <url>
agent-browser snapshot -i
agent-browser click @e1
agent-browser fill @e2 "text"
```

Re-run `agent-browser snapshot -i` after page changes.

## Implementation Notes

- Follow the task tracker in `docs/implementation-tasks.md`.
- Requirements are in `docs/ebay_price_sentry_requirements_v0.1.md`.
- Design references are in `docs/design-system/`, `docs/mock-ui/`, and `docs/superpowers/specs/2026-04-30-ebay-price-sentry-design.md`.
- Prefer existing patterns in `app/`, `lib/`, and `lib/server/`.
- Keep database schema changes in `lib/server/db/schema.ts` and generated migrations under `drizzle/`.
- Do not overwrite unrelated local changes in the worktree.
