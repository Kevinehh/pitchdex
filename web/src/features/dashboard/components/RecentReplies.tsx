import { Link } from "react-router"
import { Panel, PanelList, PanelMeta, PanelRow } from "@/components/common/Panel"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRecentReplies } from "@/features/inbox"
import { formatTimeAgo } from "@/lib/formatTimeAgo"
import styles from "./RecentReplies.module.css"

const SHOWN = 5

/** The latest replies from leads, each opening its conversation in the Inbox. */
export function RecentReplies() {
  const replies = useRecentReplies(SHOWN)

  return (
    <Panel title="Recent replies" action={{ label: "Open inbox", to: "/inbox" }}>
      {replies.isPending ? (
        <div className={styles.loading} aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className={styles.skeleton} />
          ))}
        </div>
      ) : replies.isError ? (
        <div className={styles.empty}>
          <p>Replies couldn&apos;t load. {replies.error.message}</p>
          <Button variant="outline" size="sm" onClick={() => replies.refetch()}>
            Try again
          </Button>
        </div>
      ) : replies.data.length === 0 ? (
        <p className={styles.empty}>
          No replies yet. They show up here as soon as investors answer.
        </p>
      ) : (
        <PanelList>
          {replies.data.map((reply) => {
            // Line breaks would wrap the one-line preview, so they become spaces.
            const preview = reply.body.replace(/\s+/g, " ").trim()
            return (
              <PanelRow key={reply.id}>
                <Link
                  to={reply.leadId ? `/inbox/${reply.leadId}` : "/inbox"}
                  className={styles.link}
                  title={preview}
                >
                  <span className={styles.reply}>
                    <span className={styles.from}>{reply.leadName ?? "Unknown"}</span> {preview}
                  </span>
                  <PanelMeta>
                    <time dateTime={reply.sentAt}>{formatTimeAgo(reply.sentAt)}</time>
                  </PanelMeta>
                </Link>
              </PanelRow>
            )
          })}
        </PanelList>
      )}
    </Panel>
  )
}
