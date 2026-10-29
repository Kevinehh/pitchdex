import { useId, useState, type ReactNode } from "react"
import { Link } from "react-router"
import type { SortState } from "@/lib/sorting"
import { useLeads } from "../hooks/useLeads"
import type { Lead, LeadSort, LeadsQuery } from "../types"
import styles from "./LeadGroup.module.css"
import { LeadsTable } from "./LeadsTable"

/** Each card starts small; the founder can show more per page. */
const GROUP_PAGE_SIZE = 10

type LeadGroupProps = {
  title: string
  /** Beside the title, such as the campaign's status. */
  badge?: ReactNode
  /** A link in the card's header, such as to the campaign. */
  link?: { label: string; to: string }
  /** Which leads this card holds: one campaign's, or those in none. */
  group: Pick<LeadsQuery, "campaignId" | "noCampaign">
  /** Search, status and sort, the same for every card. */
  filters: Pick<LeadsQuery, "search" | "status">
  sort: SortState<LeadSort>
  onSort: (column: LeadSort) => void
  onContact: (lead: Lead) => void
  onToggleStar: (lead: Lead) => void
  selected: ReadonlySet<string>
  onSelect: (leadIds: string[], selected: boolean) => void
  /** While searching or filtering, a card with no matches is left out. */
  hideWhenEmpty: boolean
  emptyMessage: string
}

/**
 * One card of the Leads page: a heading with its count, then a table of the group's leads
 * with its own pages. The page key resets it to page 1 when the filters change.
 */
export function LeadGroup({
  title,
  badge,
  link,
  group,
  filters,
  sort,
  onSort,
  onContact,
  onToggleStar,
  selected,
  onSelect,
  hideWhenEmpty,
  emptyMessage,
}: LeadGroupProps) {
  const id = useId()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(GROUP_PAGE_SIZE)
  const leads = useLeads({
    page,
    pageSize,
    ...filters,
    ...group,
    sortBy: sort.by,
    sortDirection: sort.direction,
  })
  const total = leads.data?.total

  if (hideWhenEmpty && total === 0) {
    return null
  }

  return (
    <section className={styles.group} aria-labelledby={id}>
      <header className={styles.header}>
        <h2 id={id} className={styles.title}>
          {title}
        </h2>
        {badge}
        {total !== undefined && (
          <span className={styles.count}>
            {total} {total === 1 ? "lead" : "leads"}
          </span>
        )}
        {link && (
          <Link to={link.to} className={styles.link}>
            {link.label}
          </Link>
        )}
      </header>
      <LeadsTable
        result={leads}
        sort={sort}
        onSort={onSort}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
        onContact={onContact}
        onToggleStar={onToggleStar}
        selected={selected}
        onSelect={onSelect}
        isFiltered={hideWhenEmpty}
        emptyMessage={emptyMessage}
      />
    </section>
  )
}
