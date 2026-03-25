'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { SavedStop, StopArrivals, StopSearchResult } from '@organize/shared';

export function useSavedStops(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['transit-stops'],
    queryFn: () => api.get<SavedStop[]>('/transit/stops'),
    ...(options?.refetchInterval !== undefined && {
      refetchInterval: options.refetchInterval,
      placeholderData: keepPreviousData,
    }),
  });
}

export function useStopArrivals(stopId: string | null, routeIds?: string[]) {
  const params = routeIds?.length ? `?routeIds=${routeIds.join(',')}` : '';
  return useQuery({
    queryKey: ['arrivals', stopId, routeIds],
    queryFn: () => api.get<StopArrivals>(`/transit/stops/${stopId}/arrivals${params}`),
    enabled: !!stopId,
    refetchInterval: 30_000, // Auto-refresh every 30s
  });
}

export function useSaveStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { stopId: string; stopName: string; routeIds: string[]; nickname?: string }) =>
      api.post<SavedStop>('/transit/stops', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transit-stops'] }),
  });
}

export function useUpdateStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; nickname?: string; routeIds?: string[] }) =>
      api.patch(`/transit/stops/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transit-stops'] }),
  });
}

export function useDeleteStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/transit/stops/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transit-stops'] }),
  });
}

export function useStopSearch(query: string) {
  return useQuery({
    queryKey: ['transit-search', query],
    queryFn: () => api.get<StopSearchResult[]>(`/transit/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
  });
}
