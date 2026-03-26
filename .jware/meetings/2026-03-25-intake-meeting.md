# Intake Meeting — FamilyHub (Organize)

**Date:** 2026-03-25
**Attendees:** Daniel Kwon (Solutions Architect), Hannah Reeves (Project Manager), Customer (Justin Malone)

---

## Agenda
1. Project context and technical discovery
2. Customer requirements and priorities
3. Scope and process alignment
4. Engagement model agreement

## Discussion

### Technical Discovery (Daniel Kwon)

**Testing:**
- Daniel noted zero tests in the project — no test directories, configs, or scripts.
- Customer confirmed he wants JWare to recommend and implement a testing strategy.

**Security / Auth:**
- Daniel identified: JWTs with no expiration, identical access/refresh token functions, hardcoded `'dev-secret'` fallback, internet-facing via Cloudflare Tunnel.
- Customer explained: Cloudflare Access is the perimeter gate with email-restricted policies. Only authorized family email accounts can reach the frontend. App-level auth is a second factor.
- Daniel's assessment: Threat model is reasonable. Recommended two minimal fixes — remove fallback secret, add generous token expiry (30 days). No full auth overhaul needed.

**Timezone Bug (Issue #4):**
- Calendar events stored as UTC, display wrong in non-UTC timezones.
- Customer confirmed: only 2 of 4 family members currently using the app (Justin and wife). Haven't noticed the bug yet but wants it fixed correctly before wider rollout.

**Shared Package Build Artifacts:**
- Compiled `.js`, `.d.ts`, `.js.map` files mixed into `packages/shared/src/`. Needs cleanup.

**Architecture Assessment:**
- Daniel noted the module registry pattern is well-designed for extensibility.
- Prisma schema is well-structured with proper indexes.
- System does not need a rewrite — needs hardening, polish, and structural fixes.

**Open Issues:**
- 7 open issues (#1, #4, #7, #9, #10, #11, #13). Customer noted some may be stale — Daniel will validate each against current code during scoping.

### Scope & Process (Hannah Reeves)

**Family Context:**
- Family of 4: Justin, wife, and two teens/young adults.
- Currently only Justin and wife are using the app. Plan to onboard the whole family once it's polished.
- All users are tech-literate — no need for simplified views or parental controls.

**Enhancement Priority:**
- Customer chose "polish what's here" over new features, notifications, or mobile improvements.
- Focus: fix rough edges, make it feel reliable enough that the whole family trusts it.

**Engagement Model:**
- Full audit + implement: JWare reviews everything, scopes it, and implements approved fixes/enhancements.

**Dashboard / Kiosk Use Case (Critical Addition):**
- Customer plans to mount a tablet on the wall as a family command center.
- Dashboard must be "at a glance" usable — optimized for reading at distance.
- Requirements: auto-refresh, large typography, strong information hierarchy, responsive across phone/tablet-in-hand/tablet-on-wall, potential kiosk mode.
- Daniel elevated this to a distinct workstream.

### Key Findings

- Brownfield project with sound architecture — polish engagement, not a rewrite
- Zero test coverage is the largest structural gap
- Security posture is reasonable given Cloudflare Access perimeter; needs two small fixes
- Timezone bug should be fixed before family onboarding
- 7 open issues need validation against current code
- Dashboard kiosk mode is a high-value enhancement for the family's daily use
- Shared package has build artifact hygiene issues

### Risk Flags

- Timezone handling in recurring events with rrule could expand beyond initial estimate
- No tests means any changes carry implicit regression risk until testing is in place
- Dashboard kiosk optimization is a distinct UX workstream that needs dedicated design attention

### Open Questions

- Which of the 7 open issues are still valid vs. stale (Daniel to validate during scoping)

## Action Items

1. **Daniel Kwon** — Validate open issues against current codebase
2. **Daniel Kwon** — Produce architecture review and scoping package
3. **Daniel Kwon** — Scope testing strategy appropriate for family app
4. **Daniel Kwon** — Scope dashboard kiosk mode as distinct workstream
5. **Hannah Reeves** — Track customer decisions on scoped work items

## Next Steps

Daniel produces the full scoping package with issues in the tracker. Customer reviews and approves. Team is allocated and development begins.
