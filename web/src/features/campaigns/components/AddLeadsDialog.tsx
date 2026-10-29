import { Search, UserPlus } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { LeadStatusBadge, useLeads, type Lead } from "@/features/leads"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useEnrollLeads } from "../hooks/useEnrollments"
import type { Campaign, EnrollResult } from "../types"
import { EnrollSummary } from "./EnrollSummary"
import styles from "./CampaignDialogs.module.css"

const PAGE_SIZE = 10

/** Leads already in a conversation are left out of sequences, so they can't be picked. */
const inConversation = (lead: Lead) =>
  lead.status === "Replied" || lead.status === "Meeting" || lead.status === "Passed"

export function AddLeadsDialog({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <UserPlus aria-hidden /> Add leads
      </DialogTrigger>
      <DialogContent className={styles.wide}>
        {/* Rendered only while open, so each opening starts with a fresh search and selection. */}
        <LeadPicker campaign={campaign} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

function LeadPicker({ campaign, onDone }: { campaign: Campaign; onDone: () => void }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [result, setResult] = useState<EnrollResult | null>(null)
  const debouncedSearch = useDebouncedValue(search.trim())
  const enroll = useEnrollLeads()
  const leads = useLeads({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    sortBy: "Name",
    sortDirection: "Asc",
  })

  if (result) {
    return <EnrollSummary result={result} campaignStatus={campaign.status} onDone={onDone} />
  }

  const pickable = (leads.data?.items ?? []).filter((lead) => !inConversation(lead))
  const allOnPage = pickable.length > 0 && pickable.every((lead) => selected.has(lead.id))
  const someOnPage = pickable.some((lead) => selected.has(lead.id))
  const lastPage = leads.data ? Math.max(1, Math.ceil(leads.data.total / PAGE_SIZE)) : 1

  function toggle(ids: string[], on: boolean) {
    setSelected((current) => {
      const next = new Set(current)
      for (const id of ids) {
        if (on) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  async function onAdd() {
    try {
      setResult(await enroll.mutateAsync({ campaignId: campaign.id, leadIds: [...selected] }))
    } catch {
      // The reason is shown above the buttons from enroll.error.
    }
  }

  return (
    <div className={styles.form}>
      <DialogHeader>
        <DialogTitle>Add leads to {campaign.name}</DialogTitle>
        <DialogDescription>
          Each lead starts at step 1. Leads already talking with you are left out.
        </DialogDescription>
      </DialogHeader>

      <div className={styles.search}>
        <Search className={styles.searchIcon} aria-hidden />
        <Input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Search name, email or firm"
          aria-label="Search leads"
          className={styles.searchInput}
        />
      </div>

      {leads.isPending ? (
        <p className={styles.empty}>Loading leads…</p>
      ) : leads.isError ? (
        <p role="alert" className={styles.error}>
          {leads.error.message}
        </p>
      ) : leads.data.items.length === 0 ? (
        <p className={styles.empty}>
          {debouncedSearch ? "No leads match this search." : "You have no leads yet."}
        </p>
      ) : (
        <ul className={styles.list} aria-label="Leads">
          <li>
            <label className={`${styles.option} ${styles.selectAll}`}>
              <Checkbox
                checked={allOnPage}
                indeterminate={someOnPage && !allOnPage}
                disabled={pickable.length === 0}
                onCheckedChange={(checked) =>
                  toggle(
                    pickable.map((lead) => lead.id),
                    checked,
                  )
                }
              />
              Select everyone on this page
            </label>
          </li>
          {leads.data.items.map((lead) => (
            <li key={lead.id} className={styles.row}>
              <label
                className={styles.option}
                title={inConversation(lead) ? "Already talking with you" : undefined}
              >
                <Checkbox
                  checked={selected.has(lead.id)}
                  disabled={inConversation(lead)}
                  onCheckedChange={(checked) => toggle([lead.id], checked)}
                />
                <span className={styles.leadText}>
                  <span className={styles.leadName}>{lead.fullName}</span>
                  <span className={styles.muted}>
                    {[lead.firm, lead.email].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className={styles.badge}>
                  <LeadStatusBadge status={lead.status} />
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.listFooter}>
        <span>{selected.size} selected</span>
        <div className={styles.pageButtons}>
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= lastPage}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {enroll.isError && (
        <p role="alert" className={styles.error}>
          {enroll.error.message}
        </p>
      )}

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button disabled={selected.size === 0 || enroll.isPending} onClick={onAdd}>
          {enroll.isPending
            ? "Adding…"
            : `Add ${selected.size || ""} lead${selected.size === 1 ? "" : "s"}`}
        </Button>
      </DialogFooter>
    </div>
  )
}
