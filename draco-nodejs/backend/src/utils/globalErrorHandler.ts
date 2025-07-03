import { Request, Response, NextFunction } from 'express';

export function hasCodeProperty(err: unknown): err is { code: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code?: unknown }).code === 'string'
  );
}

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('Global error handler:', err);
  if (hasCodeProperty(err) && (err as unknown as Record<string, unknown>).code === 'P2025') {
    res.status(404).json({
      success: false,
      message: 'Resource not found',
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
