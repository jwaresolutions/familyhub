# Meeting: Shopping List Regression & Dashboard Widget Design

**Date:** 2026-03-25
**Attendees:** Daniel Kwon (Solutions Architect), Hannah Reeves (Project Manager), Olivia Hart (Design Lead), Customer (Justin Malone)
**Called by:** Customer

## Transcript

### Shopping List Edit Regression (#036)

Customer reported a regression: unable to edit shopping list items anywhere in the app. Clicking an item no longer opens an edit view. Store tagging was cited as one example of lost edit functionality.

Daniel investigated through discussion. Initial hypothesis was the approval workflow removal commit (`b663d0a`) broke the edit handler. Customer clarified that a separate change — making a default shopping list show on the dashboard — is more likely the root cause. Customer confirmed the edit flow is broken everywhere, not just on the dashboard.

Customer provided context on the approval workflow removal: originally 4 buttons per item (approve, deny, compare prices, delete). Wife was frustrated by needing to approve her own items before checking them off at the store. Reduced to 2 buttons (compare prices, delete) plus "Added by [name]" label. This change was intentional and should not have affected the edit flow.

Daniel also identified that the dashboard shopping list widget shows list names instead of list contents — an unfulfilled requirement. Customer had wanted to reduce clicks to get to important information.

**Decision: Split into two issues.** #036 remains the edit regression (high priority, WS1). New #037 created for the dashboard widget redesign (WS3).

### Dashboard Shopping Widget Design (#037)

Hannah brought Olivia Hart into the meeting for UX guidance on the dashboard shopping widget.

**Key design discussion:**

- Customer's dashboard is a passive, wall-mounted tablet display for family glance use. Shopping page is where active interaction (adding items, checking off) happens.
- Olivia initially proposed grouping items by store with store headers. Customer corrected: items can be tagged with *multiple* stores (many-to-many). Grouping would duplicate items.
- Customer proposed a filter-highlight pattern: all items shown in columns, store pills along the top. Tapping a store highlights tagged items without changing the list.
- Olivia refined: default state is "All" (pure glance view). Store pills filter by highlighting matches. Unhighlighted items remain at normal appearance (no dimming — customer preference). Auto-reset to "All" after 60 seconds of no interaction.
- Customer specified the timeout indicator: a thin progress bar that stays full for 30 seconds, then shrinks over the remaining 30. No countdown numbers, no pulsing. Any interaction (scroll, tap) resets the timer.
- Olivia requested ownership of the full dashboard layout design across all widgets (#032, #034, #037) to ensure consistent information hierarchy.

## Action Items

1. Fix shopping list item edit regression — Owner: Nina Petrov — Priority: High — Issue #036
2. Dashboard shopping widget design spec (as part of full dashboard layout) — Owner: Olivia Hart — Issue #037, #032, #034
3. Implement dashboard shopping widget to Olivia's spec — Owner: James O'Brien — Issue #037 — Blocked by: Olivia's design spec
4. Track #036 fix completion and report back to customer — Owner: Hannah Reeves

## Decisions Made

- #036 and #037 are separate issues with separate workstreams
- Dashboard shopping widget uses filter-highlight pattern, not grouping or color-coding
- No dimming of unmatched items — highlight contrast only
- Auto-reset timeout with progress bar indicator (30s idle + 30s visible countdown)
- Olivia owns full dashboard layout design across #032, #034, #037

## Open Questions

- Exact store pill and highlight visual treatment (Olivia to spec)
- Dashboard widget relative sizing across all widgets (Olivia to propose full layout)
- Root cause of shopping list edit regression (Nina to investigate)
