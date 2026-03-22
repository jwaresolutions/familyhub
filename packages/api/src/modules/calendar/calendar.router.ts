import { Router, Response, NextFunction } from 'express';
import { calendarService } from './calendar.service';
import { registerModule } from '../../lib/module-registry';
import { validate } from '../../middleware/validate';
import { AuthRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/require-admin';
import { createEventSchema } from '@organize/shared';

const router = Router();

// GET /calendar/events?start=ISO&end=ISO&userId=
router.get('/events', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { start, end, userId } = req.query as Record<string, string>;
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end query params required' });
    }
    const events = await calendarService.findInRange(start, end, userId);
    res.json(events);
  } catch (err) { next(err); }
});

// GET /calendar/events/:id
router.get('/events/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const event = await calendarService.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) { next(err); }
});

// POST /calendar/events
router.post('/events', validate(createEventSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const event = await calendarService.create(req.body);
    res.status(201).json(event);
  } catch (err) { next(err); }
});

// PATCH /calendar/events/:id
router.patch('/events/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const event = await calendarService.update(req.params.id, req.body);
    res.json(event);
  } catch (err) { next(err); }
});

// DELETE /calendar/events/:id?scope=single|future|all
router.delete('/events/:id', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const scope = (req.query.scope as string) || 'all';
    await calendarService.delete(req.params.id, scope as 'single' | 'future' | 'all');
    res.status(204).end();
  } catch (err) { next(err); }
});

registerModule({
  name: 'Calendar',
  prefix: '/calendar',
  router,
  icon: 'calendar',
  description: 'Family calendar with recurring events',
});

export default router;
