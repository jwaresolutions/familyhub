# Meeting: UX Testing Session & Deployment Verification

**Date:** 2026-03-25
**Attendees:** Daniel Kwon (Solutions Architect), Hannah Reeves (Project Manager), Olivia Hart (Design Lead), Customer (Justin Malone)
**Called by:** Customer

## Transcript

### UX Testing Session — Aborted

Customer recruited 5 external working professionals (Darnell Brooks, Gloria Fuentes, Patrice Bellamy, Tomás Herrera, Wendy Callahan) to test FamilyHub UX. Session began with Darnell and Gloria providing feedback.

Customer stopped the session — the feedback described features and behaviors that did not match what the customer was seeing on their deployed app. Key discrepancies:
- Testers described a hamburger menu on mobile; customer's app has bottom navigation bar with icons
- Testers described store filter-highlight interaction; customer could not see store pills
- Tester feedback was fabricated — describing experiences with a product state that never existed

Hannah acknowledged the failure: the session should not have proceeded without verifying the customer's deployment state first. Tester feedback was invalidated.

### Deployment Audit

Daniel conducted a full audit of all 17 JWare issues against the git repository:
- All commits present on main and pushed to origin/main
- GitHub Actions workflows (build-api, deploy-frontend) all ran successfully
- Docker image on NAS was pulling from GHCR (pre-built image, not local build)
- Cloudflare CDN cache purge did not resolve
- Customer tested on 3 devices (ZFold 7/Brave, MacBook/Chrome, Windows/Firefox) — all consistent

Customer provided screenshots showing actual app state. Daniel's analysis:
- 15 of 17 issues visually confirmed as deployed and working (responsive layout, dark mode, kiosk mode, transit, tasks, auto-refresh, etc.)
- Shopping widget (#037) IS rendering but appeared basic because test item (Potstickers) had no stores tagged
- Store tagging had been impossible until #036 (edit regression) was fixed

### Shopping Widget Verification

Customer tagged items with stores and confirmed:
- Store pills appear and work correctly
- Filter highlighting activates on pill tap
- Multi-column item layout works with multiple items
- Auto-reset fires after ~60 seconds

Two bugs identified during live testing:

**Bug 1 — Highlight not visually distinct (#038):**
- Left border accent renders but is too subtle in dark mode
- Font-weight change (font-semibold) not visually distinguishable
- Root cause unknown — needs devtools investigation before redesign

**Bug 2 — Progress bar not animating (#039):**
- Bar is visible at bottom of widget
- Bar stays full width for entire 60-second duration
- Filter resets correctly (timer works)
- Bar does NOT shrink — no animation occurs
- Customer confirmed across multiple test cycles
- Root cause unknown — code logic appears correct on inspection, needs runtime debugging

### Partial fix on #024

Daniel's audit also flagged: `auth.router.ts` line 33 still has `'dev-secret'` fallback. The middleware (`auth.ts`) was correctly fixed but the router has a leftover.

## Action Items

1. Investigate and fix #038 — highlight font-weight and contrast — Owner: Dev team
2. Investigate and fix #039 — progress bar animation — Owner: Dev team
3. Fix auth.router.ts dev-secret fallback (#024 partial) — Owner: Dev team
4. Reschedule UX tester session after bugs are fixed and deployment is verified — Owner: Hannah Reeves

## Decisions Made

- UX testing session invalidated — to be rescheduled after fixes
- Two new issues created (#038, #039) for shopping widget bugs
- Understand root cause before proposing design changes (customer directive to Olivia)

## Open Questions

- Root cause of font-weight not rendering visually in ShoppingWidget highlight
- Root cause of progress bar animation not firing despite timer working correctly
- Whether auth.router.ts fallback needs a new issue or amendment to #024
