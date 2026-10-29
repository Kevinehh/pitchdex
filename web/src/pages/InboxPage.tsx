import { MessagesSquare, RefreshCw } from "lucide-react"
import { useState } from "react"
import { useParams } from "react-router"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import {
  ConversationList,
  ConversationPane,
  useSyncInbox,
  type ConversationView,
} from "@/features/inbox"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import styles from "./InboxPage.module.css"

/** Conversations on the left, the open one in the middle, the lead's details on the right. */
export default function InboxPage() {
  const { leadId } = useParams()
  const [view, setView] = useState<ConversationView>("All")
  const [search, setSearch] = useState("")
  const appliedSearch = useDebouncedValue(search.trim()) || undefined
  const sync = useSyncInbox()

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Every conversation with your leads, by email and LinkedIn. New replies are checked every couple of minutes."
        actions={
          <Button variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
            <RefreshCw aria-hidden /> {sync.isPending ? "Checking…" : "Check for replies"}
          </Button>
        }
      />

      {sync.isSuccess && (
        <p role="status" className={styles.status}>
          {syncSummary(sync.data.newReplies, sync.data.acceptedInvitations ?? 0)}
        </p>
      )}
      {sync.isError && (
        <p role="alert" className={styles.error}>
          {sync.error.message}
        </p>
      )}

      <div className={styles.inbox} data-open={leadId ? "true" : "false"}>
        <div className={styles.listArea}>
          <ConversationList
            selectedId={leadId}
            view={view}
            onViewChange={setView}
            search={search}
            onSearchChange={setSearch}
            appliedSearch={appliedSearch}
          />
        </div>
        <div className={styles.conversationArea}>
          {leadId ? (
            // Keyed, so switching conversations starts a fresh reply box and scroll position.
            <ConversationPane key={leadId} leadId={leadId} />
          ) : (
            <div className={styles.placeholder}>
              <MessagesSquare aria-hidden />
              <p>Choose a conversation to read it and reply.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/** "2 new replies and 1 accepted invitation." */
function syncSummary(replies: number, accepted: number) {
  const parts = [
    replies > 0 && `${replies} new ${replies === 1 ? "reply" : "replies"}`,
    accepted > 0 && `${accepted} accepted ${accepted === 1 ? "invitation" : "invitations"}`,
  ].filter(Boolean)
  return parts.length === 0 ? "Nothing new." : `${parts.join(" and ")}.`
}
