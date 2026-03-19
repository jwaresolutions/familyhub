'use client';

import { useState, useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, addMonths, subMonths,
  addWeeks, subWeeks,
} from 'date-fns';
import { DayCell } from './DayCell';
import { EventForm } from './EventForm';
import { useCalendarEvents } from '@/hooks/useCalendar';
import { useUsers } from '@/hooks/useUsers';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import type { CalendarEvent } from '@organize/shared';

type ViewMode = 'month' | 'week';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [userFilter, setUserFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: users = [] } = useUsers();

  // Calculate date range based on view
  const { rangeStart, rangeEnd, days } = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const rangeStart = startOfWeek(monthStart);
      const rangeEnd = endOfWeek(monthEnd);
      return {
        rangeStart,
        rangeEnd,
        days: eachDayOfInterval({ start: rangeStart, end: rangeEnd }),
      };
    } else {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return {
        rangeStart: weekStart,
        rangeEnd: weekEnd,
        days: eachDayOfInterval({ start: weekStart, end: weekEnd }),
      };
    }
  }, [currentDate, viewMode]);

  const { data: events = [] } = useCalendarEvents(
    rangeStart.toISOString(),
    rangeEnd.toISOString(),
    userFilter || undefined
  );

  // Group events by day
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      const dayKey = event.startTime.split('T')[0];
      if (!map[dayKey]) map[dayKey] = [];
      map[dayKey].push(event);
    }
    return map;
  }, [events]);

  function navigate(direction: 'prev' | 'next') {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    }
  }

  function handleDayClick(date: Date) {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    setSelectedEvent(null);
    setShowForm(true);
  }

  function handleEventClick(event: CalendarEvent) {
    setSelectedEvent(event);
    setSelectedDate(null);
    setShowForm(true);
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('prev')}>←</Button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy')
              : `Week of ${format(rangeStart, 'MMM d, yyyy')}`}
          </h2>
          <Button variant="secondary" size="sm" onClick={() => navigate('next')}>→</Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              className={`px-3 py-1 text-sm ${viewMode === 'month' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              onClick={() => setViewMode('month')}
            >Month</button>
            <button
              className={`px-3 py-1 text-sm ${viewMode === 'week' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              onClick={() => setViewMode('week')}
            >Week</button>
          </div>
          <Select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            options={[
              { value: '', label: 'All Members' },
              ...users.map(u => ({ value: u.id, label: u.name })),
            ]}
          />
        </div>
      </div>

      {/* User legend */}
      <div className="flex gap-3">
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-1.5 text-sm">
            <Avatar name={u.name} color={u.color} size="sm" />
            <span className="text-gray-600 dark:text-gray-400">{u.name}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800">
          {weekDays.map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            return (
              <DayCell
                key={dayKey}
                date={day}
                currentMonth={currentDate}
                events={eventsByDay[dayKey] || []}
                onDayClick={handleDayClick}
                onEventClick={handleEventClick}
              />
            );
          })}
        </div>
      </div>

      {/* Event form slide-over */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowForm(false)} />
          <EventForm
            event={selectedEvent}
            defaultDate={selectedDate || undefined}
            onClose={() => { setShowForm(false); setSelectedEvent(null); setSelectedDate(null); }}
          />
        </>
      )}
    </div>
  );
}
