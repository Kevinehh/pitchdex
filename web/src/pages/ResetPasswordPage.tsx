import { useSearchParams } from "react-router"
import { ResetPasswordForm } from "@/features/auth"
import styles from "./AuthPage.module.css"

export default function ResetPasswordPage() {
  const [params] = useSearchParams()

  return (
    <>
      <div className={styles.heading}>
        <h1 className={styles.title}>Choose a new password</h1>
      </div>
      <ResetPasswordForm email={params.get("email") ?? ""} token={params.get("token") ?? ""} />
    </>
  )
}
