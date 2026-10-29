import { Link } from "react-router"
import { Switch } from "@/components/ui/switch"
import { useChangeCampaignStatus } from "../hooks/useCampaigns"
import type { CampaignStatus } from "../types"
import styles from "./CampaignStatusToggle.module.css"

type CampaignStatusToggleProps = {
  campaignId: string
  status: CampaignStatus
}

/**
 * Pauses or resumes a campaign from a list. A draft is launched from its own page,
 * where its steps and senders can be checked first.
 */
export function CampaignStatusToggle({ campaignId, status }: CampaignStatusToggleProps) {
  const change = useChangeCampaignStatus(campaignId)

  if (status === "Draft") {
    return (
      <Link to={`/campaigns/${campaignId}`} className={styles.draft}>
        Draft · finish setup
      </Link>
    )
  }

  const running = status === "Active"
  return (
    <div className={styles.toggle}>
      <label className={styles.label}>
        <Switch
          checked={running}
          disabled={change.isPending}
          onCheckedChange={(checked) => change.mutate(checked ? "resume" : "pause")}
        />
        {running ? "Running" : "Paused"}
      </label>
      {change.isError && (
        <p role="alert" className={styles.error} title={change.error.message}>
          {change.error.message}
        </p>
      )}
    </div>
  )
}
