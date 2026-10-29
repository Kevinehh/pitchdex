import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import styles from "./EmptyState.module.css"

type EmptyStateProps = {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
}

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      {Icon && <Icon className={styles.icon} aria-hidden />}
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
