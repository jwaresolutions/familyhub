'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrivalBoard } from '@/components/transit/ArrivalBoard';
import { useTasks } from '@/hooks/useTasks';
import { useCalendarEvents } from '@/hooks/useCalendar';
import { useShoppingLists } from '@/hooks/useShopping';
import { useSavedStops } from '@/hooks/useTransit';
import { usePWA } from '@/hooks/usePWA';
import { CATEGORY_LABELS, CATEGORY_COLORS, TASK_STATUS_LABELS } from '@organize/shared';
import Link from 'next/link';

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

  const { data: tasks = [] } = useTasks();
  const { data: events = [] } = useCalendarEvents(today.start, today.end);
  const { data: lists = [] } = useShoppingLists(false);
  const { data: stops = [] } = useSavedStops();

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  if (!user) return null;

  const upcomingTasks = tasks
    .filter(t => t.status !== 'DONE')
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5);

  const todayEvents = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const activeLists = lists.filter(l => !l.archived).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <Badge label="Offline" color="#EF4444" />
          )}
          {canInstall && (
            <Button variant="secondary" size="sm" onClick={install}>
              Install App
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Tasks Widget */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Upcoming Tasks</h2>
            <Link href="/tasks" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-gray-500">No pending tasks</p>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map(task => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  <Badge
                    label={TASK_STATUS_LABELS[task.status] || task.status}
                    color={task.status === 'IN_PROGRESS' ? '#3B82F6' : '#6B7280'}
                  />
                  <span className="flex-1 truncate">{task.title}</span>
                  <Badge
                    label={CATEGORY_LABELS[task.category] || task.category}
                    color={CATEGORY_COLORS[task.category]}
                  />
                  {task.dueDate && (
                    <span className="text-xs text-gray-500 shrink-0">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Today's Calendar Widget */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Today</h2>
            <Link href="/calendar" className="text-sm text-primary-600 hover:underline">View calendar</Link>
          </div>
          {todayEvents.length === 0 ? (
            <p className="text-sm text-gray-500">No events today</p>
          ) : (
            <div className="space-y-2">
              {todayEvents.slice(0, 5).map(event => (
                <div key={event.id} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: event.userColor }} />
                  <span className="text-xs text-gray-500 shrink-0">
                    {event.allDay ? 'All day' : new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex-1 truncate">{event.title}</span>
                  <span className="text-xs text-gray-400">{event.userName}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Shopping Lists Widget */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Shopping Lists</h2>
            <Link href="/shopping" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          {activeLists.length === 0 ? (
            <p className="text-sm text-gray-500">No active lists</p>
          ) : (
            <div className="space-y-2">
              {activeLists.map(list => (
                <div key={list.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{list.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: list.itemCount > 0 ? `${(list.checkedCount / list.itemCount) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{list.checkedCount}/{list.itemCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Transit Widget */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Next Buses</h2>
            <Link href="/transit" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          {stops.length === 0 ? (
            <p className="text-sm text-gray-500">No saved stops</p>
          ) : (
            <div className="space-y-3">
              {stops.slice(0, 2).map(stop => (
                <div key={stop.id}>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {stop.nickname || stop.stopName}
                  </p>
                  <ArrivalBoard stopId={stop.stopId} routeIds={stop.routeIds} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
