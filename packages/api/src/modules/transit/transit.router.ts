import { Router, Response, NextFunction } from 'express';
import { transitService } from './transit.service';
import { registerModule } from '../../lib/module-registry';
import { validate } from '../../middleware/validate';
import { AuthRequest } from '../../middleware/auth';
import { createSavedStopSchema } from '@organize/shared';

const router = Router();

// GET /transit/stops — user's saved stops
router.get('/stops', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stops = await transitService.findSavedStops(req.userId!);
    res.json(stops);
  } catch (err) {
    next(err);
  }
});

// POST /transit/stops — save a stop
router.post(
  '/stops',
  validate(createSavedStopSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const stop = await transitService.saveStop(req.userId!, req.body);
      res.status(201).json(stop);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /transit/stops/:id — update saved stop
router.patch('/stops/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stop = await transitService.updateStop(req.params.id, req.body);
    res.json(stop);
  } catch (err) {
    next(err);
  }
});

// DELETE /transit/stops/:id — remove saved stop
router.delete('/stops/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await transitService.deleteStop(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /transit/stops/:stopId/arrivals — real-time arrivals from OBA
router.get(
  '/stops/:stopId/arrivals',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const routeIds = req.query.routeIds
        ? (req.query.routeIds as string).split(',')
        : undefined;
      const arrivals = await transitService.getArrivals(req.params.stopId, routeIds);
      res.json({
        stopId: req.params.stopId,
        arrivals,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /transit/search — search OBA stops
router.get('/search', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json([]);
    const stops = await transitService.searchStops(q);
    res.json(stops);
  } catch (err) {
    next(err);
  }
});

// GET /transit/routes/:routeId — route info
router.get('/routes/:routeId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const route = await transitService.getRoute(req.params.routeId);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (err) {
    next(err);
  }
});

registerModule({
  name: 'Transit',
  prefix: '/transit',
  router,
  icon: 'bus',
  description: 'Real-time bus arrivals',
});

export default router;
