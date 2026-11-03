import { Landing } from "@/features/landing"

/**
 * The public front page, for people who aren't signed in. Someone signed in skips straight
 * to their dashboard (see the route's loader).
 */
export default function LandingPage() {
  return <Landing />
}
