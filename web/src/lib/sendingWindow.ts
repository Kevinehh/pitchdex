/**
 * Time zones and hours for choosing a sending window, shared by each campaign's settings
 * and the workspace's default working hours.
 */

/** Zones most founders send to. Callers add the saved zone and the browser's if missing. */
const COMMON_TIME_ZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Stockholm",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
]

/** "New York · GMT-4" */
function timeZoneLabel(zone: string): string {
  const city = zone.split("/").at(-1)?.replaceAll("_", " ") ?? zone
  try {
    const offset = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value
    return offset && zone !== "UTC" ? `${city} · ${offset}` : city
  } catch {
    return city
  }
}

/** The zones to offer, including the one already chosen and the browser's own, with labels. */
export function timeZoneOptions(current: string) {
  const zones = [
    ...new Set([...COMMON_TIME_ZONES, current, Intl.DateTimeFormat().resolvedOptions().timeZone]),
  ]
  return { zones, labels: Object.fromEntries(zones.map((zone) => [zone, timeZoneLabel(zone)])) }
}

const hourFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric" })

/** 9 → "9 AM", 24 → "Midnight" (the end of the day). */
const hourLabel = (hour: number) =>
  hour === 24 ? "Midnight" : hourFormat.format(new Date(2000, 0, 1, hour))

/** Start hours: midnight to 11 PM. */
export const FROM_HOURS: Record<string, string> = Object.fromEntries(
  Array.from({ length: 24 }, (_, hour) => [hour, hourLabel(hour)]),
)

/** End hours: 1 AM to the end of the day. */
export const UNTIL_HOURS: Record<string, string> = Object.fromEntries(
  Array.from({ length: 24 }, (_, index) => [index + 1, hourLabel(index + 1)]),
)
