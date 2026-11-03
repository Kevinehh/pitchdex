import type { ReactNode } from "react"
import { useLandingTheme } from "../hooks/useLandingTheme"
import { LandingFooter } from "./LandingFooter"
import { LandingNav } from "./LandingNav"
import shared from "./Landing.module.css"

/** The frame every marketing page shares: the nav, the footer and the light or dark look. */
export function LandingShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useLandingTheme()

  return (
    <div className={shared.page} data-theme={theme}>
      <LandingNav theme={theme} onToggleTheme={toggle} />
      <main>{children}</main>
      <LandingFooter />
    </div>
  )
}
