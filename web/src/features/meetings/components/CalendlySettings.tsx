import { CalendarCheck, ExternalLink } from "lucide-react"
import { useId, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/client"
import { formatTimeAgo } from "@/lib/formatTimeAgo"
import {
  useCalendlySettings,
  useCheckCalendly,
  useConnectCalendly,
  useDisconnectCalendly,
  useUpdateCalendlyLink,
} from "../hooks/useCalendly"
import type { CalendlyCheck, CalendlySettings as Settings } from "../types"
import styles from "./CalendlySettings.module.css"

/** Where Calendly lists personal access tokens. */
const TOKEN_PAGE = "https://calendly.com/integrations/api_webhooks"

/** A field error from the API when there is one, otherwise its message. */
function errorText(error: Error | null) {
  if (!error) return null
  return error instanceof ApiError
    ? (Object.values(error.fieldErrors)[0]?.[0] ?? error.message)
    : error.message
}

/** "just now" or "5m ago". */
function checkedAgo(isoDate: string) {
  const ago = formatTimeAgo(isoDate)
  return ago === "now" ? "just now" : `${ago} ago`
}

/** What a check found, in a sentence or two. */
function checkReport({ eventsFound, booked, unmatchedEmails }: CalendlyCheck) {
  if (eventsFound === 0) {
    return "Checked just now: your Calendly has no calls from yesterday onward."
  }
  const calls = eventsFound === 1 ? "1 call" : `${eventsFound} calls`
  const found =
    booked === 0
      ? `Checked ${calls} on Calendly. No new bookings from leads.`
      : `Checked ${calls} on Calendly. ${booked === 1 ? "1 lead" : `${booked} leads`} booked and moved to Meeting.`
  return unmatchedEmails.length === 0
    ? found
    : `${found} Not leads, so on your Calendar only: ${unmatchedEmails.join(", ")}. To track one as a lead, add that email to the lead, then check again.`
}

/** The booking link that fills {{calendly}}, and the Calendly account bookings are read from. */
export function CalendlySettings() {
  const settings = useCalendlySettings()

  if (settings.isPending) {
    return <p className={styles.muted}>Loading…</p>
  }

  if (settings.isError) {
    return (
      <p role="alert" className={styles.error}>
        {settings.error.message}
      </p>
    )
  }

  return (
    <div className={styles.layout}>
      {/* Keyed by the saved link, so the box resets when connecting fills it in. */}
      <BookingLink key={settings.data.link ?? ""} saved={settings.data.link} />
      <BookingTracking settings={settings.data} />
    </div>
  )
}

function BookingLink({ saved }: { saved: string | null }) {
  const id = useId()
  const [link, setLink] = useState(saved ?? "")
  const update = useUpdateCalendlyLink()
  const changed = link.trim() !== (saved ?? "")
  const error = errorText(update.error)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await update.mutateAsync(link.trim() || null)
    } catch {
      // The reason is shown under the box.
    }
  }

  return (
    <section className={styles.section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.title}>
        Booking link
      </h2>
      <form onSubmit={onSubmit} noValidate className={styles.form}>
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor={`${id}-link`}>Your Calendly link</FieldLabel>
          <Input
            id={`${id}-link`}
            type="url"
            inputMode="url"
            value={link}
            onChange={(event) => {
              setLink(event.target.value)
              update.reset()
            }}
            placeholder="https://calendly.com/your-name/30min"
            aria-invalid={!!error}
          />
          <FieldDescription>
            Fills <code className={styles.code}>{"{{calendly}}"}</code> in campaign steps, and the
            Booking link button when you reply in the Inbox.
          </FieldDescription>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
        </Field>
        <div>
          <Button type="submit" disabled={!changed || update.isPending}>
            {update.isPending ? "Saving…" : changed ? "Save link" : "Saved"}
          </Button>
        </div>
      </form>
    </section>
  )
}

function BookingTracking({ settings }: { settings: Settings }) {
  const id = useId()
  const [token, setToken] = useState("")
  const connect = useConnectCalendly()
  const disconnect = useDisconnectCalendly()
  const check = useCheckCalendly()
  const account = settings.account
  const error = errorText(connect.error ?? disconnect.error ?? check.error)

  async function onConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token.trim()) return
    try {
      await connect.mutateAsync(token.trim())
      setToken("")
    } catch {
      // The reason is shown under the box.
    }
  }

  return (
    <section className={styles.section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.title}>
        Meeting tracking
      </h2>

      {account ? (
        <div className={styles.connected}>
          <CalendarCheck className={styles.connectedIcon} aria-hidden />
          <div className={styles.connectedText}>
            <p>
              Connected as <strong>{account.name}</strong> ({account.email})
            </p>
            <p className={styles.muted}>
              {account.syncedAt && `Checked for bookings ${checkedAgo(account.syncedAt)}. `}
              When a lead books, they move to Meeting and their campaigns stop.
            </p>
            {check.data && !account.lastError && (
              <p role="status" className={styles.report}>
                {checkReport(check.data)}
              </p>
            )}
            {(account.lastError ?? error) && (
              <p role="alert" className={styles.error}>
                {account.lastError ?? error}
              </p>
            )}
          </div>
          <div className={styles.connectedActions}>
            <Button
              variant="outline"
              size="sm"
              disabled={check.isPending}
              onClick={() => check.mutate()}
            >
              {check.isPending ? "Checking…" : "Check now"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={disconnect.isPending}
              onClick={() => disconnect.mutate()}
            >
              {disconnect.isPending ? "Disconnecting…" : "Disconnect"}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={onConnect} noValidate className={styles.form}>
          <p className={styles.muted}>
            Connect Calendly and Pitchdex checks your bookings every few minutes. When a lead books
            a call with the email you have for them, they move to Meeting, their campaigns stop and
            the call shows on your dashboard. Works on every Calendly plan, free included.
          </p>
          <ol className={styles.steps}>
            <li>
              In Calendly, open{" "}
              <a href={TOKEN_PAGE} target="_blank" rel="noreferrer" className={styles.link}>
                Integrations → API &amp; Webhooks <ExternalLink aria-hidden />
              </a>
            </li>
            <li>Under Personal access tokens, choose Generate new token and name it Pitchdex.</li>
            <li>Copy the token and paste it here.</li>
          </ol>
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor={`${id}-token`}>Personal access token</FieldLabel>
            <Input
              id={`${id}-token`}
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={token}
              onChange={(event) => {
                setToken(event.target.value)
                connect.reset()
              }}
              aria-invalid={!!error}
            />
            <FieldDescription>
              Stored encrypted and only used to read your scheduled events.
            </FieldDescription>
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
          </Field>
          <div>
            <Button type="submit" disabled={!token.trim() || connect.isPending}>
              {connect.isPending ? "Connecting…" : "Connect Calendly"}
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
