import {
  CircleAlert,
  Mail,
  MailOpen,
  MessageSquare,
  MessageSquareReply,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router"
import { Panel } from "@/components/common/Panel"
import { formatTimeAgo } from "@/lib/formatTimeAgo"
import type { Activity, ActivityKind } from "../types"
import styles from "./RecentActivity.module.css"

const kinds: Record<ActivityKind, { icon: LucideIcon; verb: string; reply?: boolean }> = {
  EmailSent: { icon: Mail, verb: "Emailed" },
  InvitationSent: { icon: UserPlus, verb: "Sent a connection request to" },
  LinkedInMessageSent: { icon: MessageSquare, verb: "Sent a LinkedIn message to" },
  EmailReply: { icon: MailOpen, verb: "Email reply from", reply: true },
  LinkedInReply: { icon: MessageSquareReply, verb: "LinkedIn reply from", reply: true },
  InvitationAccepted: { icon: UserCheck, verb: "Connection request accepted by" },
  StepFailed: { icon: CircleAlert, verb: "A step failed for" },
}

/** What happened lately: sends, replies and failed steps, newest first. It scrolls inside the height className gives it. */
export function RecentActivity({
  activity,
  className,
}: {
  activity: Activity[]
  className?: string
}) {
  return (
    <Panel title="Recent activity" scroll className={className}>
      {activity.length === 0 ? (
        <p className={styles.empty}>
          Nothing yet. Sends and replies show up here as campaigns run.
        </p>
      ) : (
        <ol className={styles.list}>
          {activity.map((item) => (
            <ActivityItem key={item.id} item={item} />
          ))}
        </ol>
      )}
    </Panel>
  )
}

function ActivityItem({ item }: { item: Activity }) {
  const { icon: Icon, verb, reply } = kinds[item.kind]
  const failed = item.kind === "StepFailed"

  const lead: ReactNode = item.leadId ? (
    <Link to={`/inbox/${item.leadId}`} className={styles.link}>
      {item.leadName ?? "a lead"}
    </Link>
  ) : (
    (item.leadName ?? "a lead")
  )

  return (
    <li className={styles.item}>
      <Icon
        className={failed ? styles.failedIcon : reply ? styles.replyIcon : styles.icon}
        aria-hidden
      />
      <div className={styles.text}>
        <p className={styles.line}>
          {verb} {lead}.
          {reply && item.stoppedCampaigns > 0 && (
            <>
              {" "}
              Stopped in {item.stoppedCampaigns}{" "}
              {item.stoppedCampaigns === 1 ? "campaign" : "campaigns"}.
            </>
          )}
          {failed && item.detail && <span className={styles.detail}> {item.detail}</span>}
        </p>
        <p className={styles.meta}>
          <time dateTime={item.at}>{timeAgo(item.at)}</time>
          {item.campaignId && (
            <>
              {" · "}
              <Link to={`/campaigns/${item.campaignId}`} className={styles.campaign}>
                {item.campaignName}
              </Link>
            </>
          )}
        </p>
      </div>
    </li>
  )
}

/** "Just now", "12m ago", "2d ago". */
function timeAgo(iso: string) {
  const short = formatTimeAgo(iso)
  return short === "now" ? "Just now" : `${short} ago`
}
