import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"
import type { InvestorsQuery } from "../types"

/** One page of investors matching the filters. */
export function useInvestors(query: InvestorsQuery) {
  return useQuery({
    queryKey: [...queryKeys.investors, query],
    queryFn: ({ signal }) => unwrap(api.GET("/api/investors", { params: { query }, signal })),
    // Keep the current results on screen while the next filter or page loads.
    placeholderData: keepPreviousData,
  })
}
