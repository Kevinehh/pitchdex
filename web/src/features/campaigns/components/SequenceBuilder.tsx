import { Plus } from "lucide-react"
import { useState } from "react"
import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { MAX_STEPS, newStep, type CampaignForm, type StepForm } from "../schemas"
import {
  followsInvitation,
  insertStep,
  ordered,
  removeStep,
  stepAt,
  type Slot,
} from "../sequenceTree"
import { STEP_ICONS, stepKind } from "../stepKinds"
import { isCondition, STEP_TYPES, type StepType } from "../types"
import styles from "./SequenceBuilder.module.css"
import { StepPanel } from "./StepPanel"

const MENU: { label: string; types: StepType[] }[] = [
  { label: "LinkedIn", types: ["LinkedInProfileView", "LinkedInInvitation", "LinkedInMessage"] },
  { label: "Email", types: ["Email"] },
  { label: "Conditions", types: ["IfInvitationAccepted", "IfHasEmail"] },
]

/**
 * The campaign's sequence drawn top to bottom, branches side by side, with a + between steps
 * to insert one. Clicking a step opens it in the panel beside the drawing.
 */
export function SequenceBuilder() {
  const { control, formState, getValues } = useFormContext<CampaignForm>()
  const { replace } = useFieldArray({ control, name: "steps" })
  const steps = useWatch({ control, name: "steps" })
  const [selectedKey, setSelectedKey] = useState(() => getValues("steps.0.key"))
  const errors = formState.errors.steps

  // Each save that finds problems opens the first step with one, so its message shows: on
  // submitting (the form's own checks), and when the API's come back. Fixing one while typing
  // doesn't jump elsewhere.
  const firstProblem = steps.find((_, index) => errors?.[index])?.key
  const saveState = `${formState.submitCount}:${firstProblem !== undefined}`
  const [handledSave, setHandledSave] = useState(saveState)
  if (saveState !== handledSave) {
    setHandledSave(saveState)
    if (firstProblem) setSelectedKey(firstProblem)
  }

  const selectedIndex = steps.findIndex((step) => step.key === selectedKey)
  const listError = errors?.message ?? errors?.root?.message

  function insert(slot: Slot, type: StepType) {
    const step = newStep(type)
    replace(insertStep(steps, slot, step))
    setSelectedKey(step.key)
  }

  function remove(key: string) {
    const step = steps.find((s) => s.key === key)
    const next = removeStep(steps, key)
    replace(next)
    // The step that took its place, or the one before it.
    const replacement = step && stepAt(next, { parentKey: step.parentKey, branch: step.branch })
    setSelectedKey(replacement?.key ?? step?.parentKey ?? ordered(next)[0]?.key)
  }

  const tree = {
    steps,
    selectedKey,
    invalid: (key: string) => !!errors?.[steps.findIndex((s) => s.key === key)],
    full: steps.length >= MAX_STEPS,
    onSelect: setSelectedKey,
    onInsert: insert,
  }

  return (
    <div className={styles.layout}>
      <div className={styles.canvas} ref={centerOnFirstStep}>
        <div className={styles.tree}>
          <span className={styles.start}>Lead added</span>
          <Chain slot={{ parentKey: null, branch: null }} tree={tree} />
        </div>
      </div>

      <div className={styles.side}>
        {listError && (
          <p role="alert" className={styles.error}>
            {listError}
          </p>
        )}
        {selectedIndex >= 0 ? (
          <StepPanel
            key={selectedKey}
            index={selectedIndex}
            removable={removeStep(steps, steps[selectedIndex].key).length > 0}
            onRemove={() => remove(steps[selectedIndex].key)}
          />
        ) : (
          <p className={styles.hint}>Click a step to edit it.</p>
        )}
        <p className={styles.hint}>A reply at any point stops the sequence for that lead.</p>
      </div>
    </div>
  )
}

type Tree = {
  steps: StepForm[]
  selectedKey: string | undefined
  invalid: (key: string) => boolean
  full: boolean
  onSelect: (key: string) => void
  onInsert: (slot: Slot, type: StepType) => void
}

/**
 * When the drawing is wider than its box (branches on a phone), it opens scrolled to the
 * middle, where the first step is, rather than to its left edge.
 */
function centerOnFirstStep(canvas: HTMLDivElement | null) {
  if (canvas) {
    canvas.scrollLeft = (canvas.scrollWidth - canvas.clientWidth) / 2
  }
}

/** A slot and everything below it: the + to insert there, then the step and its own chain. */
function Chain({ slot, tree }: { slot: Slot; tree: Tree }) {
  const step = stepAt(tree.steps, slot)

  return (
    <div className={styles.chain}>
      <span className={styles.line} aria-hidden />
      <AddStep slot={slot} tree={tree} />
      <span className={styles.line} aria-hidden />
      {step ? (
        <>
          {slot.parentKey !== null && (
            <>
              <span className={styles.wait}>
                {step.delayDays === 0 ? "Right away" : `Wait ${plural(step.delayDays, "day")}`}
              </span>
              <span className={styles.line} aria-hidden />
            </>
          )}
          <StepNode step={step} tree={tree} />
          {isCondition(step.type) ? (
            <div className={styles.branches}>
              <div className={styles.branch}>
                <span className={cn(styles.answer, styles.yes)}>Yes</span>
                <Chain slot={{ parentKey: step.key, branch: "Yes" }} tree={tree} />
              </div>
              <div className={styles.branch}>
                <span className={cn(styles.answer, styles.no)}>No</span>
                <Chain slot={{ parentKey: step.key, branch: "No" }} tree={tree} />
              </div>
            </div>
          ) : (
            <Chain slot={{ parentKey: step.key, branch: null }} tree={tree} />
          )}
        </>
      ) : (
        <span className={styles.end}>End</span>
      )}
    </div>
  )
}

function StepNode({ step, tree }: { step: StepForm; tree: Tree }) {
  const Icon = STEP_ICONS[step.type]
  const selected = step.key === tree.selectedKey
  const invalid = tree.invalid(step.key)

  return (
    <button
      type="button"
      className={cn(styles.node, selected && styles.selected, invalid && styles.invalid)}
      data-kind={stepKind(step.type)}
      aria-pressed={selected}
      onClick={() => tree.onSelect(step.key)}
    >
      <span className={styles.nodeIcon} aria-hidden>
        <Icon />
      </span>
      <span className={styles.nodeText}>
        <span className={styles.nodeTitle}>{STEP_TYPES[step.type]}</span>
        <span className={styles.nodeDetail}>{summary(step)}</span>
      </span>
      {invalid && <span className={styles.invalidDot} aria-label="Needs attention" />}
    </button>
  )
}

/** The + between steps: a menu of the kinds of step that can go in this slot. */
function AddStep({ slot, tree }: { slot: Slot; tree: Tree }) {
  const canAskAccepted = followsInvitation(tree.steps, slot)

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={styles.add}
        disabled={tree.full}
        aria-label="Add a step here"
        title={tree.full ? `A campaign can have up to ${MAX_STEPS} steps.` : "Add a step here"}
      >
        <Plus aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent className={styles.menu}>
        {MENU.map((group, index) => (
          <DropdownMenuGroup key={group.label}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className={styles.menuLabel}>{group.label}</DropdownMenuLabel>
            {group.types.map((type) => {
              const Icon = STEP_ICONS[type]
              const unavailable = type === "IfInvitationAccepted" && !canAskAccepted
              return (
                <DropdownMenuItem
                  key={type}
                  disabled={unavailable}
                  onClick={() => tree.onInsert(slot, type)}
                >
                  <Icon aria-hidden />
                  <span className={styles.menuText}>
                    {STEP_TYPES[type]}
                    {unavailable && (
                      <span className={styles.menuNote}>Needs a connection request above</span>
                    )}
                  </span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** One line under the step's name: what it says or does. */
function summary(step: StepForm): string {
  const firstLine = (text: string) =>
    text
      .split("\n")
      .find((line) => line.trim())
      ?.trim() ?? ""
  switch (step.type) {
    case "Email":
      return step.subject || "No subject yet"
    case "LinkedInMessage":
      return firstLine(step.body) || "No message yet"
    case "LinkedInInvitation":
      return firstLine(step.body) || "No note"
    case "LinkedInProfileView":
      return "They see you viewed their profile"
    case "IfInvitationAccepted":
      return `Waits up to ${plural(step.waitDays, "day")}`
    case "IfHasEmail":
      return "Yes when the lead has one"
  }
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}
