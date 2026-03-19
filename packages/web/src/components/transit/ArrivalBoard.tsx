'use client';

import { useStopArrivals } from '@/hooks/useTransit';
import type { BusArrival } from '@organize/shared';

interface ArrivalBoardProps {
  stopId: string;
  routeIds?: string[];
}

export function ArrivalBoard({ stopId, routeIds }: ArrivalBoardProps) {
  const { data, isLoading } = useStopArrivals(stopId, routeIds);

  if (isLoading) return <div className="text-xs text-gray-400">Loading arrivals...</div>;

  const arrivals = data?.arrivals || [];

  if (arrivals.length === 0) {
    return <p className="text-xs text-gray-500">No upcoming arrivals</p>;
  }

  return (
    <div className="space-y-1.5">
      {arrivals.slice(0, 5).map((arrival: BusArrival, i: number) => (
        <div key={`${arrival.routeId}-${arrival.scheduledArrivalTime}-${i}`} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center bg-primary-600 text-white text-xs font-bold rounded px-1.5 py-0.5 min-w-[2rem] text-center">
              {arrival.routeShortName}
            </span>
            <span className="text-gray-600 dark:text-gray-400 text-xs truncate max-w-[140px]">
              {arrival.tripHeadsign}
            </span>
          </div>
          <span className={`text-sm font-medium ${
            arrival.minutesUntilArrival <= 1
              ? 'text-red-600'
              : arrival.minutesUntilArrival <= 5
              ? 'text-amber-600'
              : 'text-green-600'
          }`}>
            {arrival.minutesUntilArrival <= 0 ? 'NOW' : `${arrival.minutesUntilArrival}m`}
            {arrival.predicted && <span className="text-[10px] ml-0.5">●</span>}
          </span>
        </div>
      ))}
      {data?.lastUpdated && (
        <p className="text-[10px] text-gray-400 mt-1">
          Updated {new Date(data.lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
