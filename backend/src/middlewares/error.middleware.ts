import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@shared/errors';
import { logger } from '@infrastructure/logger';
import { env } from '@config/env';

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const extra = err as unknown as Record<string, unknown>;
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...extra,
    };
  }
  try {
    return { raw: JSON.stringify(err) };
  } catch {
    return { raw: String(err) };
  }
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── Zod validation error (client sent bad data) ──────────────────────────
  if (err instanceof ZodError) {
    const issues = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    logger.warn('Validation error', {
      issues,
      path: req.path,
      method: req.method,
      requestId: req.requestId,
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        issues,
      },
    });
    return;
  }

  // ── Operational AppError ─────────────────────────────────────────────────
  if (err instanceof AppError) {
    logger.warn('Operational error', {
      message: err.message,
      statusCode: err.statusCode,
      code: err.code,
      path: req.path,
      method: req.method,
      requestId: req.requestId,
    });

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // ── Unexpected / programmer error ────────────────────────────────────────
  const serialized = serializeError(err);
  logger.error('Unexpected error', {
    err: serialized,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
  });

  const message =
    env.NODE_ENV === 'production'
      ? 'Internal server error'
      : (serialized.message as string) ?? 'Unknown error';

  res.status(500).json({
    success: false,
    error: {
      message,
      ...(env.NODE_ENV !== 'production' && {
        stack: serialized.stack,
        detail: serialized,
      }),
    },
  });
}
