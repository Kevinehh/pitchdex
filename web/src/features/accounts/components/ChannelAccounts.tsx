import { Mail, MessagesSquare, Plus, RefreshCw } from "lucide-react"
import { useState } from "react"
import { PanelList, PanelRow } from "@/components/common/Panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  useAccounts,
  useConnectAccount,
  useReconnectAccount,
  useSyncAccounts,
} from "../hooks/useAccounts"
import type { Account, AccountChannel } from "../types"
import styles from "./ChannelAccounts.module.css"
import { ConnectLinkedInDialog } from "./ConnectLinkedInDialog"

const emptyText: Record<AccountChannel, string> = {
  Email: "No mailbox connected yet. Connect a Google or Microsoft mailbox.",
  LinkedIn: "No LinkedIn account connected yet.",
}

/** The founder's mailboxes, or their LinkedIn accounts, with a button to connect another. */
export function ChannelAccounts({ channel }: { channel: AccountChannel }) {
  const accounts = useAccounts()
  const connect = useConnectAccount()
  const sync = useSyncAccounts()
  const [linkedInDialogOpen, setLinkedInDialogOpen] = useState(false)
  const [showDisconnected, setShowDisconnected] = useState(false)

  const inChannel = (accounts.data ?? []).filter((account) => account.channel === channel)
  // Accounts removed at the provider stay listed for their history, but out of the way.
  const active = inChannel.filter((account) => account.status !== "Disconnected")
  const disconnected = inChannel.filter((account) => account.status === "Disconnected")
  const shown = showDisconnected ? [...active, ...disconnected] : active
  const error = accounts.error ?? connect.error ?? sync.error

  return (
    <div className={styles.accounts}>
      {shown.length === 0 ? (
        <p className={styles.empty}>{accounts.isPending ? "Loading…" : emptyText[channel]}</p>
      ) : (
        <PanelList>
          {shown.map((account) => (
            <AccountRow key={account.id} account={account} />
          ))}
        </PanelList>
      )}

      {disconnected.length > 0 && (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={showDisconnected}
          onClick={() => setShowDisconnected(!showDisconnected)}
        >
          {showDisconnected
            ? "Hide disconnected accounts"
            : `Show ${disconnected.length} disconnected ${disconnected.length === 1 ? "account" : "accounts"}`}
        </button>
      )}

      {error && (
        <p role="alert" className={styles.error}>
          {error.message}
        </p>
      )}

      <div className={styles.actions}>
        {channel === "Email" ? (
          <Button onClick={() => connect.mutate("Email")} disabled={connect.isPending}>
            <Plus aria-hidden /> Connect a mailbox
          </Button>
        ) : (
          <Button onClick={() => setLinkedInDialogOpen(true)}>
            <Plus aria-hidden /> Connect LinkedIn
          </Button>
        )}
        <Button variant="ghost" onClick={() => sync.mutate()} disabled={sync.isPending}>
          <RefreshCw aria-hidden /> {sync.isPending ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {channel === "LinkedIn" && (
        <ConnectLinkedInDialog open={linkedInDialogOpen} onOpenChange={setLinkedInDialogOpen} />
      )}
    </div>
  )
}

function AccountRow({ account }: { account: Account }) {
  const reconnect = useReconnectAccount()
  const Icon = account.channel === "Email" ? Mail : MessagesSquare

  return (
    <PanelRow>
      <Icon className={styles.icon} aria-hidden />
      <div className={styles.who}>
        <span className={styles.name}>{account.displayName}</span>
        {account.address && <span className={styles.address}>{account.address}</span>}
      </div>
      {account.status === "Connected" && (
        <Badge variant="outline" className={styles.connected}>
          Connected
        </Badge>
      )}
      {account.status === "NeedsReconnect" && (
        <>
          <Badge variant="destructive">Needs reconnecting</Badge>
          <Button
            size="sm"
            variant="outline"
            disabled={reconnect.isPending}
            onClick={() => reconnect.mutate(account.id)}
          >
            Reconnect
          </Button>
        </>
      )}
      {account.status === "Disconnected" && <Badge variant="secondary">Disconnected</Badge>}
    </PanelRow>
  )
}
