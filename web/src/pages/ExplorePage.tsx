import { PageHeader } from "@/components/common/PageHeader"
import { toInvestorsQuery } from "@/features/investors/filters"
import { InvestorFilters } from "@/features/investors/components/InvestorFilters"
import { InvestorsTable } from "@/features/investors/components/InvestorsTable"
import { useExploreFilters } from "@/features/investors/hooks/useExploreFilters"
import { useInvestorFilterOptions } from "@/features/investors/hooks/useInvestorFilterOptions"
import { useInvestors } from "@/features/investors/hooks/useInvestors"

/** Search the investor database and save matches as leads. */
export default function ExplorePage() {
  const { filters, update, sortBy, clear, activeCount } = useExploreFilters()
  const options = useInvestorFilterOptions()
  const investors = useInvestors(toInvestorsQuery(filters))

  return (
    <>
      <PageHeader
        title="Explore"
        description="Find investors that fit your round, then save them to your leads."
      />
      <InvestorFilters
        filters={filters}
        options={options.data}
        activeCount={activeCount}
        onChange={update}
        onClear={clear}
      />
      <InvestorsTable
        result={investors}
        sort={filters.sort}
        onSort={sortBy}
        onPageChange={(page) => update({ page })}
        onPageSizeChange={(pageSize) => update({ pageSize })}
        isFiltered={activeCount > 0}
        onClearFilters={clear}
      />
    </>
  )
}
