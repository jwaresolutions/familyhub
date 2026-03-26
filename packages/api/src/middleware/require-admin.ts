import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../db/client';
import { forbidden } from '../lib/errors';

export async function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });
    if (!user || user.role !== 'admin') {
      return next(forbidden('Admin access required', 'FORBIDDEN'));
    }
    next();
  } catch (err) {
    next(err);
  }
}
