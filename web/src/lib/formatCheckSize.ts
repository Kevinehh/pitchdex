const compact = (amount: number) => {
  if (amount >= 1_000_000) return `$${amount / 1_000_000}M`
  if (amount >= 1_000) return `$${amount / 1_000}k`
  return `$${amount}`
}

/** A cheque range in US dollars as people say it: "$100k–$500k", or "$50M+" with no maximum. */
export function formatCheckSize(min: number | null | undefined, max: number | null | undefined) {
  if (min == null) return "—"
  if (max == null) return `${compact(min)}+`
  return `${compact(min)}–${compact(max)}`
}
