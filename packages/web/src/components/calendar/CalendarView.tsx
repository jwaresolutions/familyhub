'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
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

// Split a flat array of days into rows of `cols` length.
// The calendar is always 7 columns wide.
const COLS = 7;
function chunkDays(days: Date[], cols: number): Date[][] {
  const rows: Date[][] = [];
  for (let i = 0; i < days.length; i += cols) {
    rows.push(days.slice(i, i + cols));
  }
  return rows;
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [userFilter, setUserFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Track which cell index (0-based, flat) currently holds focus within the grid.
  // We use a roving tabIndex pattern: only the focused cell gets tabIndex=0, all
  // others stay at -1. This means a keyboard user tabs into the grid once and then
  // uses arrow keys — standard grid widget behaviour per ARIA Authoring Practices.
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Collect refs to every rendered day cell so we can imperatively focus them
  // when arrow key navigation changes the active cell.
  const cellRefs = useRef<Array<HTMLDivElement | null>>([]);

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

  // Group events by local date — convert UTC ISO string to local calendar day
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      const dayKey = format(new Date(event.startTime), 'yyyy-MM-dd');
      if (!map[dayKey]) map[dayKey] = [];
      map[dayKey].push(event);
    }
    return map;
  }, [events]);

  // Reset cell refs array length whenever the day list changes (month/week switch,
  // navigation). Old refs are replaced as cells remount.
  cellRefs.current = new Array(days.length).fill(null);

  function navigate(direction: 'prev' | 'next') {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    }
    // Reset focus to first cell when the visible range changes
    setFocusedIndex(0);
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

  // Arrow key handler for roving tabIndex grid navigation.
  // Left/Right move ±1 day, Up/Down move ±7 days (one week row).
  // Enter activates the day (same as click).
  const handleKeyDown = useCallback(
    (index: number) => (e: React.KeyboardEvent<HTMLDivElement>) => {
      let nextIndex = index;

      switch (e.key) {
        case 'ArrowRight':
          nextIndex = Math.min(index + 1, days.length - 1);
          break;
        case 'ArrowLeft':
          nextIndex = Math.max(index - 1, 0);
          break;
        case 'ArrowDown':
          nextIndex = Math.min(index + COLS, days.length - 1);
          break;
        case 'ArrowUp':
          nextIndex = Math.max(index - COLS, 0);
          break;
        case 'Enter':
        case ' ':
          // Activate the currently focused day cell
          e.preventDefault();
          handleDayClick(days[index]);
          return;
        default:
          return;
      }

      if (nextIndex !== index) {
        e.preventDefault();
        setFocusedIndex(nextIndex);
        cellRefs.current[nextIndex]?.focus();
      }
    },
    [days] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const rows = chunkDays(days, COLS);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            aria-label={viewMode === 'month' ? 'Previous month' : 'Previous week'}
            onClick={() => navigate('prev')}
          >
            ←
          </Button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center" aria-live="polite">
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy')
              : `Week of ${format(rangeStart, 'MMM d, yyyy')}`}
          </h2>
          <Button
            variant="secondary"
            size="sm"
            aria-label={viewMode === 'month' ? 'Next month' : 'Next week'}
            onClick={() => navigate('next')}
          >
            →
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden"
            role="group"
            aria-label="Calendar view"
          >
            <button
              className={`px-3 py-1 text-sm ${viewMode === 'month' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              aria-pressed={viewMode === 'month'}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              className={`px-3 py-1 text-sm ${viewMode === 'week' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              aria-pressed={viewMode === 'week'}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
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
      <div className="flex gap-3" aria-label="Family members">
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-1.5 text-sm">
            <Avatar name={u.name} color={u.color} size="sm" />
            <span className="text-gray-600 dark:text-gray-400">{u.name}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid
          role="grid" is the correct ARIA widget for an interactive calendar.
          aria-label identifies the grid to screen reader users.
          aria-multiselectable="false" clarifies that only one day is selectable at a time. */}
      <div
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        role="grid"
        aria-label={
          viewMode === 'month'
            ? `Calendar for ${format(currentDate, 'MMMM yyyy')}`
            : `Calendar for week of ${format(rangeStart, 'MMMM d, yyyy')}`
        }
        aria-multiselectable="false"
      >
        {/* Column header row — role="row" with role="columnheader" cells */}
        <div role="row" className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800">
          {weekDays.map(d => (
            <div
              key={d}
              role="columnheader"
              aria-label={
                // Provide the full day name so screen readers say "Sunday" not "Sun"
                { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' }[d]
              }
              className="text-center text-xs font-medium text-gray-500 py-2"
            >
              {/* Visible abbreviated label; the aria-label on the parent provides the full name */}
              <span aria-hidden="true">{d}</span>
            </div>
          ))}
        </div>

        {/* Week rows — each row of 7 days gets role="row" */}
        {rows.map((rowDays, rowIndex) => (
          <div key={rowIndex} role="row" className="grid grid-cols-7">
            {rowDays.map((day, colIndex) => {
              const flatIndex = rowIndex * COLS + colIndex;
              const dayKey = format(day, 'yyyy-MM-dd');
              return (
                <DayCell
                  key={dayKey}
                  date={day}
                  currentMonth={currentDate}
                  events={eventsByDay[dayKey] || []}
                  onDayClick={handleDayClick}
                  onEventClick={handleEventClick}
                  // Roving tabIndex: the focused cell is reachable by Tab,
                  // all others are removed from the tab sequence.
                  tabIndex={flatIndex === focusedIndex ? 0 : -1}
                  onKeyDown={handleKeyDown(flatIndex)}
                  cellRef={el => {
                    cellRefs.current[flatIndex] = el;
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Event form slide-over */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowForm(false)} />
          <EventForm
            event={selectedEvent}
            defaultDate={selectedDate || undefined}
            onClose={() => {
              setShowForm(false);
              setSelectedEvent(null);
              setSelectedDate(null);
            }}
          />
        </>
      )}
    </div>
  );
}
