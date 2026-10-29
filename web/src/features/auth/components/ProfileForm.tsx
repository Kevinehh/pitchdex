import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useSession, useUpdateProfile } from "../hooks/useSession"
import { profileSchema, type ProfileForm as ProfileValues } from "../schemas"
import { showServerErrors } from "../serverErrors"
import type { Session } from "../types"
import styles from "./AuthForm.module.css"

/** The signed-in founder's name. */
export function ProfileForm() {
  const session = useSession()
  return session.data ? <ProfileEditor session={session.data} /> : null
}

function ProfileEditor({ session }: { session: Session }) {
  const update = useUpdateProfile()
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: session.user.firstName, lastName: session.user.lastName },
  })
  const { errors, isDirty, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await update.mutateAsync(values)
      form.reset({ firstName: saved.user.firstName, lastName: saved.user.lastName })
    } catch (error) {
      showServerErrors(error, ["firstName", "lastName"], form.setError)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <div className={styles.row}>
        <Field data-invalid={!!errors.firstName}>
          <FieldLabel htmlFor="profile-first">First name</FieldLabel>
          <Input
            id="profile-first"
            autoComplete="given-name"
            aria-invalid={!!errors.firstName}
            {...form.register("firstName")}
          />
          <FieldError errors={[errors.firstName]} />
        </Field>
        <Field data-invalid={!!errors.lastName}>
          <FieldLabel htmlFor="profile-last">Last name</FieldLabel>
          <Input
            id="profile-last"
            autoComplete="family-name"
            aria-invalid={!!errors.lastName}
            {...form.register("lastName")}
          />
          <FieldError errors={[errors.lastName]} />
        </Field>
      </div>

      {errors.root && (
        <p role="alert" className={styles.error}>
          {errors.root.message}
        </p>
      )}

      <div>
        <Button type="submit" variant="outline" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? "Saving…" : isDirty ? "Save name" : "Saved"}
        </Button>
      </div>
    </form>
  )
}
