const OBA_BASE = 'http://api.pugetsound.onebusaway.org/api/where';
const OBA_KEY = process.env.OBA_API_KEY || 'TEST';

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expires: number }>();

async function obaFetch(path: string, cacheTtl = 0): Promise<any> {
  const url = `${OBA_BASE}${path}${path.includes('?') ? '&' : '?'}key=${OBA_KEY}`;

  if (cacheTtl > 0) {
    const cached = cache.get(url);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OBA API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  if (cacheTtl > 0) {
    cache.set(url, { data: json, expires: Date.now() + cacheTtl });
  }

  return json;
}

export const obaClient = {
  async getArrivalsForStop(stopId: string) {
    // Cache arrivals for 30 seconds
    const data = await obaFetch(
      `/arrivals-and-departures-for-stop/${stopId}.json?minutesBefore=2&minutesAfter=60`,
      30_000,
    );

    if (!data?.data?.entry?.arrivalsAndDepartures) {
      return [];
    }

    const now = Date.now();
    return data.data.entry.arrivalsAndDepartures.map((a: any) => ({
      routeId: a.routeId,
      routeShortName: a.routeShortName || a.routeId,
      tripHeadsign: a.tripHeadsign || 'Unknown',
      predictedArrivalTime: a.predictedArrivalTime || undefined,
      scheduledArrivalTime: a.scheduledArrivalTime,
      minutesUntilArrival: Math.round(
        ((a.predictedArrivalTime || a.scheduledArrivalTime) - now) / 60000,
      ),
      predicted: !!a.predictedArrivalTime && a.predictedArrivalTime > 0,
    }));
  },

  async searchStops(query: string) {
    // Cache stop searches for 5 minutes
    const data = await obaFetch(
      `/stops-for-location.json?query=${encodeURIComponent(query)}&lat=47.6&lon=-122.3&radius=50000`,
      300_000,
    );

    if (!data?.data?.list) {
      return [];
    }

    return data.data.list.map((stop: any) => ({
      stopId: stop.id,
      name: stop.name,
      direction: stop.direction || '',
      lat: stop.lat,
      lon: stop.lon,
      routeIds: stop.routeIds || [],
    }));
  },

  async getStop(stopId: string) {
    const data = await obaFetch(`/stop/${stopId}.json`, 300_000);
    if (!data?.data?.entry) return null;
    const stop = data.data.entry;
    return {
      stopId: stop.id,
      name: stop.name,
      direction: stop.direction || '',
      lat: stop.lat,
      lon: stop.lon,
      routeIds: stop.routeIds || [],
    };
  },

  async getRoute(routeId: string) {
    const data = await obaFetch(`/route/${routeId}.json`, 300_000);
    if (!data?.data?.entry) return null;
    const route = data.data.entry;
    return {
      id: route.id,
      shortName: route.shortName,
      longName: route.longName,
      description: route.description,
    };
  },
};
