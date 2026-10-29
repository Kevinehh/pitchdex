import type { components } from "@/lib/api/schema"
import type { SortDirection } from "@/lib/sorting"

export type Lead = components["schemas"]["LeadDto"]
export type LeadStatus = NonNullable<components["schemas"]["LeadStatus"]>
export type LeadSort = components["schemas"]["LeadSort"]
export type CreateLeadInput = components["schemas"]["CreateLeadCommand"]
export type UpdateLeadInput = components["schemas"]["UpdateLeadCommand"]
export type LeadCampaign = components["schemas"]["LeadCampaignDto"]

export type LeadsQuery = {
  page: number
  pageSize?: number
  status?: LeadStatus
  search?: string
  sortBy?: LeadSort
  sortDirection?: SortDirection
  campaignId?: string
  noCampaign?: boolean
}

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Replied",
  "Meeting",
  "Passed",
] as const satisfies readonly LeadStatus[]
