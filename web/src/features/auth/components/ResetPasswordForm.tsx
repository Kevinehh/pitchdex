import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useResetPassword } from "../hooks/useSession"
import {
  MIN_PASSWORD,
  resetPasswordSchema,
  type ResetPasswordForm as ResetValues,
} from "../schemas"
import { showServerErrors } from "../serverErrors"
import styles from "./AuthForm.module.css"

type ResetPasswordFormProps = {
  /** Both come from the link in the reset email. */
  email: string
  token: string
}

/** Sets a new password from a reset link. The link works once. */
export function ResetPasswordForm({ email, token }: ResetPasswordFormProps) {
  const reset = useResetPassword()
  const [done, setDone] = useState(false)
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "" },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async ({ newPassword }) => {
    try {
      await reset.mutateAsync({ email, token, newPassword })
      setDone(true)
    } catch (error) {
      showServerErrors(error, ["newPassword"], form.setError)
    }
  })

  if (!email || !token) {
    return (
      <div className={styles.form}>
        <p role="alert" className={styles.error}>
          This link is incomplete. Open it again from the email, or ask for a new one.
        </p>
        <p className={styles.small}>
          <Link to="/forgot-password">Get a new reset link</Link>
        </p>
      </div>
    )
  }

  if (done) {
    return (
      <div className={styles.form}>
        <p role="status" className={styles.success}>
          Your password is changed. Sign in with the new one.
        </p>
        <Button nativeButton={false} render={<Link to="/sign-in" />} className={styles.submit}>
          Sign in
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <p className={styles.small}>For {email}</p>
      <Field data-invalid={!!errors.newPassword}>
        <FieldLabel htmlFor="reset-password">New password</FieldLabel>
        <Input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          autoFocus
          aria-invalid={!!errors.newPassword}
          {...form.register("newPassword")}
        />
        <FieldDescription>At least {MIN_PASSWORD} characters.</FieldDescription>
        <FieldError errors={[errors.newPassword]} />
      </Field>

      {errors.root && (
        <p role="alert" className={styles.error}>
          {errors.root.message} <Link to="/forgot-password">Get a new link</Link>
        </p>
      )}

      <Button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Set new password"}
      </Button>
    </form>
  )
}
