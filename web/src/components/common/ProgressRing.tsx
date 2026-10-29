import styles from "./ProgressRing.module.css"

type ProgressRingProps = {
  /** From 0 to 1. Values outside are clamped. */
  value: number
  label: string
}

const RADIUS = 26
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** A circle that fills as a share is used up, with the percentage inside. */
export function ProgressRing({ value, label }: ProgressRingProps) {
  const share = Math.min(Math.max(value, 0), 1)
  return (
    <svg
      className={styles.ring}
      viewBox="0 0 64 64"
      role="img"
      aria-label={`${label}: ${Math.round(share * 100)}%`}
    >
      <circle className={styles.track} cx="32" cy="32" r={RADIUS} />
      <circle
        className={styles.fill}
        cx="32"
        cy="32"
        r={RADIUS}
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - share)}
      />
      <text className={styles.text} x="32" y="32">
        {Math.round(share * 100)}%
      </text>
    </svg>
  )
}
