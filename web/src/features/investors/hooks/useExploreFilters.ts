import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"
import { nextSort } from "@/lib/sorting"
import {
  clearedFilters,
  countActiveFilters,
  DEFAULT_SORT,
  readFilters,
  writeFilters,
} from "../filters"
import type { ExploreFilters, InvestorSort } from "../types"

/**
 * Explore's filters and sort live in the address bar, so a refresh, the back button
 * or a shared link keeps them.
 */
export function useExploreFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => readFilters(params), [params])

  /** Changing any filter or the sort goes back to page 1, unless the change is the page itself. */
  const update = useCallback(
    (changes: Partial<ExploreFilters>) => {
      setParams((current) => writeFilters({ ...readFilters(current), page: 1, ...changes }), {
        replace: true,
      })
    },
    [setParams],
  )

  /** Clicking a column header: sorts by it, or flips the direction if it's already sorted. */
  const sortBy = useCallback(
    (column: InvestorSort) => {
      setParams(
        (current) => {
          const filters = readFilters(current)
          return writeFilters({
            ...filters,
            page: 1,
            sort: nextSort(filters.sort, column, DEFAULT_SORT),
          })
        },
        { replace: true },
      )
    },
    [setParams],
  )

  /** Switches every filter off but keeps the sort. */
  const clear = useCallback(
    () =>
      setParams((current) => writeFilters(clearedFilters(readFilters(current))), {
        replace: true,
      }),
    [setParams],
  )

  return { filters, update, sortBy, clear, activeCount: countActiveFilters(filters) }
}
