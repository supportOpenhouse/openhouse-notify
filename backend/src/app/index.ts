import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { appConfig } from '@config/index';
import { errorMiddleware } from '@middlewares/error.middleware';
import { requestContextMiddleware } from '@middlewares/request-context.middleware';
import { notFoundMiddleware } from '@middlewares/not-found.middleware';
import { router } from '@routes/index';

export function createApp(): Application {
  const app = express();

  // Security
  app.use(helmet());

  const allowedOrigins = new Set(appConfig.cors.origins);
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no Origin header (e.g. curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    }),
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  // Request logging
  app.use(morgan(appConfig.isDevelopment ? 'dev' : 'combined'));

  // Request context (requestId, startTime)
  app.use(requestContextMiddleware);

  // Versioned API routes
  app.use('/api', router);

  // 404
  app.use(notFoundMiddleware);

  // Global error handler (must be last)
  app.use(errorMiddleware);

  return app;
}
