import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"
import type { CalendlySettings } from "../types"

export function useCalendlySettings() {
  return useQuery({
    queryKey: queryKeys.calendly,
    queryFn: ({ signal }) => unwrap(api.GET("/api/settings/calendly", { signal })),
  })
}

/**
 * Stores the new settings, then refreshes what depends on them: the Inbox's booking-link
 * button, and after a connect or a check, the meetings and lead statuses it found.
 */
function useStoreCalendly() {
  const queryClient = useQueryClient()
  return (settings: CalendlySettings) => {
    queryClient.setQueryData(queryKeys.calendly, settings)
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.messages }),
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings }),
      queryClient.invalidateQueries({ queryKey: queryKeys.leads }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ])
  }
}

function useSaveCalendly<TInput>(save: (input: TInput) => Promise<CalendlySettings>) {
  const store = useStoreCalendly()
  return useMutation({ mutationFn: save, onSuccess: store })
}

/** Checks Calendly now, and says what it found. */
export function useCheckCalendly() {
  const store = useStoreCalendly()
  return useMutation({
    mutationFn: () => unwrap(api.POST("/api/settings/calendly/check")),
    onSuccess: (check) => store(check.settings),
  })
}

export function useUpdateCalendlyLink() {
  return useSaveCalendly((link: string | null) =>
    unwrap(api.PUT("/api/settings/calendly/link", { body: { link } })),
  )
}

export function useConnectCalendly() {
  return useSaveCalendly((accessToken: string) =>
    unwrap(api.POST("/api/settings/calendly/connection", { body: { accessToken } })),
  )
}

export function useDisconnectCalendly() {
  return useSaveCalendly(() => unwrap(api.DELETE("/api/settings/calendly/connection")))
}
