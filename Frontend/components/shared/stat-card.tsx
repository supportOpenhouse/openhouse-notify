"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type StatCardProps = {
  label: string
  value: string | number
  helper?: string
  trend?: number
  trendLabel?: string
  icon?: React.ReactNode
  isLoading?: boolean
  className?: string
  valueClassName?: string
}

export function StatCard({
  label,
  value,
  helper,
  trend,
  trendLabel,
  icon,
  isLoading = false,
  className,
  valueClassName,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-3.5 w-28" />
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    )
  }

  const trendPositive = trend !== undefined && trend > 0
  const trendNegative = trend !== undefined && trend < 0
  const trendNeutral = trend === 0

  return (
    <Card className={cn("group transition-shadow hover:shadow-md", className)}>
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
          {icon && <div className="text-muted-foreground/50 transition-colors group-hover:text-muted-foreground">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent className="pb-4 pt-0">
        <p className={cn("text-2xl font-bold tracking-tight text-foreground", valueClassName)}>{value}</p>
        <div className="mt-1.5 flex items-center gap-2">
          {trend !== undefined && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                trendPositive && "text-emerald-600",
                trendNegative && "text-red-500",
                trendNeutral && "text-muted-foreground"
              )}
            >
              {trendPositive && <TrendingUp className="size-3" />}
              {trendNegative && <TrendingDown className="size-3" />}
              {trendNeutral && <Minus className="size-3" />}
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          )}
          {helper && (
            <CardDescription className="text-[11px]">
              {trendLabel ?? helper}
            </CardDescription>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
