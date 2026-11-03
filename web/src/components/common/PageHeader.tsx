import type { LucideIcon } from "lucide-react"
import { useContext, type ReactNode } from "react"
import { PageIcon } from "./pageIcon"
import styles from "./PageHeader.module.css"

type PageHeaderProps = {
  title: string
  description?: ReactNode
  actions?: ReactNode
}

/** A page's title, beside its sidebar icon, with the page's main buttons on the right. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const icon = useContext(PageIcon)

  return (
    <div className={styles.header}>
      {icon && <IconTile icon={icon} />}
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className={styles.icon} aria-hidden>
      <Icon />
    </span>
  )
}
