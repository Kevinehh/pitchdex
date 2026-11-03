import { useEffect, useState, type ReactNode } from "react"
import { Link, useLocation } from "react-router"
import { cn } from "@/lib/utils"
import { LandingShell } from "./LandingShell"
import shared from "./Landing.module.css"
import styles from "./LegalPage.module.css"

export type LegalSection = { title: string; body: ReactNode }

export type LegalDocument = {
  title: string
  effective: string
  intro: ReactNode
  /** Numbered in order; the table of contents and section links come from these. */
  sections: LegalSection[]
  /** The other legal page, linked at the bottom. */
  related: { to: string; title: string }
}

/** "13. Children's Privacy" → "13-children-s-privacy", the ids the original pages used. */
function sectionId(index: number, title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  return `${index + 1}-${slug}`
}

/** Which section is being read: the last heading to pass the top of the screen. */
function useCurrentSection(ids: string[]) {
  const [current, setCurrent] = useState(ids[0])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) setCurrent(visible.target.id)
      },
      { rootMargin: "-90px 0px -70% 0px" },
    )
    for (const id of ids) {
      const heading = document.getElementById(id)
      if (heading) observer.observe(heading)
    }
    return () => observer.disconnect()
  }, [ids])

  return current
}

/** A legal document in the landing page's style, with a table of contents that follows along. */
export function LegalPage({ document: legal }: { document: LegalDocument }) {
  const { hash } = useLocation()
  const [ids] = useState(() =>
    legal.sections.map((section, index) => sectionId(index, section.title)),
  )
  const current = useCurrentSection(ids)

  // Opens at the top, or at the section in the link, rather than wherever the last page was.
  useEffect(() => {
    const target = hash ? window.document.getElementById(decodeURIComponent(hash.slice(1))) : null
    if (target) target.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [hash, legal])

  return (
    <LandingShell>
      <title>{`${legal.title} | Pitchdex`}</title>
      <section className={styles.hero}>
        <div className={shared.wrap}>
          <span className={shared.label}>Legal</span>
          <h1 className={styles.title}>{legal.title}</h1>
          <span className={styles.effective}>Effective Date: {legal.effective}</span>
        </div>
      </section>

      <div className={cn(shared.wrap, styles.layout)}>
        <nav className={styles.toc} aria-label="On this page">
          <h6>On this page</h6>
          <ol>
            {legal.sections.map((section, index) => (
              <li key={ids[index]}>
                <a
                  href={`#${ids[index]}`}
                  className={cn(current === ids[index] && styles.current)}
                  aria-current={current === ids[index] ? "location" : undefined}
                >
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className={styles.prose}>
          {legal.intro}
          {legal.sections.map((section, index) => (
            <section key={ids[index]} aria-labelledby={ids[index]}>
              <h2 id={ids[index]}>
                {index + 1}. {section.title}
              </h2>
              {section.body}
            </section>
          ))}

          <Link to={legal.related.to} className={styles.related}>
            <div>
              <span>Also read</span>
              <b>{legal.related.title}</b>
            </div>
            <span className={styles.arrow} aria-hidden>
              →
            </span>
          </Link>
        </article>
      </div>
    </LandingShell>
  )
}

/** The company's postal and email address, as both documents show it. */
export function AddressBlock({ name }: { name: string }) {
  return (
    <address className={styles.address}>
      {name}
      <br />
      179 George Street
      <br />
      Ottawa, Ontario, Canada
      <br />
      Email: <a href="mailto:hello@cactusmarketing.io">hello@cactusmarketing.io</a>
    </address>
  )
}
