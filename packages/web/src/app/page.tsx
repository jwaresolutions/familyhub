'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ArrivalBoard } from '@/components/transit/ArrivalBoard';
import { useTasks } from '@/hooks/useTasks';
import { useCalendarEvents } from '@/hooks/useCalendar';
import { useShoppingLists } from '@/hooks/useShopping';
import { useSavedStops } from '@/hooks/useTransit';
import { usePWA } from '@/hooks/usePWA';
import { CATEGORY_LABELS, CATEGORY_COLORS, TASK_STATUS_LABELS } from '@organize/shared';
import Link from 'next/link';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Section header used in all breakpoints ───────────────────────────────────

function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3 lg:mb-5">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100
                     sm:text-lg
                     lg:text-2xl lg:font-bold">
        {title}
      </h2>
      <Link
        href={href}
        className="text-xs text-primary-600 hover:underline
                   sm:text-sm
                   lg:text-base"
      >
        {linkLabel}
      </Link>
    </div>
  );
}

// ─── Tasks widget ─────────────────────────────────────────────────────────────

function TasksWidget({ tasks }: { tasks: ReturnType<typeof useTasks>['data'] }) {
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
    <Card className="lg:p-6">
      <SectionHeader title="Upcoming Tasks" href="/tasks" linkLabel="View all" />

      {list.length === 0 ? (
        <p className="text-sm text-gray-500 lg:text-base">No pending tasks</p>
      ) : (
        <ol className="space-y-2 lg:space-y-4">
          {list.map(task => {
            const due = task.dueDate ? formatDueDate(task.dueDate) : null;

            return (
              <li
                key={task.id}
                className={`flex items-start gap-2 rounded-lg p-2 lg:p-3
                  ${due?.urgent ? 'bg-red-50 dark:bg-red-950/30' : 'bg-gray-50 dark:bg-gray-900/40'}`}
              >
                {/* Status badge */}
                <Badge
                  label={TASK_STATUS_LABELS[task.status] ?? task.status}
                  color={task.status === 'IN_PROGRESS' ? '#3B82F6' : '#6B7280'}
                  className="shrink-0 hidden sm:inline-flex"
                />

                {/* Title */}
                <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug
                                 lg:text-xl lg:font-semibold">
                  {task.title}
                </span>

                {/* Assignee avatars */}
                {task.assignees.length > 0 && (
                  <div className="flex -space-x-1 shrink-0">
                    {task.assignees.slice(0, 3).map(a => (
                      <Avatar key={a.id} name={a.name} color={a.color} size="sm" />
                    ))}
                  </div>
                )}

                {/* Due date */}
                {due && (
                  <span
                    className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5
                                lg:text-sm lg:px-3 lg:py-1
                                ${due.urgent
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                  >
                    {due.label}
                  </span>
                )}

                {/* Category — visible only lg+ */}
                <Badge
                  label={CATEGORY_LABELS[task.category] ?? task.category}
                  color={CATEGORY_COLORS[task.category]}
                  className="hidden lg:inline-flex shrink-0"
                />
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

// ─── Calendar widget ──────────────────────────────────────────────────────────

function CalendarWidget({
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
    <Card className="lg:p-6">
      <SectionHeader title="Today" href="/calendar" linkLabel="View calendar" />

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500 lg:text-base">Nothing scheduled today</p>
      ) : (
        <ol className="space-y-2 lg:space-y-4">
          {sorted.slice(0, 6).map(event => (
            <li key={event.id} className="flex items-center gap-3 lg:gap-4">
              {/* Color dot / user indicator */}
              <span
                className="w-3 h-3 rounded-full shrink-0 lg:w-4 lg:h-4"
                style={{ backgroundColor: event.userColor }}
                aria-hidden="true"
              />

              {/* Time */}
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 w-14 lg:w-20 lg:text-base">
                {formatEventTime(event)}
              </span>

              {/* Title */}
              <span className="flex-1 text-sm text-gray-900 dark:text-gray-100 truncate
                               lg:text-xl lg:font-medium">
                {event.title}
              </span>

              {/* Person */}
              <span
                className="text-xs font-medium shrink-0 rounded-full px-2 py-0.5 lg:text-sm lg:px-3"
                style={{ backgroundColor: `${event.userColor}20`, color: event.userColor }}
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

// ─── Shopping widget ──────────────────────────────────────────────────────────

function ShoppingWidget({
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
    <Card className="lg:p-6">
      <SectionHeader title="Shopping" href="/shopping" linkLabel="View all" />

      {active.length === 0 ? (
        <p className="text-sm text-gray-500 lg:text-base">No active lists</p>
      ) : (
        <ol className="space-y-3 lg:space-y-5">
          {active.map(list => {
            const pct = list.itemCount > 0
              ? Math.round((list.checkedCount / list.itemCount) * 100)
              : 0;
            const done = list.itemCount > 0 && list.checkedCount === list.itemCount;

            return (
              <li key={list.id}>
                {/* List name + count */}
                <div className="flex items-baseline justify-between mb-1 lg:mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100
                                   lg:text-xl lg:font-semibold">
                    {list.name}
                  </span>
                  <span className={`text-xs lg:text-base font-medium
                    ${done ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {list.checkedCount} of {list.itemCount}
                    {done && ' ✓'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 lg:h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
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

// ─── Transit widget ───────────────────────────────────────────────────────────

function TransitWidget({
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
    <Card className="lg:p-6">
      <SectionHeader title="Next Buses" href="/transit" linkLabel="View all" />

      {stops.length === 0 ? (
        <p className="text-sm text-gray-500 lg:text-base">No saved stops</p>
      ) : (
        <div className="space-y-4 lg:space-y-6">
          {stops.slice(0, 2).map(stop => (
            <div key={stop.id}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2
                            lg:text-sm lg:mb-3">
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

// ─── Page header ──────────────────────────────────────────────────────────────

function PageHeader({
  name,
  isOnline,
  canInstall,
  install,
}: {
  name: string;
  isOnline: boolean;
  canInstall: boolean;
  install: () => void;
}) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        {/* Wall layout: show clock + date prominently */}
        <p className="hidden lg:block text-5xl font-bold tabular-nums text-gray-900 dark:text-gray-100 leading-none">
          {timeStr}
        </p>
        <p className="hidden lg:block text-xl text-gray-500 dark:text-gray-400 mt-1 mb-3">
          {dateStr}
        </p>

        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100
                       sm:text-2xl
                       lg:text-3xl">
          Welcome, {name}
        </h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isOnline && <Badge label="Offline" color="#EF4444" />}
        {canInstall && (
          <Button variant="secondary" size="sm" onClick={install}>
            Install App
          </Button>
        )}
      </div>
    </header>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { canInstall, install, isOnline } = usePWA();

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [isLoading, user, router]);

  const today = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + 86400000);
    return { start: start.toISOString(), end: end.toISOString() };
  }, []);

  const { data: tasks = [] } = useTasks(undefined, { refetchInterval: 60_000 });
  const { data: events = [] } = useCalendarEvents(today.start, today.end, undefined, { refetchInterval: 60_000 });
  const { data: lists = [] } = useShoppingLists(false, { refetchInterval: 30_000 });
  const { data: stops = [] } = useSavedStops({ refetchInterval: 15_000 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 lg:text-2xl">Loading...</p>
      </div>
    );
  }
  if (!user) return null;

  return (
    /*
     * Breakpoint layout strategy:
     *   phone  (<640px)   — space-y stack, no grid
     *   tablet (640–1024) — sm:grid-cols-2, normal density
     *   wall   (>1024px)  — lg:grid-cols-2, large type, generous padding
     */
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 lg:max-w-none">
      <PageHeader
        name={user.name}
        isOnline={isOnline}
        canInstall={canInstall}
        install={install}
      />

      <div
        className="grid grid-cols-1 gap-4
                   sm:grid-cols-2 sm:gap-5
                   lg:grid-cols-2 lg:gap-6"
      >
        {/*
         * Widget order is deliberate:
         *   1. Tasks   — most actionable, top-left on all layouts
         *   2. Calendar — time-based urgency, top-right
         *   3. Transit  — time-critical, bottom-left (people need buses now)
         *   4. Shopping — lower urgency, bottom-right
         */}
        <TasksWidget tasks={tasks} />
        <CalendarWidget events={events} />
        <TransitWidget stops={stops} />
        <ShoppingWidget lists={lists} />
      </div>
    </div>
  );
}
