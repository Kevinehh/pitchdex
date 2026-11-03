import { parseDayKey } from "@/features/meetings"
import { cn } from "@/lib/utils"
import type { DailySends, ReplyStats, SendingStat } from "../types"
import styles from "./SendingChart.module.css"

/** Stacked from the bottom up, each in the colour the rest of the app gives that kind of send. */
const series = [
  { key: "invitations", label: "Invitations", one: "invitation", className: styles.invitations },
  {
    key: "linkedInMessages",
    label: "LinkedIn messages",
    one: "LinkedIn message",
    className: styles.messages,
  },
  { key: "emails", label: "Emails", one: "email", className: styles.emails },
] as const

const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
})

type SendingChartProps = {
  days: DailySends[]
  sending: SendingStat[]
  replies: ReplyStats
  pendingInvitations: number
}

/** What went out each day for two weeks, with the totals that say whether it's working. */
export function SendingChart({ days, sending, replies, pendingInvitations }: SendingChartProps) {
  const totals = days.map((day) => day.invitations + day.linkedInMessages + day.emails)
  const sent = totals.reduce((sum, total) => sum + total, 0)
  const replyCount = days.reduce((sum, day) => sum + day.replies, 0)
  const sentToday = sending.reduce((sum, stat) => sum + stat.sent, 0)
  const limitToday = sending.reduce((sum, stat) => sum + stat.limit, 0)
  // A full bar is a day's sending limit, so quiet days show as room left. With no account
  // connected there's no limit, and the busiest day fills the chart instead.
  const fullBar = Math.max(1, limitToday, ...totals)

  return (
    <section className={styles.panel} aria-labelledby="sending-title">
      <header className={styles.header}>
        <h2 id="sending-title" className={styles.title}>
          Sending, last 14 days
        </h2>
        <ul className={styles.legend} aria-hidden>
          {series.map((item) => (
            <li key={item.key}>
              <span className={cn(styles.swatch, item.className)} />
              {item.label}
            </li>
          ))}
          <li>
            <span className={cn(styles.swatch, styles.replySwatch)} />
            Replies
          </li>
        </ul>
      </header>

      <dl className={styles.totals}>
        <div>
          <dt>Sent</dt>
          <dd>{sent}</dd>
        </div>
        <div>
          <dt>Replies</dt>
          <dd>{replyCount}</dd>
        </div>
        <div>
          <dt>Reply rate, 30 days</dt>
          <dd>
            {replies.contactedLast30Days === 0
              ? "—"
              : `${Math.round((replies.repliedLast30Days / replies.contactedLast30Days) * 100)}%`}
          </dd>
        </div>
        <div>
          <dt>Invitations waiting</dt>
          <dd>{pendingInvitations}</dd>
        </div>
        <div>
          <dt>Last 24 hours</dt>
          <dd>
            {sentToday}
            <span className={styles.of}> / {limitToday}</span>
          </dd>
        </div>
      </dl>

      <ol className={styles.chart}>
        {days.map((day, index) => {
          const date = parseDayKey(day.day)
          const description = describe(day, date)
          return (
            <li key={day.day} className={styles.day} title={description}>
              <span className={styles.bar} aria-hidden>
                {day.replies > 0 && <span className={styles.replyDot} />}
                {series.map((item) =>
                  day[item.key] > 0 ? (
                    <span
                      key={item.key}
                      className={cn(styles.segment, item.className)}
                      style={{ height: `${(day[item.key] / fullBar) * 100}%` }}
                    />
                  ) : null,
                )}
              </span>
              <span className={styles.dayLabel} aria-hidden>
                {index === days.length - 1 ? "Today" : date?.getDate()}
              </span>
              <span className={styles.visuallyHidden}>{description}</span>
            </li>
          )
        })}
      </ol>

      {sent === 0 ? (
        <p className={styles.note}>
          Nothing sent in the last two weeks. Launch a campaign and each day&apos;s sends show up
          here.
        </p>
      ) : (
        limitToday > 0 && (
          <p className={styles.note}>
            A full bar is your daily limit of {limitToday} sends across your accounts.
          </p>
        )
      )}
    </section>
  )
}

/** "Mon, Nov 2: 3 invitations, 1 email, 1 reply", for the tooltip and screen readers. */
function describe(day: DailySends, date: Date | null) {
  const parts = series
    .filter((item) => day[item.key] > 0)
    .map((item) => `${day[item.key]} ${item.one}${day[item.key] === 1 ? "" : "s"}`)
  if (day.replies > 0) {
    parts.push(`${day.replies} ${day.replies === 1 ? "reply" : "replies"}`)
  }
  const when = date ? dayFormat.format(date) : day.day
  return `${when}: ${parts.length === 0 ? "nothing sent" : parts.join(", ")}`
}
