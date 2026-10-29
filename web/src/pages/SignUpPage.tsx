import { SignUpForm } from "@/features/auth"
import styles from "./AuthPage.module.css"

export default function SignUpPage() {
  return (
    <>
      <div className={styles.heading}>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.description}>
          Find investors, and reach them by email and LinkedIn from one place.
        </p>
      </div>
      <SignUpForm />
    </>
  )
}
