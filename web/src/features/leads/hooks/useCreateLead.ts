import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"
import type { CreateLeadInput } from "../types"

export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateLeadInput) => unwrap(api.POST("/api/leads", { body })),
    // Refresh only the lead lists, not everything.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.leads }),
  })
}
