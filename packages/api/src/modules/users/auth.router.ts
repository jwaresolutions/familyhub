import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../db/client';
import { signToken, signRefreshToken, authMiddleware, AuthRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { loginSchema } from '@organize/shared';

const router = Router();

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    res.json({
      token,
      refreshToken,
      user: { id: user.id, username: user.username, name: user.name, color: user.color, avatarUrl: user.avatarUrl, createdAt: user.createdAt, updatedAt: user.updatedAt },
    });
  } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Missing refresh token' });
    const jwt = await import('jsonwebtoken');
    const payload = jwt.default.verify(refreshToken, process.env.JWT_SECRET || 'dev-secret') as { userId: string };
    const token = signToken(payload.userId);
    res.json({ token });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, name: true, color: true, avatarUrl: true, createdAt: true, updatedAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

export default router;
