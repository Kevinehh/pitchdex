/** The choices in every table's "Rows per page" picker. The API allows up to 100. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

export const DEFAULT_PAGE_SIZE = 25

/** Accepts only one of the offered sizes, so a hand-edited address can't ask for 5,000 rows. */
export function toPageSize(value: unknown): number {
  const size = Number(value)
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE
}
