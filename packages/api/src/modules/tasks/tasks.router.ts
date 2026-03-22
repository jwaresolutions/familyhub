import { Router, Response, NextFunction } from 'express';
import { tasksService } from './tasks.service';
import { registerModule } from '../../lib/module-registry';
import { validate } from '../../middleware/validate';
import { AuthRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/require-admin';
import { createTaskSchema, moveTaskSchema, reorderSchema } from '@organize/shared';

const router = Router();

// GET /tasks?status=TODO&category=BOAT&assigneeId=xxx
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, category, assigneeId } = req.query as Record<string, string>;
    const tasks = await tasksService.findAll({ status, category, assigneeId });
    const formatted = tasks.map(t => ({
      ...t,
      assignees: t.assignments.map(a => a.user),
      assignments: undefined,
    }));
    res.json(formatted);
  } catch (err) { next(err); }
});

// GET /tasks/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await tasksService.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({
      ...task,
      assignees: task.assignments.map(a => a.user),
      assignments: undefined,
    });
  } catch (err) { next(err); }
});

// POST /tasks
router.post('/', validate(createTaskSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await tasksService.create(req.body);
    res.status(201).json({
      ...task,
      assignees: task.assignments.map(a => a.user),
      assignments: undefined,
    });
  } catch (err) { next(err); }
});

// PATCH /tasks/reorder — batch reorder (MUST be before /:id to avoid "reorder" matching as :id)
router.patch('/reorder', validate(reorderSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await tasksService.reorder(req.body.items);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// PATCH /tasks/:id
router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const task = await tasksService.update(req.params.id, req.body);
    res.json({
      ...task,
      assignees: task.assignments.map(a => a.user),
      assignments: undefined,
    });
  } catch (err) { next(err); }
});

// DELETE /tasks/:id
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await tasksService.delete(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

// PATCH /tasks/:id/move — move to different column + position
router.patch('/:id/move', validate(moveTaskSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, position } = req.body;
    const task = await tasksService.move(req.params.id, status, position);
    res.json({
      ...task,
      assignees: task.assignments.map(a => a.user),
      assignments: undefined,
    });
  } catch (err) { next(err); }
});

// POST /tasks/:id/assign
router.post('/:id/assign', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const assignment = await tasksService.addAssignee(req.params.id, userId);
    res.status(201).json(assignment);
  } catch (err) { next(err); }
});

// DELETE /tasks/:id/assign/:userId
router.delete('/:id/assign/:userId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await tasksService.removeAssignee(req.params.id, req.params.userId);
    res.status(204).end();
  } catch (err) { next(err); }
});

registerModule({
  name: 'Tasks',
  prefix: '/tasks',
  router,
  icon: 'check-square',
  description: 'Kanban task management',
});

export default router;
