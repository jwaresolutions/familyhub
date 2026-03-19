'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ArrivalBoard } from './ArrivalBoard';
import { AddStopForm } from './AddStopForm';
import { useSavedStops, useDeleteStop } from '@/hooks/useTransit';

export function SavedStops() {
  const [showAddStop, setShowAddStop] = useState(false);
  const { data: stops = [], isLoading } = useSavedStops();
  const deleteStop = useDeleteStop();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[200px]">Loading stops...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{stops.length} saved stop{stops.length !== 1 ? 's' : ''}</p>
        <Button onClick={() => setShowAddStop(true)} size="sm">+ Add Stop</Button>
      </div>

      {stops.length === 0 ? (
        <Card className="flex flex-col items-center justify-center min-h-[200px] gap-3">
          <p className="text-gray-500">No saved stops yet</p>
          <Button onClick={() => setShowAddStop(true)}>Add Your First Stop</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stops.map(stop => (
            <Card key={stop.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm">
                    {stop.nickname || stop.stopName}
                  </h3>
                  {stop.nickname && (
                    <p className="text-xs text-gray-500">{stop.stopName}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { if (confirm('Remove this stop?')) deleteStop.mutate(stop.id); }}
                >✕</Button>
              </div>
              <ArrivalBoard stopId={stop.stopId} routeIds={stop.routeIds} />
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAddStop} onClose={() => setShowAddStop(false)} title="Add Bus Stop">
        <AddStopForm onClose={() => setShowAddStop(false)} />
      </Modal>
    </div>
  );
}
