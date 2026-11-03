/** Date helpers for the month calendar. All in the founder's own time zone. */

type WeekInfo = { firstDay: number }

/** 0 for Sunday, 1 for Monday: the first column, as the founder's locale has it. */
export const firstDayOfWeek = (() => {
  try {
    const locale = new Intl.Locale(navigator.language) as Intl.Locale & {
      getWeekInfo?: () => WeekInfo
      weekInfo?: WeekInfo
    }
    const info = locale.getWeekInfo?.() ?? locale.weekInfo
    // Intl counts Monday as 1 and Sunday as 7.
    return info ? info.firstDay % 7 : 0
  } catch {
    return 0
  }
})()

/** "2026-11-12", the key a day goes by in the address and when grouping meetings. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

/** The day a key names, or null when it isn't a real date. */
export function parseDayKey(key: string | null): Date | null {
  const match = key?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])]
  const date = new Date(year, month, day)
  return date.getMonth() === month && date.getDate() === day ? date : null
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/** The first of the month `months` away from the date's month. */
export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

export function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

/** Whole weeks covering the month: five or six rows of seven days. */
export function monthWeeks(month: Date): Date[][] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const start = addDays(first, -((first.getDay() - firstDayOfWeek + 7) % 7))
  const end = addDays(last, (firstDayOfWeek + 6 - last.getDay() + 7) % 7)

  const weeks: Date[][] = []
  for (let day = start; day <= end; day = addDays(day, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(day, index)))
  }
  return weeks
}
