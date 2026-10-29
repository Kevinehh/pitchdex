import { Check, Copy, ExternalLink, Plus } from "lucide-react"
import { useId, useState } from "react"
import { Link } from "react-router"
import { Avatar } from "@/components/common/Avatar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddToCampaignDialog, EnrollmentStatusBadge } from "@/features/campaigns"
import { LEAD_STATUSES, useUpdateLead, type LeadStatus } from "@/features/leads"
import type { Conversation } from "../types"
import styles from "./LeadPanel.module.css"

const statusItems = Object.fromEntries(LEAD_STATUSES.map((status) => [status, status]))

/** Only http(s) links are shown, so stored data can never become a script link. */
function safeUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const url = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    return new URL(url).protocol.startsWith("http") ? url : undefined
  } catch {
    return undefined
  }
}

/** Who the lead is, where they are in the pipeline, and the campaigns they're in. */
export function LeadPanel({ conversation }: { conversation: Conversation }) {
  const id = useId()
  const { lead, campaigns } = conversation
  const updateLead = useUpdateLead()
  const [adding, setAdding] = useState(false)
  const linkedIn = safeUrl(lead.linkedInUrl)
  const website = safeUrl(lead.website)

  return (
    <aside className={styles.panel} aria-label={`About ${lead.fullName}`}>
      <div className={styles.identity}>
        <Avatar name={lead.fullName} size="lg" />
        <div className={styles.who}>
          <h3 className={styles.name}>{lead.fullName}</h3>
          {lead.title && <p className={styles.muted}>{lead.title}</p>}
          {lead.firm && <p>{lead.firm}</p>}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={`${id}-status`} className={styles.label}>
          Status
        </label>
        <Select
          modal={false}
          items={statusItems}
          value={lead.status}
          onValueChange={(value) =>
            value && updateLead.mutate({ id: lead.id, status: value as LeadStatus })
          }
        >
          <SelectTrigger id={`${id}-status`} className={styles.select}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start">
            {LEAD_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(lead.status === "Replied" || lead.status === "Contacted") && (
          <p className={styles.hint}>Booked a call? Set Meeting to stop any campaign steps.</p>
        )}
      </div>

      <dl className={styles.details}>
        <div>
          <dt className={styles.label}>Email</dt>
          <dd className={styles.value}>
            <a href={`mailto:${lead.email}`} className={styles.link}>
              {lead.email}
            </a>
            <CopyButton text={lead.email} />
          </dd>
        </div>
        {linkedIn && (
          <div>
            <dt className={styles.label}>LinkedIn</dt>
            <dd className={styles.value}>
              <a href={linkedIn} target="_blank" rel="noreferrer" className={styles.link}>
                View profile <ExternalLink aria-hidden />
              </a>
            </dd>
          </div>
        )}
        {lead.location && (
          <div>
            <dt className={styles.label}>Location</dt>
            <dd className={styles.value}>{lead.location}</dd>
          </div>
        )}
        {website && (
          <div>
            <dt className={styles.label}>Website</dt>
            <dd className={styles.value}>
              <a href={website} target="_blank" rel="noreferrer" className={styles.link}>
                {lead.website} <ExternalLink aria-hidden />
              </a>
            </dd>
          </div>
        )}
      </dl>

      <section className={styles.campaigns} aria-labelledby={`${id}-campaigns`}>
        <h4 id={`${id}-campaigns`} className={styles.label}>
          Campaigns
        </h4>
        {campaigns.length === 0 ? (
          <p className={styles.muted}>Not in a campaign.</p>
        ) : (
          <ul className={styles.campaignList}>
            {campaigns.map((campaign) => (
              <li key={campaign.campaignId} className={styles.campaign}>
                <Link to={`/campaigns/${campaign.campaignId}`} className={styles.link}>
                  {campaign.name}
                </Link>
                <EnrollmentStatusBadge status={campaign.status} />
              </li>
            ))}
          </ul>
        )}
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus aria-hidden /> Add to campaign
        </Button>
        <AddToCampaignDialog leadIds={[lead.id]} open={adding} onOpenChange={setAdding} />
      </section>
    </aside>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={copied ? "Copied" : "Copy"}
      title={copied ? "Copied" : "Copy"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          // Clipboard access can be blocked; the address is still there to select.
        }
      }}
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  )
}
