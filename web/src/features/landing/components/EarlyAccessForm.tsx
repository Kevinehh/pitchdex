import { useId, type FormEvent } from "react"
import { useNavigate } from "react-router"
import type { SignUpState } from "@/features/auth"
import { cn } from "@/lib/utils"
import shared from "./Landing.module.css"
import styles from "./EarlyAccessForm.module.css"

/** An email box that starts sign-up with the address already filled in. */
export function EarlyAccessForm({ id, className }: { id?: string; className?: string }) {
  const navigate = useNavigate()
  const inputId = useId()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = new FormData(event.currentTarget).get("email")?.toString().trim()
    void navigate("/sign-up", { state: { email } satisfies SignUpState })
  }

  return (
    <div id={id} className={cn(shared.brackets, styles.box, className)}>
      <span className={shared.bracketsEnd} />
      <form onSubmit={onSubmit} className={styles.form}>
        <label htmlFor={inputId} className={styles.srOnly}>
          Work email
        </label>
        <input
          id={inputId}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@yourstartup.com"
          required
          className={styles.input}
        />
        <button type="submit" className={cn(shared.btn, shared.btnPrimary)}>
          Join Early Access
        </button>
      </form>
    </div>
  )
}
