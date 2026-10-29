import { Megaphone } from "lucide-react"
import { Link } from "react-router"
import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCampaigns } from "../hooks/useCampaigns"
import { percent } from "../stats"
import type { CampaignSummary } from "../types"
import { CampaignProgress } from "./CampaignProgress"
import { CampaignStatusToggle } from "./CampaignStatusToggle"
import styles from "./CampaignsTable.module.css"

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" })

type CampaignsTableProps = {
  /** Shows only the most recently changed campaigns, for the dashboard. */
  limit?: number
}

/** Every campaign with how it's doing: leads, LinkedIn and email results, and an on/off switch. */
export function CampaignsTable({ limit }: CampaignsTableProps) {
  const campaigns = useCampaigns()

  if (campaigns.isPending) {
    return (
      <div className={styles.skeletons} aria-busy="true">
        {Array.from({ length: Math.min(limit ?? 4, 4) }, (_, index) => (
          <Skeleton key={index} className={styles.skeletonRow} />
        ))}
      </div>
    )
  }

  if (campaigns.isError) {
    return (
      <EmptyState
        title="Campaigns couldn't load"
        description={campaigns.error.message}
        action={
          <Button variant="outline" onClick={() => campaigns.refetch()}>
            Try again
          </Button>
        }
      />
    )
  }

  if (campaigns.data.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="No campaigns yet"
        description="Create one with the New campaign button, write its steps, then add leads."
      />
    )
  }

  const rows = limit ? campaigns.data.slice(0, limit) : campaigns.data

  return (
    <div className={styles.panel}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign</TableHead>
            <TableHead>Leads</TableHead>
            <TableHead>LinkedIn</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className={styles.statusHead}>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((campaign) => (
            <CampaignRow key={campaign.id} campaign={campaign} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function CampaignRow({ campaign }: { campaign: CampaignSummary }) {
  const { counts, stats } = campaign
  const { email, linkedIn } = stats

  return (
    <TableRow>
      <TableCell className={styles.overview}>
        <Link to={`/campaigns/${campaign.id}`} className={styles.name} title={campaign.name}>
          {campaign.name}
        </Link>
        <CampaignProgress counts={counts} />
      </TableCell>
      <TableCell>
        <Metrics
          rows={[
            { label: "All leads", value: counts.total },
            {
              label: "Contacted",
              value: stats.leadsContacted,
              hint: "Leads at least one step has gone out to",
            },
          ]}
        />
      </TableCell>
      <TableCell>
        <Metrics
          rows={[
            {
              label: "Sent",
              value: linkedIn.sent,
              detail: linkedIn.invitations ? `${linkedIn.invitations} invites` : undefined,
            },
            {
              label: "Accepted",
              value: percent(linkedIn.invitationsAccepted, linkedIn.invitations),
              detail: String(linkedIn.invitationsAccepted),
              hint: "Of the connection requests this campaign sent",
            },
            {
              label: "Replied",
              value: percent(linkedIn.leadsReplied, linkedIn.leadsReached),
              detail: String(linkedIn.leadsReplied),
              hint: "Of the leads this campaign reached on LinkedIn",
            },
          ]}
        />
      </TableCell>
      <TableCell>
        <Metrics
          rows={[
            { label: "Sent", value: email.sent },
            {
              label: "Replied",
              value: percent(email.leadsReplied, email.leadsReached),
              detail: String(email.leadsReplied),
              hint: "Of the leads this campaign emailed",
            },
          ]}
        />
      </TableCell>
      <TableCell className={styles.statusCell}>
        <CampaignStatusToggle campaignId={campaign.id} status={campaign.status} />
        <span className={styles.date}>{dateFormat.format(new Date(campaign.updatedAt))}</span>
      </TableCell>
    </TableRow>
  )
}

type MetricRow = {
  label: string
  value: number | string
  /** A smaller number beside the value, like the count behind a percentage. */
  detail?: string
  /** What the number means, shown on hover. */
  hint?: string
}

/** Two label-and-number lines, stacked, like "All leads 221 / Contacted 220". */
function Metrics({ rows }: { rows: MetricRow[] }) {
  return (
    <dl className={styles.metrics}>
      {rows.map((row) => (
        <div key={row.label} className={styles.metric} title={row.hint}>
          <dt className={styles.metricLabel}>{row.label}</dt>
          <dd className={styles.metricValue}>
            {row.value}
            {row.detail && <span className={styles.metricDetail}>{row.detail}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
