import { cn } from "@/lib/utils"
import { AppPreview } from "./AppPreview"
import { EarlyAccessForm } from "./EarlyAccessForm"
import { ArrowUpIcon, CheckIcon } from "./icons"
import shared from "./Landing.module.css"
import styles from "./Hero.module.css"

/** The decorative curves either side of the hero. */
function SideLines({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 180 900"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden
    >
      <g stroke="#3b74f6" strokeWidth="1">
        <path d="M170 0 C170 300 20 340 20 900" />
        <path d="M150 0 C150 300 40 360 40 900" opacity=".6" />
        <path d="M130 0 C130 300 60 380 60 900" opacity=".35" />
      </g>
    </svg>
  )
}

export function Hero() {
  return (
    <section id="top" className={styles.hero}>
      <div className={styles.glow} aria-hidden />
      <div className={styles.grid} aria-hidden />
      <SideLines className={cn(styles.lines, styles.linesLeft)} />
      <SideLines className={cn(styles.lines, styles.linesRight)} />

      <div className={cn(shared.wrap, styles.inner)}>
        <div className={cn(shared.brackets, styles.eyebrow)}>
          <span className={shared.bracketsEnd} />
          <span className={styles.eyebrowDot}>
            <ArrowUpIcon size={10} strokeWidth={3} stroke="#fff" />
          </span>
          For founders <b>raising their round</b>
        </div>
        <h1 className={styles.title}>
          Book VC meetings
          <br />
          <span className={styles.accent}>on autopilot.</span>
        </h1>
        <p className={shared.lead}>
          Pitchdex combines a 500+ investor database with automated cold email sequences, so you
          spend less time prospecting and more time pitching.
        </p>

        <EarlyAccessForm id="join" className={styles.signup} />
        <div className={styles.checks}>
          <span>
            <CheckIcon size={14} /> No credit card required
          </span>
          <span>
            <CheckIcon size={14} /> Setup in 10 minutes
          </span>
        </div>
        <a href="#how" className={styles.secondaryLink}>
          See how it works <span aria-hidden>→</span>
        </a>

        <AppPreview />
      </div>

      <div className={cn(shared.wrap, styles.strip)}>
        <p>Built for founders raising from pre-seed to Series A</p>
        <div className={styles.stages}>
          <span>Pre-seed</span>
          <span>Seed</span>
          <span>Series A</span>
          <span className={styles.struck}>Waiting on warm intros</span>
        </div>
      </div>
    </section>
  )
}
