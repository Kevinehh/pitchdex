import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"

/** Saves an investor as a lead. Saving one that's already a lead is safe and changes nothing. */
export function useSaveInvestor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (investorId: string) =>
      unwrap(api.POST("/api/leads/from-investor", { body: { investorId } })),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.investors }),
        queryClient.invalidateQueries({ queryKey: queryKeys.leads }),
      ]),
  })
}
