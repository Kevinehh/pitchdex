import { Megaphone, Users, X } from "lucide-react"
import { useState } from "react"
import { EmptyState } from "@/components/common/EmptyState"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AddToCampaignDialog,
  CampaignStatusBadge,
  useCampaigns,
  useEnrollLeads,
} from "@/features/campaigns"
import { useUpdateLead } from "@/features/leads"
import { ALL_CAMPAIGNS, NO_CAMPAIGN, type CampaignFilter } from "@/features/leads/campaignFilter"
import { AddLeadDialog } from "@/features/leads/components/AddLeadDialog"
import { LeadFilters } from "@/features/leads/components/LeadFilters"
import { LeadGroup } from "@/features/leads/components/LeadGroup"
import { useLeads } from "@/features/leads/hooks/useLeads"
import type { Lead, LeadSort, LeadStatus } from "@/features/leads/types"
import { ContactLeadDialog } from "@/features/messaging"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { nextSort, type SortState } from "@/lib/sorting"
import styles from "./LeadsPage.module.css"

/** Newest changes first, until a column header is clicked. */
const DEFAULT_SORT: SortState<LeadSort> = { by: "Updated", direction: "Desc" }

/** Dates start newest first; text columns start A–Z. */
const firstDirection = (column: LeadSort) => (column === "Updated" ? "Desc" : "Asc")

/**
 * The Leads page: one card for leads not in any campaign, then one per campaign. A lead in
 * two campaigns shows in both. Search, status and sort apply to every card; the campaign
 * filter picks which cards show. Ticked leads can be added to a campaign together.
 */
export default function LeadsPage() {
  const [status, setStatus] = useState<LeadStatus>()
  const [campaign, setCampaign] = useState<CampaignFilter>(ALL_CAMPAIGNS)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState(DEFAULT_SORT)
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [addingToCampaign, setAddingToCampaign] = useState(false)
  const [contactLead, setContactLead] = useState<Lead | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const debouncedSearch = useDebouncedValue(search.trim())

  const campaigns = useCampaigns()
  const campaignOptions = (campaigns.data ?? []).map(({ id, name }) => ({ id, name }))
  const enroll = useEnrollLeads()
  const updateLead = useUpdateLead()

  const filters = { status, search: debouncedSearch || undefined }
  const isFiltered = Boolean(status || debouncedSearch)
  // One row is enough to know whether there are any leads at all, for the empty state.
  const anyLeads = useLeads({ page: 1, pageSize: 1, ...filters })

  /** A new filter clears the selection, so no hidden leads stay ticked. */
  function refilter<T>(set: (value: T) => void) {
    return (value: T) => {
      set(value)
      setSelected(new Set())
    }
  }

  function select(leadIds: string[], on: boolean) {
    setSelected((current) => {
      const next = new Set(current)
      for (const id of leadIds) {
        if (on) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  /** A lead added with a campaign chosen goes straight into it. */
  async function onLeadCreated(lead: Lead, campaignId: string | undefined) {
    setNotice(null)
    const name = campaignOptions.find((option) => option.id === campaignId)?.name
    if (!campaignId || !name) {
      return
    }
    try {
      const result = await enroll.mutateAsync({ campaignId, leadIds: [lead.id] })
      setNotice(
        result.enrolled === 0
          ? `${lead.fullName} was saved but not added to ${name}.`
          : result.missingLinkedIn > 0
            ? `${lead.fullName} was added to ${name}. Without a LinkedIn link, its LinkedIn steps will fail.`
            : `${lead.fullName} was added to ${name}.`,
      )
    } catch (error) {
      setNotice(
        `${lead.fullName} was saved but not added to ${name}: ${error instanceof Error ? error.message : "something went wrong"}.`,
      )
    }
  }

  // Everything each card shares. The key starts every card on page 1 when the filters change.
  const shared = {
    filters,
    sort,
    onSort: (column: LeadSort) =>
      setSort((current) => nextSort(current, column, DEFAULT_SORT, firstDirection)),
    onContact: setContactLead,
    onToggleStar: (lead: Lead) => updateLead.mutate({ id: lead.id, isStarred: !lead.isStarred }),
    selected,
    onSelect: select,
    hideWhenEmpty: isFiltered,
  }
  const filterKey = JSON.stringify([filters, sort])

  const shownCampaigns = (campaigns.data ?? []).filter(
    (item) => campaign === ALL_CAMPAIGNS || campaign === item.id,
  )
  const showUnassigned = campaign === ALL_CAMPAIGNS || campaign === NO_CAMPAIGN

  return (
    <>
      <PageHeader
        title="Leads"
        description="Investors you plan to contact or are already talking to, by campaign."
        actions={<AddLeadDialog campaigns={campaignOptions} onCreated={onLeadCreated} />}
      />
      <LeadFilters
        search={search}
        onSearchChange={refilter(setSearch)}
        status={status}
        onStatusChange={refilter(setStatus)}
        campaign={campaign}
        onCampaignChange={refilter(setCampaign)}
        campaigns={campaignOptions}
      />

      {notice && (
        <p role="status" className={styles.notice}>
          {notice}
        </p>
      )}
      {updateLead.isError && (
        <p role="alert" className={styles.error}>
          {updateLead.error.message}
        </p>
      )}

      {selected.size > 0 && (
        <div className={styles.selection} role="region" aria-label="Selected leads">
          <span className={styles.count}>
            {selected.size} {selected.size === 1 ? "lead" : "leads"} selected
          </span>
          <Button size="sm" onClick={() => setAddingToCampaign(true)}>
            <Megaphone aria-hidden /> Add to campaign
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            <X aria-hidden /> Clear
          </Button>
        </div>
      )}

      {anyLeads.isPending || campaigns.isPending ? (
        <Skeleton className={styles.loading} />
      ) : anyLeads.data?.total === 0 ? (
        <EmptyState
          icon={Users}
          title={isFiltered ? "No leads match these filters" : "No leads yet"}
          description={
            isFiltered
              ? "Try a different search or status."
              : "Add an investor with the Add lead button, or save one from Explore."
          }
        />
      ) : (
        <div className={styles.groups}>
          {showUnassigned && (
            <LeadGroup
              key={`none-${filterKey}`}
              title="Not in a campaign"
              group={{ noCampaign: true }}
              emptyMessage="Every lead is in a campaign."
              {...shared}
            />
          )}
          {shownCampaigns.map((item) => (
            <LeadGroup
              key={`${item.id}-${filterKey}`}
              title={item.name}
              badge={<CampaignStatusBadge status={item.status} />}
              link={{ label: "Open campaign", to: `/campaigns/${item.id}` }}
              group={{ campaignId: item.id }}
              emptyMessage="No leads in this campaign yet. Tick leads above and add them."
              {...shared}
            />
          ))}
        </div>
      )}

      <ContactLeadDialog lead={contactLead} onClose={() => setContactLead(null)} />
      <AddToCampaignDialog
        leadIds={[...selected]}
        open={addingToCampaign}
        onOpenChange={setAddingToCampaign}
        onAdded={() => setSelected(new Set())}
      />
    </>
  )
}
