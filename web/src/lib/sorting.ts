import type { components } from "@/lib/api/schema"

export type SortDirection = components["schemas"]["SortDirection"]

/** Which column a table is sorted by, and which way. */
export type SortState<Column extends string> = { by: Column; direction: SortDirection }

/**
 * What happens when a column header is clicked. Each column cycles through three steps:
 * its natural direction (A–Z, smallest first, or newest first for dates), the reverse,
 * then back to the table's default sort.
 */
export function nextSort<Column extends string>(
  current: SortState<Column>,
  column: Column,
  defaultSort: SortState<Column>,
  firstDirection: (column: Column) => SortDirection = () => "Asc",
): SortState<Column> {
  const first = firstDirection(column)

  if (current.by !== column) {
    return { by: column, direction: first }
  }

  if (current.direction === first) {
    return { by: column, direction: first === "Asc" ? "Desc" : "Asc" }
  }

  return defaultSort
}
