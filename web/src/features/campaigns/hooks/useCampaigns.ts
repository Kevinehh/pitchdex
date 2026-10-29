import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, succeed, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"
import type { Campaign, CampaignAction, CampaignStatus, UpdateCampaignInput } from "../types"

/** A running campaign changes on its own as steps send, so it's refreshed while open. */
export const refreshWhileActive = (status: CampaignStatus | undefined) =>
  status === "Active" ? 30_000 : false

export function useCampaigns() {
  return useQuery({
    queryKey: queryKeys.campaigns,
    queryFn: ({ signal }) => unwrap(api.GET("/api/campaigns", { signal })),
  })
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: [...queryKeys.campaigns, id],
    queryFn: ({ signal }) =>
      unwrap(api.GET("/api/campaigns/{id}", { params: { path: { id } }, signal })),
    refetchInterval: (query) => refreshWhileActive(query.state.data?.status),
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    // Sending hours start from the workspace's working hours, set in Settings.
    mutationFn: (name: string) => unwrap(api.POST("/api/campaigns", { body: { name } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.campaigns }),
  })
}

/** Puts the saved campaign straight into the cache, and refreshes the list behind it. */
function useStoreCampaign() {
  const queryClient = useQueryClient()
  return (campaign: Campaign) => {
    queryClient.setQueryData([...queryKeys.campaigns, campaign.id], campaign)
    return queryClient.invalidateQueries({ queryKey: queryKeys.campaigns, exact: true })
  }
}

export function useUpdateCampaign(id: string) {
  const store = useStoreCampaign()
  return useMutation({
    mutationFn: (body: UpdateCampaignInput) =>
      unwrap(api.PUT("/api/campaigns/{id}", { params: { path: { id } }, body })),
    onSuccess: store,
  })
}

export function useChangeCampaignStatus(id: string) {
  const store = useStoreCampaign()
  return useMutation({
    mutationFn: (action: CampaignAction) => {
      const options = { params: { path: { id } } }
      switch (action) {
        case "launch":
          return unwrap(api.POST("/api/campaigns/{id}/launch", options))
        case "pause":
          return unwrap(api.POST("/api/campaigns/{id}/pause", options))
        case "resume":
          return unwrap(api.POST("/api/campaigns/{id}/resume", options))
      }
    },
    onSuccess: store,
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      succeed(api.DELETE("/api/campaigns/{id}", { params: { path: { id } } })),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: [...queryKeys.campaigns, id] })
      return queryClient.invalidateQueries({ queryKey: queryKeys.campaigns, exact: true })
    },
  })
}
