import { cn } from "@/lib/utils"
import { CalendarIcon, SendIcon } from "./icons"
import styles from "./AppPreview.module.css"

const sidebar = [
  { label: "VC Replies", count: 12, active: true },
  { label: "Sequences", count: 3 },
  { label: "Investor list", count: 214 },
  { label: "Meetings", count: 6 },
]

const pipeline = [
  { label: "Contacted", count: 186 },
  { label: "Interested", count: 19 },
  { label: "Term sheet", count: 1 },
]

const replies = [
  {
    initials: "SA",
    tone: "blue",
    name: "Sarah A.",
    firm: "Sequoia Capital",
    subject: "Re: Pitch meeting request, loved the deck",
    tag: "Replied",
    tagTone: "green",
    highlight: true,
  },
  {
    initials: "MK",
    tone: "green",
    name: "Marcus K.",
    firm: "a16z",
    subject: "Re: [AI Startup], Can we do Thursday 2pm?",
    tag: "Meeting set",
    tagTone: "blue",
  },
  {
    initials: "LT",
    tone: "amber",
    name: "Lisa T.",
    firm: "Andreessen Horowitz",
    subject: "Re: Interesting timing, we're exploring this space",
    tag: "New",
    tagTone: "amber",
  },
  {
    initials: "JN",
    tone: "violet",
    name: "James N.",
    firm: "Founders Fund",
    subject: "Re: Let's connect, quick call this week?",
    tag: "New",
    tagTone: "amber",
  },
] as const

const replyBars = [30, 42, 38, 55, 64, 78, 100]

/** A still picture of the app's inbox for the hero. Decorative: it isn't interactive. */
export function AppPreview() {
  return (
    <div className={styles.preview} aria-hidden>
      <div className={cn(styles.float, styles.floatLeft)}>
        <span className={cn(styles.floatIcon, styles.green)}>
          <CalendarIcon size={14} />
        </span>
        <div>
          <b>Meeting booked</b>
          <span>Thu 2:00pm · a16z</span>
        </div>
      </div>
      <div className={cn(styles.float, styles.floatRight)}>
        <span className={cn(styles.floatIcon, styles.blue)}>
          <SendIcon size={14} />
        </span>
        <div>
          <b>Follow-up 2 sent</b>
          <span>to 38 investors · automatically</span>
        </div>
      </div>

      <div className={styles.frame}>
        <div className={styles.bar}>
          <div className={styles.dots}>
            <i />
            <i />
            <i />
          </div>
          <div className={styles.url}>app.pitchdex.ai/inbox</div>
          <div className={styles.barSpacer} />
        </div>

        <div className={styles.body}>
          <div className={styles.side}>
            {sidebar.map((item) => (
              <div key={item.label} className={cn(styles.sideItem, item.active && styles.active)}>
                {item.label} <span className={styles.count}>{item.count}</span>
              </div>
            ))}
            <div className={styles.group}>Pipeline</div>
            {pipeline.map((item) => (
              <div key={item.label} className={styles.sideItem}>
                {item.label} <span className={styles.count}>{item.count}</span>
              </div>
            ))}
          </div>

          <div className={styles.inbox}>
            <div className={styles.inboxHead}>
              <h4>VC Replies, Inbox</h4>
              <span>Updated just now</span>
            </div>
            {replies.map((reply) => (
              <div
                key={reply.initials}
                className={cn(styles.row, "highlight" in reply && styles.highlight)}
              >
                <span className={cn(styles.avatar, styles[reply.tone])}>{reply.initials}</span>
                <div className={styles.rowText}>
                  <div className={styles.rowName}>
                    {reply.name} <em>at {reply.firm}</em>
                  </div>
                  <div className={styles.rowSubject}>{reply.subject}</div>
                </div>
                <span className={cn(styles.tag, styles[reply.tagTone])}>{reply.tag}</span>
              </div>
            ))}
          </div>

          <div className={styles.stats}>
            <h5>This week</h5>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Reply rate</div>
              <div className={styles.statValue}>
                14.2% <small>↑ vs 2% avg</small>
              </div>
              <div className={styles.bars}>
                {replyBars.map((height, index) => (
                  <i key={index} style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statLabel}>Meetings booked</div>
              <div className={styles.statValue}>6</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
