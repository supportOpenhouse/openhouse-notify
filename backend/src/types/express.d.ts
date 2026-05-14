// Augments the Express Request type globally
// requestId and startTime are injected by requestContextMiddleware

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export {};
