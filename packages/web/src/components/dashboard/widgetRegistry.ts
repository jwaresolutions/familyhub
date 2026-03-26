/**
 * Widget registry — single source of truth for dashboard layout.
 *
 * Design principle (Olivia Hart, customer meeting):
 *   Adding a new widget = one component + one registry entry.
 *   Reordering = change `order` values here, not a layout rewrite.
 *   NOT drag-and-drop — intentional config-driven ordering.
 *
 * Size classes:
 *   LARGE  — spans both columns on tablet/wall (col-span-2)
 *   MEDIUM — single column
 *   SMALL  — single column, compact
 *
 * The grid renderer reads this registry at render time. Widget components
 * are responsible for their own data fetching.
 */

export type WidgetSizeClass = 'LARGE' | 'MEDIUM' | 'SMALL';

export interface WidgetDefinition {
  /** Unique stable identifier */
  id: string;
  /** Human-readable name (for a11y and debugging) */
  name: string;
  /** Visual weight — controls column span on tablet/wall breakpoints */
  sizeClass: WidgetSizeClass;
  /**
   * Render order — lower = earlier in DOM / visual flow.
   * Determines position within each size tier on the grid.
   */
  order: number;
  /** Whether this widget is currently enabled */
  enabled: boolean;
}

/**
 * Registered widgets ordered by `order` field.
 *
 * Current layout (per customer meeting with Olivia, updated #40):
 *   Shopping  — LARGE, fills entire left column on tablet/wall
 *   Transit   — SMALL, top of right column
 *   Calendar  — MEDIUM, middle of right column (today's events)
 *   Tasks     — SMALL, bottom of right column (upcoming)
 *
 * On phone (<640px) all widgets stack in a single column in order.
 */
export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    id: 'shopping',
    name: 'Shopping',
    sizeClass: 'LARGE',
    order: 1,
    enabled: true,
  },
  {
    id: 'transit',
    name: 'Transit',
    sizeClass: 'SMALL',
    order: 2,
    enabled: true,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    sizeClass: 'MEDIUM',
    order: 3,
    enabled: true,
  },
  {
    id: 'tasks',
    name: 'Tasks',
    sizeClass: 'SMALL',
    order: 4,
    enabled: true,
  },
];

/**
 * Returns enabled widgets sorted by `order`, stable across re-renders.
 */
export function getEnabledWidgets(): WidgetDefinition[] {
  return WIDGET_REGISTRY.filter(w => w.enabled).sort((a, b) => a.order - b.order);
}

/**
 * Tailwind col-span classes per size class and breakpoint.
 *
 * On phone (1-col grid): everything is col-span-1 — full width.
 * On tablet/wall (2-col grid): LARGE spans both columns.
 */
export function getWidgetColSpan(sizeClass: WidgetSizeClass): string {
  switch (sizeClass) {
    case 'LARGE':
      return 'col-span-1 sm:col-span-2';
    case 'MEDIUM':
    case 'SMALL':
      return 'col-span-1';
  }
}
