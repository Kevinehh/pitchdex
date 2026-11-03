import { useQuery } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"

/** Calls leads booked that haven't ended yet, soonest first. */
export function useUpcomingMeetings() {
  return useQuery({
    queryKey: [...queryKeys.meetings, "upcoming"],
    queryFn: ({ signal }) => unwrap(api.GET("/api/meetings/upcoming", { signal })),
  })
}
