/**
 * One-off FCM test send (firebase-admin), payload aligned with Django:
 *   core/oh/views.py → send_property_notification (property_data + FCM data dict)
 *   core/oh/views.py → send_firebase_notification (Message with notification + data)
 *
 * Django encodes home id as:
 *   hex_property_id = format(int(home.id * 10000), 'x')
 * and sends data:
 *   type: "property"
 *   propertyId: <hex_property_id>
 *   url: "/property/<hex_property_id>"
 *   notificationId: "<db id>"
 *
 * CRITICAL — notificationId:
 *   The app's FCMService.handleNotification checks !!data?.notificationId to decide
 *   whether to call `await updateNotificationStatus()` before dispatching navigation.
 *   In killed/quit-app state, this HTTP delay is REQUIRED for the navigation tree to
 *   mount before dispatch fires. Without it, dispatch throws and the app lands on Home.
 *   Django ALWAYS sends notificationId. We generate a timestamp-based ID for tests.
 *
 * App handling: app/src/services/FCMService.ts handlePropertyNotification
 *   parseInt(data.propertyId, 16) / 10000 → numeric id → navigate with propertyId as string
 *
 * Usage:
 *   npm run fcm:test -- <FCM_TOKEN> <HOME_ID>
 *   npm run fcm:test -- <FCM_TOKEN> <HOME_ID> <NOTIFICATION_ID>
 *
 * Examples:
 *   npm run fcm:test -- "dKx2..." 12345
 *   FCM_DEVICE_TOKEN="..." PROPERTY_ID=12345 npm run fcm:test
 *
 * HOME_ID is Home.id in Django / listing id for GET .../get-home-details/?id=
 */
import 'dotenv/config';
import { getFirebaseMessaging, isFirebaseConfigured } from '../src/providers/firebase.admin';

/**
 * Match Python: format(int(home.id * 10000), 'x')
 * Use integer math (BigInt) so large ids stay exact.
 */
function encodePropertyIdLikeDjango(homeId: number): string {
  if (!Number.isFinite(homeId) || homeId <= 0 || !Number.isInteger(homeId)) {
    throw new Error(
      `Invalid HOME_ID: ${homeId}. Use a positive integer (Django Home.id), same as get-home-details ?id=`,
    );
  }
  return (BigInt(homeId) * 10000n).toString(16);
}

async function main(): Promise<void> {
  const token = process.argv[2] ?? process.env.FCM_DEVICE_TOKEN;
  const propertyIdRaw =
    process.argv[3] ?? process.env.PROPERTY_ID ?? process.env.PROPERTY_ID_NUMERIC;
  const notificationIdRaw =
    process.argv[4] ?? process.env.NOTIFICATION_ID ?? process.env.NOTIFICATION_ID_STR;

  if (!token?.trim()) {
    console.error(
      'Missing FCM token. Pass as first arg or set FCM_DEVICE_TOKEN.\n' +
        '  npm run fcm:test -- <TOKEN> <HOME_ID> [NOTIFICATION_ID]',
    );
    process.exit(1);
  }

  if (!isFirebaseConfigured()) {
    console.error(
      'Firebase is not configured. Check GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_* in .env',
    );
    process.exit(1);
  }

  const messaging = getFirebaseMessaging();

  const listingId =
    propertyIdRaw !== undefined && propertyIdRaw !== ''
      ? Number.parseInt(String(propertyIdRaw).trim(), 10)
      : NaN;
  const includePropertyNavigation =
    propertyIdRaw !== undefined && propertyIdRaw !== '' && Number.isInteger(listingId) && listingId > 0;

  // Generate a stable notificationId for this test run.
  // CRITICAL: must always be present — the app uses !!data?.notificationId to gate
  // the updateNotificationStatus() HTTP call that provides a timing buffer for the
  // killed-state navigation. Without it, dispatch fires before navigators mount.
  const notificationId = notificationIdRaw?.toString().trim() || `test-${Date.now()}`;

  const data: Record<string, string> = {
    source: 'send-test-fcm-script',
    // Always include notificationId (mirrors Django behavior)
    notificationId,
  };

  if (includePropertyNavigation) {
    const hexPropertyId = encodePropertyIdLikeDjango(listingId);
    const url = `/property/${hexPropertyId}`;

    // Mirror core/oh/views.py send_property_notification → send_firebase_notification data dict
    data.type = 'property';
    data.propertyId = hexPropertyId;
    data.url = url;

    console.log('\n=== Django-aligned FCM payload ===');
    console.log({
      type: data.type,
      propertyId: data.propertyId,
      url: data.url,
      notificationId: data.notificationId,
      source: data.source,
      decodedListingId: Number.parseInt(hexPropertyId, 16) / 10000,
    });
    console.log(
      `\nDecoded check: parseInt("${hexPropertyId}", 16) / 10000 = ${Number.parseInt(hexPropertyId, 16) / 10000}`,
    );
  } else {
    console.warn(
      '\nNo HOME_ID — sending plain test (tap will not open Property Details).\n' +
        '  npm run fcm:test -- <TOKEN> <HOME_ID> [NOTIFICATION_ID]',
    );
    console.log('\n=== Plain test FCM payload ===');
    console.log({
      notificationId: data.notificationId,
      source: data.source,
    });
  }

  console.log('\n=== Outgoing FCM message ===');
  const messagePayload = {
    token: token.trim(),
    notification: {
      title: includePropertyNavigation
        ? `Test — property ${listingId}`
        : 'Notification platform test',
      body: includePropertyNavigation
        ? `Tap to open listing ${listingId}`
        : `Sent at ${new Date().toISOString()}`,
    },
    data,
  };
  console.log(JSON.stringify(messagePayload, null, 2));

  const messageId = await messaging.send(messagePayload);

  console.log('\nFCM send OK');
  console.log('  messageId:', messageId);
  console.log('  notificationId in payload:', notificationId);
  if (includePropertyNavigation) {
    console.log('  propertyId (hex):', data.propertyId);
    console.log('  type:', data.type);
  }
  console.log(
    '\nKilled-state nav check: notificationId is present ✓ — app will call updateNotificationStatus() before dispatch',
  );
}

main().catch((err) => {
  console.error('FCM send failed:', err);
  process.exit(1);
});
