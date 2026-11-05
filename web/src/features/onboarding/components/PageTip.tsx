import { Lightbulb, X } from "lucide-react"
import { useId } from "react"
import { useLocation } from "react-router"
import { Button } from "@/components/ui/button"
import { useMarkTipSeen, useSeenTips } from "../hooks/useTips"
import { tipFor, TOUR_ID } from "../tips"
import styles from "./PageTip.module.css"

/**
 * What this page is for, under its header, until the founder closes it. Waits for the tour
 * to be done, so the two don't show at once.
 */
export function PageTip() {
  const id = useId()
  const { pathname } = useLocation()
  const seen = useSeenTips()
  const markSeen = useMarkTipSeen()
  const tip = tipFor(pathname)

  if (!tip || !seen || !seen.has(TOUR_ID) || seen.has(tip.id)) {
    return null
  }

  return (
    <section className={styles.tip} aria-labelledby={`${id}-title`}>
      <span className={styles.icon} aria-hidden>
        <Lightbulb />
      </span>
      <div className={styles.text}>
        <h2 id={`${id}-title`} className={styles.title}>
          {tip.title}
        </h2>
        <p className={styles.body}>{tip.body}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className={styles.close}
        aria-label="Close tip"
        onClick={() => markSeen.mutate(tip.id)}
      >
        <X aria-hidden />
      </Button>

      <ul className={styles.points}>
        {tip.points.map(({ icon: Icon, text }) => (
          <li key={text} className={styles.point}>
            <Icon aria-hidden />
            {text}
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        <Button variant="outline" size="sm" onClick={() => markSeen.mutate(tip.id)}>
          Got it
        </Button>
      </div>
    </section>
  )
}
