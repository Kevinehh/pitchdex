const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
})
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" })

/** "Today · 2:00 PM", "Tomorrow · 9:30 AM" or "Thu, Nov 12 · 2:00 PM", in the founder's own time zone. */
export function formatMeetingTime(isoDate: string, now = new Date()): string {
  const date = new Date(isoDate)
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000)
  const day = days === 0 ? "Today" : days === 1 ? "Tomorrow" : dayFormat.format(date)
  return `${day} · ${timeFormat.format(date)}`
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}
