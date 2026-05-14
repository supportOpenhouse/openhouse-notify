import { Router } from 'express';
import { v1Router } from './v1';
import { appConfig } from '@config/index';

export const router = Router();

router.use(`/${appConfig.apiVersion}`, v1Router);
