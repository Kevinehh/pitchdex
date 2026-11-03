import { Link, Outlet } from "react-router"
import { BrandMark } from "@/components/common/BrandMark"
import styles from "./AuthLayout.module.css"

/**
 * The signed-out screens: sign in, sign up and password resets, on one centred card. The
 * name above it leads back to the landing page.
 */
export function AuthLayout() {
  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <Link to="/" className={styles.brand}>
          <BrandMark size="lg" />
          Pitchdex
        </Link>
        <div className={styles.card}>
          <Outlet />
        </div>
      </div>
    </main>
  )
}
