import { KpiGrid } from "@/features/dashboard/components/kpi-grid"
import { DeliveryChart } from "@/features/dashboard/components/delivery-chart"
import { PlatformFunnelCards } from "@/features/dashboard/components/platform-funnel"
import { RecentCampaigns } from "@/features/dashboard/components/recent-campaigns"
import { AnalyticsSummary } from "@/features/dashboard/components/analytics-summary"
import { PageHeader } from "@/components/shared/page-header"

export default function AdminPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description="Notification platform overview for the last 30 days"
        breadcrumbs={[{ label: "Admin" }, { label: "Dashboard" }]}
      />
      <KpiGrid />
      <DeliveryChart />
      <PlatformFunnelCards />
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <RecentCampaigns />
        <AnalyticsSummary />
      </div>
    </div>
  )
}
