# Technical Architecture Proposal — FamilyHub (Organize)

**Author:** Daniel Kwon, Solutions Architect
**Date:** 2026-03-25
**Engagement Type:** Codebase Audit + Polish Implementation

## System Overview

FamilyHub is a family life management system built as a TypeScript monorepo with three packages:

- **@organize/api** — Express REST API with Prisma ORM on PostgreSQL
- **@organize/web** — Next.js 14 frontend with React 18, Tailwind CSS, TanStack Query
- **@organize/shared** — Shared TypeScript types and Zod validation schemas

The system serves 4 family members through 4 feature modules (tasks, calendar, shopping, transit) plus a dashboard. It is deployed as a Docker Compose stack on a home NAS (API + PostgreSQL) with the frontend on Cloudflare Pages, connected via Cloudflare Tunnel.

The architecture is sound. The module registry pattern (`registerModule()` / `mountModules()`) provides clean extensibility. The Prisma schema is well-normalized with appropriate indexes. The monorepo workspace structure with shared validation is a correct structural choice. This is not a system that needs rearchitecting — it needs the work described below.

## Component Breakdown

### 1. API Layer (@organize/api)
- **Purpose:** REST API serving all CRUD operations for tasks, calendar, shopping, transit, and user management
- **Technology:** Express 4, Prisma 5, PostgreSQL 16, Zod validation, JWT auth
- **Interfaces:** RESTful JSON API at `/api/v1/*`, health check at `/api/health`
- **Complexity:** Low-Medium. Clean module structure, straightforward CRUD operations.
- **Findings:**
  - Module registry pattern is well-implemented
  - Auth middleware works but has no token expiry and a dev-secret fallback
  - No rate limiting (acceptable given Cloudflare Access perimeter)
  - No request logging beyond Express defaults
  - Error handler exists but error responses are inconsistent across modules
  - No input size limits on `express.json()`

### 2. Frontend Layer (@organize/web)
- **Purpose:** Next.js 14 PWA providing all user-facing UI
- **Technology:** Next.js 14 (App Router), React 18, Tailwind CSS, TanStack Query, dnd-kit, recharts, date-fns
- **Interfaces:** Browser-based SPA with PWA installation support
- **Complexity:** Medium. Multiple feature modules, drag-and-drop, calendar rendering, responsive layouts.
- **Findings:**
  - Component structure is clean — `/components/{module}/` pattern
  - Custom hooks per module (`useTasks`, `useCalendar`, etc.) provide good data abstraction
  - API client is a clean singleton with token management and 401 redirect
  - UI component library (`/components/ui/`) provides reusable primitives
  - Dark mode exists but has flash-of-light-theme on load (script timing issue)
  - Mobile navigation exists but some views (kanban) aren't fully responsive
  - No loading skeletons or optimistic updates visible
  - Dashboard exists but is not optimized for the wall-tablet kiosk use case

### 3. Shared Package (@organize/shared)
- **Purpose:** TypeScript types and Zod validation schemas shared between API and frontend
- **Technology:** TypeScript, Zod
- **Complexity:** Low.
- **Findings:**
  - Build artifacts (`.js`, `.d.ts`, `.js.map`) committed to `src/` directory alongside `.ts` sources
  - This creates git noise and confusion about source-of-truth
  - `tsconfig.json` output likely needs redirection to `dist/` with proper `.gitignore`

### 4. Infrastructure
- **Purpose:** Docker Compose deployment on NAS with Cloudflare connectivity
- **Technology:** Docker Compose, PostgreSQL 16 Alpine, Cloudflare Tunnel, Cloudflare Pages
- **Complexity:** Low. Clean setup with auto-generated secrets.
- **Findings:**
  - Secret generation in db entrypoint is clever and functional
  - CI/CD exists: GitHub Actions for API Docker image build + Cloudflare Pages deployment
  - No database backup strategy visible
  - No migration automation in Docker startup (relies on manual `prisma migrate`)

## Integration Points

| System | API Details | Risk Rating | Assumptions |
|--------|-------------|-------------|-------------|
| OneBusAway API | REST API for transit arrivals, uses `TEST` key for Puget Sound | Low | TEST key is rate-limited; if usage grows, a proper key may be needed |
| Cloudflare Access | Perimeter auth via email-restricted policies | Low | Access policies are correctly configured and maintained |
| Cloudflare Pages | Frontend hosting with automatic deploys | Low | GitHub Actions workflow handles deployment |
| PostgreSQL | Direct Prisma connection within Docker network | Low | Database is co-located on NAS, no network latency |

## Technology Recommendations

No stack changes recommended. The current stack is appropriate for the use case:
- Express + Prisma is right-sized for a family app API
- Next.js 14 with App Router provides good PWA foundation
- PostgreSQL is appropriate for the relational data model
- Tailwind CSS is appropriate for the responsive requirements

**Testing stack recommendation:** Vitest (API unit/integration) + Playwright (critical frontend flows). Jest is heavier than necessary for this project. Vitest shares the TypeScript toolchain and is faster.

## Security Considerations

The Cloudflare Access perimeter model is the primary security boundary. App-level auth is a secondary factor. Given this architecture:

1. **Remove `'dev-secret'` fallback** from auth middleware — production must fail loudly if `JWT_SECRET` is unset
2. **Add token expiry** — `expiresIn: '30d'` on `jwt.sign()` calls
3. **Add `express.json({ limit: '1mb' })** — prevent payload abuse
4. **Frank Morrison review not mandatory** — Cloudflare Access perimeter adequately addresses the internet-facing exposure. Standard code review is sufficient.

## Assumptions Register

| # | Assumption | Risk Level | What Must Be True |
|---|-----------|------------|-------------------|
| 1 | Cloudflare Access email policies are correctly restricting access to family members only | Medium | Policies are maintained and not accidentally loosened |
| 2 | The NAS has sufficient resources to run PostgreSQL + API + tunnel concurrently | Low | Current deployment is already working; no new resource pressure from this scope |
| 3 | The timezone fix can be implemented without migrating existing calendar data | Medium | Existing events are either few enough to manually verify or stored in a way that allows inference of intended timezone |
| 4 | Vitest + Playwright can be added to the monorepo without conflicting with the existing build pipeline | Low | Standard tooling, well-documented monorepo support |
| 5 | The wall-mounted tablet will run a modern browser with PWA support | Low | Any tablet purchased in 2026 supports this |
| 6 | The OneBusAway TEST API key will continue to work for Puget Sound transit data | Low | TEST key has been stable; a proper key is a low-effort fallback |
| 7 | The 7 open issues are independently fixable without cascading architectural changes | Low-Medium | Issue validation in progress; any dependencies will be surfaced |
