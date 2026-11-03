import { Mail, MessageSquare, Search, Star, UserPlus, type LucideIcon } from "lucide-react"
import { NavLink } from "react-router"
import { Avatar } from "@/components/common/Avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { formatListTime } from "../format"
import { useConversationCounts, useConversations } from "../hooks/useConversations"
import type { ConversationCounts, ConversationView, MessageKind } from "../types"
import styles from "./ConversationList.module.css"

const kindIcons: Record<MessageKind, LucideIcon> = {
  Email: Mail,
  LinkedInMessage: MessageSquare,
  LinkedInInvitation: UserPlus,
}

const kindLabels: Record<MessageKind, string> = {
  Email: "Email",
  LinkedInMessage: "LinkedIn",
  LinkedInInvitation: "LinkedIn invitation",
}

const views: { value: ConversationView; label: string; count?: keyof ConversationCounts }[] = [
  { value: "All", label: "All" },
  { value: "Unread", label: "Unread", count: "unread" },
  { value: "Starred", label: "Starred", count: "starred" },
  { value: "Archived", label: "Archived" },
]

const emptyText: Record<ConversationView, string> = {
  All: "No conversations yet. Messages you send to leads, and their replies, show up here.",
  Unread: "You're all caught up.",
  Starred: "Star a conversation to keep it here.",
  Archived: "Nothing archived.",
}

type ConversationListProps = {
  selectedId: string | undefined
  view: ConversationView
  onViewChange: (view: ConversationView) => void
  search: string
  onSearchChange: (search: string) => void
  /** The search as sent to the API, after typing pauses. */
  appliedSearch: string | undefined
}

export function ConversationList({
  selectedId,
  view,
  onViewChange,
  search,
  onSearchChange,
  appliedSearch,
}: ConversationListProps) {
  const conversations = useConversations(view, appliedSearch)
  const counts = useConversationCounts()
  const items = conversations.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <section className={styles.column} aria-label="Conversations">
      <div className={styles.top}>
        <div className={styles.search}>
          <Search className={styles.searchIcon} aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search name, email or firm"
            aria-label="Search conversations"
            className={styles.searchInput}
          />
        </div>
        <Tabs value={view} onValueChange={(value) => onViewChange(value as ConversationView)}>
          <TabsList className={styles.tabs}>
            {views.map((item) => {
              const count = item.count ? counts.data?.[item.count] : undefined
              return (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                  {count ? <span className={styles.tabCount}>{count}</span> : null}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>

      <div className={cn(styles.scroll, conversations.isPlaceholderData && styles.loadingNext)}>
        {conversations.isPending ? (
          <div className={styles.skeletons} aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className={styles.skeletonRow} />
            ))}
          </div>
        ) : conversations.isError ? (
          <div className={styles.message}>
            <p>{conversations.error.message}</p>
            <Button variant="outline" size="sm" onClick={() => conversations.refetch()}>
              Try again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className={styles.message}>
            {appliedSearch ? "No conversations match this search." : emptyText[view]}
          </p>
        ) : (
          <ul className={styles.list}>
            {items.map((conversation) => {
              const KindIcon = kindIcons[conversation.lastKind]
              const unread = conversation.unreadCount > 0
              return (
                <li key={conversation.leadId}>
                  <NavLink
                    to={`/inbox/${conversation.leadId}`}
                    className={cn(
                      styles.item,
                      conversation.leadId === selectedId && styles.selected,
                      unread && styles.unread,
                    )}
                    aria-current={conversation.leadId === selectedId ? "page" : undefined}
                  >
                    <Avatar name={conversation.leadName} src={conversation.leadPictureUrl} />
                    <span className={styles.text}>
                      <span className={styles.row}>
                        <span className={styles.name}>{conversation.leadName}</span>
                        {conversation.isStarred && (
                          <Star className={styles.star} aria-label="Starred" />
                        )}
                        <span className={styles.time}>
                          {formatListTime(conversation.lastMessageAt)}
                        </span>
                      </span>
                      <span className={styles.row}>
                        <KindIcon
                          className={styles.kind}
                          aria-label={kindLabels[conversation.lastKind]}
                        />
                        <span className={styles.snippet}>
                          {conversation.lastDirection === "Outbound" && (
                            <span className={styles.you}>You: </span>
                          )}
                          {conversation.lastSnippet || kindLabels[conversation.lastKind]}
                        </span>
                        {unread && (
                          <span
                            className={styles.badge}
                            aria-label={`${conversation.unreadCount} unread`}
                          >
                            {conversation.unreadCount}
                          </span>
                        )}
                      </span>
                    </span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        )}

        {conversations.hasNextPage && (
          <div className={styles.more}>
            <Button
              variant="outline"
              size="sm"
              disabled={conversations.isFetchingNextPage}
              onClick={() => conversations.fetchNextPage()}
            >
              {conversations.isFetchingNextPage ? "Loading…" : "Show more"}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
