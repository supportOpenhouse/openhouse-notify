/**
 * Maps each broadcast audienceType to the corresponding Firebase topic name.
 *
 * Mobile apps must subscribe to these topics on login:
 *   await messaging().subscribeToTopic(token, 'all-users');
 *
 * AudienceTypes NOT listed here require individual token delivery (CSV / manual / segment).
 */
export const AUDIENCE_TOPIC_MAP: Record<string, string> = {
  all_users:    'all-users',
  all_brokers:  'all-brokers',
  android_users: 'android-users',
  ios_users:    'ios-users',
  marketing:    'marketing',
};

/** Returns the FCM topic for a given audienceType, or undefined if token-based. */
export function getTopicForAudience(audienceType: string): string | undefined {
  return AUDIENCE_TOPIC_MAP[audienceType];
}

/** All audienceTypes that use topic-based delivery. */
export const TOPIC_AUDIENCE_TYPES = new Set(Object.keys(AUDIENCE_TOPIC_MAP));
