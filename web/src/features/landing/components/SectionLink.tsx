import type { ReactNode } from "react"
import { Link, useLocation } from "react-router"

type SectionLinkProps = {
  /** The landing page section's id, such as "pricing". */
  section: string
  className?: string
  children: ReactNode
}

/**
 * A link to a landing page section that works from any page: a plain anchor on the landing
 * page, so the browser scrolls natively, and a link back to it from the legal pages.
 */
export function SectionLink({ section, className, children }: SectionLinkProps) {
  const { pathname } = useLocation()
  return pathname === "/" ? (
    <a href={`#${section}`} className={className}>
      {children}
    </a>
  ) : (
    <Link to={{ pathname: "/", hash: section }} className={className}>
      {children}
    </Link>
  )
}
