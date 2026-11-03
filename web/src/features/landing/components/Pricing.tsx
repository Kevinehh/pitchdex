import { useState } from "react"
import { cn } from "@/lib/utils"
import { CheckIcon, ShieldIcon } from "./icons"
import shared from "./Landing.module.css"
import styles from "./Pricing.module.css"

const plans = {
  monthly: { amount: "$25", per: "/month", note: "or $150/year, save 6 months" },
  yearly: { amount: "$150", per: "/year", note: "Works out to $12.50/mo, billed annually" },
}

type Billing = keyof typeof plans

const included = [
  "Investor database (500+ vetted VCs)",
  "Cold email engine with AI personalization",
  "Automated follow-up sequences",
  "Meeting tracker & Calendly booking",
  "Pipeline dashboard",
  "Everything. Cancel anytime.",
]

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("monthly")
  const plan = plans[billing]

  return (
    <section id="pricing" className={shared.pad}>
      <div className={shared.wrap}>
        <div className={shared.secHead}>
          <span className={shared.label}>Pricing</span>
          <h2>One plan. Everything included.</h2>
          <p className={shared.lead}>
            No tiers. No upsells. No feature gating. Just the full platform at one honest price.
          </p>
        </div>

        <div className={styles.box}>
          <div className={styles.plan}>
            <div className={styles.toggle} role="group" aria-label="Billing">
              <button
                type="button"
                aria-pressed={billing === "monthly"}
                className={cn(billing === "monthly" && styles.on)}
                onClick={() => setBilling("monthly")}
              >
                Monthly
              </button>
              <button
                type="button"
                aria-pressed={billing === "yearly"}
                className={cn(billing === "yearly" && styles.on)}
                onClick={() => setBilling("yearly")}
              >
                Yearly <span className={styles.save}>SAVE 6 MO</span>
              </button>
            </div>

            <div className={styles.planName}>
              <b>Pitchdex</b>
              <span className={styles.badge}>FULL ACCESS</span>
            </div>
            <div className={styles.price} aria-live="polite">
              <span className={styles.amount}>{plan.amount}</span>
              <span className={styles.per}>{plan.per}</span>
            </div>
            <div className={styles.note}>{plan.note}</div>
            <a href="#join" className={cn(shared.btn, shared.btnPrimary, styles.cta)}>
              Join Early Access →
            </a>
            <div className={styles.guarantee}>
              <ShieldIcon size={14} strokeWidth={2} /> 30-day money-back guarantee
            </div>
          </div>

          <div className={styles.included}>
            <h4>What's included</h4>
            <ul className={cn(shared.ticks, styles.list)}>
              {included.map((item) => (
                <li key={item}>
                  <CheckIcon /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
