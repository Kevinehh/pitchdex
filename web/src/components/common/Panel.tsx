import { useId, type ReactNode } from "react"
import { Link } from "react-router"
import styles from "./Panel.module.css"

type PanelProps = {
  title: string
  /** Optional link in the top-right corner, such as "Open inbox". */
  action?: { label: string; to: string }
  children: ReactNode
}

/** A titled box on a page. Dashboard sections are all Panels. */
export function Panel({ title, action, children }: PanelProps) {
  const titleId = useId()

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {action && (
          <Link to={action.to} className={styles.action}>
            {action.label}
          </Link>
        )}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  )
}

/** A divided list inside a Panel. Each child should be a PanelRow. */
export function PanelList({ children }: { children: ReactNode }) {
  return <ul className={styles.list}>{children}</ul>
}

export function PanelRow({ children }: { children: ReactNode }) {
  return <li className={styles.row}>{children}</li>
}

/** Small text on the right of a row. Pass `to` to make it a link. */
export function PanelMeta({ children, to }: { children: ReactNode; to?: string }) {
  if (to) {
    return (
      <Link to={to} className={styles.meta}>
        {children}
      </Link>
    )
  }
  return <span className={styles.meta}>{children}</span>
}
