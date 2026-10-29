import { useId, useState } from "react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCampaigns } from "../hooks/useCampaigns"
import { useEnrollLeads } from "../hooks/useEnrollments"
import type { CampaignStatus, EnrollResult } from "../types"
import styles from "./CampaignDialogs.module.css"
import { EnrollSummary } from "./EnrollSummary"

const statusLabels: Record<CampaignStatus, string> = {
  Draft: "draft",
  Active: "running",
  Paused: "paused",
}

type AddToCampaignDialogProps = {
  leadIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called once the leads are added, for example to clear a selection. */
  onAdded?: () => void
}

/** Adds chosen leads to a campaign, from anywhere leads are listed. */
export function AddToCampaignDialog({
  leadIds,
  open,
  onOpenChange,
  onAdded,
}: AddToCampaignDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Rendered only while open, so each opening starts fresh. */}
        <CampaignChooser leadIds={leadIds} onAdded={onAdded} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

type CampaignChooserProps = {
  leadIds: string[]
  onAdded?: () => void
  onDone: () => void
}

function CampaignChooser({ leadIds, onAdded, onDone }: CampaignChooserProps) {
  const id = useId()
  const campaigns = useCampaigns()
  const enroll = useEnrollLeads()
  const [campaignId, setCampaignId] = useState("")
  const [result, setResult] = useState<EnrollResult | null>(null)
  const chosen = campaigns.data?.find((campaign) => campaign.id === campaignId)

  if (result && chosen) {
    return <EnrollSummary result={result} campaignStatus={chosen.status} onDone={onDone} />
  }

  const items = Object.fromEntries(
    (campaigns.data ?? []).map((campaign) => [
      campaign.id,
      `${campaign.name} (${statusLabels[campaign.status]})`,
    ]),
  )

  async function onAdd() {
    try {
      setResult(await enroll.mutateAsync({ campaignId, leadIds }))
      onAdded?.()
    } catch {
      // The reason is shown above the buttons from enroll.error.
    }
  }

  const count = leadIds.length === 1 ? "1 lead" : `${leadIds.length} leads`

  return (
    <div className={styles.form}>
      <DialogHeader>
        <DialogTitle>Add {count} to a campaign</DialogTitle>
        <DialogDescription>
          Each lead starts at step 1. Leads already talking with you are left out.
        </DialogDescription>
      </DialogHeader>

      {campaigns.isSuccess && campaigns.data.length === 0 ? (
        <p className={styles.empty}>
          No campaigns yet. <Link to="/campaigns">Create one</Link> first.
        </p>
      ) : (
        <Field>
          <FieldLabel htmlFor={`${id}-campaign`}>Campaign</FieldLabel>
          <Select
            modal={false}
            items={items}
            value={campaignId || null}
            onValueChange={(value) => value && setCampaignId(value)}
          >
            <SelectTrigger id={`${id}-campaign`} className={styles.fullWidth}>
              <SelectValue placeholder={campaigns.isPending ? "Loading…" : "Choose a campaign"} />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start">
              {(campaigns.data ?? []).map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {items[campaign.id]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      {enroll.isError && (
        <p role="alert" className={styles.error}>
          {enroll.error.message}
        </p>
      )}

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button disabled={!campaignId || enroll.isPending} onClick={onAdd}>
          {enroll.isPending ? "Adding…" : `Add ${count}`}
        </Button>
      </DialogFooter>
    </div>
  )
}
