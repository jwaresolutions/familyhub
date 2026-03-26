import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Known application error — use its status and code directly
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  // Zod validation error — include field-level detail
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      fields: err.errors,
    });
  }

  // Prisma unique constraint violation
  if (isObject(err) && err.code === 'P2002') {
    return res.status(409).json({ error: 'Resource already exists', code: 'CONFLICT' });
  }

  // Prisma record not found
  if (isObject(err) && err.code === 'P2025') {
    return res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' });
  }

  // Unhandled — log the full error, return generic message
  console.error(err);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}
