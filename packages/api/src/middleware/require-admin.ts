import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../db/client';

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    next(err);
  }
}
