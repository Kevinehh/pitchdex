/** "45%", or "—" when there's nothing to divide by yet. */
export function percent(part: number, whole: number): string {
  return whole === 0 ? "—" : `${Math.round((part / whole) * 100)}%`
}
