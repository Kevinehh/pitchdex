import { ChevronLeft, ChevronRight } from "lucide-react"
import { useId } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PAGE_SIZE_OPTIONS } from "@/lib/paging"
import styles from "./Pagination.module.css"

type PaginationProps = {
  page: number
  pageSize: number
  total: number
  /** How many rows the current page actually shows. */
  itemCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

/** "Rows per page", "1–25 of 190", and Previous / Next, for the bottom of a paged table. */
export function Pagination({
  page,
  pageSize,
  total,
  itemCount,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const labelId = useId()
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = from + itemCount - 1
  const lastPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <nav className={styles.pagination} aria-label="Pages">
      <div className={styles.left}>
        <span className={styles.label} id={labelId}>
          Rows per page
        </span>
        <Select
          modal={false}
          value={String(pageSize)}
          onValueChange={(value) => value && onPageSizeChange(Number(value))}
        >
          <SelectTrigger size="sm" className={styles.sizeTrigger} aria-labelledby={labelId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start" side="top">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className={styles.range}>
          {from}–{to} of {total}
        </span>
      </div>

      <div className={styles.buttons}>
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  )
}
