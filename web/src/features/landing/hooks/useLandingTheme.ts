import { useCallback } from "react"
import { useTheme, type Theme } from "@/lib/theme"

export type LandingTheme = Theme

/**
 * The marketing pages' light or dark look. Shares the app's theme setting, so it follows the
 * visitor's system until they pick one with the toggle, and the pick carries into the app.
 */
export function useLandingTheme() {
  const { theme, setPreference } = useTheme()
  const toggle = useCallback(
    () => setPreference(theme === "dark" ? "light" : "dark"),
    [theme, setPreference],
  )
  return { theme, toggle }
}
