/**
 * Centralized error types and factory functions.
 *
 * All API error responses follow the shape:
 *   { error: string, code: string }
 *
 * Validation errors add field-level detail:
 *   { error: string, code: string, fields: ZodIssue[] }
 *
 * Usage:
 *   throw new AppError('Task not found', 'NOT_FOUND', 404);
 *   throw notFound('Task');
 *   throw conflict('Username already exists');
 */

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ── Factories ──────────────────────────────────────────────────────────────

export function badRequest(message: string, code = 'BAD_REQUEST'): AppError {
  return new AppError(message, code, 400);
}

export function unauthorized(message: string, code = 'UNAUTHORIZED'): AppError {
  return new AppError(message, code, 401);
}

export function forbidden(message: string, code = 'FORBIDDEN'): AppError {
  return new AppError(message, code, 403);
}

export function notFound(resource: string): AppError {
  return new AppError(`${resource} not found`, 'NOT_FOUND', 404);
}

export function conflict(message: string, code = 'CONFLICT'): AppError {
  return new AppError(message, code, 409);
}
