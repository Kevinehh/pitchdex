import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useSignIn } from "../hooks/useSession"
import { signInSchema, type SignInForm as SignInValues } from "../schemas"
import { showServerErrors } from "../serverErrors"
import styles from "./AuthForm.module.css"

/** Email and password. Afterwards the founder lands where they were heading, or the dashboard. */
export function SignInForm({ next }: { next: string }) {
  const navigate = useNavigate()
  const signIn = useSignIn()
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signIn.mutateAsync(values)
      await navigate(next, { replace: true })
    } catch (error) {
      showServerErrors(error, ["email", "password"], form.setError)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
          <Input
            id="sign-in-email"
            type="email"
            autoComplete="email"
            autoFocus
            aria-invalid={!!errors.email}
            {...form.register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <div className={styles.labelRow}>
            <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
            <Link to="/forgot-password" className={styles.small}>
              Forgot password?
            </Link>
          </div>
          <Input
            id="sign-in-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <label className={styles.remember}>
          <Controller
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
              />
            )}
          />
          Keep me signed in for two weeks
        </label>
      </FieldGroup>

      {errors.root && (
        <p role="alert" className={styles.error}>
          {errors.root.message}
        </p>
      )}

      <Button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className={styles.small}>
        New to Pitchdex? <Link to="/sign-up">Create an account</Link>
      </p>
    </form>
  )
}
