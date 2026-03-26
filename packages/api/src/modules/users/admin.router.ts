import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../db/client';
import { requireAdmin } from '../../middleware/require-admin';
import { AuthRequest } from '../../middleware/auth';
import { badRequest } from '../../lib/errors';

const router = Router();

// All admin routes require admin role
router.use(requireAdmin);

// GET /admin/users — list all users with full details
router.get('/users', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, color: true, role: true, avatarUrl: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(users);
  } catch (err) { next(err); }
});

// POST /admin/users — create a new user
router.post('/users', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username, password, name, color, role } = req.body;
    if (!username || !password || !name || !color) {
      return next(badRequest('username, password, name, and color are required', 'MISSING_FIELDS'));
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashed, name, color, role: role || 'member' },
      select: { id: true, username: true, name: true, color: true, role: true, avatarUrl: true, createdAt: true, updatedAt: true },
    });
    res.status(201).json(user);
  } catch (err) {
    // P2002 (unique constraint) is handled centrally in the error middleware
    next(err);
  }
});

// PATCH /admin/users/:id — update user
router.patch('/users/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, color, role, password } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (color !== undefined) data.color = color;
    if (role !== undefined) data.role = role;
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, username: true, name: true, color: true, role: true, avatarUrl: true, createdAt: true, updatedAt: true },
    });
    res.json(user);
  } catch (err) { next(err); }
});

// DELETE /admin/users/:id — delete user (cannot delete yourself)
router.delete('/users/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.params.id === req.userId) {
      return next(badRequest('Cannot delete yourself', 'SELF_DELETE'));
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
