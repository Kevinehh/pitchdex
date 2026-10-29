import type { EnrollmentCounts } from "../types"
import styles from "./CampaignProgress.module.css"

const segments = [
  { key: "active", label: "In progress", className: styles.active },
  { key: "replied", label: "Replied", className: styles.replied },
  { key: "completed", label: "Finished", className: styles.completed },
  { key: "ended", label: "Failed or stopped", className: styles.ended },
] as const

/** Where a campaign's leads are, as one bar split by state, with the counts beneath. */
export function CampaignProgress({ counts }: { counts: EnrollmentCounts }) {
  const values = {
    active: counts.active,
    replied: counts.replied,
    completed: counts.completed,
    ended: counts.failed + counts.stopped,
  }
  const shown = segments.filter((segment) => values[segment.key] > 0)
  const summary = segments.map((segment) => `${values[segment.key]} ${segment.label.toLowerCase()}`)

  if (counts.total === 0) {
    return <p className={styles.empty}>No leads yet</p>
  }

  return (
    <div className={styles.progress} role="img" aria-label={summary.join(", ")}>
      <div className={styles.bar}>
        {shown.map((segment) => (
          <span
            key={segment.key}
            className={`${styles.segment} ${segment.className}`}
            style={{ flexGrow: values[segment.key] }}
            title={`${segment.label}: ${values[segment.key]}`}
          />
        ))}
      </div>
      <div className={styles.legend} aria-hidden>
        {shown.map((segment) => (
          <span key={segment.key} className={segment.className} title={segment.label}>
            {values[segment.key]}
          </span>
        ))}
      </div>
    </div>
  )
}
