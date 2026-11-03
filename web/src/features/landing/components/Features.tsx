import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { CheckIcon } from "./icons"
import shared from "./Landing.module.css"
import styles from "./Features.module.css"

type FeatureProps = {
  number: string
  title: string
  body: string
  ticks: string[]
  /** Puts the picture on the left. */
  reversed?: boolean
  children: ReactNode
}

function Feature({ number, title, body, ticks, reversed, children }: FeatureProps) {
  return (
    <div className={cn(styles.feature, reversed && styles.reversed)}>
      <div className={styles.copy}>
        <div className={styles.number}>{number}</div>
        <h3>{title}</h3>
        <p>{body}</p>
        <ul className={shared.ticks}>
          {ticks.map((tick) => (
            <li key={tick}>
              <CheckIcon /> {tick}
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.panel} aria-hidden>
        {children}
      </div>
    </div>
  )
}

const investors = [
  { name: "Sequoia Capital", stage: "Seed–A", check: "$1M–$5M", fit: "96%" },
  { name: "a16z", stage: "Seed–A", check: "$500k–$3M", fit: "94%" },
  { name: "Founders Fund", stage: "Seed", check: "$500k–$2M", fit: "91%" },
  { name: "Index Ventures", stage: "Seed–A", check: "$1M–$4M", fit: "88%" },
]

/** Meetings in the calendar picture, row by row across the weekdays. Null is a free slot. */
const week: ([string, string, "dark" | "light"] | null)[] = [
  ["Sequoia", "10:00", "dark"],
  null,
  ["Index", "11:30", "light"],
  null,
  ["Accel", "9:00", "dark"],
  null,
  ["Founders Fund", "1:00", "light"],
  null,
  ["a16z", "2:00", "dark"],
  null,
  null,
  null,
  ["Lightspeed", "4:00", "light"],
  null,
  null,
]

export function Features() {
  return (
    <section id="features" className={cn(shared.pad, styles.section)}>
      <div className={shared.wrap}>
        <div className={shared.secHead}>
          <span className={shared.label}>The solution</span>
          <h2>
            Everything you need
            <br />
            to close your round.
          </h2>
          <p className={shared.lead}>
            Pitchdex combines the tools top fundraising advisors charge $50k to provide, in one
            platform founders actually use.
          </p>
        </div>

        <Feature
          number="1/3"
          title="Investor database"
          body="500+ vetted VCs filtered by stage, sector, check size, and geography. No more guessing who to pitch."
          ticks={[
            "Filter by stage, sector, check size & geography",
            "Every profile updated quarterly",
          ]}
        >
          <div className={styles.panelHead}>
            <b>Investor database</b>
            <span>214 of 500+ match</span>
          </div>
          <div className={styles.filters}>
            <span className={cn(styles.chip, styles.chipOn)}>Stage: Seed</span>
            <span className={cn(styles.chip, styles.chipOn)}>Sector: AI / SaaS</span>
            <span className={cn(styles.chip, styles.chipOn)}>Check: $250k–$2M</span>
            <span className={styles.chip}>Geo: US &amp; EU</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Investor</th>
                <th>Stage</th>
                <th>Check size</th>
                <th>Fit</th>
              </tr>
            </thead>
            <tbody>
              {investors.map((investor) => (
                <tr key={investor.name}>
                  <td>{investor.name}</td>
                  <td>{investor.stage}</td>
                  <td>{investor.check}</td>
                  <td>
                    <span className={styles.fit}>{investor.fit}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Feature>

        <Feature
          number="2/3"
          title="Cold email engine"
          body="AI-personalized sequences sent from your own domain. Your outreach runs 24/7, even while you're sleeping."
          ticks={["Sent from your own domain", "Follow-ups automated, replies tracked"]}
          reversed
        >
          <div className={styles.panelHead}>
            <b>Sequence · Seed round</b>
            <span>Running</span>
          </div>
          <div className={styles.sequence}>
            <div className={cn(styles.step, styles.stepDone)}>
              <span className={styles.stepNumber}>01</span>
              <div className={styles.stepBox}>
                <div className={styles.stepTitle}>
                  Initial email <span>Day 1</span>
                </div>
                <p>
                  Hi Sarah, <mark>saw your thesis on AI-native dev tools</mark>, we're building
                  exactly that…
                </p>
              </div>
            </div>
            <div className={cn(styles.step, styles.stepDone)}>
              <span className={styles.stepNumber}>02</span>
              <div className={styles.stepBox}>
                <div className={styles.stepTitle}>
                  Follow-up 1 <span>Day 4</span>
                </div>
                <p>
                  Quick bump, we just crossed <mark>$40k MRR</mark> since my last note.
                </p>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>03</span>
              <div className={styles.stepBox}>
                <div className={styles.stepTitle}>
                  Follow-up 2 <span>Day 9</span>
                </div>
                <p>Last note from me, happy to send the deck if timing's better later.</p>
              </div>
            </div>
          </div>
        </Feature>

        <Feature
          number="3/3"
          title="Meeting booking"
          body="When a VC clicks, your Calendly is ready. Track every meeting, reply, and intro in one place."
          ticks={[
            "Calendly built into every reply",
            "Know exactly where every relationship stands",
          ]}
        >
          <div className={styles.panelHead}>
            <b>Your week</b>
            <span>6 meetings</span>
          </div>
          <div className={styles.calendar}>
            {["MON", "TUE", "WED", "THU", "FRI"].map((day) => (
              <div key={day} className={styles.day}>
                {day}
              </div>
            ))}
            {week.map((slot, index) =>
              slot ? (
                <div
                  key={index}
                  className={cn(
                    styles.slot,
                    slot[2] === "dark" ? styles.meeting : styles.meetingLight,
                  )}
                >
                  <b>{slot[0]}</b>
                  {slot[1]}
                </div>
              ) : (
                <div key={index} className={styles.slot} />
              ),
            )}
          </div>
          <div className={styles.toast}>
            <span className={styles.toastIcon}>
              <CheckIcon size={13} strokeWidth={3} />
            </span>
            <div>
              <b>Marcus K. booked</b> · Thu 2pm
            </div>
          </div>
        </Feature>
      </div>
    </section>
  )
}
