import { cn } from "@/lib/utils"
import shared from "./Landing.module.css"
import styles from "./HowItWorks.module.css"

const steps = [
  {
    title: "Build your list",
    body: "Filter 500+ VCs by your stage, sector, geography, and raise size. Save your shortlist in one click.",
    meta: "500+ vetted VCs",
  },
  {
    title: "Launch your sequence",
    body: "AI writes personalized first lines. Your sequence goes out automatically: initial email, follow-up 1, follow-up 2.",
    meta: "Runs 24/7 from your domain",
  },
  {
    title: "Book the meeting",
    body: "Replies land in your inbox. Meetings auto-schedule via Calendly. Track your whole pipeline in your Pitchdex dashboard.",
    meta: "Meetings in your calendar",
  },
]

export function HowItWorks() {
  return (
    <section id="how" className={shared.pad}>
      <div className={shared.wrap}>
        <div className={shared.secHead}>
          <span className={shared.label}>How it works</span>
          <h2>From zero to VC meetings in days.</h2>
          <p className={shared.lead}>
            Three steps to fill your calendar. No black boxes. No guesswork.
          </p>
        </div>

        <ol className={styles.grid}>
          {steps.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <div className={styles.number} aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <div className={styles.meta}>→ {step.meta}</div>
            </li>
          ))}
        </ol>

        <div className={styles.cta}>
          <a href="#join" className={cn(shared.btn, shared.btnPrimary)}>
            Join Early Access
          </a>
        </div>
      </div>
    </section>
  )
}
