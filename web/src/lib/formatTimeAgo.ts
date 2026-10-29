/** Short "how long ago" text for lists: "now", "12m", "5h", "3d". */
export function formatTimeAgo(isoDate: string, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(isoDate).getTime()) / 60_000)

  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`

  return `${Math.floor(hours / 24)}d`
}
