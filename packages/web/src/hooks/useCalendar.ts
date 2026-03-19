'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { CalendarEvent, CreateEventRequest } from '@organize/shared';

export function useCalendarEvents(start: string, end: string, userId?: string) {
  const params = new URLSearchParams({ start, end });
  if (userId) params.set('userId', userId);

  return useQuery({
    queryKey: ['calendar', start, end, userId],
    queryFn: () => api.get<CalendarEvent[]>(`/calendar/events?${params}`),
    enabled: !!start && !!end,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventRequest) => api.post<CalendarEvent>('/calendar/events', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CalendarEvent>) =>
      api.patch<CalendarEvent>(`/calendar/events/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scope }: { id: string; scope?: string }) =>
      api.delete(`/calendar/events/${id}${scope ? `?scope=${scope}` : ''}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  });
}
