/** Payload types and name constants for campaign-related BullMQ jobs. */

export const CAMPAIGN_JOB_NAMES = {
  /** One job per campaign — fans out into FCM batch jobs. */
  DISPATCH: 'campaign:dispatch',
  /** One job per 500-token batch — calls FCM sendEachForMulticast. */
  FCM_BATCH: 'fcm:batch',
} as const;

export type CampaignJobName = (typeof CAMPAIGN_JOB_NAMES)[keyof typeof CAMPAIGN_JOB_NAMES];

/** Data for the campaign dispatch job (enqueued by the API on campaign creation). */
export interface CampaignDispatchJobData {
  campaignId: string;
}

/** Data for each FCM batch job (enqueued by the dispatch processor). */
export interface FcmBatchJobData {
  campaignId: string;
  tokens: string[];
  batchIndex: number;
  totalBatches: number;
  title: string;
  body: string;
  imageUrl?: string;
  deepLinkUrl?: string;
  /** Hex property id encoding (Django) — FCM data for PropertyDetails redirect */
  propertyCode?: string;
  /**
   * Mirrors Django's notificationId field in the FCM data payload.
   * The app (FCMService.handleNotification) uses !!data?.notificationId to gate
   * the updateNotificationStatus() HTTP call BEFORE navigation dispatch.
   * That HTTP round-trip acts as a timing buffer: it gives UserProvider.refreshUser()
   * time to complete (isLoading→false) so the navigation tree mounts inside
   * NavigationContainer before navigationRef.dispatch() fires in getInitialNotification.
   * Without this, dispatch throws "navigator not mounted" in the killed-app state and
   * the app silently falls back to Home. Use campaignId as the value — Django will
   * reject the PUT with 400/404 (wrong ID type) but the app catches it and navigates.
   */
  notificationId?: string;
  /** Extra key-value data payload attached to every notification. */
  data?: Record<string, string>;
}
