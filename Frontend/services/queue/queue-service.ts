import { mockQueueJobs, mockQueueStats, mockQueueMetrics } from "@/lib/data/mock-queue"
import { QueueJob, QueueStats, QueueMetricPoint } from "@/lib/types/queue"
import { withSimulatedLatency } from "@/services/mock-api/delay"

export async function getQueueJobsService(): Promise<QueueJob[]> {
  return withSimulatedLatency(() => mockQueueJobs, { minMs: 150, maxMs: 400 })
}

export async function getQueueStatsService(): Promise<QueueStats> {
  return withSimulatedLatency(
    () => ({
      ...mockQueueStats,
      totalThroughput: Math.floor(mockQueueStats.totalThroughput + (Math.random() * 40 - 20)),
      avgLatencyMs: Math.floor(mockQueueStats.avgLatencyMs + (Math.random() * 30 - 15)),
    }),
    { minMs: 100, maxMs: 300 }
  )
}

export async function getQueueMetricsService(): Promise<QueueMetricPoint[]> {
  return withSimulatedLatency(() => mockQueueMetrics, { minMs: 200, maxMs: 500 })
}

export async function retryJobService(jobId: string): Promise<{ success: boolean; message: string }> {
  return withSimulatedLatency(
    () => ({ success: true, message: `Job ${jobId} re-queued for retry.` }),
    { minMs: 400, maxMs: 800, failRate: 0.1, failMessage: "Failed to retry job. Worker may be unavailable." }
  )
}

export async function cancelJobService(jobId: string): Promise<{ success: boolean }> {
  return withSimulatedLatency(() => ({ success: true }), { minMs: 200, maxMs: 400 })
}
