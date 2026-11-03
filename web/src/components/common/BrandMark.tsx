import styles from "./BrandMark.module.css"

/** The Pitchdex "P" on a blue square, as on the landing page. Decorative: the name sits beside it. */
export function BrandMark({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span className={size === "lg" ? `${styles.mark} ${styles.lg}` : styles.mark} aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
        <path d="M4 20V4h9a5 5 0 0 1 0 10H4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
