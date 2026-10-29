import { Mail, MessageSquare, Send } from "lucide-react"
import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api/client"
import { useReply } from "../hooks/useConversations"
import type { Channel, ConversationLead, ReplyOptions } from "../types"
import styles from "./ConversationPane.module.css"

type ReplyComposerProps = {
  lead: ConversationLead
  reply: ReplyOptions
}

/** Answers the lead by email or LinkedIn, starting on the channel they last wrote on. */
export function ReplyComposer({ lead, reply }: ReplyComposerProps) {
  const usable: Record<Channel, boolean> = { Email: reply.canEmail, LinkedIn: reply.canLinkedIn }
  const [channel, setChannel] = useState<Channel>(() =>
    usable[reply.defaultChannel] || !(reply.canEmail || reply.canLinkedIn)
      ? reply.defaultChannel
      : reply.canEmail
        ? "Email"
        : "LinkedIn",
  )
  const [subject, setSubject] = useState(reply.emailSubject ?? "")
  const [body, setBody] = useState("")
  const send = useReply(lead.id)
  const firstName = lead.fullName.split(" ")[0]

  const blocked: Record<Channel, ReactNode> = {
    Email: (
      <>
        Connect a mailbox on the <Link to="/account?tab=email">Account</Link> page to reply by
        email.
      </>
    ),
    LinkedIn: lead.linkedInUrl ? (
      <>
        Connect a LinkedIn account on the <Link to="/account">Account</Link> page to reply on
        LinkedIn.
      </>
    ) : (
      `${lead.fullName} has no LinkedIn link, so you can't message them there.`
    ),
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!body.trim() || !usable[channel] || send.isPending) {
      return
    }
    try {
      await send.mutateAsync({
        channel,
        subject: channel === "Email" ? subject.trim() || null : null,
        body: body.trim(),
      })
      setBody("")
    } catch {
      // The reason is shown under the box from send.error.
    }
  }

  // Ctrl+Enter (Cmd+Enter on a Mac) sends; Enter alone starts a new line.
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const error =
    send.error instanceof ApiError
      ? (Object.values(send.error.fieldErrors)[0]?.[0] ?? send.error.message)
      : send.error?.message

  return (
    <form className={styles.composer} onSubmit={onSubmit} noValidate>
      <div className={styles.composerTop}>
        <div className={styles.channels} role="group" aria-label="Reply by">
          {(["Email", "LinkedIn"] as const).map((option) => (
            <Button
              key={option}
              type="button"
              size="xs"
              variant={channel === option ? "secondary" : "ghost"}
              aria-pressed={channel === option}
              onClick={() => {
                setChannel(option)
                send.reset()
              }}
            >
              {option === "Email" ? <Mail aria-hidden /> : <MessageSquare aria-hidden />}
              {option}
            </Button>
          ))}
        </div>
        {channel === "Email" && usable.Email && (
          <Input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
            aria-label="Subject"
            className={styles.subjectInput}
          />
        )}
      </div>

      {usable[channel] ? (
        <div className={styles.composeRow}>
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={`Reply to ${firstName} ${channel === "Email" ? "by email" : "on LinkedIn"}`}
            aria-label="Reply"
            className={styles.replyBox}
          />
          <Button type="submit" disabled={!body.trim() || send.isPending}>
            <Send aria-hidden /> {send.isPending ? "Sending…" : "Send"}
          </Button>
        </div>
      ) : (
        <p className={styles.notice}>{blocked[channel]}</p>
      )}

      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : (
        usable[channel] && <p className={styles.hint}>Ctrl + Enter to send</p>
      )}
    </form>
  )
}
