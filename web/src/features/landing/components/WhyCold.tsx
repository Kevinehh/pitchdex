import { cn } from "@/lib/utils"
import { BoltIcon, SendIcon, TargetIcon } from "./icons"
import shared from "./Landing.module.css"
import styles from "./WhyCold.module.css"

const targets = [
  { label: "Seed", on: true },
  { label: "Series B" },
  { label: "AI / SaaS", on: true },
  { label: "Biotech" },
  { label: "$500k–$2M", on: true },
  { label: "$20M+" },
]

export function WhyCold() {
  return (
    <section className={cn(shared.pad, styles.section)}>
      <div className={shared.wrap}>
        <div className={shared.secHead}>
          <span className={cn(shared.label, styles.label)}>Why cold works</span>
          <h2>
            VCs take cold meetings,
            <br />
            if you do it right.
          </h2>
          <p className={cn(shared.lead, styles.lead)}>
            Most founders wait for warm intros that never come. The best founders go direct. Cold
            email done well gets replies, because every VC is looking for their next deal.
          </p>
        </div>

        <div className={styles.bento}>
          <div className={styles.card}>
            <div className={cn(shared.icon, styles.icon)}>
              <SendIcon size={20} strokeWidth={1.8} />
            </div>
            <h3>Cold gets read</h3>
            <p>
              A personalized, well-timed cold email stands out in a VC's inbox. Generic pitches get
              ignored; specific, relevant ones get replies. Pitchdex writes the personalization for
              you.
            </p>
            <div className={styles.viz} aria-hidden>
              <div className={styles.compare}>
                <span className={styles.compareLabel}>Generic</span>
                <span
                  className={styles.compareBar}
                  style={{ width: "12%", background: "#6c80b8" }}
                />
              </div>
              <div className={styles.compare}>
                <span className={styles.compareLabel}>Personalized</span>
                <span
                  className={styles.compareBar}
                  style={{ width: "70%", background: "#5b8cff" }}
                />
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={cn(shared.icon, styles.icon)}>
              <TargetIcon size={20} strokeWidth={1.8} />
            </div>
            <h3>Right investor, right moment</h3>
            <p>
              500+ vetted VCs filtered by your stage, sector, and check size. Reaching investors who
              actually fund companies like yours is half the battle. We give you the list.
            </p>
            <div className={styles.viz} aria-hidden>
              <div className={styles.targets}>
                {targets.map((target) => (
                  <span key={target.label} className={cn(target.on && styles.targetOn)}>
                    {target.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={cn(shared.icon, styles.icon)}>
              <BoltIcon size={20} strokeWidth={1.8} />
            </div>
            <h3>Volume without spam</h3>
            <p>
              Automated follow-up sequences keep you top of mind without burning bridges. Your
              pipeline fills while you focus on pitching, not prospecting.
            </p>
            <div className={styles.viz} aria-hidden>
              <div className={styles.timeline}>
                <i />
                <s />
                <i />
                <s />
                <i className={styles.timelineNext} />
              </div>
              <div className={styles.timelineLabels}>
                <span>Day 1</span>
                <span>Day 4</span>
                <span>Day 9</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
