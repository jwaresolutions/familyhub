'use client';

import { useState, useRef } from 'react';
import { isToday, isSameMonth, format } from 'date-fns';
import type { CalendarEvent } from '@organize/shared';

interface DayCellProps {
  date: Date;
  currentMonth: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  // Keyboard navigation — the parent manages which cell is focused
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  cellRef?: React.RefCallback<HTMLDivElement>;
}

export function DayCell({
  date,
  currentMonth,
  events,
  onDayClick,
  onEventClick,
  tabIndex = -1,
  onKeyDown,
  cellRef,
}: DayCellProps) {
  const [expanded, setExpanded] = useState(false);
  const today = isToday(date);
  const inMonth = isSameMonth(date, currentMonth);

  const visibleEvents = expanded ? events : events.slice(0, 3);
  const hiddenCount = events.length - 3;

  // Build a human-readable label so screen readers announce date + event count
  // e.g. "March 25, 2026, 3 events" or "March 25, 2026, no events"
  const formattedDate = format(date, 'MMMM d, yyyy');
  const eventCountLabel =
    events.length === 0
      ? 'no events'
      : events.length === 1
      ? '1 event'
      : `${events.length} events`;
  const ariaLabel = `${formattedDate}, ${eventCountLabel}`;

  return (
    <div
      ref={cellRef}
      role="gridcell"
      aria-label={ariaLabel}
      // tabIndex is managed by the parent so arrow-key navigation moves focus
      // correctly through the grid without trapping the user in a sea of tab stops.
      tabIndex={tabIndex}
      className={[
        'min-h-[80px] md:min-h-[100px] border border-gray-200 dark:border-gray-700 p-1 cursor-pointer',
        'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
        // Visible focus ring that works in both light and dark mode
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:z-10 focus-visible:relative',
        !inMonth ? 'bg-gray-50 dark:bg-gray-900/50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onDayClick(date)}
      onKeyDown={onKeyDown}
    >
      <span
        className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${
          today
            ? 'bg-primary-600 text-white font-bold'
            : inMonth
            ? 'text-gray-700 dark:text-gray-300'
            : 'text-gray-400 dark:text-gray-600'
        }`}
        // Hide the raw number from screen readers — the gridcell aria-label already
        // contains the full date so this would be redundant noise.
        aria-hidden="true"
      >
        {date.getDate()}
      </span>
      <div className="mt-0.5 space-y-0.5">
        {visibleEvents.map(event => (
          <div
            key={event.id}
            role="button"
            tabIndex={-1}
            aria-label={event.title}
            className="text-xs truncate rounded px-1 py-0.5 cursor-pointer hover:opacity-80"
            style={{ backgroundColor: `${event.userColor}20`, color: event.userColor }}
            onClick={e => {
              e.stopPropagation();
              onEventClick(event);
            }}
            onKeyDown={e => {
              // Allow keyboard users to activate events without triggering day navigation
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onEventClick(event);
              }
            }}
          >
            {event.title}
          </div>
        ))}
        {!expanded && hiddenCount > 0 && (
          <div
            className="text-xs text-gray-400 px-1 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
            onClick={e => {
              e.stopPropagation();
              setExpanded(true);
            }}
          >
            +{hiddenCount} more
          </div>
        )}
        {expanded && (
          <div
            className="text-xs text-gray-400 px-1 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
            onClick={e => {
              e.stopPropagation();
              setExpanded(false);
            }}
          >
            Show less
          </div>
        )}
      </div>
    </div>
  );
}
