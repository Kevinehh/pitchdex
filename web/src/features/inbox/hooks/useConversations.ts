import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { api, succeed, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"
import type { components } from "@/lib/api/schema"
import type { ConversationView, ReplyInput } from "../types"

/** Under "messages", so anything that sends a message refreshes the Inbox too. */
const conversationsKey = [...queryKeys.messages, "conversations"] as const

const PAGE_SIZE = 30

/** New replies are synced every couple of minutes, so the Inbox rechecks every minute. */
const REFRESH = 60_000

/** The conversation list, a page at a time as the founder scrolls. */
export function useConversations(view: ConversationView, search: string | undefined) {
  return useInfiniteQuery({
    queryKey: [...conversationsKey, "list", { view, search }],
    queryFn: ({ pageParam, signal }) =>
      unwrap(
        api.GET("/api/conversations", {
          params: { query: { page: pageParam, pageSize: PAGE_SIZE, view, search } },
          signal,
        }),
      ),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH,
  })
}

/** Counts for the Inbox tabs and the sidebar badge. */
export function useConversationCounts() {
  return useQuery({
    queryKey: [...conversationsKey, "counts"],
    queryFn: ({ signal }) => unwrap(api.GET("/api/conversations/counts", { signal })),
    refetchInterval: REFRESH,
  })
}

export function useConversation(leadId: string) {
  return useQuery({
    queryKey: [...conversationsKey, leadId],
    queryFn: ({ signal }) =>
      unwrap(api.GET("/api/conversations/{leadId}", { params: { path: { leadId } }, signal })),
    refetchInterval: REFRESH,
  })
}

type UpdateConversationInput = components["schemas"]["UpdateConversationCommand"]

export function useUpdateConversation(leadId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateConversationInput) =>
      succeed(api.PATCH("/api/conversations/{leadId}", { params: { path: { leadId } }, body })),
    // Reading or archiving changes the unread counts: the sidebar badge, the Inbox tabs and
    // the dashboard all refetch theirs.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: conversationsKey }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]),
  })
}

/** Replying also moves the lead along, so lead lists refresh with the Inbox. */
export function useReply(leadId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ReplyInput) =>
      unwrap(api.POST("/api/conversations/{leadId}/reply", { params: { path: { leadId } }, body })),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.messages }),
        queryClient.invalidateQueries({ queryKey: queryKeys.leads }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]),
  })
}

/** Pulls new replies from every account now, instead of waiting for the background sync. */
export function useSyncInbox() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => unwrap(api.POST("/api/messages/sync")),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.messages }),
        queryClient.invalidateQueries({ queryKey: queryKeys.leads }),
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]),
  })
}
