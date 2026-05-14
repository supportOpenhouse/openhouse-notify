"use client"

import * as React from "react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts"
import { format } from "date-fns"
import { useAnalyticsOverview, useDeliveryTimeSeries, useCtrTimeSeries, usePlatformBreakdown, useCampaignComparison } from "@/hooks/use-analytics"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setActiveTab } from "@/store/slices/analytics-slice"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"

const CHART_STYLE = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: 12,
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

export function AnalyticsModule() {
  const dispatch = useAppDispatch()
  const activeTab = useAppSelector((s) => s.analytics.activeTab)

  const { data: overview, isLoading: loadingOverview } = useAnalyticsOverview()
  const { data: deliverySeries = [], isLoading: loadingDelivery } = useDeliveryTimeSeries()
  const { data: ctrSeries = [], isLoading: loadingCtr } = useCtrTimeSeries()
  const { data: platforms = [], isLoading: loadingPlatform } = usePlatformBreakdown()
  const { data: comparison = [], isLoading: loadingComparison } = useCampaignComparison()

  const combined = deliverySeries.map((d, i) => ({
    date: format(new Date(d.timestamp), "MMM d"),
    sent: d.value,
    ctr: ctrSeries[i]?.value ?? 0,
  }))

  const kpis = overview
    ? [
        { label: "Total Sent", value: overview.totalSent.toLocaleString(), trend: 8.4, helper: "vs last period" },
        { label: "Delivery Rate", value: `${overview.deliveryRate}%`, trend: 1.2, helper: "vs last period" },
        { label: "Open Rate", value: `${overview.openRate}%`, trend: -0.8, helper: "vs last period" },
        { label: "CTR", value: `${overview.ctr}%`, trend: 2.3, helper: "vs last period" },
        { label: "Total Failed", value: overview.totalFailed.toLocaleString(), trend: -3.1, helper: "vs last period" },
        { label: "Total Clicked", value: overview.totalClicked.toLocaleString(), trend: 5.6, helper: "vs last period" },
      ]
    : []

  return (
    <div className="space-y-4">
      <PageHeader
        title="Analytics"
        description="Delivery, engagement, and conversion metrics across all campaigns"
        breadcrumbs={[{ label: "Admin" }, { label: "Analytics" }]}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-6">
        {loadingOverview
          ? Array.from({ length: 6 }).map((_, i) => <StatCard key={i} label="" value="" isLoading />)
          : kpis.map((kpi) => (
              <StatCard key={kpi.label} label={kpi.label} value={kpi.value} trend={kpi.trend} helper={kpi.helper} />
            ))}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => dispatch(setActiveTab(v as typeof activeTab))}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="platform">Platform</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sent vs CTR Timeline</CardTitle>
                <CardDescription>30-day delivery volume and click-through rate</CardDescription>
              </CardHeader>
              <CardContent className="pb-5">
                {loadingDelivery || loadingCtr ? (
                  <Skeleton className="h-[220px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={combined} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sentG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ctrG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={CHART_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="sent" name="Sent" stroke="#6366f1" fill="url(#sentG)" strokeWidth={2} dot={false} />
                      <Area type="monotone" dataKey="ctr" name="CTR %" stroke="#f59e0b" fill="url(#ctrG)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Distribution</CardTitle>
                <CardDescription>Delivery and open rate by platform</CardDescription>
              </CardHeader>
              <CardContent className="pb-5">
                {loadingPlatform ? (
                  <Skeleton className="h-[220px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={platforms} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                      <XAxis dataKey="platform" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip contentStyle={CHART_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="deliveryRate" name="Delivery %" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="openRate" name="Open %" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Comparison</CardTitle>
              <CardDescription>Delivery rate, open rate, and CTR side by side</CardDescription>
            </CardHeader>
            <CardContent className="pb-5">
              {loadingComparison ? (
                <Skeleton className="h-[280px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={comparison.map((c) => ({ ...c, name: c.campaignName.length > 20 ? c.campaignName.slice(0, 20) + "…" : c.campaignName }))}
                    margin={{ top: 5, right: 10, left: -20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip contentStyle={CHART_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="deliveryRate" name="Delivery %" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="openRate" name="Open %" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="ctr" name="CTR %" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platform">
          <div className="grid gap-3 md:grid-cols-2">
            {loadingPlatform
              ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-[200px]" />)
              : platforms.map((p) => (
                  <Card key={p.platform}>
                    <CardHeader>
                      <CardTitle>{p.platform}</CardTitle>
                      <CardDescription>{p.sent.toLocaleString()} total sent</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3 text-center text-xs">
                        {[
                          { label: "Delivered", value: p.delivered.toLocaleString(), rate: `${p.deliveryRate}%` },
                          { label: "Opened", value: p.opened.toLocaleString(), rate: `${p.openRate}%` },
                          { label: "Failed", value: p.failed.toLocaleString(), rate: `${(100 - p.deliveryRate).toFixed(1)}%` },
                        ].map((m) => (
                          <div key={m.label} className="rounded-lg bg-muted/50 px-2 py-2">
                            <p className="font-bold text-foreground">{m.value}</p>
                            <p className="text-muted-foreground">{m.label}</p>
                            <p className="font-medium text-foreground">{m.rate}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
