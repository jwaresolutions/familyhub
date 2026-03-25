'use client';

import { useState } from 'react';
import { isToday, isSameMonth } from 'date-fns';
import type { CalendarEvent } from '@organize/shared';

interface DayCellProps {
  date: Date;
  currentMonth: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function DayCell({ date, currentMonth, events, onDayClick, onEventClick }: DayCellProps) {
  const [expanded, setExpanded] = useState(false);
  const today = isToday(date);
  const inMonth = isSameMonth(date, currentMonth);

  const visibleEvents = expanded ? events : events.slice(0, 3);
  const hiddenCount = events.length - 3;

  return (
    <div
      className={`min-h-[80px] md:min-h-[100px] border border-gray-200 dark:border-gray-700 p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        !inMonth ? 'bg-gray-50 dark:bg-gray-900/50' : ''
      }`}
      onClick={() => onDayClick(date)}
    >
      <span
        className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${
          today
            ? 'bg-primary-600 text-white font-bold'
            : inMonth
            ? 'text-gray-700 dark:text-gray-300'
            : 'text-gray-400 dark:text-gray-600'
        }`}
      >
        {date.getDate()}
      </span>
      <div className="mt-0.5 space-y-0.5">
        {visibleEvents.map(event => (
          <div
            key={event.id}
            className="text-xs truncate rounded px-1 py-0.5 cursor-pointer hover:opacity-80"
            style={{ backgroundColor: `${event.userColor}20`, color: event.userColor }}
            onClick={e => { e.stopPropagation(); onEventClick(event); }}
          >
            {event.title}
          </div>
        ))}
        {!expanded && hiddenCount > 0 && (
          <div
            className="text-xs text-gray-400 px-1 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
            onClick={e => { e.stopPropagation(); setExpanded(true); }}
          >
            +{hiddenCount} more
          </div>
        )}
        {expanded && (
          <div
            className="text-xs text-gray-400 px-1 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
            onClick={e => { e.stopPropagation(); setExpanded(false); }}
          >
            Show less
          </div>
        )}
      </div>
    </div>
  );
}
