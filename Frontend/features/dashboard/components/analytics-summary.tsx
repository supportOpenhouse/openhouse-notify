"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCampaignComparison } from "@/hooks/use-analytics"

export function AnalyticsSummary() {
  const { data = [], isLoading } = useCampaignComparison()

  const chartData = data.map((c) => ({
    name: c.campaignName.length > 18 ? c.campaignName.slice(0, 18) + "…" : c.campaignName,
    "Delivery %": c.deliveryRate,
    "Open %": c.openRate,
    "CTR %": c.ctr,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Comparison</CardTitle>
        <CardDescription>Delivery, open rate and CTR across recent campaigns</CardDescription>
      </CardHeader>
      <CardContent className="pb-5">
        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="Delivery %" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="Open %" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="CTR %" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
