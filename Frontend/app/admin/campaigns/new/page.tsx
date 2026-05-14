import { PageHeader } from "@/components/shared/page-header"
import { CampaignBuilder } from "@/features/campaigns/components/campaign-builder"

export default function NewCampaignPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Campaign Builder"
        description="Create a new notification campaign with live preview and audience targeting"
        breadcrumbs={[{ label: "Admin" }, { label: "Campaigns", href: "/admin/campaigns" }, { label: "New Campaign" }]}
      />
      <CampaignBuilder />
    </div>
  )
}
