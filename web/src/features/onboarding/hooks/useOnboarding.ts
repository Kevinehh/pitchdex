import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Session } from "@/features/auth"
import { api, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"
import type { OnboardingAnswers } from "../survey"

/** Saves the survey, or skips it when sent no answers. Either way it won't come back. */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: OnboardingAnswers) => unwrap(api.PUT("/api/settings/onboarding", { body })),
    onSuccess: (workspace) =>
      queryClient.setQueryData<Session>(
        queryKeys.session,
        (session) => session && { ...session, workspace },
      ),
  })
}

/** How many investors match the survey's filters. Only the total is read, so one row is asked for. */
export function useMatchCount(filters: {
  stages: string[]
  industries: string[]
  geographies: string[]
}) {
  const query = { ...filters, pageSize: 1 }
  return useQuery({
    queryKey: [...queryKeys.investors, query],
    queryFn: ({ signal }) => unwrap(api.GET("/api/investors", { params: { query }, signal })),
    select: (page) => page.total,
  })
}
