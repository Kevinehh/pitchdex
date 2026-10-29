import { QueryClient } from "@tanstack/react-query"

/**
 * The app's one cache of server data. Shared with route loaders, which check the session
 * before a protected page renders.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
})
