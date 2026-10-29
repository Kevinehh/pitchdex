import { zodResolver } from "@hookform/resolvers/zod"
import { Send, UserPlus } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { AccountPicker, type Account } from "@/features/accounts"
import type { components } from "@/lib/api/schema"
import { cn } from "@/lib/utils"
import { useSendLinkedIn } from "../hooks/useSendMessage"
import { linkedInSchema, MAX_INVITE_NOTE, type LinkedInForm } from "../schemas"
import styles from "./ContactLeadDialog.module.css"

type Lead = components["schemas"]["LeadDto"]

type LinkedInComposerProps = {
  lead: Lead
  accounts: Account[]
  onSent: () => void
}

export function LinkedInComposer({ lead, accounts, onSent }: LinkedInComposerProps) {
  const send = useSendLinkedIn()
  const form = useForm<LinkedInForm>({
    resolver: zodResolver(linkedInSchema),
    defaultValues: { accountId: accounts[0]?.id ?? "", action: "Invitation", text: "" },
  })
  const { errors, isSubmitting } = form.formState
  const action = useWatch({ control: form.control, name: "action" })
  const textLength = useWatch({ control: form.control, name: "text" }).trim().length

  if (!lead.linkedInUrl) {
    return (
      <p className={styles.notice}>
        {lead.fullName} has no LinkedIn profile link yet. Leads saved from Explore get one
        automatically.
      </p>
    )
  }

  if (accounts.length === 0) {
    return (
      <p className={styles.notice}>
        No LinkedIn account connected. Connect one on the <Link to="/account">Account</Link> page.
      </p>
    )
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await send.mutateAsync({ leadId: lead.id, ...values, text: values.text || null })
      onSent()
    } catch {
      // The reason is shown under the form from send.error.
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <FieldGroup>
        <Field data-invalid={!!errors.accountId}>
          <FieldLabel htmlFor="linkedin-account">From</FieldLabel>
          <Controller
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <AccountPicker
                id="linkedin-account"
                accounts={accounts}
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.accountId}
              />
            )}
          />
          <FieldError errors={[errors.accountId]} />
        </Field>

        <Field>
          <FieldLabel>Send</FieldLabel>
          <div className={styles.actionOptions} role="radiogroup" aria-label="What to send">
            <Button
              type="button"
              role="radio"
              aria-checked={action === "Invitation"}
              variant={action === "Invitation" ? "default" : "outline"}
              onClick={() => form.setValue("action", "Invitation")}
            >
              <UserPlus aria-hidden /> Connection request
            </Button>
            <Button
              type="button"
              role="radio"
              aria-checked={action === "Message"}
              variant={action === "Message" ? "default" : "outline"}
              onClick={() => form.setValue("action", "Message")}
            >
              <Send aria-hidden /> Message
            </Button>
          </div>
        </Field>

        <Field data-invalid={!!errors.text}>
          <div className={styles.labelRow}>
            <FieldLabel htmlFor="linkedin-text">
              {action === "Invitation" ? "Note (optional)" : "Message"}
            </FieldLabel>
            {action === "Invitation" && (
              <span
                className={cn(styles.counter, textLength > MAX_INVITE_NOTE && styles.counterOver)}
              >
                {textLength}/{MAX_INVITE_NOTE}
              </span>
            )}
          </div>
          <Textarea
            id="linkedin-text"
            className={styles.body}
            aria-invalid={!!errors.text}
            {...form.register("text")}
          />
          <FieldError errors={[errors.text]} />
        </Field>
      </FieldGroup>

      {action === "Message" && (
        <p className={styles.notice}>
          LinkedIn only allows messages to people already connected with you. Send a connection
          request first if you aren't.
        </p>
      )}

      {send.isError && (
        <p role="alert" className={styles.error}>
          {send.error.message}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? "Sending…"
          : action === "Invitation"
            ? "Send connection request"
            : "Send LinkedIn message"}
      </Button>
    </form>
  )
}
