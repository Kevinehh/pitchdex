import type { components, paths } from "@/lib/api/schema"
import type { SortState } from "@/lib/sorting"

export type Investor = components["schemas"]["InvestorDto"]
export type InvestorFilterOptions = components["schemas"]["InvestorFiltersDto"]
export type CheckSizeRange = components["schemas"]["CheckSizeRange"]
export type InvestorSort = components["schemas"]["InvestorSort"]
export type InvestorsQuery = NonNullable<paths["/api/investors"]["get"]["parameters"]["query"]>

/** The filters that can hold several values at once. Names match the API's query. */
export const LIST_FILTERS = ["stages", "industries", "geographies", "fundTypes", "roles"] as const
export type ListFilter = (typeof LIST_FILTERS)[number]

export const INVESTOR_SORTS = [
  "Name",
  "Firm",
  "CheckSize",
] as const satisfies readonly InvestorSort[]

/** Explore's filters and sort as they live in the address bar. */
export type ExploreFilters = Record<ListFilter, string[]> & {
  page: number
  pageSize: number
  search: string
  /** A cheque range written as "min-max", or "min-" for "and up". */
  checkSize: string | null
  sort: SortState<InvestorSort>
}
