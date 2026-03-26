# Effort Estimates — FamilyHub (Organize)

**Author:** Daniel Kwon, Solutions Architect
**Confidence Level:** Medium-High (brownfield with well-understood codebase; timezone and dashboard work carry moderate estimation risk)

## Summary

Total estimated effort: **4-5 developer-weeks** across 3 workstreams.

This is a polish engagement on a well-structured codebase. The scope is bounded — no new feature modules, no data model redesign, no infrastructure migration. The work divides into bug fixes (known issues), structural improvements (testing, security, build hygiene), and one enhancement workstream (dashboard kiosk optimization).

## Breakdown by Component

| Component | Effort | Risk | Notes |
|-----------|--------|------|-------|
| **WS1: Bug Fixes & UX Polish** | 1.5 weeks | Low | 5-7 known issues, all isolated fixes |
| - Timezone fix (calendar UTC) | 3-4 days | Medium | Recurring events with rrule add complexity; need to verify existing data |
| - Kanban mobile responsive | 1 day | Low | CSS layout change, likely vertical stack on mobile |
| - Dark mode flash fix | 0.5 day | Low | Script injection in `<head>` before React hydration |
| - Calendar +N more handler | 0.5 day | Low | Click handler routing fix in DayCell |
| - Missing assignee selector on create | 0.5 day | Low | Form already has user data, needs UI wiring |
| - Calendar accessibility attrs | 0.5 day | Low | Add ARIA roles, labels, keyboard nav to DayCell |
| - Validate remaining open issues | 0.5 day | Low | Verify #1 and close any stale issues |
| **WS2: Structural Improvements** | 1.5-2 weeks | Low-Medium | Testing framework, security, build hygiene |
| - Testing framework setup (Vitest) | 2 days | Low | Monorepo Vitest config, first API tests on auth + CRUD |
| - API test coverage (critical paths) | 3 days | Low | Auth, tasks, calendar, shopping CRUD; focus on regression prevention |
| - Frontend test setup (Playwright) | 1 day | Low | Config + 2-3 critical flow tests (login, create task, create event) |
| - Security hardening (minimal) | 0.5 day | Low | Remove dev-secret fallback, add token expiry, add body size limit |
| - Shared package build cleanup | 0.5 day | Low | Fix tsconfig output dir, gitignore artifacts, clean committed files |
| - Error response consistency | 1 day | Low | Standardize API error format across all modules |
| **WS3: Dashboard Kiosk Optimization** | 1-1.5 weeks | Medium | New UX work, responsive design, auto-refresh |
| - Dashboard responsive redesign | 2-3 days | Medium | Three breakpoint layouts: phone, tablet-in-hand, tablet-on-wall |
| - Auto-refresh / live updates | 1 day | Low | TanStack Query `refetchInterval` on dashboard queries |
| - Information hierarchy redesign | 1-2 days | Medium | Typography scale, visual weight, glanceability at distance |
| - Kiosk mode (optional) | 1 day | Low | Full-screen PWA mode, hide nav, screen-burn prevention |

## Contingency

**15% contingency** on total estimate.

Rationale: The codebase is well-understood and the work items are bounded. The two areas that carry estimation risk are:
1. **Timezone fix** — recurring events with rrule may have edge cases that expand the scope. The 3-4 day estimate assumes no data migration is needed.
2. **Dashboard redesign** — UX work is inherently less predictable than bug fixes. The estimate assumes no custom illustration or branding work.

15% is appropriate because this is an audit engagement with low integration risk and no external dependencies.

## High-Risk Items

| Item | Risk | Change-Order Trigger |
|------|------|---------------------|
| Timezone/rrule fix | Existing recurring events may store data that requires migration | If >10 existing recurring events need manual correction, scope expands by 1-2 days |
| Dashboard kiosk | Customer's tablet hardware may have specific browser constraints | If the target tablet is identified and has unusual viewport behavior, layout work may expand |

## Workstream Dependencies

```
WS1 (Bug Fixes) ─── no dependencies, can start immediately
WS2 (Structural) ── testing framework should be set up before WS1 fixes land (to write regression tests for fixes)
WS3 (Dashboard) ─── independent of WS1/WS2, can run in parallel
```

Recommended execution order: Start WS2 (testing framework) first, then WS1 (bug fixes with tests), WS3 (dashboard) in parallel.
