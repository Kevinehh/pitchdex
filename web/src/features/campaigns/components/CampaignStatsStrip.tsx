import { percent } from "../stats"
import type { Campaign } from "../types"
import styles from "./CampaignStatsStrip.module.css"

/** How the campaign is doing, at the top of its page. */
export function CampaignStatsStrip({ campaign }: { campaign: Campaign }) {
  const { counts, stats } = campaign
  const { email, linkedIn } = stats

  const tiles = [
    {
      label: "Contacted",
      value: String(stats.leadsContacted),
      detail: `of ${counts.total} leads`,
    },
    {
      label: "Replied",
      value: percent(stats.leadsReplied, stats.leadsContacted),
      detail: `${stats.leadsReplied} leads`,
    },
    {
      label: "Emails sent",
      value: String(email.sent),
      detail: `${percent(email.leadsReplied, email.leadsReached)} replied`,
    },
    {
      label: "LinkedIn sent",
      value: String(linkedIn.sent),
      detail: `${linkedIn.invitationsAccepted} of ${linkedIn.invitations} invites accepted · ${percent(linkedIn.leadsReplied, linkedIn.leadsReached)} replied`,
    },
    {
      label: "Failed",
      value: String(counts.failed),
      detail: counts.failed > 0 ? "see the Leads tab" : "none",
    },
  ]

  return (
    <dl className={styles.strip}>
      {tiles.map((tile) => (
        <div key={tile.label} className={styles.tile}>
          <dt className={styles.label}>{tile.label}</dt>
          <dd className={styles.value}>{tile.value}</dd>
          <dd className={styles.detail}>{tile.detail}</dd>
        </div>
      ))}
    </dl>
  )
}
