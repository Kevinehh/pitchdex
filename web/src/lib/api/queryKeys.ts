/**
 * Cache keys for server data, in one place. A feature that changes data can refresh
 * another feature's lists by key without importing that feature's code.
 */
export const queryKeys = {
  accounts: ["accounts"],
  session: ["session"],
  campaigns: ["campaigns"],
  dashboard: ["dashboard"],
  messages: ["messages"],
  investors: ["investors"],
  // Separate from "investors" so saving an investor doesn't refetch the filter lists.
  investorFilters: ["investor-filters"],
  leads: ["leads"],
  workingHours: ["working-hours"],
} as const
