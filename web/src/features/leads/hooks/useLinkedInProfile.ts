import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"

/**
 * A lead's whole LinkedIn profile, looked up live. Each lookup is a profile view LinkedIn
 * limits, so it's kept for the session rather than refetched.
 */
export function useLinkedInProfile(leadId: string) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: [...queryKeys.linkedInProfiles, leadId],
    queryFn: async ({ signal }) => {
      const profile = await unwrap(
        api.GET("/api/leads/{id}/linkedin", { params: { path: { id: leadId } }, signal }),
      )
      // The lookup also saved a fresh picture and headline, which the lists show.
      void queryClient.invalidateQueries({ queryKey: queryKeys.leads })
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages })
      return profile
    },
    staleTime: Infinity,
    retry: false,
  })
}
