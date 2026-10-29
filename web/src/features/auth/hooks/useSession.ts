import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, succeed, unwrap } from "@/lib/api/client"
import { queryKeys } from "@/lib/api/queryKeys"
import type {
  ChangePasswordInput,
  ResetPasswordInput,
  Session,
  SignInInput,
  SignUpInput,
  UpdateProfileInput,
} from "../types"

/** Who is signed in. Fails with a 401 when nobody is, which the route loaders act on. */
export const sessionQuery = queryOptions({
  queryKey: queryKeys.session,
  queryFn: ({ signal }) => unwrap(api.GET("/api/auth/session", { signal })),
  staleTime: 5 * 60_000,
  retry: false,
})

/** The signed-in founder. Protected pages only render once the loader has fetched it. */
export function useSession() {
  return useQuery(sessionQuery)
}

/**
 * After signing in or up, nothing cached from a previous session may show, so the cache
 * starts over with just the new session in it.
 */
function useStartSession() {
  const queryClient = useQueryClient()
  return (session: Session) => {
    queryClient.clear()
    queryClient.setQueryData(queryKeys.session, session)
  }
}

export function useSignIn() {
  const start = useStartSession()
  return useMutation({
    mutationFn: (body: SignInInput) => unwrap(api.POST("/api/auth/sign-in", { body })),
    onSuccess: start,
  })
}

export function useSignUp() {
  const start = useStartSession()
  return useMutation({
    mutationFn: (body: SignUpInput) => unwrap(api.POST("/api/auth/sign-up", { body })),
    onSuccess: start,
  })
}

/** Ends the session and forgets everything cached for it. */
export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => succeed(api.POST("/api/auth/sign-out")),
    onSuccess: () => queryClient.clear(),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateProfileInput) => unwrap(api.PUT("/api/auth/profile", { body })),
    onSuccess: (session) => queryClient.setQueryData(queryKeys.session, session),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordInput) =>
      succeed(api.POST("/api/auth/change-password", { body })),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      succeed(api.POST("/api/auth/forgot-password", { body: { email } })),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (body: ResetPasswordInput) =>
      succeed(api.POST("/api/auth/reset-password", { body })),
  })
}
