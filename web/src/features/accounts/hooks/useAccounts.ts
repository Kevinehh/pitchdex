import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"
import type { components } from "@/lib/api/schema"
import type { Account, AccountChannel } from "../types"

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: ({ signal }) => unwrap(api.GET("/api/accounts", { signal })),
  })
}

/**
 * Starts connecting an account: gets the provider's sign-in link and sends the browser
 * there. The provider brings the founder back to the Account page afterwards.
 */
export function useConnectAccount() {
  return useMutation({
    mutationFn: (channel: AccountChannel) =>
      unwrap(api.POST("/api/accounts/connect", { body: { channel } })),
    onSuccess: (link) => window.location.assign(link.url),
  })
}

export function useReconnectAccount() {
  return useMutation({
    mutationFn: (accountId: string) =>
      unwrap(api.POST("/api/accounts/{id}/reconnect", { params: { path: { id: accountId } } })),
    onSuccess: (link) => window.location.assign(link.url),
  })
}

/** Refreshes the account list from the provider, for example right after signing in. */
export function useSyncAccounts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => unwrap(api.POST("/api/accounts/sync")),
    onSuccess: (accounts) => queryClient.setQueryData(queryKeys.accounts, accounts),
  })
}

type UpdateLimitsInput = { accountId: string } & components["schemas"]["UpdateAccountLimitsCommand"]

/**
 * Saves an account's daily limits. Sending and the dashboard both read them, so both refresh.
 * Saves for one account run one after another, so quick changes land in the order made.
 */
export function useUpdateAccountLimits(accountId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    scope: { id: `account-limits-${accountId}` },
    mutationFn: ({ accountId, ...body }: UpdateLimitsInput) =>
      unwrap(api.PUT("/api/accounts/{id}/limits", { params: { path: { id: accountId } }, body })),
    onSuccess: (account) => {
      queryClient.setQueryData<Account[]>(queryKeys.accounts, (accounts) =>
        accounts?.map((existing) => (existing.id === account.id ? account : existing)),
      )
      return queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}
