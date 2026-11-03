import { ArrowRight } from "lucide-react"
import { Link } from "react-router"
import { useDashboard } from "../hooks/useDashboard"
import { setupSteps } from "../setupSteps"
import styles from "./SetupPrompt.module.css"

/** The next first-run step, at the foot of the sidebar on every page. Gone once all are done. */
export function SetupPrompt() {
  const setup = useDashboard().data?.setup
  if (!setup) {
    return null
  }

  const steps = setupSteps(setup)
  const next = steps.find((step) => !step.done)
  if (!next) {
    return null
  }
  const done = steps.filter((step) => step.done).length

  return (
    <Link to={next.to} className={styles.prompt}>
      <span className={styles.progress}>
        Get set up · {done} of {steps.length}
      </span>
      <span className={styles.bar} aria-hidden>
        <span style={{ width: `${(done / steps.length) * 100}%` }} />
      </span>
      <span className={styles.label}>{next.label}</span>
      <span className={styles.hint}>{next.hint}</span>
      <span className={styles.go}>
        Set up <ArrowRight aria-hidden />
      </span>
    </Link>
  )
}
