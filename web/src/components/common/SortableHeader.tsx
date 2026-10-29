import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import type { SortState } from "@/lib/sorting"
import { cn } from "@/lib/utils"
import styles from "./SortableHeader.module.css"

type SortableHeaderProps<Column extends string> = {
  column: Column
  label: string
  sort: SortState<Column>
  onSort: (column: Column) => void
  className?: string
}

/**
 * A table column header that sorts by its column when clicked. The arrow shows the
 * current direction; unsorted columns show a faint two-way arrow.
 */
export function SortableHeader<Column extends string>({
  column,
  label,
  sort,
  onSort,
  className,
}: SortableHeaderProps<Column>) {
  const active = sort.by === column
  const Icon = !active ? ArrowUpDown : sort.direction === "Asc" ? ArrowUp : ArrowDown

  return (
    <TableHead
      className={className}
      aria-sort={active ? (sort.direction === "Asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        className={cn(styles.button, active && styles.active)}
        onClick={() => onSort(column)}
      >
        {label}
        <Icon className={styles.icon} aria-hidden />
      </button>
    </TableHead>
  )
}
