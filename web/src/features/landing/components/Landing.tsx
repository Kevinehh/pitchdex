import { useEffect } from "react"
import { useLocation } from "react-router"
import { Features } from "./Features"
import { FinalCta } from "./FinalCta"
import { Hero } from "./Hero"
import { HowItWorks } from "./HowItWorks"
import { LandingShell } from "./LandingShell"
import { Pricing } from "./Pricing"
import { Problem } from "./Problem"
import { WhyCold } from "./WhyCold"

/** The whole marketing page, top to bottom. */
export function Landing() {
  const { hash } = useLocation()

  // A link like /#pricing arrives before the page has loaded, so the browser can't jump to it.
  useEffect(() => {
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
    }
  }, [hash])

  return (
    <LandingShell>
      <Hero />
      <Problem />
      <Features />
      <HowItWorks />
      <WhyCold />
      <Pricing />
      <FinalCta />
    </LandingShell>
  )
}
