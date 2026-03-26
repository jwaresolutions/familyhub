# Meeting: Design Spec Review & Dashboard Widget Hierarchy

**Date:** 2026-03-25
**Attendees:** Daniel Kwon (Solutions Architect), Hannah Reeves (Project Manager), Olivia Hart (Design Lead), Customer (Justin Malone)
**Called by:** Customer

## Transcript

### #036 Verification

Customer confirmed the shopping list edit regression (#036) is fixed and working correctly. Marked as customer-verified.

### Responsive Dashboard Review (#032, #034)

Olivia walked through the three-breakpoint dashboard layout James implemented:
- Phone (<640px): single column, stacked widgets
- Tablet-in-hand (640-1024px): two-column grid
- Tablet-on-wall (>1024px): large typography, high contrast, clock widget, color-coded user pills, overdue highlighting

Customer tested on ZFold 7: two columns unfolded, one column folded. Confirmed breakpoints are working correctly. Customer approved #032 and #034 as shipped.

Customer noted: no dedicated tablet yet. Currently using a mini computer connected to a 1080p TV as a stop-gap. Plans to get a dedicated tablet later. Daniel flagged potential 4K zoom issues but not relevant to current 1080p setup.

### Shopping Widget Design Spec (#037)

Olivia presented her design direction:
- Full-width card in dashboard grid (spans both columns on tablet)
- Items in CSS column flow: 3 columns wall, 2 tablet, 1 phone
- Store pills along top, 'All' default (filled), store pills outlined until tapped
- Highlight: left border accent + bolder font weight on matching items, no dimming
- Timeout bar: 2px line at widget bottom, holds 30s then shrinks over 30s, resets on any touch
- Empty state: "Shopping list is empty" with no store pills

### Dashboard Widget Hierarchy (Key Decision)

Customer provided critical input on widget sizing:
- **Shopping list** — primary widget, most space, most important at a glance
- **Transit/bus** — minimal, tracks one bus stop for kids' school commute. Reduce to compact strip.
- **Tasks** — summary only. Show count per person, not full task list. Compact card.
- **Calendar** — TBD, not enough data populated yet. Design for reasonable default (today's/tomorrow's events).

### Modularity Requirement

Customer requested modular widget system to reduce overhead for future changes — add, remove, reorder, resize widgets without rewriting layout code. Explicitly NOT drag-and-drop.

Daniel defined the approach: widget registry with size metadata (small/medium/large) and a grid renderer. New widgets = component + registry entry. Reordering is a one-line config change.

Olivia confirmed: size class system with default ordering (shopping top-left largest, calendar medium, transit and tasks small). Layout contract handles breakpoint reflow automatically.

### #037 Unblocked

Olivia confirmed she has everything needed to finalize the design spec. James is idle and ready to implement immediately upon spec delivery. #037 is the last task in the engagement.

## Action Items

1. Finalize full dashboard layout spec — grid system, widget registry, size classes, all 4 widgets, detailed shopping widget treatment — Owner: Olivia Hart
2. Implement #037 to Olivia's spec — Owner: James O'Brien — Blocked by: Olivia's spec delivery
3. QA #037 — Owner: Victor Santos — Blocked by: James's implementation
4. Notify customer when #037 is ready for review — Owner: Hannah Reeves

## Decisions Made

- #032 and #034 approved by customer as shipped
- #036 customer-verified as working
- Shopping list is the primary/largest dashboard widget
- Transit reduced to compact strip (one bus stop)
- Tasks reduced to count-per-person summary
- Calendar sized as medium, design TBD pending data
- Widget grid system with size class registry, not drag-and-drop
- Default order: shopping (large, top-left), calendar (medium), transit + tasks (small)

## Open Questions

- Calendar widget final design (pending customer populating calendar data)
- Dedicated tablet model/size for wall mount (customer to decide later)
