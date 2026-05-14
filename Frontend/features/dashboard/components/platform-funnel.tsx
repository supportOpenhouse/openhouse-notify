"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, FunnelChart, Funnel, LabelList } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDeliveryFunnel, usePlatformBreakdown } from "@/hooks/use-analytics"

const PLATFORM_COLORS = ["#6366f1", "#10b981"]

export function PlatformFunnelCards() {
  const { data: funnel = [], isLoading: loadingFunnel } = useDeliveryFunnel()
  const { data: platforms = [], isLoading: loadingPlatform } = usePlatformBreakdown()
  const isLoading = loadingFunnel || loadingPlatform

  const pieData = platforms.map((p) => ({ name: p.platform, value: p.sent }))

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Delivery Funnel</CardTitle>
          <CardDescription>Stage-by-stage conversion</CardDescription>
        </CardHeader>
        <CardContent className="pb-5">
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <FunnelChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Funnel dataKey="count" data={funnel} isAnimationActive>
                  {funnel.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                  <LabelList
                    position="center"
                    content={({ value, x, y, width }) => (
                      <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#fff" fontWeight={600}>
                        {value?.toLocaleString()}
                      </text>
                    )}
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          )}
          {!isLoading && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {funnel.map((f) => (
                <div key={f.stage} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">{f.stage}</span>
                  <span className="font-semibold">{f.rate}%</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform Split</CardTitle>
          <CardDescription>Android vs iOS distribution</CardDescription>
        </CardHeader>
        <CardContent className="pb-5">
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {!isLoading && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {platforms.map((p, i) => (
                <div key={p.platform} className="rounded-lg bg-muted/40 px-3 py-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[i] }} />
                    <span className="text-muted-foreground">{p.platform}</span>
                  </div>
                  <p className="mt-0.5 font-semibold">{p.deliveryRate}% delivery</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
