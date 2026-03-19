'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useCalendar';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/lib/auth';
import type { CalendarEvent } from '@organize/shared';

interface EventFormProps {
  event?: CalendarEvent | null;
  defaultDate?: string;
  onClose: () => void;
}

const RECURRENCE_OPTIONS = [
  { value: '', label: 'No repeat' },
  { value: 'FREQ=DAILY', label: 'Daily' },
  { value: 'FREQ=WEEKLY', label: 'Weekly' },
  { value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', label: 'Weekdays' },
  { value: 'FREQ=MONTHLY', label: 'Monthly' },
  { value: 'FREQ=YEARLY', label: 'Yearly' },
];

export function EventForm({ event, defaultDate, onClose }: EventFormProps) {
  const { user } = useAuth();
  const { data: users = [] } = useUsers();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const isEditing = !!event;

  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [date, setDate] = useState(
    event ? event.startTime.split('T')[0] : defaultDate || new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState(
    event ? event.startTime.split('T')[1]?.slice(0, 5) || '09:00' : '09:00'
  );
  const [endTime, setEndTime] = useState(
    event ? event.endTime.split('T')[1]?.slice(0, 5) || '10:00' : '10:00'
  );
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [userId, setUserId] = useState(event?.userId || user?.id || '');
  const [recurrence, setRecurrence] = useState(event?.recurrenceRule || '');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const startISO = allDay ? `${date}T00:00:00.000Z` : `${date}T${startTime}:00.000Z`;
    const endISO = allDay ? `${date}T23:59:59.000Z` : `${date}T${endTime}:00.000Z`;

    if (isEditing) {
      await updateEvent.mutateAsync({
        id: event.id,
        title,
        description: description || undefined,
        startTime: startISO,
        endTime: endISO,
        allDay,
        recurrenceRule: recurrence || undefined,
      });
    } else {
      await createEvent.mutateAsync({
        title,
        description: description || undefined,
        startTime: startISO,
        endTime: endISO,
        allDay,
        userId,
        recurrenceRule: recurrence || undefined,
      });
    }
    onClose();
  }

  async function handleDelete() {
    if (event && confirm('Delete this event?')) {
      await deleteEvent.mutateAsync({ id: event.id, scope: 'all' });
      onClose();
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">{isEditing ? 'Edit Event' : 'New Event'}</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} autoFocus required />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allDay"
            checked={allDay}
            onChange={e => setAllDay(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="allDay" className="text-sm text-gray-700 dark:text-gray-300">All day</label>
        </div>
        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            <Input label="End" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        )}
        <Select
          label="Person"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          options={users.map(u => ({ value: u.id, label: u.name }))}
        />
        <Select
          label="Repeat"
          value={recurrence}
          onChange={e => setRecurrence(e.target.value)}
          options={RECURRENCE_OPTIONS}
        />
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={!title.trim()}>
            {isEditing ? 'Save' : 'Create'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          {isEditing && (
            <Button type="button" variant="danger" onClick={handleDelete} className="ml-auto">Delete</Button>
          )}
        </div>
      </form>
    </div>
  );
}
