import { Trash2 } from "lucide-react"
import { useId, useRef, useState } from "react"
import { Controller, useFormContext, useWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  MAX_INVITE_NOTE,
  MAX_WAIT_DAYS,
  newStep,
  TEMPLATE_FIELDS,
  type CampaignForm,
} from "../schemas"
import { subtree } from "../sequenceTree"
import { STEP_ICONS, stepKind } from "../stepKinds"
import { ACTION_TYPES, isCondition, STEP_TYPES, type StepType } from "../types"
import styles from "./StepPanel.module.css"

const actionItems = Object.fromEntries(ACTION_TYPES.map((type) => [type, STEP_TYPES[type]]))

const hints: Partial<Record<StepType, string>> = {
  LinkedInInvitation: "The note is optional. Leave it empty to send the request without one.",
  LinkedInMessage:
    'LinkedIn only delivers messages to connections. Put this after "Accepted invitation?", or leave a few days after a connection request.',
  LinkedInProfileView:
    'Views their profile from your LinkedIn account, so they see you under "Who viewed your profile". Up to 80 a day.',
  IfHasEmail: "Leads with an email address go down Yes, the rest down No.",
}

type StepPanelProps = {
  index: number
  /** False for the only step left, or a first condition that would take every step with it. */
  removable: boolean
  onRemove: () => void
}

/** The selected step's settings: its kind, when it goes, and what it says. */
export function StepPanel({ index, removable, onRemove }: StepPanelProps) {
  const id = useId()
  const { control, register, getValues, setValue, formState } = useFormContext<CampaignForm>()
  const steps = useWatch({ control, name: "steps" })
  const step = steps[index]
  const errors = formState.errors.steps?.[index]
  const [confirming, setConfirming] = useState(false)
  const Icon = STEP_ICONS[step.type]
  const condition = isCondition(step.type)
  const removes = subtree(steps, step.key).length
  const hasText =
    step.type === "Email" || step.type === "LinkedInInvitation" || step.type === "LinkedInMessage"

  const bodyElement = useRef<HTMLTextAreaElement | null>(null)
  const { ref: registerBody, ...bodyField } = register(`steps.${index}.body`)

  /** Puts a {{field}} where the cursor is in the message, or at the end. */
  function insertField(field: string) {
    const element = bodyElement.current
    const current = getValues(`steps.${index}.body`)
    const start = element?.selectionStart ?? current.length
    const end = element?.selectionEnd ?? start
    const token = `{{${field}}}`
    setValue(`steps.${index}.body`, current.slice(0, start) + token + current.slice(end), {
      shouldDirty: true,
      shouldValidate: formState.isSubmitted,
    })
    requestAnimationFrame(() => {
      element?.focus()
      element?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  /** Switching kind keeps what's written, and fills in starter text where there's none. */
  function changeType(type: StepType) {
    const starter = newStep(type)
    setValue(`steps.${index}.type`, type, { shouldDirty: true })
    if (type === "Email" && !getValues(`steps.${index}.subject`)) {
      setValue(`steps.${index}.subject`, starter.subject, { shouldDirty: true })
    }
    if (!getValues(`steps.${index}.body`) && starter.body) {
      setValue(`steps.${index}.body`, starter.body, { shouldDirty: true })
    }
  }

  return (
    <section className={styles.panel} aria-label={`Step ${index + 1}: ${STEP_TYPES[step.type]}`}>
      <header className={styles.header} data-kind={stepKind(step.type)}>
        <span className={styles.icon} aria-hidden>
          <Icon />
        </span>
        {condition ? (
          <span className={styles.title}>{STEP_TYPES[step.type]}</span>
        ) : (
          <Controller
            control={control}
            name={`steps.${index}.type`}
            render={({ field }) => (
              <Select
                modal={false}
                items={actionItems}
                value={field.value}
                onValueChange={(value) => value && changeType(value as StepType)}
              >
                <SelectTrigger size="sm" className={styles.typeTrigger} aria-label="Kind of step">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} align="start">
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {STEP_TYPES[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
        <span className={styles.number}>Step {index + 1}</span>
      </header>

      <div className={styles.body}>
        {step.parentKey === null ? (
          <p className={styles.note}>Goes as soon as a lead is added, within your sending hours.</p>
        ) : (
          <Field data-invalid={!!errors?.delayDays}>
            <div className={styles.inline}>
              <FieldLabel htmlFor={`${id}-delay`}>Wait</FieldLabel>
              <Input
                id={`${id}-delay`}
                type="number"
                inputMode="numeric"
                min={0}
                max={60}
                className={styles.days}
                aria-invalid={!!errors?.delayDays}
                {...register(`steps.${index}.delayDays`, { valueAsNumber: true })}
              />
              <span className={styles.muted}>
                {step.branch ? "days after the answer" : "days after the step before"}
              </span>
            </div>
            <FieldError errors={[errors?.delayDays]} />
          </Field>
        )}

        {step.type === "IfInvitationAccepted" && (
          <Field data-invalid={!!errors?.waitDays}>
            <div className={styles.inline}>
              <FieldLabel htmlFor={`${id}-wait`}>No after</FieldLabel>
              <Input
                id={`${id}-wait`}
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_WAIT_DAYS}
                className={styles.days}
                aria-invalid={!!errors?.waitDays}
                {...register(`steps.${index}.waitDays`, { valueAsNumber: true })}
              />
              <span className={styles.muted}>days</span>
            </div>
            <FieldDescription>
              Yes as soon as they accept your connection request. No if they haven&apos;t within
              this many days of it going out.
            </FieldDescription>
            <FieldError errors={[errors?.waitDays]} />
          </Field>
        )}

        {step.type === "Email" && (
          <Field data-invalid={!!errors?.subject}>
            <FieldLabel htmlFor={`${id}-subject`}>Subject</FieldLabel>
            <Input
              id={`${id}-subject`}
              autoComplete="off"
              aria-invalid={!!errors?.subject}
              {...register(`steps.${index}.subject`)}
            />
            <FieldError errors={[errors?.subject]} />
          </Field>
        )}

        {hasText && (
          <Field data-invalid={!!errors?.body}>
            <div className={styles.labelRow}>
              <FieldLabel htmlFor={`${id}-body`}>
                {step.type === "LinkedInInvitation" ? "Note" : "Message"}
              </FieldLabel>
              {step.type === "LinkedInInvitation" && (
                <span
                  className={cn(
                    styles.counter,
                    step.body.length > MAX_INVITE_NOTE && styles.counterOver,
                  )}
                >
                  {step.body.length}/{MAX_INVITE_NOTE}
                </span>
              )}
            </div>
            <Textarea
              id={`${id}-body`}
              className={step.type === "Email" ? styles.emailBody : styles.shortBody}
              aria-invalid={!!errors?.body}
              {...bodyField}
              ref={(element) => {
                registerBody(element)
                bodyElement.current = element
              }}
            />
            <div className={styles.fields}>
              <span className={styles.muted}>Insert</span>
              {TEMPLATE_FIELDS.map((field) => (
                <Button
                  key={field}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => insertField(field)}
                >
                  {`{{${field}}}`}
                </Button>
              ))}
            </div>
            <FieldError errors={[errors?.body]} />
          </Field>
        )}

        {hints[step.type] && <p className={styles.note}>{hints[step.type]}</p>}
      </div>

      <footer className={styles.footer}>
        {confirming ? (
          <>
            <span className={styles.muted}>
              Remove this and the {removes - 1} {removes - 1 === 1 ? "step" : "steps"} below it?
            </span>
            <Button type="button" variant="destructive" size="sm" onClick={onRemove}>
              Remove
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!removable}
            title={removable ? undefined : "A campaign needs at least one step."}
            // A condition takes its branches with it, so that asks first.
            onClick={() => (condition && removes > 1 ? setConfirming(true) : onRemove())}
          >
            <Trash2 aria-hidden /> Remove step
          </Button>
        )}
      </footer>
    </section>
  )
}
