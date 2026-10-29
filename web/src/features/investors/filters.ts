import { DEFAULT_PAGE_SIZE, toPageSize } from "@/lib/paging"
import type { SortState } from "@/lib/sorting"
import {
  INVESTOR_SORTS,
  LIST_FILTERS,
  type CheckSizeRange,
  type ExploreFilters,
  type InvestorSort,
  type InvestorsQuery,
} from "./types"

export const DEFAULT_SORT: SortState<InvestorSort> = { by: "Name", direction: "Asc" }

/** How a cheque range is written in the address bar: "100000-500000", or "50000000-" for "and up". */
export const checkSizeKey = (range: CheckSizeRange) => `${range.min}-${range.max ?? ""}`

function parseCheckSizeKey(key: string | null): { min?: number; max?: number } {
  if (!key) return {}
  const [min, max] = key.split("-").map((part) => (part ? Number(part) : undefined))
  return {
    min: Number.isFinite(min) ? min : undefined,
    max: Number.isFinite(max) ? max : undefined,
  }
}

/** Reads ?sort=Firm&dir=Desc, ignoring anything that isn't a real option. */
function readSort(params: URLSearchParams): SortState<InvestorSort> {
  const by = INVESTOR_SORTS.find((sort) => sort === params.get("sort")) ?? DEFAULT_SORT.by
  const direction = params.get("dir") === "Desc" ? "Desc" : "Asc"
  return { by, direction }
}

export function readFilters(params: URLSearchParams): ExploreFilters {
  return {
    page: Math.max(1, Number(params.get("page")) || 1),
    pageSize: toPageSize(params.get("pageSize") ?? DEFAULT_PAGE_SIZE),
    search: params.get("search") ?? "",
    stages: params.getAll("stages"),
    industries: params.getAll("industries"),
    geographies: params.getAll("geographies"),
    fundTypes: params.getAll("fundTypes"),
    roles: params.getAll("roles"),
    checkSize: params.get("checkSize"),
    sort: readSort(params),
  }
}

export function writeFilters(filters: ExploreFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  for (const key of LIST_FILTERS) {
    for (const value of filters[key]) params.append(key, value)
  }
  if (filters.checkSize) params.set("checkSize", filters.checkSize)
  // The default sort stays out of the address, so plain links stay short.
  if (filters.sort.by !== DEFAULT_SORT.by || filters.sort.direction !== DEFAULT_SORT.direction) {
    params.set("sort", filters.sort.by)
    params.set("dir", filters.sort.direction)
  }
  if (filters.pageSize !== DEFAULT_PAGE_SIZE) params.set("pageSize", String(filters.pageSize))
  if (filters.page > 1) params.set("page", String(filters.page))
  return params
}

/** How many filters are switched on, for the Clear button and empty-state wording. Sort isn't a filter. */
export function countActiveFilters(filters: ExploreFilters) {
  const listCount = LIST_FILTERS.reduce((count, key) => count + filters[key].length, 0)
  return listCount + (filters.search ? 1 : 0) + (filters.checkSize ? 1 : 0)
}

/** Every filter switched off, keeping the current sort. */
export function clearedFilters(filters: ExploreFilters): ExploreFilters {
  return {
    page: 1,
    pageSize: filters.pageSize,
    search: "",
    stages: [],
    industries: [],
    geographies: [],
    fundTypes: [],
    roles: [],
    checkSize: null,
    sort: filters.sort,
  }
}

/** Turns the address-bar filters into the API's query, leaving out anything empty. */
export function toInvestorsQuery(filters: ExploreFilters): InvestorsQuery {
  const list = (values: string[]) => (values.length > 0 ? values : undefined)
  const checkSize = parseCheckSizeKey(filters.checkSize)

  return {
    page: filters.page,
    pageSize: filters.pageSize,
    search: filters.search || undefined,
    stages: list(filters.stages),
    industries: list(filters.industries),
    geographies: list(filters.geographies),
    fundTypes: list(filters.fundTypes),
    roles: list(filters.roles),
    checkSizeMin: checkSize.min,
    checkSizeMax: checkSize.max,
    sortBy: filters.sort.by,
    sortDirection: filters.sort.direction,
  }
}
