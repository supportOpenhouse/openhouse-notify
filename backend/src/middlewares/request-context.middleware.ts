import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  req.requestId = (req.headers['x-request-id'] as string) ?? uuidv4();
  req.startTime = Date.now();

  res.setHeader('X-Request-ID', req.requestId);

  next();
}
