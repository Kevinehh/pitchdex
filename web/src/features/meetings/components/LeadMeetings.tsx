import { Video } from "lucide-react"
import { formatMeetingTime } from "../formatMeetingTime"
import type { Meeting } from "../types"
import styles from "./LeadMeetings.module.css"

/** The calls one lead booked on Calendly, for the Inbox's side panel. Nothing when there are none. */
export function LeadMeetings({
  meetings,
  labelClassName,
}: {
  meetings: Meeting[]
  labelClassName?: string
}) {
  if (meetings.length === 0) {
    return null
  }

  return (
    <section className={styles.meetings} aria-label="Meetings">
      <h4 className={labelClassName}>Meetings</h4>
      <ul className={styles.list}>
        {meetings.map((meeting) => {
          const canceled = meeting.status === "Canceled"
          return (
            <li key={meeting.id} className={styles.meeting}>
              <div className={styles.text}>
                <time
                  dateTime={meeting.startsAt}
                  className={canceled ? styles.canceled : undefined}
                >
                  {formatMeetingTime(meeting.startsAt)}
                </time>
                <span className={styles.title}>
                  {canceled ? `${meeting.title} · Canceled` : meeting.title}
                </span>
              </div>
              {meeting.joinUrl && !canceled && (
                <a href={meeting.joinUrl} target="_blank" rel="noreferrer" className={styles.join}>
                  <Video aria-hidden /> Join
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
