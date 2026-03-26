'use client';

import { useStopArrivals } from '@/hooks/useTransit';
import type { BusArrival } from '@organize/shared';

interface ArrivalBoardProps {
  stopId: string;
  routeIds?: string[];
  /** Wall-tablet mode: hero treatment for first arrival, compact for the rest */
  wallMode?: boolean;
}

export function ArrivalBoard({ stopId, routeIds, wallMode = false }: ArrivalBoardProps) {
  const { data, isLoading } = useStopArrivals(stopId, routeIds);

  if (isLoading) return <div className="text-xs text-gray-400">Loading arrivals...</div>;

  const arrivals = data?.arrivals || [];

  if (arrivals.length === 0) {
    return <p className="text-xs text-gray-500">No upcoming arrivals</p>;
  }

  if (wallMode && arrivals.length > 0) {
    const next = arrivals[0];
    const upcoming = arrivals.slice(1, 4);
    const nextMinutes = next.minutesUntilArrival;
    const urgencyColor =
      nextMinutes <= 1
        ? 'text-red-600 dark:text-red-400'
        : nextMinutes <= 5
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-green-600 dark:text-green-400';

    return (
      <div>
        {/* Hero: next arrival */}
        <div className="flex items-end justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center justify-center bg-primary-600 text-white text-lg font-bold rounded px-3 py-1 min-w-[3.5rem] text-center shrink-0">
              {next.routeShortName}
            </span>
            <span className="text-base text-gray-600 dark:text-gray-400 truncate leading-tight">
              {next.tripHeadsign}
            </span>
          </div>
          <span className={`text-5xl font-black tabular-nums leading-none shrink-0 ${urgencyColor}`}
                aria-label={`${nextMinutes <= 0 ? 'arriving now' : `${nextMinutes} minutes`}`}>
            {nextMinutes <= 0 ? 'NOW' : `${nextMinutes}m`}
            {next.predicted && (
              <span className="text-base ml-1 align-top" aria-label="real-time">●</span>
            )}
          </span>
        </div>

        {/* Secondary: next few arrivals in compact rows */}
        {upcoming.length > 0 && (
          <div className="space-y-1.5 border-t border-gray-100 dark:border-gray-800 pt-2">
            {upcoming.map((arrival: BusArrival, i: number) => {
              const mins = arrival.minutesUntilArrival;
              const color =
                mins <= 1
                  ? 'text-red-600 dark:text-red-400'
                  : mins <= 5
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-green-600 dark:text-green-400';
              return (
                <div
                  key={`${arrival.routeId}-${arrival.scheduledArrivalTime}-${i}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded px-1.5 py-0.5 min-w-[2rem] text-center shrink-0">
                      {arrival.routeShortName}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {arrival.tripHeadsign}
                    </span>
                  </div>
                  <span className={`text-base font-semibold tabular-nums shrink-0 ml-2 ${color}`}>
                    {mins <= 0 ? 'NOW' : `${mins}m`}
                    {arrival.predicted && <span className="text-[10px] ml-0.5">●</span>}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {data?.lastUpdated && (
          <p className="text-xs text-gray-400 mt-2">
            Updated {new Date(data.lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </div>
    );
  }

  // Default (phone/tablet) mode — original compact list
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
