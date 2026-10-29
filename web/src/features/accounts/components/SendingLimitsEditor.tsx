import { Mail, MessagesSquare } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"
import { Slider } from "@/components/ui/slider"
import { useAccounts, useUpdateAccountLimits } from "../hooks/useAccounts"
import type { Account, DailyLimit } from "../types"
import styles from "./SendingLimitsEditor.module.css"

const kindLabels: Record<DailyLimit["kind"], string> = {
  LinkedInInvitation: "Connection requests",
  LinkedInMessage: "LinkedIn messages",
  Email: "Emails",
}

/**
 * How much each connected account sends a day. Campaigns and manual sends both count, over
 * a rolling 24 hours. A change saves as soon as the slider is let go.
 */
export function SendingLimitsEditor() {
  const accounts = useAccounts()
  const editable = (accounts.data ?? []).filter((account) => account.status !== "Disconnected")

  if (accounts.isPending) {
    return <p className={styles.empty}>Loading…</p>
  }

  if (editable.length === 0) {
    return (
      <p className={styles.empty}>
        Connect a LinkedIn account or mailbox on the <Link to="/account">Account</Link> page to set
        its limits.
      </p>
    )
  }

  return (
    <div className={styles.accounts}>
      {editable.map((account) => (
        <AccountLimits key={account.id} account={account} />
      ))}
    </div>
  )
}

function AccountLimits({ account }: { account: Account }) {
  const update = useUpdateAccountLimits(account.id)
  const Icon = account.channel === "Email" ? Mail : MessagesSquare

  return (
    <section className={styles.account} aria-label={`${account.displayName} limits`}>
      <header className={styles.header}>
        <Icon className={styles.icon} aria-hidden />
        <span className={styles.name}>{account.displayName}</span>
        {account.address && <span className={styles.address}>{account.address}</span>}
        <span className={styles.status} aria-live="polite">
          {update.isPending ? "Saving…" : update.isSuccess ? "Saved" : ""}
        </span>
      </header>

      {account.limits.map((limit) => (
        <LimitRow
          key={limit.kind}
          limit={limit}
          onCommit={(value, onFailed) =>
            update.mutate(
              { accountId: account.id, limits: [{ kind: limit.kind, limit: value }] },
              { onError: onFailed },
            )
          }
        />
      ))}

      {update.isError && (
        <p role="alert" className={styles.error}>
          {update.error.message}
        </p>
      )}
    </section>
  )
}

type LimitRowProps = {
  limit: DailyLimit
  /** Saves the value. `onFailed` is called if the save doesn't go through. */
  onCommit: (value: number, onFailed: () => void) => void
}

/**
 * One slider. It moves freely while dragged and saves once released. The chosen value stays
 * on screen while saving, so the next change starts from it, and only reverts if saving fails.
 */
function LimitRow({ limit, onCommit }: LimitRowProps) {
  const [draft, setDraft] = useState<number | null>(null)
  const value = draft ?? limit.limit
  const label = kindLabels[limit.kind]

  return (
    <div className={styles.row}>
      <div className={styles.rowText}>
        <span className={styles.label}>{label}</span>
        <span className={styles.sent}>
          {limit.sentLast24Hours} sent in the last 24 hours · default {limit.default}
        </span>
      </div>
      <Slider
        className={styles.slider}
        min={0}
        max={limit.max}
        value={[value]}
        aria-label={`${label} a day`}
        onValueChange={(next) => setDraft(Array.isArray(next) ? next[0] : next)}
        onValueCommitted={(next) => {
          const committed = Array.isArray(next) ? next[0] : next
          setDraft(committed)
          onCommit(committed, () => setDraft(null))
        }}
      />
      <span className={styles.value}>
        {value}
        <span className={styles.max}> / {limit.max}</span>
      </span>
    </div>
  )
}
