import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"
import type { components } from "@/lib/api/schema"

type SendEmailCommand = components["schemas"]["SendEmailCommand"]
type SendLinkedInCommand = components["schemas"]["SendLinkedInCommand"]

/** Sending changes the Inbox and usually the lead's status, so both lists refresh. */
function useRefreshAfterSend() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.messages }),
      queryClient.invalidateQueries({ queryKey: queryKeys.leads }),
    ])
}

export function useSendEmail() {
  const refresh = useRefreshAfterSend()
  return useMutation({
    mutationFn: (body: SendEmailCommand) => unwrap(api.POST("/api/messages/email", { body })),
    onSuccess: refresh,
  })
}

export function useSendLinkedIn() {
  const refresh = useRefreshAfterSend()
  return useMutation({
    mutationFn: (body: SendLinkedInCommand) => unwrap(api.POST("/api/messages/linkedin", { body })),
    onSuccess: refresh,
  })
}
