"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDeliveryTimeSeries, useOpenRateTimeSeries } from "@/hooks/use-analytics"

export function DeliveryChart() {
  const { data: deliverySeries = [], isLoading: loadingDelivery } = useDeliveryTimeSeries()
  const { data: openRateSeries = [], isLoading: loadingOpen } = useOpenRateTimeSeries()
  const isLoading = loadingDelivery || loadingOpen

  const combined = deliverySeries.map((d, i) => ({
    date: format(new Date(d.timestamp), "MMM d"),
    sent: d.value,
    openRate: openRateSeries[i]?.value ?? 0,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Timeline</CardTitle>
        <CardDescription>Notifications sent and open rate over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="pb-5">
        {isLoading ? (
          <Skeleton className="h-[220px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={combined} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="openGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="sent"
                name="Sent"
                stroke="#6366f1"
                fill="url(#sentGrad)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="openRate"
                name="Open Rate %"
                stroke="#10b981"
                fill="url(#openGrad)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
