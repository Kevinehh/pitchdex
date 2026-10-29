/*
 * The accounts feature's public face. Other features import from "@/features/accounts",
 * never from its folders, so its insides can change freely.
 */
export { AccountPicker } from "./components/AccountPicker"
export { ChannelAccounts } from "./components/ChannelAccounts"
export { SendingLimitsEditor } from "./components/SendingLimitsEditor"
export { useAccounts, useSyncAccounts, useUpdateAccountLimits } from "./hooks/useAccounts"
export type { Account, AccountChannel, AccountStatus, DailyLimit } from "./types"
