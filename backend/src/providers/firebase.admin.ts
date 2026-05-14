import path from 'path';
import admin from 'firebase-admin';
import { env } from '@config/env';
import { logger } from '@infrastructure/logger';

function resolveCredentialsPath(raw: string): string {
  const trimmed = raw.trim();
  if (path.isAbsolute(trimmed)) return trimmed;
  return path.join(process.cwd(), trimmed);
}

/**
 * Initialise the default Firebase Admin app once (idempotent).
 * Prefers `GOOGLE_APPLICATION_CREDENTIALS` (JSON path); otherwise uses
 * `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`.
 */
export function initFirebaseAdmin(): void {
  if (admin.apps.length > 0) {
    return;
  }

  const credsPath = env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credsPath) {
    const resolved = resolveCredentialsPath(credsPath);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = resolved;
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    logger.info('Firebase Admin initialised (application default credentials)', {
      credentialsPath: resolved,
    });
    return;
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = env;
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
    logger.info('Firebase Admin initialised (inline service account env)', {
      projectId: FIREBASE_PROJECT_ID,
    });
    return;
  }

  logger.warn(
    'Firebase Admin not configured — set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY',
  );
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    env.GOOGLE_APPLICATION_CREDENTIALS ||
      (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY),
  );
}

/**
 * Initialise Firebase when env is present; logs and swallows errors so HTTP server still starts.
 */
export function tryInitFirebaseAdmin(): void {
  if (!isFirebaseConfigured()) {
    return;
  }
  try {
    initFirebaseAdmin();
  } catch (err) {
    logger.error('Firebase Admin initialisation failed — fix env and restart', { err });
  }
}

export function getFirebaseMessaging(): admin.messaging.Messaging {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_* env vars.',
    );
  }
  initFirebaseAdmin();
  if (admin.apps.length === 0) {
    throw new Error('Firebase Admin failed to initialise.');
  }
  return admin.messaging();
}
