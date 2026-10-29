import { Outlet } from "react-router"
import styles from "./AuthLayout.module.css"

/** The signed-out screens: sign in, sign up and password resets, on one centred card. */
export function AuthLayout() {
  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <p className={styles.brand}>Pitchdex</p>
        <div className={styles.card}>
          <Outlet />
        </div>
      </div>
    </main>
  )
}
