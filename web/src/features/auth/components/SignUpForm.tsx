import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link, useLocation, useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useSignUp } from "../hooks/useSession"
import { MIN_PASSWORD, signUpSchema, type SignUpForm as SignUpValues } from "../schemas"
import { showServerErrors } from "../serverErrors"
import styles from "./AuthForm.module.css"

/**
 * What another page can hand to sign-up, such as the landing page's email box, so the email
 * isn't typed twice. It travels in navigation state, which keeps it out of the URL.
 */
export type SignUpState = { email?: string }

/** Creates the account and its workspace, signs in, and opens the dashboard. */
export function SignUpForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const signUp = useSignUp()
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: (location.state as SignUpState | null)?.email ?? "",
      password: "",
    },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signUp.mutateAsync(values)
      await navigate("/dashboard", { replace: true })
    } catch (error) {
      showServerErrors(error, ["firstName", "lastName", "email", "password"], form.setError)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <FieldGroup>
        <div className={styles.row}>
          <Field data-invalid={!!errors.firstName}>
            <FieldLabel htmlFor="sign-up-first">First name</FieldLabel>
            <Input
              id="sign-up-first"
              autoComplete="given-name"
              autoFocus
              aria-invalid={!!errors.firstName}
              {...form.register("firstName")}
            />
            <FieldError errors={[errors.firstName]} />
          </Field>
          <Field data-invalid={!!errors.lastName}>
            <FieldLabel htmlFor="sign-up-last">Last name</FieldLabel>
            <Input
              id="sign-up-last"
              autoComplete="family-name"
              aria-invalid={!!errors.lastName}
              {...form.register("lastName")}
            />
            <FieldError errors={[errors.lastName]} />
          </Field>
        </div>

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
          <Input
            id="sign-up-email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...form.register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
          <Input
            id="sign-up-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
          <FieldDescription>
            At least {MIN_PASSWORD} characters. A few words together is easy to remember.
          </FieldDescription>
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>

      {errors.root && (
        <p role="alert" className={styles.error}>
          {errors.root.message}
        </p>
      )}

      <Button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? "Creating your account…" : "Create account"}
      </Button>

      <p className={styles.small}>
        By creating an account, you agree to the{" "}
        <Link to="/terms" target="_blank">
          Terms &amp; Conditions
        </Link>{" "}
        and{" "}
        <Link to="/privacy" target="_blank">
          Privacy Policy
        </Link>
        .
      </p>

      <p className={styles.small}>
        Already have an account? <Link to="/sign-in">Sign in</Link>
      </p>
    </form>
  )
}
