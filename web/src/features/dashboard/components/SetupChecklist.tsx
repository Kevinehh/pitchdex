import { Check } from "lucide-react"
import { Link } from "react-router"
import { Panel, PanelList, PanelRow } from "@/components/common/Panel"
import { cn } from "@/lib/utils"
import type { Setup } from "../types"
import styles from "./SetupChecklist.module.css"

/** First-run checklist, ticked off from what exists. Hides itself once every step is done. */
export function SetupChecklist({ setup }: { setup: Setup }) {
  const steps = [
    { id: "mailbox", label: "Connect a mailbox", done: setup.hasMailbox, to: "/account?tab=email" },
    { id: "linkedin", label: "Connect LinkedIn", done: setup.hasLinkedIn, to: "/account" },
    { id: "leads", label: "Save investors as leads", done: setup.hasLeads, to: "/explore" },
    { id: "campaign", label: "Create a campaign", done: setup.hasCampaign, to: "/campaigns" },
    {
      id: "launch",
      label: "Launch your first campaign",
      done: setup.hasLaunchedCampaign,
      to: "/campaigns",
    },
  ]
  const doneCount = steps.filter((step) => step.done).length
  if (doneCount === steps.length) {
    return null
  }

  return (
    <Panel title="Get set up">
      <p className={styles.summary}>
        {doneCount} of {steps.length} done
      </p>
      <PanelList>
        {steps.map((step) => (
          <PanelRow key={step.id}>
            <span className={cn(styles.box, step.done && styles.boxDone)} aria-hidden>
              {step.done && <Check className={styles.check} />}
            </span>
            {step.done ? (
              <span className={styles.doneLabel}>
                {step.label}
                <span className={styles.visuallyHidden}> (done)</span>
              </span>
            ) : (
              <Link to={step.to} className={styles.link}>
                {step.label}
              </Link>
            )}
          </PanelRow>
        ))}
      </PanelList>
    </Panel>
  )
}
