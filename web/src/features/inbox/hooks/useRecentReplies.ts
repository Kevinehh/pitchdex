import { useQuery } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"

/** Enough recent replies that a few chatty leads still leave room for others. */
const FETCHED = 25

/**
 * The latest reply from each of the most recent leads to write, newest first, by email
 * or LinkedIn. Under "messages", so a sync or a reply refreshes it along with the Inbox.
 */
export function useRecentReplies(limit: number) {
  return useQuery({
    queryKey: [...queryKeys.messages, "recent-replies"],
    queryFn: ({ signal }) =>
      unwrap(
        api.GET("/api/messages", {
          params: { query: { page: 1, pageSize: FETCHED, direction: "Inbound" } },
          signal,
        }),
      ),
    // One row per lead: a lead who wrote twice shows only their newest reply.
    select: (page) =>
      page.items
        .filter(
          (reply, index, all) => all.findIndex((other) => other.leadId === reply.leadId) === index,
        )
        .slice(0, limit),
    refetchInterval: 60_000,
  })
}
