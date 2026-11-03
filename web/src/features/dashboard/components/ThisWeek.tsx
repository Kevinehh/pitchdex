import { useMemo, useState } from "react"
import { Link } from "react-router"
import { Panel } from "@/components/common/Panel"
import {
  addDays,
  dayKey,
  firstDayOfWeek,
  formatMeetingTime,
  useCalendlySettings,
  useMeetings,
  useUpcomingMeetings,
} from "@/features/meetings"
import { cn } from "@/lib/utils"
import styles from "./ThisWeek.module.css"

const COMING_UP = 3

const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: "narrow" })
const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
})

/** The current week as a strip, a dot on each day with a call, then the next few calls. */
export function ThisWeek({ className }: { className?: string }) {
  const [today] = useState(() => new Date())
  const days = useMemo(() => {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    start.setDate(start.getDate() - ((start.getDay() - firstDayOfWeek + 7) % 7))
    return Array.from({ length: 7 }, (_, index) => addDays(start, index))
  }, [today])
  const week = useMeetings(days[0], addDays(days[6], 1))
  const upcoming = useUpcomingMeetings()
  const connected = !!useCalendlySettings().data?.account

  const callsByDay = new Map<string, number>()
  for (const meeting of week.data ?? []) {
    if (meeting.status === "Scheduled") {
      const key = dayKey(new Date(meeting.startsAt))
      callsByDay.set(key, (callsByDay.get(key) ?? 0) + 1)
    }
  }
  const todayKey = dayKey(today)
  const next = (upcoming.data ?? [])
    .filter((meeting) => meeting.status === "Scheduled")
    .slice(0, COMING_UP)

  return (
    <Panel title="This week" action={{ label: "Calendar", to: "/calendar" }} className={className}>
      <ol className={styles.strip}>
        {days.map((day) => {
          const key = dayKey(day)
          const calls = callsByDay.get(key) ?? 0
          return (
            <li key={key}>
              <Link
                to={`/calendar?day=${key}`}
                className={cn(styles.day, key === todayKey && styles.today)}
                aria-label={`${dayFormat.format(day)}, ${callCount(calls)}`}
              >
                <span className={styles.weekday} aria-hidden>
                  {weekdayFormat.format(day)}
                </span>
                <span className={styles.date} aria-hidden>
                  {day.getDate()}
                </span>
                <span className={styles.dots} aria-hidden>
                  {Array.from({ length: Math.min(calls, 3) }, (_, index) => (
                    <span key={index} />
                  ))}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>

      {next.length > 0 ? (
        <ul className={styles.calls}>
          {next.map((meeting) => (
            <li key={meeting.id} className={styles.call}>
              <time dateTime={meeting.startsAt} className={styles.when}>
                {formatMeetingTime(meeting.startsAt)}
              </time>
              {meeting.leadId ? (
                <Link to={`/inbox/${meeting.leadId}`} className={styles.who}>
                  {meeting.name}
                </Link>
              ) : (
                <span className={styles.who}>{meeting.name}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>
          {connected ? (
            "No calls booked. Calls booked on your Calendly show up here."
          ) : (
            <>
              <Link to="/settings?tab=meetings">Connect Calendly</Link> and the calls your leads
              book show up here.
            </>
          )}
        </p>
      )}
    </Panel>
  )
}

function callCount(count: number) {
  return count === 0 ? "no calls" : count === 1 ? "1 call" : `${count} calls`
}
