import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useChangePassword } from "../hooks/useSession"
import {
  changePasswordSchema,
  MIN_PASSWORD,
  type ChangePasswordForm as ChangePasswordValues,
} from "../schemas"
import { showServerErrors } from "../serverErrors"
import styles from "./AuthForm.module.css"

const empty: ChangePasswordValues = { currentPassword: "", newPassword: "" }

/** Changes the password. Other browsers signed in to the account are signed out. */
export function ChangePasswordForm() {
  const change = useChangePassword()
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: empty,
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await change.mutateAsync(values)
      form.reset(empty)
    } catch (error) {
      change.reset()
      showServerErrors(error, ["currentPassword", "newPassword"], form.setError)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <FieldGroup>
        <Field data-invalid={!!errors.currentPassword}>
          <FieldLabel htmlFor="password-current">Current password</FieldLabel>
          <Input
            id="password-current"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.currentPassword}
            {...form.register("currentPassword")}
          />
          <FieldError errors={[errors.currentPassword]} />
        </Field>
        <Field data-invalid={!!errors.newPassword}>
          <FieldLabel htmlFor="password-new">New password</FieldLabel>
          <Input
            id="password-new"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.newPassword}
            {...form.register("newPassword")}
          />
          <FieldDescription>
            At least {MIN_PASSWORD} characters. Other browsers signed in to your account are signed
            out.
          </FieldDescription>
          <FieldError errors={[errors.newPassword]} />
        </Field>
      </FieldGroup>

      {errors.root && (
        <p role="alert" className={styles.error}>
          {errors.root.message}
        </p>
      )}
      {change.isSuccess && (
        <p role="status" className={styles.success}>
          Password changed.
        </p>
      )}

      <div>
        <Button type="submit" variant="outline" disabled={isSubmitting}>
          {isSubmitting ? "Changing…" : "Change password"}
        </Button>
      </div>
    </form>
  )
}
