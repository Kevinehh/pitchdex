import { Mail, MessageSquare, UserPlus, type LucideIcon } from "lucide-react"
import { useLayoutEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { dayKey, formatDay, formatMessageTime } from "../format"
import type { Message, MessageKind } from "../types"
import styles from "./ConversationPane.module.css"

const kinds: Record<MessageKind, { icon: LucideIcon; label: string }> = {
  Email: { icon: Mail, label: "Email" },
  LinkedInMessage: { icon: MessageSquare, label: "LinkedIn" },
  LinkedInInvitation: { icon: UserPlus, label: "Connection request" },
}

/** Messages split by the day they were sent, oldest first. */
function groupByDay(messages: Message[]) {
  const groups: { day: string; messages: Message[] }[] = []
  for (const message of messages) {
    const day = dayKey(message.sentAt)
    if (groups.at(-1)?.day !== day) {
      groups.push({ day, messages: [] })
    }
    groups.at(-1)?.messages.push(message)
  }
  return groups
}

/** The conversation, email and LinkedIn together, kept scrolled to the newest message. */
export function MessageThread({ messages }: { messages: Message[] }) {
  const scroller = useRef<HTMLDivElement>(null)

  // Opens at the newest message, and follows new ones as they arrive.
  useLayoutEffect(() => {
    const element = scroller.current
    if (element) {
      element.scrollTop = element.scrollHeight
    }
  }, [messages.length])

  return (
    <div ref={scroller} className={styles.messages}>
      {groupByDay(messages).map((group) => (
        <section key={group.day} aria-label={formatDay(group.messages[0].sentAt)}>
          <p className={styles.day}>
            <span>{formatDay(group.messages[0].sentAt)}</span>
          </p>
          <ol className={styles.list}>
            {group.messages.map((message) => {
              const outbound = message.direction === "Outbound"
              const { icon: Icon, label } = kinds[message.kind]
              return (
                <li
                  key={message.id}
                  className={cn(styles.message, outbound ? styles.outbound : styles.inbound)}
                >
                  <div className={styles.bubble}>
                    <p className={styles.meta}>
                      <Icon aria-hidden />
                      {label}
                      {message.subject && (
                        <span className={styles.subject}> · {message.subject}</span>
                      )}
                    </p>
                    <p className={styles.body}>
                      {message.body ||
                        (message.kind === "LinkedInInvitation" ? "Sent without a note." : "")}
                    </p>
                    <p className={styles.footer}>
                      {outbound && `From ${message.accountName} · `}
                      <time dateTime={message.sentAt}>{formatMessageTime(message.sentAt)}</time>
                      {message.kind === "LinkedInInvitation" && outbound && (
                        <>
                          {" · "}
                          {message.acceptedAt ? "Accepted" : "Not accepted yet"}
                        </>
                      )}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}
