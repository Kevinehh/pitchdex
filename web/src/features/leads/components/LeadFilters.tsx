import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ALL_CAMPAIGNS, NO_CAMPAIGN, type CampaignFilter } from "../campaignFilter"
import { LEAD_STATUSES, type LeadStatus } from "../types"
import styles from "./LeadFilters.module.css"

const ALL = "all"

const statusItems = {
  [ALL]: "All statuses",
  ...Object.fromEntries(LEAD_STATUSES.map((status) => [status, status])),
}

type LeadFiltersProps = {
  search: string
  onSearchChange: (search: string) => void
  status: LeadStatus | undefined
  onStatusChange: (status: LeadStatus | undefined) => void
  campaign: CampaignFilter
  onCampaignChange: (campaign: CampaignFilter) => void
  /** The campaigns to filter by. */
  campaigns: { id: string; name: string }[]
}

export function LeadFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  campaign,
  onCampaignChange,
  campaigns,
}: LeadFiltersProps) {
  const campaignItems = {
    [ALL_CAMPAIGNS]: "All campaigns",
    [NO_CAMPAIGN]: "Not in a campaign",
    ...Object.fromEntries(campaigns.map((item) => [item.id, item.name])),
  }

  return (
    <div className={styles.filters}>
      <div className={styles.search}>
        <Search className={styles.searchIcon} aria-hidden />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search name, email or firm"
          aria-label="Search leads"
          className={styles.searchInput}
        />
      </div>

      <Select
        modal={false}
        items={campaignItems}
        value={campaign}
        onValueChange={(value) => value && onCampaignChange(value)}
      >
        <SelectTrigger className={styles.campaign} aria-label="Filter by campaign">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} align="start">
          <SelectItem value={ALL_CAMPAIGNS}>All campaigns</SelectItem>
          <SelectItem value={NO_CAMPAIGN}>Not in a campaign</SelectItem>
          {campaigns.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        modal={false}
        items={statusItems}
        value={status ?? ALL}
        onValueChange={(value) =>
          onStatusChange(value === ALL || value === null ? undefined : (value as LeadStatus))
        }
      >
        <SelectTrigger className={styles.status} aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} align="start">
          <SelectItem value={ALL}>All statuses</SelectItem>
          {LEAD_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
