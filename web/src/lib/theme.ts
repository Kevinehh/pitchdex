import { useSyncExternalStore } from "react"

/** What the founder picked. "system" follows the device's light or dark setting. */
export type ThemePreference = "light" | "dark" | "system"
export type Theme = "light" | "dark"

/** Also read by the start-up script in index.html, which sets the theme before the first paint. */
const storageKey = "pitchdex.theme"
const darkQuery = "(prefers-color-scheme: dark)"

const listeners = new Set<() => void>()

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(storageKey)
    return value === "light" || value === "dark" ? value : "system"
  } catch {
    return "system"
  }
}

let preference = readPreference()

function resolve(pick: ThemePreference): Theme {
  if (pick !== "system") return pick
  return window.matchMedia(darkQuery).matches ? "dark" : "light"
}

/** The app's colours switch on the `dark` class on <html> (see index.css). */
function apply() {
  document.documentElement.classList.toggle("dark", resolve(preference) === "dark")
  listeners.forEach((listener) => listener())
}

export function setThemePreference(next: ThemePreference) {
  preference = next
  try {
    if (next === "system") localStorage.removeItem(storageKey)
    else localStorage.setItem(storageKey, next)
  } catch {
    // Private windows can refuse storage; the pick still holds for this visit.
  }
  apply()
}

/**
 * Keeps the theme current when the device switches between light and dark, and when the
 * founder changes it in another tab. Called once at start-up.
 */
export function watchTheme() {
  window.matchMedia(darkQuery).addEventListener("change", apply)
  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey && event.key !== null) return
    preference = readPreference()
    apply()
  })
  apply()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The founder's pick, the theme showing, and a way to change it. */
export function useTheme() {
  const current = useSyncExternalStore(subscribe, () => preference)
  const theme = useSyncExternalStore(subscribe, () => resolve(preference))
  return { preference: current, theme, setPreference: setThemePreference }
}
