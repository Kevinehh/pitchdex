/**
 * Cache keys for server data, in one place. A feature that changes data can refresh
 * another feature's lists by key without importing that feature's code.
 */
export const queryKeys = {
  accounts: ["accounts"],
  calendly: ["calendly"],
  session: ["session"],
  campaigns: ["campaigns"],
  // Separate from "campaigns": saving a campaign mustn't refetch the gallery.
  campaignTemplates: ["campaign-templates"],
  dashboard: ["dashboard"],
  messages: ["messages"],
  investors: ["investors"],
  // Separate from "investors" so saving an investor doesn't refetch the filter lists.
  investorFilters: ["investor-filters"],
  leads: ["leads"],
  // Separate from "leads": each fetch is a LinkedIn profile view, so lead changes mustn't refetch it.
  linkedInProfiles: ["linkedin-profiles"],
  meetings: ["meetings"],
  workingHours: ["working-hours"],
} as const
