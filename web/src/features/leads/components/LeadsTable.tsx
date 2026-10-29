import type { UseQueryResult } from "@tanstack/react-query"
import { Send, Star, Users } from "lucide-react"
import { Link } from "react-router"
import { EmptyState } from "@/components/common/EmptyState"
import { Pagination } from "@/components/common/Pagination"
import { SortableHeader } from "@/components/common/SortableHeader"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { components } from "@/lib/api/schema"
import type { SortState } from "@/lib/sorting"
import { cn } from "@/lib/utils"
import type { Lead, LeadCampaign, LeadSort } from "../types"
import { LeadStatusBadge } from "./LeadStatusBadge"
import styles from "./LeadsTable.module.css"

type PagedLeads = components["schemas"]["PagedOfLeadDto"]

type LeadsTableProps = {
  result: UseQueryResult<PagedLeads>
  sort: SortState<LeadSort>
  onSort: (column: LeadSort) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  /** Opens the Contact dialog for a lead. */
  onContact: (lead: Lead) => void
  onToggleStar: (lead: Lead) => void
  /** Ticked leads, kept across pages until the selection is cleared. */
  selected: ReadonlySet<string>
  onSelect: (leadIds: string[], selected: boolean) => void
  isFiltered: boolean
  /** A short line instead of the full empty state, for a table inside a card. */
  emptyMessage?: string
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" })

/** Campaign names shown in a row before the rest collapse into "+2". */
const SHOWN_CAMPAIGNS = 2

export function LeadsTable({
  result,
  sort,
  onSort,
  onPageChange,
  onPageSizeChange,
  onContact,
  onToggleStar,
  selected,
  onSelect,
  isFiltered,
  emptyMessage,
}: LeadsTableProps) {
  if (result.isPending) {
    return <LoadingRows />
  }

  if (result.isError) {
    return (
      <EmptyState
        title="Leads couldn't load"
        description={result.error.message}
        action={
          <Button variant="outline" onClick={() => result.refetch()}>
            Try again
          </Button>
        }
      />
    )
  }

  const { items, total, page, pageSize } = result.data

  if (items.length === 0 && emptyMessage) {
    return <p className={styles.emptyInline}>{emptyMessage}</p>
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={isFiltered ? "No leads match these filters" : "No leads yet"}
        description={
          isFiltered
            ? "Try a different search, campaign or status."
            : "Add an investor with the Add lead button, or save one from Explore."
        }
      />
    )
  }

  const pageIds = items.map((lead) => lead.id)
  const allOnPage = pageIds.every((id) => selected.has(id))
  const someOnPage = pageIds.some((id) => selected.has(id))

  return (
    <div className={styles.panel}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={styles.check}>
              <Checkbox
                checked={allOnPage}
                indeterminate={someOnPage && !allOnPage}
                onCheckedChange={(checked) => onSelect(pageIds, checked)}
                aria-label="Select every lead on this page"
              />
            </TableHead>
            <SortableHeader column="Name" label="Name" sort={sort} onSort={onSort} />
            <SortableHeader column="Firm" label="Firm" sort={sort} onSort={onSort} />
            <SortableHeader column="Email" label="Email" sort={sort} onSort={onSort} />
            <SortableHeader column="Status" label="Status" sort={sort} onSort={onSort} />
            <TableHead>Campaigns</TableHead>
            <SortableHeader
              column="Updated"
              label="Updated"
              sort={sort}
              onSort={onSort}
              className={styles.date}
            />
            <TableHead className={styles.action}>
              <span className={styles.muted}>Contact</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={result.isPlaceholderData ? styles.loadingNext : undefined}>
          {items.map((lead) => (
            <TableRow key={lead.id} data-state={selected.has(lead.id) ? "selected" : undefined}>
              <TableCell className={styles.check}>
                <Checkbox
                  checked={selected.has(lead.id)}
                  onCheckedChange={(checked) => onSelect([lead.id], checked)}
                  aria-label={`Select ${lead.fullName}`}
                />
              </TableCell>
              <TableCell>
                <div className={styles.nameCell}>
                  <span className={styles.name}>{lead.fullName}</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className={cn(styles.star, lead.isStarred && styles.starred)}
                    aria-pressed={lead.isStarred}
                    aria-label={
                      lead.isStarred ? `Unstar ${lead.fullName}` : `Star ${lead.fullName}`
                    }
                    onClick={() => onToggleStar(lead)}
                  >
                    <Star />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                {lead.firm ? (
                  <span className={styles.truncate} title={lead.firm}>
                    {lead.firm}
                  </span>
                ) : (
                  <span className={styles.muted}>—</span>
                )}
              </TableCell>
              <TableCell className={styles.muted}>
                <span className={styles.truncate} title={lead.email}>
                  {lead.email}
                </span>
              </TableCell>
              <TableCell>
                <LeadStatusBadge status={lead.status} />
              </TableCell>
              <TableCell>
                <CampaignLinks campaigns={lead.campaigns} />
              </TableCell>
              <TableCell className={styles.date}>
                {dateFormat.format(new Date(lead.updatedAt))}
              </TableCell>
              <TableCell className={styles.action}>
                <Button variant="outline" size="sm" onClick={() => onContact(lead)}>
                  <Send aria-hidden /> Contact
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        itemCount={items.length}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}

function CampaignLinks({ campaigns }: { campaigns: LeadCampaign[] }) {
  if (campaigns.length === 0) {
    return <span className={styles.muted}>—</span>
  }

  const hidden = campaigns.slice(SHOWN_CAMPAIGNS)
  return (
    <div className={styles.campaigns}>
      {campaigns.slice(0, SHOWN_CAMPAIGNS).map((campaign) => (
        <Link
          key={campaign.campaignId}
          to={`/campaigns/${campaign.campaignId}`}
          className={styles.campaign}
          title={`${campaign.name}: ${campaign.status}`}
        >
          {campaign.name}
        </Link>
      ))}
      {hidden.length > 0 && (
        <span className={styles.muted} title={hidden.map((campaign) => campaign.name).join(", ")}>
          +{hidden.length}
        </span>
      )}
    </div>
  )
}

function LoadingRows() {
  return (
    <div className={styles.skeletons} aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className={styles.skeletonRow} />
      ))}
    </div>
  )
}
