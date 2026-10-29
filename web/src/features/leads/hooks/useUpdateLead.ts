import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"
import type { UpdateLeadInput } from "../types"

/** Changes a lead's status or star. The Inbox shows both, so it refreshes too. */
export function useUpdateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateLeadInput & { id: string }) =>
      unwrap(api.PATCH("/api/leads/{id}", { params: { path: { id } }, body })),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.leads }),
        queryClient.invalidateQueries({ queryKey: queryKeys.messages }),
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns }),
      ]),
  })
}
