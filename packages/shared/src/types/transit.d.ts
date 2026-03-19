export interface SavedStop {
    id: string;
    userId: string;
    stopId: string;
    stopName: string;
    routeIds: string[];
    nickname?: string;
    position: number;
}
export interface BusArrival {
    routeId: string;
    routeShortName: string;
    tripHeadsign: string;
    predictedArrivalTime?: number;
    scheduledArrivalTime: number;
    minutesUntilArrival: number;
    predicted: boolean;
}
export interface StopArrivals {
    stopId: string;
    stopName: string;
    arrivals: BusArrival[];
    lastUpdated: string;
}
export interface StopSearchResult {
    stopId: string;
    name: string;
    direction: string;
    lat: number;
    lon: number;
    routeIds: string[];
}
export interface CreateSavedStopRequest {
    stopId: string;
    stopName: string;
    routeIds: string[];
    nickname?: string;
}
//# sourceMappingURL=transit.d.ts.map