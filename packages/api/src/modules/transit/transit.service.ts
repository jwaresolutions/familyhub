import { prisma } from '../../db/client';
import { obaClient } from '../../lib/oba-client';

export const transitService = {
  async findSavedStops(userId: string) {
    return prisma.savedStop
      .findMany({
        where: { userId },
        orderBy: { position: 'asc' },
      })
      .then((stops) =>
        stops.map((s) => ({
          ...s,
          routeIds: s.routeIds ? s.routeIds.split(',').filter(Boolean) : [],
        })),
      );
  },

  async saveStop(
    userId: string,
    data: {
      stopId: string;
      stopName: string;
      routeIds: string[];
      nickname?: string;
    },
  ) {
    const maxPos = await prisma.savedStop.aggregate({
      where: { userId },
      _max: { position: true },
    });
    const position = (maxPos._max.position ?? -1) + 1;

    const stop = await prisma.savedStop.create({
      data: {
        userId,
        stopId: data.stopId,
        stopName: data.stopName,
        routeIds: data.routeIds.join(','),
        nickname: data.nickname,
        position,
      },
    });

    return {
      ...stop,
      routeIds: stop.routeIds ? stop.routeIds.split(',').filter(Boolean) : [],
    };
  },

  async updateStop(
    id: string,
    data: {
      nickname?: string;
      routeIds?: string[];
      position?: number;
    },
  ) {
    const updateData: any = {};
    if (data.nickname !== undefined) updateData.nickname = data.nickname;
    if (data.routeIds) updateData.routeIds = data.routeIds.join(',');
    if (data.position !== undefined) updateData.position = data.position;

    const stop = await prisma.savedStop.update({ where: { id }, data: updateData });
    return {
      ...stop,
      routeIds: stop.routeIds ? stop.routeIds.split(',').filter(Boolean) : [],
    };
  },

  async deleteStop(id: string) {
    return prisma.savedStop.delete({ where: { id } });
  },

  async getArrivals(stopId: string, filterRouteIds?: string[]) {
    const arrivals = await obaClient.getArrivalsForStop(stopId);

    if (filterRouteIds && filterRouteIds.length > 0) {
      return arrivals.filter((a: any) => filterRouteIds.includes(a.routeId));
    }
    return arrivals;
  },

  async searchStops(query: string) {
    return obaClient.searchStops(query);
  },

  async getRoute(routeId: string) {
    return obaClient.getRoute(routeId);
  },
};
