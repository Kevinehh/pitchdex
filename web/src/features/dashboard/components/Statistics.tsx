import { Link } from "react-router"
import { ProgressRing } from "@/components/common/ProgressRing"
import { Button } from "@/components/ui/button"
import type { ReplyStats, SendingStat } from "../types"
import styles from "./Statistics.module.css"

const kindLabels: Record<SendingStat["kind"], string> = {
  LinkedInInvitation: "Invitations sent",
  LinkedInMessage: "LinkedIn messages",
  Email: "Emails sent",
}

type StatisticsProps = {
  sending: SendingStat[]
  replies: ReplyStats
  unreadConversations: number
  pendingInvitations: number
}

/**
 * Today's sending against what the connected accounts allow, then how leads are answering.
 * "Today" is the last 24 hours, the same window the sending limits use.
 */
export function Statistics({
  sending,
  replies,
  unreadConversations,
  pendingInvitations,
}: StatisticsProps) {
  const change = weekChange(replies.thisWeek, replies.lastWeek)

  return (
    <section className={styles.panel} aria-labelledby="statistics-title">
      <header className={styles.header}>
        <h2 id="statistics-title" className={styles.title}>
          Statistics
        </h2>
        <span className={styles.period}>Last 24 hours</span>
      </header>

      <ul className={styles.rings}>
        {sending.map((stat) => (
          <li key={stat.kind} className={styles.ringItem}>
            <ProgressRing
              value={stat.limit === 0 ? 0 : stat.sent / stat.limit}
              label={kindLabels[stat.kind]}
            />
            <p className={styles.count}>
              {stat.sent}
              <span className={styles.limit}> / {stat.limit}</span>
            </p>
            <p className={styles.ringLabel}>{kindLabels[stat.kind]}</p>
            {stat.limit === 0 && (
              <Link
                to={stat.kind === "Email" ? "/account?tab=email" : "/account"}
                className={styles.connect}
              >
                Connect an account
              </Link>
            )}
          </li>
        ))}
      </ul>

      <div className={styles.cards}>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Unread conversations</p>
          <div className={styles.cardRow}>
            <p className={styles.cardValue}>{unreadConversations}</p>
            <Button variant="outline" size="sm" nativeButton={false} render={<Link to="/inbox" />}>
              View
            </Button>
          </div>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Pending invitations</p>
          <div className={styles.cardRow}>
            <p className={styles.cardValue}>{pendingInvitations}</p>
            <span className={styles.change}>waiting to be accepted</span>
          </div>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Leads replied, last 7 days</p>
          <div className={styles.cardRow}>
            <p className={styles.cardValue}>{replies.thisWeek}</p>
            {change && <span className={styles.change}>{change} vs last week</span>}
          </div>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Reply rate, last 30 days</p>
          <div className={styles.cardRow}>
            <p className={styles.cardValue}>
              {replies.contactedLast30Days === 0
                ? "—"
                : `${Math.round((replies.repliedLast30Days / replies.contactedLast30Days) * 100)}%`}
            </p>
            <span className={styles.change}>
              {replies.repliedLast30Days} of {replies.contactedLast30Days} leads
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

/** "+41%", "-12%", or "new" when there was nothing last week to compare with. */
function weekChange(thisWeek: number, lastWeek: number): string | null {
  if (lastWeek === 0) {
    return thisWeek > 0 ? "new" : null
  }
  const change = Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
  return `${change > 0 ? "+" : ""}${change}%`
}
