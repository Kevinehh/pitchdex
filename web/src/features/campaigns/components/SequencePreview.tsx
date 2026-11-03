import { stepAt, type Slot, type TreeStep } from "../sequenceTree"
import { stepKind } from "../stepKinds"
import { isCondition, STEP_TYPES } from "../types"
import styles from "./SequencePreview.module.css"

/**
 * A thumbnail of a sequence: one bar per step in its channel's colour, branches side by side.
 * Decorative; the card it sits on names the template and says what it does.
 */
export function SequencePreview({ steps }: { steps: readonly TreeStep[] }) {
  return (
    <div className={styles.preview} aria-hidden>
      <MiniChain steps={steps} slot={{ parentKey: null, branch: null }} />
    </div>
  )
}

function MiniChain({ steps, slot }: { steps: readonly TreeStep[]; slot: Slot }) {
  const step = stepAt(steps, slot)
  if (!step) {
    return null
  }

  return (
    <div className={styles.chain}>
      <span className={styles.step} data-kind={stepKind(step.type)} title={STEP_TYPES[step.type]} />
      {isCondition(step.type) ? (
        <div className={styles.branches}>
          <MiniChain steps={steps} slot={{ parentKey: step.key, branch: "Yes" }} />
          <MiniChain steps={steps} slot={{ parentKey: step.key, branch: "No" }} />
        </div>
      ) : (
        <MiniChain steps={steps} slot={{ parentKey: step.key, branch: null }} />
      )}
    </div>
  )
}
