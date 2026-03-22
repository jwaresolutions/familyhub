import { Router } from 'express';
import { prisma } from '../../db/client';
import { registerModule } from '../../lib/module-registry';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, color: true, avatarUrl: true, role: true, createdAt: true, updatedAt: true },
    });
    res.json(users);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, username: true, name: true, color: true, avatarUrl: true, role: true, createdAt: true, updatedAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

registerModule({ name: 'Users', prefix: '/users', router, icon: 'users', description: 'Family members' });

export default router;
