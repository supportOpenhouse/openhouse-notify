"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCampaignMetrics } from "@/hooks/use-notification-campaigns"

export function MetricsGrid() {
  const { data = [], isLoading } = useCampaignMetrics()

  return (
    <section className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
      {isLoading
        ? Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx}>
              <CardContent className="h-20 animate-pulse rounded-xl bg-muted/60 sm:h-24" />
            </Card>
          ))
        : data.map((metric) => (
            <Card key={metric.label}>
              <CardHeader className="px-3 pb-1 pt-3 sm:px-5 sm:pt-4">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-xs leading-tight sm:text-sm">{metric.label}</CardTitle>
                  <CardDescription className="text-[10px] leading-tight sm:text-[11px]">{metric.helper}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0 sm:px-5 sm:pb-4 sm:pt-1">
                <p className="text-2xl font-semibold leading-none text-foreground sm:text-3xl">{metric.value}</p>
              </CardContent>
            </Card>
          ))}
    </section>
  )
}
