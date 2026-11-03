import { cn } from "@/lib/utils"
import { EarlyAccessForm } from "./EarlyAccessForm"
import shared from "./Landing.module.css"
import styles from "./FinalCta.module.css"

export function FinalCta() {
  return (
    <section className={styles.section}>
      <div className={shared.wrap}>
        <div className={styles.box}>
          <span className={shared.label}>Get started</span>
          <h2 className={styles.title}>Ready to fill your calendar with VC meetings?</h2>
          <p className={cn(shared.lead, styles.lead)}>
            Stop waiting for warm intros. Start booking VC meetings directly, with cold outreach
            that actually converts.
          </p>
          <EarlyAccessForm className={styles.form} />
          <div className={styles.fine}>$25/mo · Cancel anytime · 30-day money-back guarantee</div>
        </div>
      </div>
    </section>
  )
}
