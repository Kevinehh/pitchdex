const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" })
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: "short" })
const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" })
const fullDateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "long" })

const DAY = 86_400_000

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

/** For the list: "2:30 PM" today, "Mon" this week, "Oct 26" before that. */
export function formatListTime(iso: string, now = new Date()): string {
  const date = new Date(iso)
  const days = (startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY
  if (days < 1) return timeFormat.format(date)
  if (days < 7) return weekdayFormat.format(date)
  return dateFormat.format(date)
}

/** For a message: just the time. Its day is shown by the separator above it. */
export const formatMessageTime = (iso: string) => timeFormat.format(new Date(iso))

/** For day separators: "Today", "Yesterday", "October 24, 2026". */
export function formatDay(iso: string, now = new Date()): string {
  const days = (startOfDay(now).getTime() - startOfDay(new Date(iso)).getTime()) / DAY
  if (days < 1) return "Today"
  if (days < 2) return "Yesterday"
  return fullDateFormat.format(new Date(iso))
}

/** Groups key: the local calendar day a message was sent. */
export const dayKey = (iso: string) => startOfDay(new Date(iso)).toISOString()
