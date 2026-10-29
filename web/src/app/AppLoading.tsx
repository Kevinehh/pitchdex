import styles from "./AppLoading.module.css"

/** Shown for a moment on first load, while the first page's code downloads. */
export function AppLoading() {
  return (
    <div className={styles.loading} role="status">
      Loading Pitchdex…
    </div>
  )
}
