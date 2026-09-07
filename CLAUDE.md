# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

```bash
npm run dev          # Start both servers (frontend :5173, backend :3001)
npm run dev:server   # Backend only (tsx watch)
npm run dev:client   # Frontend only (vite)
npm run build        # Build both for production
npm test             # Run tests in all workspaces
npm run lint         # Lint all workspaces
```

## Architecture

**Monorepo** with two workspaces: `server/` (Express API) and `client/` (React SPA). The Vite dev server proxies `/api/*` to the Express server on port 3001.

### Data Flow

```
Browser → Vite (:5173) → Express (/api/v1/*) → Supabase (PostgreSQL + Auth + Realtime)
                              ↓
                        Gemini API (AI chat)
                        Brevo (email notifications)
```

The frontend is a thin client. All business logic, authorization, and data mutations live in the Express server. The frontend never touches Supabase directly — it goes through the API.

### Server Structure (`server/src/`)

- **`routes/`** — Express route handlers, one file per resource. Use `export default function` factory pattern.
- **`middleware/`** — `auth.ts` (Bearer token validation via Supabase `getUser()`), `errorHandler.ts`, `logger.ts`.
- **`services/`** — External integrations: `ai.ts` (Gemini), `email.ts` (Brevo). Always lazy-instantiate external clients (no singleton creation at module load time).
- **`lib/`** — `supabase.ts` exports `getSupabase()` which caches a single client instance per process using the service-role key.
- **`config.ts`** — Reads from `dotenv/config` (imported first in `index.ts`). All env vars go through here.
- **`types/index.ts`** — Shared TypeScript interfaces mirroring the database schema.

### Auth Pattern

All protected routes receive `AuthRequest` with `req.user` populated by `authMiddleware`. The middleware validates the Bearer token against Supabase, then fetches the profile to attach `role` (`customer` | `admin`). Use `requireAdmin` / `requireCustomer` as additional guards.

### Client Structure (`client/src/`)

- **`pages/`** — Route-level components. Sub-folders for `admin/`.
- **`stores/`** — Zustand stores (currently only `cartStore.ts`).
- **`lib/api.ts`** — Axios instance with `/api/v1` base URL. One named export per endpoint.
- **`lib/utils.ts`** — `cn()` utility for clsx + tailwind-merge.

### Database (`server/database/migrations/`)

Single migration file `001_initial_schema.sql`. Runs in Supabase SQL Editor. Creates:
- 12+ tables with foreign keys, checks, indexes
- Row Level Security (RLS) policies on every table
- Triggers for `updated_at` and auto-generated `request_number`
- Storage bucket for product images

**Rule:** Add new tables to the migration file, never alter existing schema manually in Supabase.

## Key Conventions

- **Never trust the frontend.** All auth checks, availability validations, and price snapshotting happen server-side.
- **Price snapshots** are stored in `request_items.unit_price_snapshot` and `request_services.price_snapshot` so historical requests don't change when catalogue prices update.
- **Soft deletes** — products are unpublished (`published = false`), never hard-deleted if they have historical request references.
- **Slot state machine:** `available → held → booked` / `blocked` / `cancelled`. The backend holds slots at request submission time; held slots must be converted to `booked` on acceptance or released on rejection/cancellation.
- **TypeScript strict mode** is enabled in both workspaces. Don't add `@ts-ignore` or `any` without justification.
- **All timestamps** stored as UTC `timestamptz`, displayed in business/customer timezone on the client.

## Deployment Quirks

### Render (Backend)

- Build script is `tsc && tsc-alias && node scripts/fix-esm.cjs` — the ESM fix injects `.js` extensions that TypeScript's bundler-style resolution strips.
- Express 5 rejects bare wildcard routes (`*` or `/*`). Use parameterless middleware for catch-all handlers.
- Health endpoint: `GET /health`

### Vercel (Frontend)

- `vercel.json` must include a `rewrites` entry to proxy `/api/v1/*` to the Render backend.
- Build command: `npm install --prefix client && npm run build --prefix client` (not `cd client`).
- Output directory: `client/dist`.
- Logo assets go in `client/public/` and are copied to `dist/` verbatim.

### Environment Variables

See `.env.example`. Required for full functionality:
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — database access
- `GEMINI_API_KEY` — AI assistant (optional; degrades gracefully)
- `BREVO_API_KEY` + `FROM_EMAIL` + `OWNER_EMAIL` — email notifications (optional; degrades gracefully)

The server starts without these keys (features are stubbed), but Supabase is required for any data operations.
