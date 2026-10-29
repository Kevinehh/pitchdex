import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, succeed, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"
import type { CampaignStatus, EnrollmentsQuery } from "../types"
import { refreshWhileActive } from "./useCampaigns"

export function useEnrollments(
  campaignId: string,
  query: EnrollmentsQuery,
  campaignStatus: CampaignStatus | undefined,
) {
  return useQuery({
    queryKey: [...queryKeys.campaigns, campaignId, "enrollments", query],
    queryFn: ({ signal }) =>
      unwrap(
        api.GET("/api/campaigns/{id}/enrollments", {
          params: { path: { id: campaignId }, query },
          signal,
        }),
      ),
    placeholderData: keepPreviousData,
    refetchInterval: refreshWhileActive(campaignStatus),
  })
}

/**
 * Adding or stopping leads changes the campaign's counts and lists, and the campaigns
 * shown on the Leads page and in the Inbox, so all of those refresh.
 */
function useRefreshAfterEnrollment() {
  const queryClient = useQueryClient()
  return (campaignId: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [...queryKeys.campaigns, campaignId] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns, exact: true }),
      queryClient.invalidateQueries({ queryKey: queryKeys.leads }),
      queryClient.invalidateQueries({ queryKey: queryKeys.messages }),
    ])
}

export type EnrollLeadsInput = { campaignId: string; leadIds: string[] }

export function useEnrollLeads() {
  const refresh = useRefreshAfterEnrollment()
  return useMutation({
    mutationFn: ({ campaignId, leadIds }: EnrollLeadsInput) =>
      unwrap(
        api.POST("/api/campaigns/{id}/enrollments", {
          params: { path: { id: campaignId } },
          body: { campaignId, leadIds },
        }),
      ),
    onSuccess: (_, { campaignId }) => refresh(campaignId),
  })
}

export function useStopEnrollment(campaignId: string) {
  const refresh = useRefreshAfterEnrollment()
  return useMutation({
    mutationFn: (enrollmentId: string) =>
      succeed(
        api.POST("/api/campaigns/{id}/enrollments/{enrollmentId}/stop", {
          params: { path: { id: campaignId, enrollmentId } },
        }),
      ),
    onSuccess: () => refresh(campaignId),
  })
}
