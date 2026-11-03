import {
  CalendarDays,
  CircleCheck,
  ListChecks,
  MessageSquare,
  Pause,
  Video,
  type LucideIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router"
import { Panel } from "@/components/common/Panel"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCampaigns, useChangeCampaignStatus, type CampaignSummary } from "@/features/campaigns"
import { useConversations } from "@/features/inbox"
import { formatMeetingTime, useUpcomingMeetings } from "@/features/meetings"
import { cn } from "@/lib/utils"
import { setupSteps } from "../setupSteps"
import type { Setup } from "../types"
import styles from "./NeedsYou.module.css"

/**
 * What's waiting on the founder, each with the button that deals with it: the next call, the
 * latest unread reply, a paused campaign, the next setup step. Whatever is fine shows as a
 * ticked row, so the list reads as complete even on a quiet day.
 */
export function NeedsYou({ setup, className }: { setup: Setup; className?: string }) {
  const meetings = useUpcomingMeetings()
  const unread = useConversations("Unread", undefined)
  const campaigns = useCampaigns()

  if (meetings.isPending || unread.isPending || campaigns.isPending) {
    return (
      <Panel title="Needs you" className={className}>
        <div className={styles.loading} aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className={styles.skeleton} />
          ))}
        </div>
      </Panel>
    )
  }

  const call = meetings.data?.find((meeting) => meeting.status === "Scheduled")
  const firstPage = unread.data?.pages[0]
  const conversation = firstPage?.items[0]
  const moreUnread = (firstPage?.total ?? 0) - 1
  const allCampaigns = campaigns.data ?? []
  const paused = allCampaigns.filter((campaign) => campaign.status === "Paused")
  const steps = setupSteps(setup)
  const nextStep = steps.find((step) => !step.done)

  const todo: ReactNode[] = []
  const fine: ReactNode[] = []

  if (call) {
    todo.push(
      <Row
        key="call"
        tone="call"
        icon={Video}
        title={`Call with ${call.name}`}
        detail={formatMeetingTime(call.startsAt)}
      >
        {call.joinUrl ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={call.joinUrl} target="_blank" rel="noreferrer" />}
          >
            Join
          </Button>
        ) : (
          <LinkButton to="/calendar">Calendar</LinkButton>
        )}
      </Row>,
    )
  } else {
    fine.push(<Row key="call" icon={CalendarDays} title="No calls booked" />)
  }

  if (conversation) {
    // Line breaks would wrap the one-line preview, so they become spaces.
    const preview = conversation.lastSnippet.replace(/\s+/g, " ").trim()
    todo.push(
      <Row
        key="reply"
        tone="reply"
        icon={MessageSquare}
        title={
          moreUnread > 0
            ? `Reply from ${conversation.leadName} and ${moreUnread} more`
            : `Reply from ${conversation.leadName}`
        }
        detail={`${conversation.lastDirection === "Outbound" ? "You: " : ""}${preview}`}
      >
        <LinkButton to={`/inbox/${conversation.leadId}`}>Reply</LinkButton>
      </Row>,
    )
  } else {
    fine.push(<Row key="reply" icon={CircleCheck} title="No unread replies" />)
  }

  if (paused.length > 0) {
    todo.push(<PausedRow key="paused" campaign={paused[0]} count={paused.length} />)
  } else if (allCampaigns.length > 0) {
    fine.push(<Row key="paused" icon={CircleCheck} title="No paused campaigns" />)
  }

  if (nextStep) {
    todo.push(
      <Row
        key="setup"
        tone="setup"
        icon={ListChecks}
        title={nextStep.label}
        detail={`Setup ${steps.filter((step) => step.done).length} of ${steps.length} · ${nextStep.hint}`}
      >
        <LinkButton to={nextStep.to}>Set up</LinkButton>
      </Row>,
    )
  } else {
    fine.push(<Row key="setup" icon={CircleCheck} title="Setup complete" />)
  }

  return (
    <Panel
      title={todo.length > 0 ? `Needs you · ${todo.length}` : "Needs you"}
      className={className}
    >
      <ul className={styles.list}>
        {todo}
        {fine}
      </ul>
    </Panel>
  )
}

type Tone = "call" | "reply" | "paused" | "setup"

type RowProps = {
  /** Something to do gets its colour and a button; without a tone the row is a quiet "all fine". */
  tone?: Tone
  icon: LucideIcon
  title: string
  detail?: ReactNode
  children?: ReactNode
}

function Row({ tone, icon: Icon, title, detail, children }: RowProps) {
  return (
    <li className={cn(styles.row, tone ? styles[tone] : styles.fine)}>
      <span className={styles.icon} aria-hidden>
        <Icon />
      </span>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {detail && <span className={styles.detail}>{detail}</span>}
      </span>
      {children && <span className={styles.action}>{children}</span>}
    </li>
  )
}

function LinkButton({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Button variant="outline" size="sm" nativeButton={false} render={<Link to={to} />}>
      {children}
    </Button>
  )
}

/** A paused campaign, with Resume right on the row. Why it can't resume shows under its name. */
function PausedRow({ campaign, count }: { campaign: CampaignSummary; count: number }) {
  const change = useChangeCampaignStatus(campaign.id)
  const leads = campaign.counts.total
  const detail = change.isError
    ? change.error.message
    : leads === 0
      ? "No leads added yet"
      : `${leads} ${leads === 1 ? "lead" : "leads"} waiting`

  return (
    <Row
      tone="paused"
      icon={Pause}
      title={count === 1 ? `${campaign.name} is paused` : `${count} campaigns paused`}
      detail={<span className={cn(change.isError && styles.error)}>{detail}</span>}
    >
      <Button
        variant="outline"
        size="sm"
        disabled={change.isPending}
        onClick={() => change.mutate("resume")}
      >
        {change.isPending ? "Resuming…" : "Resume"}
      </Button>
    </Row>
  )
}
