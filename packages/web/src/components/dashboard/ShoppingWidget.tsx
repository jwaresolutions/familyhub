'use client';

/**
 * ShoppingWidget — dashboard view of all unchecked shopping items.
 *
 * Implements Olivia Hart's design spec:
 *   - Multi-column flowing layout (glance view)
 *   - Store filter pills along top — highlight matching items, no dimming
 *   - 60s auto-reset to "All": full for first 30s, shrinks over final 30s
 *   - Progress bar: 2px line at widget bottom, same color as active pill
 *   - Highlight treatment: left border accent + bolder font weight
 *   - Empty state: "Shopping list is empty" with no pills shown
 *   - Many-to-many store tagging (items can match multiple pills)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { ShoppingList, ShoppingItem, Store } from '@organize/shared';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Total auto-reset window in ms */
const RESET_TOTAL_MS = 60_000;
/** Point at which the bar starts shrinking (held full before this) */
const SHRINK_STARTS_AT_MS = 30_000;

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreFilterState {
  activeStoreId: string | null; // null = "All"
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useActiveLists() {
  return useQuery({
    queryKey: ['shopping-lists', false],
    queryFn: () => api.get<ShoppingList[]>('/shopping/lists?archived=false'),
    refetchInterval: 30_000,
  });
}

function useItemsAcrossLists(listIds: string[]) {
  const results = useQueries({
    queries: listIds.map(id => ({
      queryKey: ['shopping-items', id],
      queryFn: () => api.get<ShoppingItem[]>(`/shopping/lists/${id}`),
      staleTime: 30_000,
    })),
  });

  const allItems: ShoppingItem[] = [];
  for (const r of results) {
    if (r.data) allItems.push(...r.data);
  }
  // Only unchecked items on the dashboard
  return allItems.filter(item => !item.checked);
}

// ─── Timer hook ───────────────────────────────────────────────────────────────

/**
 * Returns a progress value [0, 1] that:
 *   - Stays at 1.0 for the first SHRINK_STARTS_AT_MS
 *   - Shrinks linearly from 1.0 → 0 over the remaining time
 *
 * `resetTimer()` restarts the countdown from the top.
 * `active` — only ticks when a store filter is selected.
 */
function useAutoResetTimer(active: boolean, onReset: () => void) {
  const [progress, setProgress] = useState(1);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const resetTimer = useCallback(() => {
    startRef.current = performance.now();
    setProgress(1);
  }, []);

  useEffect(() => {
    if (!active) {
      // Clean up if we deactivate
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      setProgress(1);
      startRef.current = null;
      return;
    }

    // Start the clock when filter becomes active
    if (startRef.current === null) {
      startRef.current = performance.now();
    }

    function tick() {
      const elapsed = performance.now() - (startRef.current ?? performance.now());

      if (elapsed >= RESET_TOTAL_MS) {
        setProgress(0);
        onReset();
        startRef.current = null;
        return;
      }

      if (elapsed < SHRINK_STARTS_AT_MS) {
        // Hold phase — bar is full. Only set state once to avoid
        // flooding React with 60 no-op updates per second.
        // progress starts at 1 from useState initial value; skip re-setting it.
      } else {
        const shrinkElapsed = elapsed - SHRINK_STARTS_AT_MS;
        const shrinkWindow = RESET_TOTAL_MS - SHRINK_STARTS_AT_MS;
        setProgress(1 - shrinkElapsed / shrinkWindow);
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [active, onReset]);

  return { progress, resetTimer };
}

// ─── Store pill colors ─────────────────────────────────────────────────────────

/**
 * Deterministic color from store name — keeps pills visually distinct
 * and stable across renders without a lookup table.
 */
function storeColor(storeName: string): string {
  const palette = [
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#F59E0B', // amber
    '#10B981', // emerald
    '#EF4444', // red
    '#06B6D4', // cyan
    '#84CC16', // lime
  ];
  let hash = 0;
  for (let i = 0; i < storeName.length; i++) {
    hash = (hash * 31 + storeName.charCodeAt(i)) & 0xffffffff;
  }
  return palette[Math.abs(hash) % palette.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StorePill({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'sm:text-sm',
        'lg:px-4 lg:py-1.5 lg:text-base',
        active
          ? 'text-white'
          : 'bg-transparent border',
      ].join(' ')}
      style={
        active
          ? { backgroundColor: color, borderColor: color }
          : { borderColor: color, color }
      }
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function ItemRow({
  item,
  highlighted,
}: {
  item: ShoppingItem;
  highlighted: boolean | null; // null = no filter active (all shown equally)
}) {
  // highlighted === null → no filter, treat like not-highlighted (normal weight)
  // highlighted === true  → accent border + bold
  // highlighted === false → normal appearance (Olivia: NO dimming)
  const isAccented = highlighted === true;

  return (
    <li
      className={[
        'flex items-baseline gap-1.5 py-1 pl-2 pr-1',
        'text-sm text-gray-800 dark:text-gray-200',
        'sm:text-base',
        'lg:text-lg',
        isAccented
          ? 'border-l-4 border-primary-500 font-bold bg-primary-500/10 text-gray-900 dark:text-gray-50'
          : 'border-l-4 border-transparent',
        'transition-[border-color,background-color] duration-150',
      ].join(' ')}
    >
      <span className="flex-1 leading-snug">{item.product.name}</span>
      {item.quantity > 1 && (
        <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400 tabular-nums lg:text-sm">
          ×{item.quantity}
          {item.unit ? ` ${item.unit}` : ''}
        </span>
      )}
    </li>
  );
}

// ─── Main widget ───────────────────────────────────────────────────────────────

export function ShoppingWidget() {
  const { data: lists = [] } = useActiveLists();

  const activeListIds = lists.filter(l => !l.archived).map(l => l.id);
  const items = useItemsAcrossLists(activeListIds);

  // Collect unique stores from unchecked items only
  const storeMap = new Map<string, Store>();
  for (const item of items) {
    for (const store of item.stores) {
      if (!storeMap.has(store.id)) storeMap.set(store.id, store);
    }
  }
  const stores = Array.from(storeMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const [filter, setFilter] = useState<StoreFilterState>({ activeStoreId: null });

  const handleReset = useCallback(() => {
    setFilter({ activeStoreId: null });
  }, []);

  const isFiltering = filter.activeStoreId !== null;

  const { progress, resetTimer } = useAutoResetTimer(isFiltering, handleReset);

  const handlePillClick = useCallback(
    (storeId: string | null) => {
      setFilter({ activeStoreId: storeId });
      resetTimer();
    },
    [resetTimer]
  );

  // Any interaction with the widget body resets the timer
  const handleWidgetInteraction = useCallback(() => {
    if (isFiltering) resetTimer();
  }, [isFiltering, resetTimer]);

  // ── Derive active pill color ──────────────────────────────────────────────
  const activePillColor = isFiltering
    ? storeColor(storeMap.get(filter.activeStoreId!)?.name ?? '')
    : '#3B82F6';

  // ── Empty state ───────────────────────────────────────────────────────────
  const isEmpty = items.length === 0;

  return (
    <Card
      className="lg:p-6 relative overflow-hidden"
      onClick={handleWidgetInteraction}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 lg:mb-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100
                       sm:text-lg
                       lg:text-2xl lg:font-bold">
          Shopping
        </h2>
        <Link
          href="/shopping"
          className="text-xs text-primary-600 hover:underline
                     sm:text-sm
                     lg:text-base"
          onClick={handleWidgetInteraction}
        >
          View all
        </Link>
      </div>

      {isEmpty ? (
        /* ── Empty state ──────────────────────────────────────────────────── */
        <p className="text-sm text-gray-500 lg:text-base">Shopping list is empty</p>
      ) : (
        <>
          {/* ── Store pills ─────────────────────────────────────────────── */}
          {stores.length > 0 && (
            <div
              className="flex flex-wrap gap-2 mb-4 lg:mb-5"
              role="group"
              aria-label="Filter by store"
            >
              <StorePill
                label="All"
                active={!isFiltering}
                color="#6B7280"
                onClick={() => handlePillClick(null)}
              />
              {stores.map(store => (
                <StorePill
                  key={store.id}
                  label={store.name}
                  active={filter.activeStoreId === store.id}
                  color={storeColor(store.name)}
                  onClick={() => handlePillClick(store.id)}
                />
              ))}
            </div>
          )}

          {/* ── Item grid: flowing columns ───────────────────────────────── */}
          {/*
           * columns-2 on phone/tablet, columns-3 on wall.
           * Items flow naturally — this is pure glance view.
           */}
          <ul
            className="columns-2 gap-x-4
                       sm:columns-2
                       lg:columns-3 lg:gap-x-6"
            aria-label="Shopping items"
          >
            {items.map(item => {
              const highlighted = isFiltering
                ? item.stores.some(s => s.id === filter.activeStoreId)
                : null;
              return (
                <ItemRow
                  key={item.id}
                  item={item}
                  highlighted={highlighted}
                />
              );
            })}
          </ul>
        </>
      )}

      {/* ── Auto-reset progress bar ──────────────────────────────────────── */}
      {/*
       * 2px line at widget bottom. Only visible when a store filter is active.
       * No numbers, no pulsing. Shrinks left-to-right from right edge.
       * Transitions off cleanly when filter resets.
       */}
      {isFiltering && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ backgroundColor: `${activePillColor}30` }}
          role="none"
        >
          <div
            className="h-full origin-left"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: activePillColor,
              transition: 'width 100ms linear',
            }}
            aria-hidden="true"
          />
        </div>
      )}
    </Card>
  );
}
