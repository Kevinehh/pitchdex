import { isCondition, type StepBranch, type StepType } from "./types"

/**
 * What the tree helpers need from a step: saved steps in the form, and template steps alike.
 * A step follows the step its parentKey names; after a condition, on its Yes or No branch.
 */
export type TreeStep = {
  key: string
  parentKey: string | null
  branch: StepBranch | null
  type: StepType
  delayDays: number
  waitDays: number
}

/** A place a step can go: after a step (on a branch, after a condition), or first when parentKey is null. */
export type Slot = { parentKey: string | null; branch: StepBranch | null }

/** The step in a slot, if there is one. */
export function stepAt<T extends TreeStep>(steps: readonly T[], slot: Slot): T | undefined {
  return steps.find((step) => step.parentKey === slot.parentKey && step.branch === slot.branch)
}

/** The slots right after a step: Yes and No for a condition, one otherwise. */
export function slotsAfter(step: TreeStep): Slot[] {
  return isCondition(step.type)
    ? [
        { parentKey: step.key, branch: "Yes" },
        { parentKey: step.key, branch: "No" },
      ]
    : [{ parentKey: step.key, branch: null }]
}

/**
 * Parents before children, Yes branches before No: the order the API expects and the
 * numbering the founder sees.
 */
export function ordered<T extends TreeStep>(steps: readonly T[]): T[] {
  const result: T[] = []
  const visit = (slot: Slot) => {
    const step = stepAt(steps, slot)
    if (!step) return
    result.push(step)
    slotsAfter(step).forEach(visit)
  }
  visit({ parentKey: null, branch: null })
  return result
}

/**
 * Puts a step in a slot. Whatever was there moves down to follow it: onto its Yes branch
 * when the new step is a condition.
 */
export function insertStep<T extends TreeStep>(steps: readonly T[], slot: Slot, step: T): T[] {
  const occupant = stepAt(steps, slot)
  const placed = { ...step, parentKey: slot.parentKey, branch: slot.branch }
  const moved = steps.map((existing) =>
    existing === occupant
      ? {
          ...existing,
          parentKey: placed.key,
          branch: isCondition(placed.type) ? ("Yes" as const) : null,
        }
      : existing,
  )
  return ordered([...moved, placed])
}

/** The step and everything after it, on every branch. */
export function subtree<T extends TreeStep>(steps: readonly T[], key: string): T[] {
  const result: T[] = []
  const visit = (current: string) => {
    for (const step of steps.filter((s) => s.parentKey === current)) {
      result.push(step)
      visit(step.key)
    }
  }
  const root = steps.find((step) => step.key === key)
  if (root) {
    result.push(root)
    visit(key)
  }
  return result
}

/**
 * Removes a step. After an action, the step that followed it moves up into its place; a
 * condition takes both its branches with it.
 */
export function removeStep<T extends TreeStep>(steps: readonly T[], key: string): T[] {
  const step = steps.find((s) => s.key === key)
  if (!step) return [...steps]

  if (isCondition(step.type)) {
    const gone = new Set(subtree(steps, key).map((s) => s.key))
    return ordered(steps.filter((s) => !gone.has(s.key)))
  }

  return ordered(
    steps
      .filter((s) => s.key !== key)
      .map((s) =>
        s.parentKey === key ? { ...s, parentKey: step.parentKey, branch: step.branch } : s,
      ),
  )
}

/** Whether a slot sits somewhere after a connection request, which "Accepted invitation?" needs. */
export function followsInvitation(steps: readonly TreeStep[], slot: Slot): boolean {
  let key = slot.parentKey
  while (key) {
    const step = steps.find((s) => s.key === key)
    if (!step) return false
    if (step.type === "LinkedInInvitation") return true
    key = step.parentKey
  }
  return false
}

/**
 * Roughly how long the longest path through the sequence takes, in days: every wait, plus a
 * condition's full waiting time on its No branch.
 */
export function longestDays(steps: readonly TreeStep[]): number {
  const walk = (slot: Slot): number => {
    const step = stepAt(steps, slot)
    if (!step) return 0
    if (!isCondition(step.type)) return step.delayDays + walk({ parentKey: step.key, branch: null })
    return (
      step.delayDays +
      Math.max(
        walk({ parentKey: step.key, branch: "Yes" }),
        step.waitDays + walk({ parentKey: step.key, branch: "No" }),
      )
    )
  }
  return walk({ parentKey: null, branch: null })
}

/** Which channels a sequence uses, for the tags on template cards. */
export function channels(steps: readonly TreeStep[]): ("LinkedIn" | "Email")[] {
  const result: ("LinkedIn" | "Email")[] = []
  if (steps.some((s) => s.type !== "Email" && s.type !== "IfHasEmail")) result.push("LinkedIn")
  if (steps.some((s) => s.type === "Email")) result.push("Email")
  return result
}
