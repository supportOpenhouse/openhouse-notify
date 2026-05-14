export type QueueJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "retrying"
  | "delayed"
  | "cancelled"

export type QueueJobPriority = "low" | "normal" | "high" | "critical"

export type QueueJob = {
  id: string
  campaignId: string
  campaignName: string
  status: QueueJobStatus
  priority: QueueJobPriority
  totalTokens: number
  processedTokens: number
  successfulTokens: number
  failedTokens: number
  progress: number
  attemptNumber: number
  maxAttempts: number
  enqueuedAt: string
  startedAt?: string
  completedAt?: string
  nextRetryAt?: string
  workerNode?: string
  estimatedCompletionAt?: string
  errorMessage?: string
  platform: "android" | "ios" | "all"
  batchSize: number
  currentBatch: number
  totalBatches: number
  throughputPerSecond: number
}

export type QueueStats = {
  queued: number
  processing: number
  completed: number
  failed: number
  retrying: number
  delayed: number
  totalThroughput: number
  avgLatencyMs: number
  successRate: number
  peakThroughput: number
  workerCount: number
  activeWorkers: number
}

export type QueueMetricPoint = {
  timestamp: string
  queued: number
  processing: number
  throughput: number
  latencyMs: number
}
