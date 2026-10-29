import { ForgotPasswordForm } from "@/features/auth"
import styles from "./AuthPage.module.css"

export default function ForgotPasswordPage() {
  return (
    <>
      <div className={styles.heading}>
        <h1 className={styles.title}>Reset your password</h1>
        <p className={styles.description}>
          Enter your email and we&apos;ll send you a link to choose a new one.
        </p>
      </div>
      <ForgotPasswordForm />
    </>
  )
}
