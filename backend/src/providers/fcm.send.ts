import { getFirebaseMessaging } from './firebase.admin';
import { logger } from '@infrastructure/logger';

/**
 * Build the FCM `data` payload matching Django's send_property_notification exactly.
 *
 * Django (core/oh/views.py):
 *   hex_property_id = format(int(home.id * 10000), 'x')   # e.g. "138800" for home.id=128
 *   data = {
 *     "type":           "property",
 *     "propertyId":     hex_property_id,
 *     "url":            f"/property/{hex_property_id}",
 *     "notificationId": str(notification.id),
 *   }
 *
 * App (FCMService.handlePropertyNotification):
 *   data.propertyId → parseInt(hex, 16) / 10000 → home.id → getHomeDetails(id)
 *
 * CRITICAL — notificationId:
 *   The app's FCMService.handleNotification checks `!!data?.notificationId` to decide
 *   whether to call `await updateNotificationStatus()` BEFORE dispatching navigation.
 *   In the killed/quit-app state, getInitialNotification() fires right after
 *   registerFCMToken() completes. Without the updateNotificationStatus() HTTP delay,
 *   navigationRef.dispatch() is called before UserProvider.refreshUser() finishes
 *   (isLoading=true) — the navigation tree is not yet mounted, dispatch throws, gets
 *   caught silently, and the app lands on Home instead of PropertyScreen.
 *   Django ALWAYS sends notificationId; we must do the same so the app's HTTP-call
 *   timing buffer fires and the navigator is mounted when dispatch runs.
 *
 * `propertyCode` is the hex from the /get-homes/ API field `propertyCode`.
 */
export function buildOpenhouseFcmDataPayload(options: {
  deepLinkUrl?: string;
  propertyCode?: string;
  /** Campaign ID (or any stable string). Mirrors Django's notificationId so the app
   *  calls updateNotificationStatus() before navigation dispatch, giving the React
   *  navigation tree time to mount in the killed-app state. */
  notificationId?: string;
  extra?: Record<string, string>;
}): Record<string, string> | undefined {
  const { deepLinkUrl, propertyCode, notificationId, extra } = options;
  const merged: Record<string, string> = { ...(extra ?? {}) };

  if (deepLinkUrl?.trim()) {
    merged.deepLink = deepLinkUrl.trim();
  }

  if (propertyCode?.trim()) {
    // Always lowercase — Django format(..., 'x') produces lowercase hex.
    const hex = propertyCode.trim().toLowerCase();
    merged.type = 'property';       // triggers FCMService.handlePropertyNotification
    merged.propertyId = hex;        // app decodes: parseInt(hex,16)/10000 = home.id
    merged.url = `/property/${hex}`; // same as Django: f"/property/{hex_property_id}"

    logger.debug(
      `[fcm:payload] propertyCode="${propertyCode}" → hex="${hex}" | ` +
      `decoded_home_id=${parseInt(hex, 16) / 10000}`,
    );
  } else {
    logger.warn(
      `[fcm:payload] No propertyCode provided — notification will NOT navigate ` +
      `to PropertyScreen on tap (data.type and data.propertyId will be absent). ` +
      `Set propertyCode in the campaign to enable deep-link navigation.`,
    );
  }

  // CRITICAL: always include notificationId to mirror Django's payload exactly.
  // The app checks !!data?.notificationId to gate the updateNotificationStatus() HTTP
  // call that acts as a timing buffer for killed-state navigation (see comment above).
  if (notificationId?.trim()) {
    merged.notificationId = notificationId.trim();
    logger.debug(`[fcm:payload] notificationId="${notificationId.trim()}"`);
  } else {
    logger.warn(
      `[fcm:payload] notificationId not provided — killed-state navigation may fail ` +
      `because the app will skip the updateNotificationStatus() delay. ` +
      `Pass campaignId as notificationId in sendFcmTopic/sendFcmBatch.`,
    );
  }

  const result = Object.keys(merged).length > 0 ? merged : undefined;

  logger.info('[fcm:payload] Final FCM data payload:', {
    keys: result ? Object.keys(result) : '(none — no data block will be sent)',
    type: result?.type ?? '(missing)',
    propertyId: result?.propertyId ?? '(missing)',
    notificationId: result?.notificationId ?? '(missing)',
    deepLink: result?.deepLink ?? '(none)',
    url: result?.url ?? '(none)',
  });

  return result;
}

// ─── Topic send ───────────────────────────────────────────────────────────────

export interface FcmTopicPayload {
  topic: string;
  title: string;
  body: string;
  imageUrl?: string;
  deepLinkUrl?: string;
  /** Hex from Django format(int(home.id * 10000), 'x') — opens PropertyDetails on tap */
  propertyCode?: string;
  /** Campaign ID used as notificationId — required for killed-state navigation timing. */
  notificationId?: string;
  data?: Record<string, string>;
}

export interface FcmTopicResult {
  messageId: string;
}

/**
 * Send a single FCM message to a topic (e.g. "all-users", "android-users").
 * Firebase fans this out to every subscribed device automatically.
 */
export async function sendFcmTopic(payload: FcmTopicPayload): Promise<FcmTopicResult> {
  const { topic, title, body, imageUrl, deepLinkUrl, propertyCode, notificationId, data } = payload;
  const messaging = getFirebaseMessaging();

  logger.info('[fcm:topic] Building message', {
    topic,
    title,
    body,
    imageUrl: imageUrl ?? '(none)',
    deepLinkUrl: deepLinkUrl ?? '(none)',
    propertyCode: propertyCode ?? '(none — no property navigation)',
    notificationId: notificationId ?? '(none — killed-state nav may break)',
    extraDataKeys: data ? Object.keys(data) : [],
  });

  const dataPayload = buildOpenhouseFcmDataPayload({ deepLinkUrl, propertyCode, notificationId, extra: data });

  // Match Django EXACTLY: messaging.Message(notification=Notification(title,body), data={...})
  // NO android block, NO apns block — any platform-specific config changes how
  // Android constructs the notification intent on quit-state tap, which can
  // cause data to be missing from getInitialNotification().
  const message: Parameters<typeof messaging.send>[0] = {
    topic,
    notification: {
      title,
      body,
      ...(imageUrl ? { imageUrl } : {}),
    },
    ...(dataPayload ? { data: dataPayload } : {}),
  };

  logger.info('[fcm:topic] Outgoing FCM message structure:', {
    topic,
    hasNotification: true,
    notificationTitle: title,
    notificationBody: body,
    hasData: !!dataPayload,
    dataKeys: dataPayload ? Object.keys(dataPayload) : [],
    dataPayload: dataPayload ?? '(none)',
  });

  const messageId = await messaging.send(message);

  logger.info(`[fcm:topic] Sent to topic "${topic}" — messageId: ${messageId}`);
  return { messageId };
}

export interface FcmBatchPayload {
  tokens: string[];
  title: string;
  body: string;
  imageUrl?: string;
  deepLinkUrl?: string;
  propertyCode?: string;
  /** Campaign ID used as notificationId — required for killed-state navigation timing. */
  notificationId?: string;
  data?: Record<string, string>;
}

export interface FcmBatchResult {
  successCount: number;
  failureCount: number;
  /** Parallel array to `tokens` — true = sent, false = failed */
  responses: Array<{ success: boolean; errorMessage?: string }>;
}

const FCM_MAX_BATCH = 500;

/**
 * Send a multicast FCM push to up to 500 tokens (Firebase limit).
 * Splits automatically if `tokens.length > 500`.
 */
export async function sendFcmBatch(payload: FcmBatchPayload): Promise<FcmBatchResult> {
  const { tokens, title, body, imageUrl, deepLinkUrl, propertyCode, notificationId, data } = payload;

  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, responses: [] };
  }

  logger.info('[fcm:batch] Building batch message', {
    tokenCount: tokens.length,
    title,
    body,
    imageUrl: imageUrl ?? '(none)',
    deepLinkUrl: deepLinkUrl ?? '(none)',
    propertyCode: propertyCode ?? '(none — no property navigation)',
    notificationId: notificationId ?? '(none — killed-state nav may break)',
    extraDataKeys: data ? Object.keys(data) : [],
  });

  const messaging = getFirebaseMessaging();
  const chunks: string[][] = [];

  for (let i = 0; i < tokens.length; i += FCM_MAX_BATCH) {
    chunks.push(tokens.slice(i, i + FCM_MAX_BATCH));
  }

  const allResponses: FcmBatchResult['responses'] = [];
  let totalSuccess = 0;
  let totalFailure = 0;

  const dataPayload = buildOpenhouseFcmDataPayload({ deepLinkUrl, propertyCode, notificationId, extra: data });

  if (dataPayload) {
    logger.info('[fcm:batch] Data payload keys: ' + Object.keys(dataPayload).join(', '), {
      propertyId: dataPayload.propertyId ?? '(missing — will not navigate to PropertyScreen)',
      notificationId: dataPayload.notificationId ?? '(missing — killed-state nav may fail)',
      type: dataPayload.type ?? '(missing)',
      url: dataPayload.url ?? '(none)',
    });
  } else {
    logger.warn('[fcm:batch] No data payload — notification will not navigate on tap');
  }

  for (const chunk of chunks) {
    // Match Django EXACTLY: messaging.Message(notification=Notification(title,body), data={...}, token=token)
    // NO android block, NO apns block — any platform-specific config can change how
    // Android constructs the launch intent on quit-state notification tap, causing
    // data to be empty in getInitialNotification(). Django sends nothing and it works.
    const multicast: Parameters<typeof messaging.sendEachForMulticast>[0] = {
      tokens: chunk,
      notification: {
        title,
        body,
        ...(imageUrl ? { imageUrl } : {}),
      },
      ...(dataPayload ? { data: dataPayload } : {}),
    };

    logger.info('[fcm:batch] Outgoing multicast FCM message structure:', {
      tokenCount: chunk.length,
      hasNotification: true,
      notificationTitle: title,
      hasData: !!dataPayload,
      dataPayload: dataPayload ?? '(none)',
    });

    const result = await messaging.sendEachForMulticast(multicast);
    totalSuccess += result.successCount;
    totalFailure += result.failureCount;

    result.responses.forEach((r) => {
      allResponses.push({
        success: r.success,
        errorMessage: r.error?.message,
      });
    });

    if (result.failureCount > 0) {
      logger.warn(`[fcm:batch] ${result.failureCount}/${chunk.length} tokens failed in this chunk`);
      result.responses.forEach((r, idx) => {
        if (!r.success) {
          logger.warn(`[fcm:batch] Token[${idx}] failed: ${r.error?.code} — ${r.error?.message}`);
        }
      });
    }
  }

  logger.info(
    `[fcm:batch] Completed: ${totalSuccess} sent, ${totalFailure} failed out of ${tokens.length} tokens`,
  );

  return {
    successCount: totalSuccess,
    failureCount: totalFailure,
    responses: allResponses,
  };
}
