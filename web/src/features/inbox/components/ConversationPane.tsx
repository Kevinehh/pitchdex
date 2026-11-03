import { Archive, ArchiveRestore, ArrowLeft, MailOpen, Star } from "lucide-react"
import { useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router"
import { Avatar } from "@/components/common/Avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useUpdateLead } from "@/features/leads"
import { ApiError } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import { useConversation, useUpdateConversation } from "../hooks/useConversations"
import { LeadPanel } from "./LeadPanel"
import { MessageThread } from "./MessageThread"
import { ReplyComposer } from "./ReplyComposer"
import styles from "./ConversationPane.module.css"

/** One open conversation: the messages, a reply box, and who the lead is. */
export function ConversationPane({ leadId }: { leadId: string }) {
  const conversation = useConversation(leadId)
  const update = useUpdateConversation(leadId)
  const updateLead = useUpdateLead()
  const navigate = useNavigate()

  // Reading a conversation marks its replies read, including ones that arrive while it's open.
  // Remembering which fetch was marked stops a second request before the refetch lands.
  const markedFetch = useRef(0)
  const { mutate: changeConversation } = update
  const unread = conversation.data?.unreadCount ?? 0
  useEffect(() => {
    if (unread > 0 && markedFetch.current !== conversation.dataUpdatedAt) {
      markedFetch.current = conversation.dataUpdatedAt
      changeConversation({ isRead: true })
    }
  }, [unread, conversation.dataUpdatedAt, changeConversation])

  if (conversation.isPending) {
    return (
      <div className={styles.pane} aria-busy="true">
        <div className={styles.loading}>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton
              key={index}
              className={cn(styles.skeleton, index % 2 === 1 && styles.right)}
            />
          ))}
        </div>
      </div>
    )
  }

  if (conversation.isError) {
    const missing = conversation.error instanceof ApiError && conversation.error.status === 404
    return (
      <div className={styles.pane}>
        <div className={styles.problem}>
          <p>{missing ? "This conversation doesn't exist." : conversation.error.message}</p>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link to="/inbox" />}>
            Back to the inbox
          </Button>
        </div>
      </div>
    )
  }

  const { lead, isArchived } = conversation.data
  const firstName = lead.fullName.split(" ")[0]
  const problem = update.error?.message ?? updateLead.error?.message

  return (
    <div className={styles.pane}>
      <section className={styles.thread} aria-label={`Conversation with ${lead.fullName}`}>
        <header className={styles.header}>
          <Link to="/inbox" className={styles.back} aria-label="Back to conversations">
            <ArrowLeft />
          </Link>
          <Avatar name={lead.fullName} src={lead.linkedIn?.pictureUrl} />
          <div className={styles.who}>
            <h2 className={styles.name}>{lead.fullName}</h2>
            <p className={styles.sub}>
              {lead.linkedIn?.headline ?? [lead.title, lead.firm].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className={styles.actions}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-pressed={lead.isStarred}
              aria-label={lead.isStarred ? "Unstar" : "Star"}
              title={lead.isStarred ? "Unstar" : "Star"}
              onClick={() => updateLead.mutate({ id: lead.id, isStarred: !lead.isStarred })}
            >
              <Star className={cn(lead.isStarred && styles.starred)} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Mark as unread"
              title="Mark as unread"
              onClick={() =>
                // Leaving it, or opening it again would mark it read straight away.
                update.mutate({ isRead: false }, { onSuccess: () => navigate("/inbox") })
              }
            >
              <MailOpen />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={isArchived ? "Move back to the inbox" : "Archive"}
              title={isArchived ? "Move back to the inbox" : "Archive"}
              onClick={() => update.mutate({ isArchived: !isArchived })}
            >
              {isArchived ? <ArchiveRestore /> : <Archive />}
            </Button>
          </div>
        </header>

        {isArchived && (
          <p className={styles.note}>
            Archived. It comes back to the inbox if {firstName} writes again.
          </p>
        )}
        {problem && (
          <p role="alert" className={styles.error}>
            {problem}
          </p>
        )}

        <MessageThread messages={conversation.data.messages} />
        <ReplyComposer key={leadId} lead={lead} reply={conversation.data.reply} />
      </section>

      <LeadPanel conversation={conversation.data} />
    </div>
  )
}
