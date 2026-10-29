import { Search, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback"
import { formatCheckSize } from "@/lib/formatCheckSize"
import { cn } from "@/lib/utils"
import { checkSizeKey } from "../filters"
import type { ExploreFilters, InvestorFilterOptions, ListFilter } from "../types"
import styles from "./InvestorFilters.module.css"
import { MultiSelectFilter } from "./MultiSelectFilter"

const ANY_CHECK_SIZE = "any"

const listFilterLabels: Record<ListFilter, string> = {
  stages: "Stage",
  industries: "Industry",
  geographies: "Geography",
  fundTypes: "Fund type",
  roles: "Role",
}

type InvestorFiltersProps = {
  filters: ExploreFilters
  /** Empty while the filter choices are loading. */
  options: InvestorFilterOptions | undefined
  activeCount: number
  onChange: (changes: Partial<ExploreFilters>) => void
  onClear: () => void
}

export function InvestorFilters({
  filters,
  options,
  activeCount,
  onChange,
  onClear,
}: InvestorFiltersProps) {
  // The box updates as you type; the search itself waits until typing pauses.
  const [searchText, setSearchText] = useState(filters.search)
  const applySearch = useDebouncedCallback((text: string) => onChange({ search: text.trim() }))

  const checkSizeItems = {
    [ANY_CHECK_SIZE]: "Any cheque size",
    ...Object.fromEntries(
      (options?.checkSizes ?? []).map((range) => [
        checkSizeKey(range),
        formatCheckSize(range.min, range.max),
      ]),
    ),
  }

  return (
    <div className={styles.filters}>
      <div className={styles.search}>
        <Search className={styles.searchIcon} aria-hidden />
        <Input
          type="search"
          value={searchText}
          onChange={(event) => {
            setSearchText(event.target.value)
            applySearch(event.target.value)
          }}
          placeholder="Search by name, firm or title"
          aria-label="Search investors"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.dropdowns}>
        {(Object.keys(listFilterLabels) as ListFilter[]).map((key) => (
          <MultiSelectFilter
            key={key}
            label={listFilterLabels[key]}
            options={options?.[key] ?? []}
            value={filters[key]}
            onChange={(value) => onChange({ [key]: value })}
          />
        ))}

        <Select
          modal={false}
          items={checkSizeItems}
          value={filters.checkSize ?? ANY_CHECK_SIZE}
          onValueChange={(value) =>
            onChange({ checkSize: value === ANY_CHECK_SIZE || value === null ? null : value })
          }
        >
          <SelectTrigger
            className={cn(styles.checkSize, filters.checkSize && styles.checkSizeActive)}
            aria-label="Filter by cheque size"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            className={styles.checkSizePopup}
            alignItemWithTrigger={false}
            align="start"
          >
            {Object.entries(checkSizeItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchText("")
              onClear()
            }}
          >
            <X aria-hidden /> Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
