import { Link, useParams } from "react-router"
import { AppLoading } from "@/app/AppLoading"
import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"
import { CampaignEditor, useCampaign } from "@/features/campaigns"
import { ApiError } from "@/lib/api/client"

export default function CampaignPage() {
  const { id = "" } = useParams()
  const campaign = useCampaign(id)

  if (campaign.isPending) {
    return <AppLoading />
  }

  if (campaign.isError) {
    const missing = campaign.error instanceof ApiError && campaign.error.status === 404
    return (
      <EmptyState
        title={missing ? "This campaign doesn't exist" : "The campaign couldn't load"}
        description={missing ? "It may have been deleted." : campaign.error.message}
        action={
          <Button variant="outline" nativeButton={false} render={<Link to="/campaigns" />}>
            Back to campaigns
          </Button>
        }
      />
    )
  }

  // Keyed by id, so moving to another campaign starts a fresh form.
  return <CampaignEditor key={campaign.data.id} campaign={campaign.data} />
}
