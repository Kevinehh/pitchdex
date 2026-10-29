import { zodResolver } from "@hookform/resolvers/zod"
import { Send } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AccountPicker, type Account } from "@/features/accounts"
import type { components } from "@/lib/api/schema"
import { useSendEmail } from "../hooks/useSendMessage"
import { emailSchema, type EmailForm } from "../schemas"
import styles from "./ContactLeadDialog.module.css"

type Lead = components["schemas"]["LeadDto"]

type EmailComposerProps = {
  lead: Lead
  accounts: Account[]
  onSent: () => void
}

export function EmailComposer({ lead, accounts, onSent }: EmailComposerProps) {
  const send = useSendEmail()
  const form = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { accountId: accounts[0]?.id ?? "", subject: "", body: "" },
  })
  const { errors, isSubmitting } = form.formState

  if (accounts.length === 0) {
    return (
      <p className={styles.notice}>
        No mailbox connected. Connect one on the <Link to="/account?tab=email">Account</Link> page.
      </p>
    )
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await send.mutateAsync({ leadId: lead.id, ...values })
      onSent()
    } catch {
      // The reason is shown under the form from send.error.
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <FieldGroup>
        <Field data-invalid={!!errors.accountId}>
          <FieldLabel htmlFor="email-account">From</FieldLabel>
          <Controller
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <AccountPicker
                id="email-account"
                accounts={accounts}
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.accountId}
              />
            )}
          />
          <FieldError errors={[errors.accountId]} />
        </Field>

        <Field data-invalid={!!errors.subject}>
          <FieldLabel htmlFor="email-subject">Subject</FieldLabel>
          <Input id="email-subject" aria-invalid={!!errors.subject} {...form.register("subject")} />
          <FieldError errors={[errors.subject]} />
        </Field>

        <Field data-invalid={!!errors.body}>
          <FieldLabel htmlFor="email-body">Message</FieldLabel>
          <Textarea
            id="email-body"
            className={styles.body}
            aria-invalid={!!errors.body}
            {...form.register("body")}
          />
          <FieldError errors={[errors.body]} />
        </Field>
      </FieldGroup>

      {send.isError && (
        <p role="alert" className={styles.error}>
          {send.error.message}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        <Send aria-hidden /> {isSubmitting ? "Sending…" : `Send to ${lead.email}`}
      </Button>
    </form>
  )
}
