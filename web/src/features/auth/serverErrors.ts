import type { FieldValues, Path, UseFormSetError } from "react-hook-form"
import { ApiError } from "@/lib/api/client"

/**
 * Puts the API's validation messages next to the matching inputs, and anything else (a
 * wrong password, a lockout, a lost connection) in the form's own error line.
 */
export function showServerErrors<T extends FieldValues>(
  error: unknown,
  fields: readonly string[],
  setError: UseFormSetError<T>,
) {
  const fieldErrors = error instanceof ApiError ? Object.entries(error.fieldErrors) : []
  const known = fieldErrors.filter(([field]) => fields.includes(field))

  for (const [field, messages] of known) {
    setError(field as Path<T>, { message: messages[0] })
  }

  if (known.length === 0) {
    const other = fieldErrors.find(([, messages]) => messages.length > 0)?.[1][0]
    setError("root", {
      message:
        other ?? (error instanceof Error ? error.message : "Something went wrong. Try again."),
    })
  }
}
