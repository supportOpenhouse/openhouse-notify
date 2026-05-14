"use client"

import * as React from "react"
import { RefreshCcw, XCircle, Activity, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useQueueJobs, useQueueStats, useRetryJob, useCancelJob } from "@/hooks/use-queue"
import { QueueJob } from "@/lib/types/queue"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

const STATUS_CONFIG: Record<QueueJob["status"], { label: string; color: string; indicatorColor: string }> = {
  queued: { label: "Queued", color: "border-blue-500/30 bg-blue-500/10 text-blue-700", indicatorColor: "bg-blue-500" },
  processing: { label: "Processing", color: "border-violet-500/30 bg-violet-500/10 text-violet-700", indicatorColor: "bg-violet-500" },
  completed: { label: "Completed", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700", indicatorColor: "bg-emerald-500" },
  failed: { label: "Failed", color: "border-red-500/30 bg-red-500/10 text-red-700", indicatorColor: "bg-red-500" },
  retrying: { label: "Retrying", color: "border-amber-500/30 bg-amber-500/10 text-amber-700", indicatorColor: "bg-amber-500" },
  delayed: { label: "Delayed", color: "border-orange-500/30 bg-orange-500/10 text-orange-700", indicatorColor: "bg-orange-500" },
  cancelled: { label: "Cancelled", color: "border-border bg-muted text-muted-foreground", indicatorColor: "bg-muted-foreground" },
}

function QueueJobCard({ job, onRetry, onCancel }: { job: QueueJob; onRetry: (id: string) => void; onCancel: (id: string) => void }) {
  const cfg = STATUS_CONFIG[job.status]
  const canRetry = job.status === "failed" || job.status === "retrying"
  const canCancel = job.status === "queued" || job.status === "processing"

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium", cfg.color)}>
                <span className={cn("size-1.5 rounded-full", cfg.indicatorColor)} />
                {cfg.label}
              </span>
              <span className="text-xs font-mono text-muted-foreground">{job.id}</span>
              {job.priority === "high" || job.priority === "critical" ? (
                <span className="text-[10px] font-semibold uppercase text-amber-600">● {job.priority}</span>
              ) : null}
            </div>
            <p className="mt-1.5 font-semibold text-sm text-foreground line-clamp-1">{job.campaignName}</p>
            <p className="text-xs text-muted-foreground">{job.totalTokens.toLocaleString()} tokens · {job.platform} · Attempt {Math.max(job.attemptNumber, 1)}/{job.maxAttempts}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            {canRetry && (
              <Button variant="ghost" size="icon-sm" onClick={() => onRetry(job.id)} title="Retry job">
                <RefreshCcw className="size-3.5" />
              </Button>
            )}
            {canCancel && (
              <Button variant="ghost" size="icon-sm" onClick={() => onCancel(job.id)} title="Cancel job" className="hover:text-destructive">
                <XCircle className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {(job.status === "processing" || job.progress > 0) && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{job.processedTokens.toLocaleString()} / {job.totalTokens.toLocaleString()}</span>
              <span>{job.progress.toFixed(1)}%</span>
            </div>
            <Progress
              value={job.progress}
              className="h-1.5"
              indicatorClassName={job.status === "processing" ? "bg-violet-500" : job.failedTokens > 0 ? "bg-amber-500" : "bg-emerald-500"}
            />
            {job.status === "processing" && (
              <p className="mt-1 text-[11px] text-muted-foreground">{job.throughputPerSecond}/s · Batch {job.currentBatch}/{job.totalBatches}</p>
            )}
          </div>
        )}

        {job.errorMessage && (
          <div className="mt-2 rounded-md bg-red-500/10 px-2.5 py-1.5 text-xs text-red-600">{job.errorMessage}</div>
        )}

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Enqueued {format(new Date(job.enqueuedAt), "MMM d, HH:mm")}</span>
          {job.completedAt && <span>Completed {format(new Date(job.completedAt), "HH:mm:ss")}</span>}
          {job.nextRetryAt && <span>Retry at {format(new Date(job.nextRetryAt), "HH:mm")}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

export function QueueModule() {
  const { data: jobs = [], isLoading: loadingJobs } = useQueueJobs()
  const { data: stats, isLoading: loadingStats } = useQueueStats()
  const retryMutation = useRetryJob()
  const cancelMutation = useCancelJob()

  const statCards = stats
    ? [
        { label: "Queued", value: stats.queued, icon: <Clock className="size-4" /> },
        { label: "Processing", value: stats.processing, icon: <Activity className="size-4" /> },
        { label: "Completed", value: stats.completed, icon: <CheckCircle className="size-4" /> },
        { label: "Failed/Retry", value: stats.failed + stats.retrying, icon: <AlertTriangle className="size-4" /> },
        { label: "Throughput/s", value: stats.totalThroughput, icon: <Activity className="size-4" /> },
        { label: "Avg Latency", value: `${stats.avgLatencyMs}ms`, icon: <Clock className="size-4" /> },
      ]
    : []

  const activeJobs = jobs.filter((j) => ["queued", "processing", "retrying", "delayed"].includes(j.status))
  const completedJobs = jobs.filter((j) => ["completed", "failed", "cancelled"].includes(j.status))

  return (
    <div className="space-y-4">
      <PageHeader
        title="Queue Monitor"
        description="Real-time notification delivery queue with retry management"
        breadcrumbs={[{ label: "Admin" }, { label: "Queue" }]}
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Live · refreshes every 5s
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-6">
        {loadingStats
          ? Array.from({ length: 6 }).map((_, i) => <StatCard key={i} label="" value="" isLoading />)
          : statCards.map((s) => (
              <StatCard key={s.label} label={s.label} value={String(s.value)} icon={s.icon} />
            ))}
      </div>

      {/* Active jobs */}
      <div>
        <h3 className="mb-2.5 text-sm font-semibold text-foreground">Active ({activeJobs.length})</h3>
        {loadingJobs ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        ) : activeJobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Queue is empty
          </div>
        ) : (
          <div className="space-y-2">
            {activeJobs.map((job) => (
              <QueueJobCard
                key={job.id}
                job={job}
                onRetry={(id) => retryMutation.mutate(id, { onSuccess: (r) => toast.success(r.message), onError: (e) => toast.error(e.message) })}
                onCancel={(id) => cancelMutation.mutate(id, { onSuccess: () => toast.success("Job cancelled") })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed jobs */}
      <div>
        <h3 className="mb-2.5 text-sm font-semibold text-foreground">Recent History ({completedJobs.length})</h3>
        <div className="space-y-2">
          {completedJobs.map((job) => (
            <QueueJobCard
              key={job.id}
              job={job}
              onRetry={(id) => retryMutation.mutate(id, { onSuccess: (r) => toast.success(r.message) })}
              onCancel={(id) => cancelMutation.mutate(id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
