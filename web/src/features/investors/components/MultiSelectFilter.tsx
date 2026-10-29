import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import styles from "./MultiSelectFilter.module.css"

type MultiSelectFilterProps = {
  /** Shown when nothing is chosen, such as "Stage". */
  label: string
  options: readonly string[]
  value: string[]
  onChange: (value: string[]) => void
}

/** A dropdown where several values can be ticked. Shows "Stage", "Seed" or "Stage · 3". */
export function MultiSelectFilter({ label, options, value, onChange }: MultiSelectFilterProps) {
  return (
    // modal={false}: while open, the rest of the page stays clickable, so clicking the
    // next filter opens it in one click instead of only closing this one.
    <Select multiple modal={false} value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(styles.trigger, value.length > 0 && styles.active)}
        aria-label={`Filter by ${label.toLowerCase()}`}
      >
        <SelectValue className={styles.label}>
          {(selected: string[]) =>
            selected.length === 0
              ? label
              : selected.length === 1
                ? selected[0]
                : `${label} · ${selected.length}`
          }
        </SelectValue>
      </SelectTrigger>
      {/* Opens below the button instead of on top of it, so the choice stays visible. */}
      <SelectContent className={styles.popup} alignItemWithTrigger={false} align="start">
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
