import createClient from "openapi-fetch"
import type { components, paths } from "./schema"

/**
 * The only way the app talks to the backend. Paths, parameters and responses are
 * all typed from the API's OpenAPI document. Regenerate with `npm run api:types`
 * after changing an endpoint.
 */
export const api = createClient<paths>()

/**
 * A session can end while the app is open: signed out in another tab, or expired. Any 401
 * from a data endpoint sends the founder to sign in, then back to where they were. The auth
 * endpoints answer 401 as part of their normal work, so they're left to the page.
 */
api.use({
  onResponse({ request, response }) {
    if (response.status === 401 && !new URL(request.url).pathname.startsWith("/api/auth/")) {
      const here = window.location.pathname + window.location.search
      window.location.assign(`/sign-in?next=${encodeURIComponent(here)}`)
    }
    return response
  },
})

type ValidationProblem = components["schemas"]["ValidationProblemDetails"]

/** Thrown for any failed response, so TanStack Query and forms treat it as an error. */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string[]>

  constructor(status: number, problem: unknown) {
    const details = (problem ?? {}) as ValidationProblem
    // The detail says what to do ("Add a LinkedIn link first"); the title is generic.
    super(details.detail ?? details.title ?? `Request failed with status ${status}`)
    this.name = "ApiError"
    this.status = status
    this.fieldErrors = details.errors ?? {}
  }
}

type FetchResult<T> = { data?: T; error?: unknown; response: Response }

/** Returns the response body, or throws an ApiError. */
export async function unwrap<T>(request: Promise<FetchResult<T>>): Promise<T> {
  const { data, error, response } = await request
  if (!response.ok || error !== undefined || data === undefined) {
    throw new ApiError(response.status, error)
  }
  return data
}

/** For requests that answer with no body (204 No Content): throws an ApiError on failure. */
export async function succeed(request: Promise<FetchResult<unknown>>): Promise<void> {
  const { error, response } = await request
  if (!response.ok) {
    throw new ApiError(response.status, error)
  }
}
