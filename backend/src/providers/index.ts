// Provider registry: external service integrations
export {
  initFirebaseAdmin,
  tryInitFirebaseAdmin,
  isFirebaseConfigured,
  getFirebaseMessaging,
} from './firebase.admin';

export { sendFcmBatch, sendFcmTopic, buildOpenhouseFcmDataPayload } from './fcm.send';
export type { FcmBatchPayload, FcmBatchResult, FcmTopicPayload, FcmTopicResult } from './fcm.send';
