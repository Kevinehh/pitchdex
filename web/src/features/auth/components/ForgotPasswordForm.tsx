import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useForgotPassword } from "../hooks/useSession"
import { forgotPasswordSchema, type ForgotPasswordForm as ForgotValues } from "../schemas"
import { showServerErrors } from "../serverErrors"
import styles from "./AuthForm.module.css"

/**
 * Asks for a reset link. The answer is the same whether or not the email has an account,
 * so the form can't be used to find out who's signed up.
 */
export function ForgotPasswordForm() {
  const forgot = useForgotPassword()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async ({ email }) => {
    try {
      await forgot.mutateAsync(email)
      setSentTo(email)
    } catch (error) {
      showServerErrors(error, ["email"], form.setError)
    }
  })

  if (sentTo) {
    return (
      <div className={styles.form}>
        <p role="status" className={styles.success}>
          If {sentTo} has an account, a link to reset its password is on the way. It works for a few
          hours.
        </p>
        {import.meta.env.DEV && (
          <p className={styles.small}>
            Running locally, no email is sent: the link is in the API log.
          </p>
        )}
        <p className={styles.small}>
          <Link to="/sign-in">Back to sign in</Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <Field data-invalid={!!errors.email}>
        <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          autoFocus
          aria-invalid={!!errors.email}
          {...form.register("email")}
        />
        <FieldError errors={[errors.email]} />
      </Field>

      {errors.root && (
        <p role="alert" className={styles.error}>
          {errors.root.message}
        </p>
      )}

      <Button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>

      <p className={styles.small}>
        Remembered it? <Link to="/sign-in">Sign in</Link>
      </p>
    </form>
  )
}
