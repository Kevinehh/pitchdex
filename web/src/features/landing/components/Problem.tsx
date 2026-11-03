import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { GridIcon, MailIcon, SearchIcon } from "./icons"
import shared from "./Landing.module.css"
import styles from "./Problem.module.css"

const problems: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <GridIcon size={20} strokeWidth={1.8} />,
    title: "Spreadsheets don't scale",
    body: "Tracking 200+ VCs in a Google Sheet means deals fall through the cracks. No follow-up reminders. No reply tracking. Just chaos.",
  },
  {
    icon: <MailIcon size={20} strokeWidth={1.8} />,
    title: "Cold outreach has a 2% reply rate",
    body: 'Generic "I\'d love to connect" emails get ignored. Without personalization and perfect timing, your best pitch never gets read.',
  },
  {
    icon: <SearchIcon size={20} strokeWidth={1.8} />,
    title: "VC research takes weeks",
    body: "Finding the right investors, ones who actually fund your stage, sector, and check size, can take longer than building your MVP.",
  },
]

export function Problem() {
  return (
    <section id="problem" className={shared.pad}>
      <div className={shared.wrap}>
        <div className={shared.secHead}>
          <span className={shared.label}>The problem</span>
          <h2>Fundraising is broken.</h2>
          <p className={shared.lead}>
            Most founders spend 80% of their fundraising time on research and outreach, not
            pitching. That's backwards.
          </p>
        </div>

        <div className={styles.grid}>
          <div className={styles.bigStat}>
            <span className={cn(shared.label, styles.bigStatLabel)}>Where the time goes</span>
            <div>
              <div className={styles.number}>80%</div>
              <div className={styles.meter}>
                <i />
                <i />
              </div>
              <div className={styles.legend}>
                <span>Research &amp; outreach</span>
                <span>Pitching</span>
              </div>
            </div>
            <p>of fundraising time never touches an actual investor conversation.</p>
          </div>

          {problems.map((problem) => (
            <div key={problem.title} className={styles.card}>
              <div className={shared.icon}>{problem.icon}</div>
              <h3>{problem.title}</h3>
              <p>{problem.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
