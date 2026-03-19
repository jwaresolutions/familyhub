'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useStopSearch, useSaveStop } from '@/hooks/useTransit';
import type { StopSearchResult } from '@organize/shared';

interface AddStopFormProps {
  onClose: () => void;
}

export function AddStopForm({ onClose }: AddStopFormProps) {
  const [query, setQuery] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedStop, setSelectedStop] = useState<StopSearchResult | null>(null);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);

  const { data: results = [], isLoading } = useStopSearch(query);
  const saveStop = useSaveStop();

  function selectStop(stop: StopSearchResult) {
    setSelectedStop(stop);
    setSelectedRoutes(stop.routeIds.slice(0, 5)); // default to first 5 routes
  }

  function toggleRoute(routeId: string) {
    setSelectedRoutes(prev =>
      prev.includes(routeId) ? prev.filter(r => r !== routeId) : [...prev, routeId]
    );
  }

  async function handleSave() {
    if (!selectedStop) return;
    await saveStop.mutateAsync({
      stopId: selectedStop.stopId,
      stopName: selectedStop.name,
      routeIds: selectedRoutes,
      nickname: nickname || undefined,
    });
    onClose();
  }

  return (
    <div className="space-y-4">
      {!selectedStop ? (
        <>
          <Input
            label="Search for a stop"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. 3rd Ave, Pioneer Square..."
            autoFocus
          />
          {isLoading && <p className="text-sm text-gray-500">Searching...</p>}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map(stop => (
              <Card
                key={stop.stopId}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => selectStop(stop)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{stop.name}</p>
                    {stop.direction && (
                      <p className="text-xs text-gray-500">{stop.direction} bound</p>
                    )}
                  </div>
                  <Badge label={`${stop.routeIds.length} routes`} color="#6B7280" />
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          <div>
            <p className="font-medium">{selectedStop.name}</p>
            <p className="text-xs text-gray-500">Stop #{selectedStop.stopId}</p>
          </div>
          <Input
            label="Nickname (optional)"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="e.g. Home stop, Work stop..."
          />
          {selectedStop.routeIds.length > 0 && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter routes (optional)</label>
              <div className="flex flex-wrap gap-1">
                {selectedStop.routeIds.map(routeId => (
                  <button
                    key={routeId}
                    type="button"
                    onClick={() => toggleRoute(routeId)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      selectedRoutes.includes(routeId)
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {routeId.split('_').pop()}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saveStop.isPending}>Save Stop</Button>
            <Button variant="secondary" onClick={() => setSelectedStop(null)}>Back</Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </>
      )}
    </div>
  );
}
