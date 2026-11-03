import { Link } from "react-router"
import { Panel } from "@/components/common/Panel"
import type { LeadStatus } from "@/features/leads"
import { cn } from "@/lib/utils"
import type { PipelineStage } from "../types"
import styles from "./Pipeline.module.css"

const tones: Record<LeadStatus, string> = {
  New: styles.new,
  Contacted: styles.contacted,
  Replied: styles.replied,
  Meeting: styles.meeting,
  Passed: styles.passed,
}

/** How many leads are at each stage. Each row opens Leads filtered to that stage. */
export function Pipeline({ stages, className }: { stages: PipelineStage[]; className?: string }) {
  const total = stages.reduce((sum, stage) => sum + stage.count, 0)
  // The biggest stage fills its bar, so small pipelines still read at a glance.
  const largest = Math.max(1, ...stages.map((stage) => stage.count))

  return (
    <Panel
      title="Pipeline"
      action={{ label: `${total} ${total === 1 ? "lead" : "leads"}`, to: "/leads" }}
      className={className}
    >
      <ul className={styles.stages}>
        {stages.map((stage) => (
          <li key={stage.status}>
            <Link
              to={`/leads?status=${stage.status}`}
              className={cn(styles.stage, tones[stage.status])}
            >
              <span className={styles.label}>{stage.status}</span>
              <span className={styles.track} aria-hidden>
                <span style={{ width: `${(stage.count / largest) * 100}%` }} />
              </span>
              <span className={styles.count}>{stage.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
