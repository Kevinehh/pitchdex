import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"
import type { WorkingHours } from "../types"

export function useWorkingHours() {
  return useQuery({
    queryKey: queryKeys.workingHours,
    queryFn: ({ signal }) => unwrap(api.GET("/api/settings/working-hours", { signal })),
  })
}

export function useUpdateWorkingHours() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: WorkingHours) => unwrap(api.PUT("/api/settings/working-hours", { body })),
    onSuccess: (saved) => queryClient.setQueryData(queryKeys.workingHours, saved),
  })
}
