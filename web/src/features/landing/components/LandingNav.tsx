import { useEffect, useState } from "react"
import { Link } from "react-router"
import { cn } from "@/lib/utils"
import type { LandingTheme } from "../hooks/useLandingTheme"
import { Logo, MoonIcon, SunIcon } from "./icons"
import shared from "./Landing.module.css"
import styles from "./LandingNav.module.css"
import { SectionLink } from "./SectionLink"

const sections = [
  { id: "problem", label: "Why Pitchdex" },
  { id: "features", label: "Features" },
  { id: "how", label: "How it works" },
  { id: "pricing", label: "Pricing" },
]

type LandingNavProps = {
  theme: LandingTheme
  onToggleTheme: () => void
}

/**
 * Fixed along the top of the landing and legal pages; turns frosted once the page scrolls,
 * so it stays readable over content.
 */
export function LandingNav({ theme, onToggleTheme }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className={cn(styles.nav, scrolled && styles.scrolled)}>
      <div className={cn(shared.wrap, styles.bar)}>
        <SectionLink section="top">
          <Logo />
        </SectionLink>
        <nav className={styles.links} aria-label="Sections">
          {sections.map((section) => (
            <SectionLink key={section.id} section={section.id}>
              {section.label}
            </SectionLink>
          ))}
        </nav>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            {theme === "dark" ? <SunIcon strokeWidth={2} /> : <MoonIcon strokeWidth={2} />}
          </button>
          <Link to="/sign-in" className={styles.signIn}>
            Sign in
          </Link>
          <SectionLink
            section="join"
            className={cn(shared.btn, shared.btnPrimary, shared.btnSmall)}
          >
            Join Early Access
          </SectionLink>
        </div>
      </div>
    </header>
  )
}
