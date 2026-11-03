import { CalendarClock } from "lucide-react"
import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { MeetingCalendar, dayKey, parseDayKey, useCalendlySettings } from "@/features/meetings"
import styles from "./CalendarPage.module.css"

/** The calls leads booked on Calendly, a month at a time. The chosen day is in the address. */
export default function CalendarPage() {
  const [params, setParams] = useSearchParams()
  const day = params.get("day")
  const [today] = useState(() => new Date())
  const selected = useMemo(() => parseDayKey(day) ?? today, [day, today])
  const calendly = useCalendlySettings()

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Calls booked on your Calendly. Calls from leads open their conversation."
      />

      {calendly.isSuccess && !calendly.data.account && (
        <div className={styles.notice}>
          <CalendarClock className={styles.noticeIcon} aria-hidden />
          <p>
            Connect Calendly and the calls your leads book show up here. Leads who book move to
            Meeting and their campaigns stop.
          </p>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link to="/settings?tab=meetings" />}
          >
            Connect Calendly
          </Button>
        </div>
      )}

      <MeetingCalendar
        selected={selected}
        onSelect={(date) => setParams({ day: dayKey(date) }, { replace: true })}
      />
    </>
  )
}
