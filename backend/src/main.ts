import { bootstrap } from './app/bootstrap';
import { logger } from './infrastructure/logger';

bootstrap().catch((err) => {
  logger.error('Failed to start application', { err });
  process.exit(1);
});
