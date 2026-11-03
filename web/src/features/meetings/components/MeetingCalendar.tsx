import { ChevronLeft, ChevronRight, Video } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router"
import { Avatar } from "@/components/common/Avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { addDays, addMonths, dayKey, monthWeeks, sameMonth } from "../calendarDays"
import { useMeetings } from "../hooks/useMeetings"
import type { Meeting } from "../types"
import styles from "./MeetingCalendar.module.css"

/** How many calls a day's box lists before "+2 more". */
const SHOWN_PER_DAY = 3

const monthFormat = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" })
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: "short" })
const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
})
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" })
const hourFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric" })

/** "2 PM" on the hour, "2:30 PM" otherwise, so names in a day's box get more room. */
function shortTime(isoDate: string) {
  const date = new Date(isoDate)
  return (date.getMinutes() === 0 ? hourFormat : timeFormat).format(date)
}

type MeetingCalendarProps = {
  /** The day whose calls are listed beside the month. Its month is the one shown. */
  selected: Date
  onSelect: (day: Date) => void
}

/** A month of calls booked on Calendly, with the chosen day's calls listed in full. */
export function MeetingCalendar({ selected, onSelect }: MeetingCalendarProps) {
  const weeks = useMemo(() => monthWeeks(selected), [selected])
  const first = weeks[0][0]
  const meetings = useMeetings(first, addDays(weeks.at(-1)![6], 1))
  const byDay = useMemo(() => groupByDay(meetings.data ?? []), [meetings.data])
  const [today] = useState(() => dayKey(new Date()))
  const selectedKey = dayKey(selected)

  function goToMonth(months: number) {
    const month = addMonths(selected, months)
    onSelect(sameMonth(month, new Date()) ? new Date() : month)
  }

  return (
    <div className={styles.layout}>
      <section className={styles.month} aria-labelledby="calendar-month">
        <header className={styles.toolbar}>
          <h2 id="calendar-month" className={styles.monthTitle} aria-live="polite">
            {monthFormat.format(selected)}
          </h2>
          <div className={styles.toolbarActions}>
            <Button variant="outline" size="sm" onClick={() => onSelect(new Date())}>
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => goToMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => goToMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </header>

        {meetings.isError && (
          <p role="alert" className={styles.error}>
            Meetings couldn&apos;t load. {meetings.error.message}{" "}
            <button type="button" className={styles.retry} onClick={() => meetings.refetch()}>
              Try again
            </button>
          </p>
        )}

        <div
          className={cn(styles.grid, meetings.isFetching && styles.fetching)}
          aria-busy={meetings.isFetching}
        >
          {weeks[0].map((day) => (
            <div key={day.getDay()} className={styles.weekday} aria-hidden>
              {weekdayFormat.format(day)}
            </div>
          ))}
          {weeks.flat().map((day) => {
            const key = dayKey(day)
            const calls = byDay.get(key) ?? []
            const booked = calls.filter((meeting) => meeting.status === "Scheduled")
            return (
              <button
                key={key}
                type="button"
                className={cn(
                  styles.day,
                  !sameMonth(day, selected) && styles.otherMonth,
                  key === today && styles.today,
                  key === selectedKey && styles.selected,
                )}
                aria-pressed={key === selectedKey}
                aria-label={`${dayFormat.format(day)}, ${callCount(booked.length)}`}
                onClick={() => onSelect(day)}
              >
                <span className={styles.dayNumber}>{day.getDate()}</span>
                {calls.length > 0 && (
                  <span className={styles.calls} aria-hidden>
                    {calls.slice(0, SHOWN_PER_DAY).map((meeting) => (
                      <span
                        key={meeting.id}
                        className={cn(
                          styles.call,
                          meeting.status === "Canceled" && styles.canceled,
                        )}
                      >
                        <span className={styles.callTime}>{shortTime(meeting.startsAt)}</span>{" "}
                        {meeting.name}
                      </span>
                    ))}
                    {calls.length > SHOWN_PER_DAY && (
                      <span className={styles.more}>+{calls.length - SHOWN_PER_DAY} more</span>
                    )}
                  </span>
                )}
                {booked.length > 0 && (
                  <span className={styles.dots} aria-hidden>
                    {booked.slice(0, SHOWN_PER_DAY).map((meeting) => (
                      <span key={meeting.id} className={styles.dot} />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <DayAgenda day={selected} meetings={byDay.get(selectedKey) ?? []} />
    </div>
  )
}

function DayAgenda({ day, meetings }: { day: Date; meetings: Meeting[] }) {
  return (
    <section className={styles.agenda} aria-labelledby="calendar-day">
      <h2 id="calendar-day" className={styles.agendaTitle}>
        {dayFormat.format(day)}
      </h2>
      {meetings.length === 0 ? (
        <p className={styles.muted}>No calls this day.</p>
      ) : (
        <ul className={styles.agendaList}>
          {meetings.map((meeting) => {
            const canceled = meeting.status === "Canceled"
            return (
              <li key={meeting.id} className={styles.agendaItem}>
                <div className={styles.agendaTime}>
                  <time dateTime={meeting.startsAt} className={cn(canceled && styles.struck)}>
                    {timeFormat.formatRange(new Date(meeting.startsAt), new Date(meeting.endsAt))}
                  </time>
                  {canceled && <Badge variant="outline">Canceled</Badge>}
                </div>
                {meeting.leadId ? (
                  <Link to={`/inbox/${meeting.leadId}`} className={styles.lead}>
                    <Person meeting={meeting} />
                  </Link>
                ) : (
                  <div className={styles.person}>
                    <Person meeting={meeting} />
                  </div>
                )}
                <p className={styles.meetingTitle}>{meeting.title}</p>
                {meeting.joinUrl && !canceled && (
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<a href={meeting.joinUrl} target="_blank" rel="noreferrer" />}
                    className={styles.join}
                  >
                    <Video aria-hidden /> Join call
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/** Who a call is with: a lead and their firm, or the name and email someone booked with. */
function Person({ meeting }: { meeting: Meeting }) {
  const detail = meeting.leadId ? meeting.firm : meeting.email
  return (
    <>
      <Avatar name={meeting.name} src={meeting.pictureUrl} size="sm" />
      <span className={styles.leadText}>
        <span className={styles.leadName}>{meeting.name}</span>
        {detail && <span className={styles.muted}>{detail}</span>}
      </span>
    </>
  )
}

/** Meetings by the day they start on, each day's soonest first (the API's order). */
function groupByDay(meetings: Meeting[]) {
  const days = new Map<string, Meeting[]>()
  for (const meeting of meetings) {
    const key = dayKey(new Date(meeting.startsAt))
    days.set(key, [...(days.get(key) ?? []), meeting])
  }
  return days
}

function callCount(count: number) {
  return count === 0 ? "no calls" : count === 1 ? "1 call" : `${count} calls`
}
