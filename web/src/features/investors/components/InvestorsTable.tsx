import type { UseQueryResult } from "@tanstack/react-query"
import { ExternalLink, Search } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"
import { Pagination } from "@/components/common/Pagination"
import { SortableHeader } from "@/components/common/SortableHeader"
import { Badge } from "@/components/ui/badge"
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
import type { components } from "@/lib/api/schema"
import { formatCheckSize } from "@/lib/formatCheckSize"
import type { SortState } from "@/lib/sorting"
import { cn } from "@/lib/utils"
import type { Investor, InvestorSort } from "../types"
import styles from "./InvestorsTable.module.css"
import { AddToLeadsButton } from "./AddToLeadsButton"

type PagedInvestors = components["schemas"]["PagedOfInvestorDto"]

type InvestorsTableProps = {
  result: UseQueryResult<PagedInvestors>
  sort: SortState<InvestorSort>
  onSort: (column: InvestorSort) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  isFiltered: boolean
  onClearFilters: () => void
}

/** How many industries to show before collapsing the rest into "+3". */
const VISIBLE_INDUSTRIES = 2

export function InvestorsTable({
  result,
  sort,
  onSort,
  onPageChange,
  onPageSizeChange,
  isFiltered,
  onClearFilters,
}: InvestorsTableProps) {
  if (result.isPending) {
    return <LoadingRows />
  }

  if (result.isError) {
    return (
      <EmptyState
        title="Investors couldn't load"
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

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title={isFiltered ? "No investors match these filters" : "The investor database is empty"}
        description={
          isFiltered
            ? "Try fewer filters or a different search."
            : "Investors appear here once they're imported."
        }
        action={
          isFiltered && (
            <Button variant="outline" onClick={onClearFilters}>
              Clear filters
            </Button>
          )
        }
      />
    )
  }

  return (
    <div className={styles.panel}>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader column="Name" label="Investor" sort={sort} onSort={onSort} />
            <SortableHeader column="Firm" label="Firm" sort={sort} onSort={onSort} />
            <TableHead>Stages</TableHead>
            <TableHead>Industries</TableHead>
            <SortableHeader column="CheckSize" label="Cheque" sort={sort} onSort={onSort} />
            <TableHead>Geography</TableHead>
            <TableHead className={styles.action}>
              <span className={styles.muted}>Leads</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={result.isPlaceholderData ? styles.loadingNext : undefined}>
          {items.map((investor) => (
            <InvestorRow key={investor.id} investor={investor} />
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

function InvestorRow({ investor }: { investor: Investor }) {
  const hiddenIndustries = investor.industries.slice(VISIBLE_INDUSTRIES)
  // How they invest, under the firm name: "Traditional VC · Lead".
  const investingStyle = [investor.fundType, investor.investmentRole].filter(Boolean).join(" · ")

  return (
    <TableRow>
      <TableCell className={cn(styles.cell, styles.person)}>
        <div className={styles.name}>
          {investor.fullName}
          {investor.linkedInUrl && (
            <a
              href={investor.linkedInUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.linkedin}
              aria-label={`${investor.fullName} on LinkedIn`}
            >
              <ExternalLink className={styles.linkedinIcon} aria-hidden />
            </a>
          )}
        </div>
        {investor.title && (
          <div className={styles.sub} title={investor.title}>
            {investor.title}
          </div>
        )}
      </TableCell>

      <TableCell className={cn(styles.cell, styles.firm)}>
        <div>{investor.firmName ?? <span className={styles.muted}>—</span>}</div>
        {investingStyle && (
          <div className={styles.sub} title={investingStyle}>
            {investingStyle}
          </div>
        )}
      </TableCell>

      <TableCell className={styles.cell}>
        <div className={styles.tags}>
          {investor.stages.map((stage) => (
            <Badge key={stage} variant="outline">
              {stage}
            </Badge>
          ))}
        </div>
      </TableCell>

      <TableCell className={styles.cell}>
        <div className={styles.tags}>
          {investor.industries.slice(0, VISIBLE_INDUSTRIES).map((industry) => (
            <Badge key={industry} variant="secondary">
              {industry}
            </Badge>
          ))}
          {hiddenIndustries.length > 0 && (
            <span className={styles.more} title={hiddenIndustries.join(", ")}>
              +{hiddenIndustries.length}
            </span>
          )}
        </div>
      </TableCell>

      <TableCell className={cn(styles.cell, styles.nowrap)}>
        {formatCheckSize(investor.checkSizeMin, investor.checkSizeMax)}
      </TableCell>

      <TableCell className={cn(styles.cell, styles.muted)}>
        {investor.geographies.join(", ") || "—"}
      </TableCell>

      <TableCell className={cn(styles.cell, styles.action)}>
        <AddToLeadsButton investor={investor} />
      </TableCell>
    </TableRow>
  )
}

function LoadingRows() {
  return (
    <div className={styles.skeletons} aria-busy="true">
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className={styles.skeletonRow} />
      ))}
    </div>
  )
}
