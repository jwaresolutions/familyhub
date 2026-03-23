import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../db/client';
import { signToken, signRefreshToken, authMiddleware, AuthRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { loginSchema, changePasswordSchema } from '@organize/shared';

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
      user: { id: user.id, username: user.username, name: user.name, color: user.color, avatarUrl: user.avatarUrl, role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt },
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
      select: { id: true, username: true, name: true, color: true, avatarUrl: true, role: true, createdAt: true, updatedAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

router.patch('/password', authMiddleware, validate(changePasswordSchema), async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
});

export default router;
