import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../db/client';
import { signToken, signRefreshToken, authMiddleware, AuthRequest, verifyToken } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { loginSchema, changePasswordSchema } from '@organize/shared';
import { badRequest, notFound, unauthorized } from '../../lib/errors';

const router = Router();

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(unauthorized('Invalid credentials', 'INVALID_CREDENTIALS'));
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
    if (!refreshToken) return next(badRequest('Missing refresh token', 'MISSING_REFRESH_TOKEN'));
    const payload = verifyToken(refreshToken);
    const token = signToken(payload.userId);
    res.json({ token });
  } catch {
    return next(unauthorized('Invalid refresh token', 'INVALID_TOKEN'));
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, name: true, color: true, avatarUrl: true, role: true, createdAt: true, updatedAt: true },
    });
    if (!user) return next(notFound('User'));
    res.json(user);
  } catch (err) { next(err); }
});

router.patch('/password', authMiddleware, validate(changePasswordSchema), async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return next(notFound('User'));
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return next(badRequest('Current password is incorrect', 'INVALID_PASSWORD'));
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
