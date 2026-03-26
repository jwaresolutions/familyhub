'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ArrivalBoard } from '@/components/transit/ArrivalBoard';
import { ShoppingWidget } from '@/components/dashboard/ShoppingWidget';
import { getEnabledWidgets } from '@/components/dashboard/widgetRegistry';
import { useTasks } from '@/hooks/useTasks';
import { useCalendarEvents } from '@/hooks/useCalendar';
import { useSavedStops } from '@/hooks/useTransit';
import { usePWA } from '@/hooks/usePWA';
import { CATEGORY_LABELS, CATEGORY_COLORS, TASK_STATUS_LABELS } from '@organize/shared';
import Link from 'next/link';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDueDate(dateStr: string): { label: string; urgent: boolean; overdue: boolean } {
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Overdue', urgent: true, overdue: true };
  if (diffDays === 0) return { label: 'Today', urgent: true, overdue: false };
  if (diffDays === 1) return { label: 'Tomorrow', urgent: true, overdue: false };
  if (diffDays <= 7) return { label: `${diffDays}d`, urgent: false, overdue: false };
  return { label: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), urgent: false, overdue: false };
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
        <ol className="space-y-2 lg:space-y-3">
          {list.map(task => {
            const due = task.dueDate ? formatDueDate(task.dueDate) : null;

            /*
             * Visual hierarchy tiers at lg: breakpoint:
             *   overdue  — warm red bg, large bold text, prominent badge
             *   today    — amber tint, medium-large text
             *   upcoming — neutral bg, normal weight
             */
            const isOverdue = due?.overdue ?? false;
            const isToday   = due?.urgent && !isOverdue;

            const rowBg = isOverdue
              ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800'
              : isToday
              ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
              : 'bg-gray-50 dark:bg-gray-900/40';

            const titleSize = isOverdue
              ? 'text-sm font-semibold text-red-900 dark:text-red-100 leading-snug lg:text-2xl lg:font-bold'
              : isToday
              ? 'text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug lg:text-xl lg:font-semibold'
              : 'text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug lg:text-lg lg:font-medium';

            const dueBadge = due
              ? isOverdue
                ? 'bg-red-600 text-white lg:text-base lg:px-3 lg:py-1 lg:font-bold'
                : isToday
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 lg:text-sm lg:px-3 lg:py-1'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 lg:text-sm lg:px-3 lg:py-1'
              : '';

            return (
              <li
                key={task.id}
                className={`flex items-start gap-2 rounded-lg p-2 lg:p-4 ${rowBg}`}
              >
                {/* Status badge — hidden on phone, visible sm+ */}
                <Badge
                  label={TASK_STATUS_LABELS[task.status] ?? task.status}
                  color={task.status === 'IN_PROGRESS' ? '#3B82F6' : '#6B7280'}
                  className="shrink-0 hidden sm:inline-flex lg:mt-0.5"
                />

                {/* Title */}
                <span className={`flex-1 ${titleSize}`}>
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
                    className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${dueBadge}`}
                  >
                    {due.label}
                  </span>
                )}

                {/* Category — wall only */}
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
  const now = new Date();

  const sorted = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // The "current or next" event: either in-progress or the soonest upcoming
  const currentOrNextIdx = sorted.findIndex(e => {
    if (e.allDay) return false;
    return new Date(e.startTime).getTime() >= now.getTime() - 60 * 60 * 1000; // started within last hour
  });

  return (
    <Card className="lg:p-6">
      <SectionHeader title="Today" href="/calendar" linkLabel="View calendar" />

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500 lg:text-base">Nothing scheduled today</p>
      ) : (
        <ol className="space-y-2 lg:space-y-3">
          {sorted.slice(0, 6).map((event, idx) => {
            const isNext = idx === currentOrNextIdx;
            const isPast = !event.allDay && new Date(event.startTime).getTime() < now.getTime() - 60 * 60 * 1000;

            return (
              <li
                key={event.id}
                className={`flex items-center gap-3 lg:gap-4 rounded-lg
                  ${isNext
                    ? 'lg:bg-blue-50 lg:dark:bg-blue-950/30 lg:border lg:border-blue-200 lg:dark:border-blue-800 lg:px-3 lg:py-2'
                    : 'lg:px-1'
                  }`}
              >
                {/* Color dot */}
                <span
                  className={`rounded-full shrink-0
                    ${isNext ? 'w-4 h-4 lg:w-5 lg:h-5' : 'w-3 h-3 lg:w-4 lg:h-4'}
                    ${isPast ? 'opacity-40' : ''}`}
                  style={{ backgroundColor: event.userColor }}
                  aria-hidden="true"
                />

                {/* Time */}
                <span className={`shrink-0 tabular-nums
                  ${isNext
                    ? 'text-xs text-gray-600 dark:text-gray-300 w-14 lg:text-xl lg:font-semibold lg:w-24 lg:text-gray-900 lg:dark:text-gray-100'
                    : `text-xs w-14 lg:text-base lg:w-20 ${isPast ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`
                  }`}>
                  {formatEventTime(event)}
                </span>

                {/* Title */}
                <span className={`flex-1 truncate
                  ${isNext
                    ? 'text-sm font-semibold text-gray-900 dark:text-gray-100 lg:text-2xl lg:font-bold'
                    : `text-sm lg:font-medium ${isPast ? 'text-gray-400 dark:text-gray-500 lg:text-base' : 'text-gray-900 dark:text-gray-100 lg:text-xl'}`
                  }`}>
                  {event.title}
                </span>

                {/* Person chip */}
                <span
                  className={`shrink-0 font-medium rounded-full px-2 py-0.5
                    ${isNext ? 'text-xs lg:text-sm lg:px-3 lg:py-1' : 'text-xs lg:text-sm lg:px-3'}
                    ${isPast ? 'opacity-40' : ''}`}
                  style={{ backgroundColor: `${event.userColor}20`, color: event.userColor }}
                >
                  {event.userName.split(' ')[0]}
                </span>
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
              {/*
               * wallMode gives the first arrival a hero treatment (large tabular
               * time, colored by urgency) while keeping subsequent arrivals in a
               * compact secondary list. The detail page renders ArrivalBoard
               * without wallMode so its layout is unaffected.
               */}
              <ArrivalBoard stopId={stop.stopId} routeIds={stop.routeIds} wallMode />
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

// ─── Registry-based grid renderer ────────────────────────────────────────────

/**
 * Renders widget data props that need to be threaded from Dashboard
 * into non-self-fetching widgets (calendar, tasks, transit).
 *
 * ShoppingWidget is self-fetching — it needs no props here.
 */
interface DashboardData {
  tasks: ReturnType<typeof useTasks>['data'];
  events: Array<{
    id: string;
    title: string;
    startTime: string;
    allDay: boolean;
    userName: string;
    userColor: string;
  }>;
  stops: Array<{
    id: string;
    stopId: string;
    stopName: string;
    nickname?: string;
    routeIds: string[];
  }>;
}

function renderWidget(widget: ReturnType<typeof getEnabledWidgets>[number], data: DashboardData) {
  switch (widget.id) {
    case 'shopping':
      return <ShoppingWidget />;
    case 'calendar':
      return <CalendarWidget events={data.events} />;
    case 'transit':
      return <TransitWidget stops={data.stops} />;
    case 'tasks':
      return <TasksWidget tasks={data.tasks} />;
    default:
      return null;
  }
}

function DashboardGrid({ data }: { data: DashboardData }) {
  const widgets = getEnabledWidgets();

  const largeWidgets  = widgets.filter(w => w.sizeClass === 'LARGE');
  const stackedWidgets = widgets.filter(w => w.sizeClass !== 'LARGE');

  /*
   * Phone (<640px): single column, all widgets in order (large first, then stacked).
   * Tablet / wall (sm+): two-column side-by-side flex layout.
   *   Left column  — LARGE widgets (Shopping), stretched to fill full height.
   *   Right column — remaining widgets (Transit → Calendar → Tasks) stacked top-to-bottom.
   */
  return (
    <>
      {/* ── Phone: single column stack ─────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:hidden">
        {widgets.map(widget => (
          <div key={widget.id}>
            {renderWidget(widget, data)}
          </div>
        ))}
      </div>

      {/* ── Tablet / wall: two-column layout ───────────────────────── */}
      <div className="hidden sm:flex sm:gap-5 lg:gap-6 sm:items-stretch">
        {/* Left column — LARGE widgets fill the full height */}
        <div className="flex flex-col gap-5 lg:gap-6 flex-1 [&>*]:flex-1 [&>*]:flex [&>*]:flex-col">
          {largeWidgets.map(widget => (
            <div key={widget.id} className="flex flex-col flex-1 [&>*]:flex-1">
              {renderWidget(widget, data)}
            </div>
          ))}
        </div>

        {/* Right column — smaller widgets stacked */}
        <div className="flex flex-col gap-5 lg:gap-6 flex-1">
          {stackedWidgets.map(widget => (
            <div key={widget.id}>
              {renderWidget(widget, data)}
            </div>
          ))}
        </div>
      </div>
    </>
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
  const { data: stops = [] } = useSavedStops({ refetchInterval: 15_000 });

  // Shopping is no longer fetched here — ShoppingWidget is self-fetching.

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
     *
     * Widget order and sizing is driven by widgetRegistry.ts.
     * To reorder: change `order` values in the registry. No layout rewrite needed.
     */
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 lg:max-w-none">
      <PageHeader
        name={user.name}
        isOnline={isOnline}
        canInstall={canInstall}
        install={install}
      />

      <DashboardGrid data={{ tasks, events, stops }} />
    </div>
  );
}
