import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"
import type { LeadsQuery } from "../types"

/** The only place that knows how leads are fetched. */
export function useLeads(query: LeadsQuery) {
  return useQuery({
    queryKey: [...queryKeys.leads, query],
    queryFn: ({ signal }) => unwrap(api.GET("/api/leads", { params: { query }, signal })),
    // Keep the current page on screen while the next one loads.
    placeholderData: keepPreviousData,
  })
}
