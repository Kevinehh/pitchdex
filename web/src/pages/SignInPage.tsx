import { useSearchParams } from "react-router"
import { SignInForm } from "@/features/auth"
import styles from "./AuthPage.module.css"

/**
 * Only a path inside the app counts as somewhere to return to, so a crafted link can't
 * send someone to another site after they sign in.
 */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"
}

export default function SignInPage() {
  const [params] = useSearchParams()

  return (
    <>
      <div className={styles.heading}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.description}>Welcome back.</p>
      </div>
      <SignInForm next={safeNext(params.get("next"))} />
    </>
  )
}
