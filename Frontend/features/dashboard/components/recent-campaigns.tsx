"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusBadge } from "@/components/shared/status-badge"
import { useCampaignHistory } from "@/hooks/use-notification-campaigns"

export function RecentCampaigns() {
  const { data, isLoading } = useCampaignHistory()
  const items = data?.data?.items?.slice(0, 5) ?? []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Campaigns</CardTitle>
            <CardDescription>Latest activity across all campaigns</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/campaigns">
              View all <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-3 pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {items.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {c.totalCount.toLocaleString()} recipients
                    {c.scheduledAt && ` · ${format(new Date(c.scheduledAt), "MMM d, HH:mm")}`}
                  </p>
                </div>
                <StatusBadge status={c.status} showDot />
                <div className="text-right text-xs text-muted-foreground">
                  {c.totalCount > 0 ? `${Math.round((c.sentCount / c.totalCount) * 1000) / 10}%` : "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
