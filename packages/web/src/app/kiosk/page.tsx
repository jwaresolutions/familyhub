'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ArrivalBoard } from '@/components/transit/ArrivalBoard';
import { useTasks } from '@/hooks/useTasks';
import { useCalendarEvents } from '@/hooks/useCalendar';
import { useShoppingLists } from '@/hooks/useShopping';
import { useSavedStops } from '@/hooks/useTransit';
import { CATEGORY_LABELS, CATEGORY_COLORS, TASK_STATUS_LABELS } from '@organize/shared';
import Link from 'next/link';

// ─── Screen-burn prevention ───────────────────────────────────────────────────
//
// Every 3 minutes, shift the content by a tiny random amount (±2px on each
// axis). This breaks the static pixel pattern that causes OLED/AMOLED burn-in
// on wall-mounted displays. The shift is imperceptible to users but meaningful
// for the panel.

const BURN_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const BURN_RANGE_PX = 2; // max ±2px per axis

function useScreenBurnShift() {
  const [shift, setShift] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const tick = () => {
      setShift({
        x: (Math.random() * 2 - 1) * BURN_RANGE_PX,
        y: (Math.random() * 2 - 1) * BURN_RANGE_PX,
      });
    };

    const id = setInterval(tick, BURN_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return shift;
}

// ─── Live clock ───────────────────────────────────────────────────────────────

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Update every second, aligned to the clock tick for accuracy.
    function schedule() {
      const msUntilNextSecond = 1000 - (Date.now() % 1000);
      rafRef.current = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, msUntilNextSecond);
    }
    schedule();
    return () => {
      if (rafRef.current !== null) clearTimeout(rafRef.current);
    };
  }, []);

  return now;
}

// ─── Helpers (shared with main dashboard) ────────────────────────────────────

function formatDueDate(dateStr: string): { label: string; urgent: boolean } {
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Overdue', urgent: true };
  if (diffDays === 0) return { label: 'Today', urgent: true };
  if (diffDays === 1) return { label: 'Tomorrow', urgent: true };
  if (diffDays <= 7) return { label: `${diffDays}d`, urgent: false };
  return { label: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), urgent: false };
}

function formatEventTime(event: { startTime: string; allDay: boolean }): string {
  if (event.allDay) return 'All day';
  return new Date(event.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// ─── Clock display ────────────────────────────────────────────────────────────

function KioskClock() {
  const now = useLiveClock();

  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="text-center select-none" aria-live="off" aria-atomic="true">
      <p className="text-7xl font-bold tabular-nums text-white leading-none tracking-tight">
        {timeStr}
      </p>
      <p className="text-2xl text-gray-400 mt-2 tracking-wide">
        {dateStr}
      </p>
    </div>
  );
}

// ─── Tasks widget (kiosk-scaled) ──────────────────────────────────────────────

function KioskTasksWidget({ tasks }: { tasks: ReturnType<typeof useTasks>['data'] }) {
  const list = (tasks ?? [])
    .filter(t => t.status !== 'DONE')
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5);

  return (
    <Card className="bg-gray-900/80 border-gray-700 p-5">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Upcoming Tasks</h2>

      {list.length === 0 ? (
        <p className="text-gray-500 text-lg">No pending tasks</p>
      ) : (
        <ol className="space-y-3">
          {list.map(task => {
            const due = task.dueDate ? formatDueDate(task.dueDate) : null;

            return (
              <li
                key={task.id}
                className={`flex items-center gap-3 rounded-xl p-3
                  ${due?.urgent ? 'bg-red-950/50' : 'bg-gray-800/60'}`}
              >
                <Badge
                  label={TASK_STATUS_LABELS[task.status] ?? task.status}
                  color={task.status === 'IN_PROGRESS' ? '#3B82F6' : '#6B7280'}
                  className="shrink-0"
                />

                <span className="flex-1 text-lg font-semibold text-gray-100 leading-snug truncate">
                  {task.title}
                </span>

                {task.assignees.length > 0 && (
                  <div className="flex -space-x-1 shrink-0">
                    {task.assignees.slice(0, 3).map(a => (
                      <Avatar key={a.id} name={a.name} color={a.color} size="sm" />
                    ))}
                  </div>
                )}

                {due && (
                  <span
                    className={`shrink-0 text-sm font-medium rounded-full px-3 py-1
                      ${due.urgent
                        ? 'bg-red-900/60 text-red-300'
                        : 'bg-gray-700 text-gray-300'
                      }`}
                  >
                    {due.label}
                  </span>
                )}

                <Badge
                  label={CATEGORY_LABELS[task.category] ?? task.category}
                  color={CATEGORY_COLORS[task.category]}
                  className="shrink-0 hidden xl:inline-flex"
                />
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

// ─── Calendar widget (kiosk-scaled) ───────────────────────────────────────────

function KioskCalendarWidget({
  events,
}: {
  events: Array<{
    id: string;
    title: string;
    startTime: string;
    allDay: boolean;
    userName: string;
    userColor: string;
  }>;
}) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <Card className="bg-gray-900/80 border-gray-700 p-5">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Today</h2>

      {sorted.length === 0 ? (
        <p className="text-gray-500 text-lg">Nothing scheduled today</p>
      ) : (
        <ol className="space-y-3">
          {sorted.slice(0, 6).map(event => (
            <li key={event.id} className="flex items-center gap-4">
              <span
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: event.userColor }}
                aria-hidden="true"
              />

              <span className="text-base text-gray-400 shrink-0 w-20 tabular-nums">
                {formatEventTime(event)}
              </span>

              <span className="flex-1 text-lg font-medium text-gray-100 truncate">
                {event.title}
              </span>

              <span
                className="text-sm font-medium shrink-0 rounded-full px-3 py-0.5"
                style={{ backgroundColor: `${event.userColor}25`, color: event.userColor }}
              >
                {event.userName.split(' ')[0]}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

// ─── Shopping widget (kiosk-scaled) ───────────────────────────────────────────

function KioskShoppingWidget({
  lists,
}: {
  lists: Array<{
    id: string;
    name: string;
    itemCount: number;
    checkedCount: number;
    archived: boolean;
  }>;
}) {
  const active = lists.filter(l => !l.archived).slice(0, 4);

  return (
    <Card className="bg-gray-900/80 border-gray-700 p-5">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Shopping</h2>

      {active.length === 0 ? (
        <p className="text-gray-500 text-lg">No active lists</p>
      ) : (
        <ol className="space-y-4">
          {active.map(list => {
            const pct = list.itemCount > 0
              ? Math.round((list.checkedCount / list.itemCount) * 100)
              : 0;
            const done = list.itemCount > 0 && list.checkedCount === list.itemCount;

            return (
              <li key={list.id}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-lg font-semibold text-gray-100">{list.name}</span>
                  <span className={`text-base font-medium
                    ${done ? 'text-green-400' : 'text-gray-400'}`}>
                    {list.checkedCount} of {list.itemCount}
                    {done && ' ✓'}
                  </span>
                </div>

                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: done ? '#22c55e' : '#3b82f6',
                    }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${list.name}: ${list.checkedCount} of ${list.itemCount} items`}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

// ─── Transit widget (kiosk-scaled) ────────────────────────────────────────────

function KioskTransitWidget({
  stops,
}: {
  stops: Array<{
    id: string;
    stopId: string;
    stopName: string;
    nickname?: string;
    routeIds: string[];
  }>;
}) {
  return (
    <Card className="bg-gray-900/80 border-gray-700 p-5">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Next Buses</h2>

      {stops.length === 0 ? (
        <p className="text-gray-500 text-lg">No saved stops</p>
      ) : (
        <div className="space-y-5">
          {stops.slice(0, 2).map(stop => (
            <div key={stop.id}>
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-2">
                {stop.nickname ?? stop.stopName}
              </p>
              <ArrivalBoard stopId={stop.stopId} routeIds={stop.routeIds} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Kiosk page ───────────────────────────────────────────────────────────────

export default function KioskPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const shift = useScreenBurnShift();

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [isLoading, user, router]);

  const today = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + 86400000);
    return { start: start.toISOString(), end: end.toISOString() };
  }, []);

  // Aggressive refetch intervals — wall display should always be fresh.
  const { data: tasks = [] } = useTasks(undefined, { refetchInterval: 30_000 });
  const { data: events = [] } = useCalendarEvents(today.start, today.end, undefined, { refetchInterval: 30_000 });
  const { data: lists = [] } = useShoppingLists(false, { refetchInterval: 30_000 });
  const { data: stops = [] } = useSavedStops({ refetchInterval: 15_000 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <p className="text-3xl text-gray-500 tabular-nums">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    /*
     * Screen-burn prevention: the entire content block is translated by a tiny
     * random amount every 3 minutes. The transition makes it imperceptible.
     * transform: translate is GPU-composited — no layout thrash, no jank.
     */
    <div
      className="min-h-screen bg-gray-950 p-6 flex flex-col gap-6"
      style={{
        transform: `translate(${shift.x}px, ${shift.y}px)`,
        transition: 'transform 4s ease-in-out',
      }}
    >
      {/* Clock — the reason you mounted this tablet */}
      <KioskClock />

      {/* Widgets — 2-col grid, same order as main dashboard */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 flex-1">
        <KioskTasksWidget tasks={tasks} />
        <KioskCalendarWidget events={events} />
        <KioskTransitWidget stops={stops} />
        <KioskShoppingWidget lists={lists} />
      </div>

      {/* Exit kiosk — subtle, unobtrusive, present */}
      <div className="flex justify-center">
        <Link
          href="/"
          className="text-xs text-gray-700 hover:text-gray-500 transition-colors select-none"
          aria-label="Exit kiosk mode"
        >
          Exit kiosk
        </Link>
      </div>
    </div>
  );
}
