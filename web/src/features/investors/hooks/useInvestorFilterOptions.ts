import { useQuery } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"

/** The values each Explore filter offers. They rarely change, so they're kept for 5 minutes. */
export function useInvestorFilterOptions() {
  return useQuery({
    queryKey: queryKeys.investorFilters,
    queryFn: ({ signal }) => unwrap(api.GET("/api/investors/filters", { signal })),
    staleTime: 5 * 60_000,
  })
}
