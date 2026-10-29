import { PageHeader } from "@/components/common/PageHeader"
import { CampaignsTable, NewCampaignDialog } from "@/features/campaigns"

export default function CampaignsPage() {
  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Email and LinkedIn sequences that go out to your leads on a schedule."
        actions={<NewCampaignDialog />}
      />
      <CampaignsTable />
    </>
  )
}
