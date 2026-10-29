import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AccountOption = { id: string; displayName: string; address?: string | null }

type AccountPickerProps = {
  id: string
  accounts: AccountOption[]
  value: string
  onChange: (accountId: string) => void
  invalid?: boolean
}

/** Chooses which connected account a message is sent from. */
export function AccountPicker({ id, accounts, value, onChange, invalid }: AccountPickerProps) {
  const items = Object.fromEntries(
    accounts.map((account) => [
      account.id,
      account.address ? `${account.displayName} · ${account.address}` : account.displayName,
    ]),
  )

  return (
    <Select
      modal={false}
      items={items}
      value={value || null}
      onValueChange={(next) => next && onChange(next)}
    >
      <SelectTrigger id={id} aria-invalid={invalid}>
        <SelectValue placeholder="Choose an account" />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            {items[account.id]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
