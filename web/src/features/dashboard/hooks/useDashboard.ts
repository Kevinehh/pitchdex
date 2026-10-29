import { useQuery } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"

/**
 * Everything the dashboard shows, in one request. Campaigns send and replies arrive on
 * their own, so it rechecks every minute while open.
 */
export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => unwrap(api.GET("/api/dashboard", { signal })),
    refetchInterval: 60_000,
  })
}
