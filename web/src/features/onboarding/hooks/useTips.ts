import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession, type Session } from "@/features/auth"
import { api, succeed } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"

/** The banners and tour the founder has closed; undefined until the session has loaded. */
export function useSeenTips(): ReadonlySet<string> | undefined {
  const seen = useSession().data?.user.seenTips
  return seen && new Set(seen)
}

/** Writes the founder's seen tips into the cached session, so banners react at once. */
function setSeenTips(
  queryClient: ReturnType<typeof useQueryClient>,
  update: (seen: string[]) => string[],
) {
  queryClient.setQueryData<Session>(
    queryKeys.session,
    (session) =>
      session && { ...session, user: { ...session.user, seenTips: update(session.user.seenTips) } },
  )
}

/** Closes a banner (or the tour) for good. It hides straight away; the save follows. */
export function useMarkTipSeen() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tip: string) =>
      succeed(api.PUT("/api/auth/tips/{tip}", { params: { path: { tip } } })),
    onMutate: (tip) =>
      setSeenTips(queryClient, (seen) => (seen.includes(tip) ? seen : [...seen, tip])),
    // If the save fails, the banner comes back now, not by surprise on the next visit.
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.session }),
  })
}

/** Brings back the tour and every page banner. */
export function useResetTips() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => succeed(api.DELETE("/api/auth/tips")),
    onSuccess: () => setSeenTips(queryClient, () => []),
  })
}
