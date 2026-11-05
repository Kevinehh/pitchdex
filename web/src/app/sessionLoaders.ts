import { redirect, type LoaderFunctionArgs } from "react-router"
import { sessionQuery } from "@/features/auth"
import { ApiError } from "@/lib/api/client"
import { queryClient } from "@/lib/queryClient"

/**
 * Runs before any signed-in page: no session, no page. The founder goes to sign in and
 * comes back here afterwards. The session is cached, so this only asks the API once.
 */
export async function requireSession({ request }: LoaderFunctionArgs) {
  try {
    return await queryClient.ensureQueryData(sessionQuery)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const url = new URL(request.url)
      throw redirect(`/sign-in?next=${encodeURIComponent(url.pathname + url.search)}`)
    }
    throw error
  }
}

/** The app itself waits until the founder has answered or skipped the welcome survey. */
export async function requireOnboarded(args: LoaderFunctionArgs) {
  const session = await requireSession(args)
  if (!session.workspace.onboardedAt) {
    throw redirect("/welcome")
  }
  return session
}

/** The welcome survey is asked once; afterwards its address goes to the dashboard. */
export async function requireNotOnboarded(args: LoaderFunctionArgs) {
  const session = await requireSession(args)
  if (session.workspace.onboardedAt) {
    throw redirect("/dashboard")
  }
  return session
}

/** Sign-in and sign-up skip straight to the app for someone already signed in. */
export async function redirectIfSignedIn() {
  try {
    await queryClient.ensureQueryData(sessionQuery)
  } catch {
    return null
  }
  return redirect("/dashboard")
}
