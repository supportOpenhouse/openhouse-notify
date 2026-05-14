"use client"

import { BarChart3, BellRing, CheckCircle, TrendingDown, Zap, Clock } from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import { useCampaignMetrics } from "@/hooks/use-notification-campaigns"

const ICONS = [BellRing, CheckCircle, BarChart3, TrendingDown, Zap, Clock]

export function KpiGrid() {
  const { data = [], isLoading } = useCampaignMetrics()

  return (
    <section className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-3 2xl:grid-cols-6">
      {isLoading
        ? Array.from({ length: 6 }).map((_, i) => (
            <StatCard key={i} label="" value="" isLoading />
          ))
        : data.map((metric, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <StatCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                helper={metric.helper}
                trend={metric.trend}
                trendLabel={metric.trendLabel}
                icon={<Icon className="size-4" />}
              />
            )
          })}
    </section>
  )
}
