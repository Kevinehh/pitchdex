import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"

/**
 * Every call starting from `from` up to `to`, canceled ones included. The last range stays on
 * screen while the next loads, so paging through months doesn't flash empty.
 */
export function useMeetings(from: Date, to: Date) {
  const range = { from: from.toISOString(), to: to.toISOString() }
  return useQuery({
    queryKey: [...queryKeys.meetings, "range", range],
    queryFn: ({ signal }) => unwrap(api.GET("/api/meetings", { params: { query: range }, signal })),
    placeholderData: keepPreviousData,
  })
}
