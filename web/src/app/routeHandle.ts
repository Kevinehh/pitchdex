import type { UIMatch } from "react-router"

/** Extra settings a route can set in the router's `handle` field. */
export type RouteHandle = {
  /** Use the full page width instead of the usual reading width, for wide tables and the Inbox. */
  wide?: boolean
}

export function isWideRoute(matches: UIMatch[]) {
  return matches.some((match) => (match.handle as RouteHandle | undefined)?.wide === true)
}
