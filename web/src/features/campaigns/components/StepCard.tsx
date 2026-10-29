import {
  ArrowDown,
  ArrowUp,
  Mail,
  MessageSquare,
  Trash2,
  UserPlus,
  type LucideIcon,
} from "lucide-react"
import { useId, useRef } from "react"
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
import { MAX_INVITE_NOTE, TEMPLATE_FIELDS, type CampaignForm } from "../schemas"
import { STEP_TYPES, type StepType } from "../types"
import styles from "./CampaignEditor.module.css"

const icons: Record<StepType, LucideIcon> = {
  Email: Mail,
  LinkedInInvitation: UserPlus,
  LinkedInMessage: MessageSquare,
}

const hints: Partial<Record<StepType, string>> = {
  LinkedInInvitation: "The note is optional. Leave it empty to send the invitation without one.",
  LinkedInMessage:
    "LinkedIn only delivers messages to people you're connected with, so leave a few days after an invitation.",
}

type StepCardProps = {
  index: number
  total: number
  onMove: (from: number, to: number) => void
  onRemove: (index: number) => void
}

/** One step of the sequence: what kind it is, when it goes out, and what it says. */
export function StepCard({ index, total, onMove, onRemove }: StepCardProps) {
  const id = useId()
  const { control, register, getValues, setValue, formState } = useFormContext<CampaignForm>()
  const type = useWatch({ control, name: `steps.${index}.type` })
  const body = useWatch({ control, name: `steps.${index}.body` })
  const errors = formState.errors.steps?.[index]
  const Icon = icons[type]

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

  return (
    <article className={styles.step} aria-label={`Step ${index + 1}`}>
      <header className={styles.stepHeader}>
        <span className={styles.stepNumber} aria-hidden>
          <Icon />
        </span>
        <span className={styles.stepTitle}>Step {index + 1}</span>

        <Controller
          control={control}
          name={`steps.${index}.type`}
          render={({ field }) => (
            <Select
              modal={false}
              items={STEP_TYPES}
              value={field.value}
              onValueChange={(value) => value && field.onChange(value)}
            >
              <SelectTrigger size="sm" className={styles.typeTrigger} aria-label="Kind of step">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} align="start">
                {Object.entries(STEP_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />

        <div className={styles.stepTools}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Move step up"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Move step down"
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove step"
            disabled={total === 1}
            onClick={() => onRemove(index)}
          >
            <Trash2 />
          </Button>
        </div>
      </header>

      <div className={styles.stepBody}>
        <Field data-invalid={!!errors?.delayDays}>
          <div className={styles.delay}>
            <FieldLabel htmlFor={`${id}-delay`}>{index === 0 ? "Send" : "Wait"}</FieldLabel>
            <Input
              id={`${id}-delay`}
              type="number"
              inputMode="numeric"
              min={0}
              max={60}
              className={styles.delayInput}
              aria-invalid={!!errors?.delayDays}
              {...register(`steps.${index}.delayDays`, { valueAsNumber: true })}
            />
            <span className={styles.delayText}>
              {index === 0 ? "days after a lead is added" : `days after step ${index}`}
            </span>
          </div>
          <FieldError errors={[errors?.delayDays]} />
        </Field>

        {type === "Email" && (
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

        <Field data-invalid={!!errors?.body}>
          <div className={styles.labelRow}>
            <FieldLabel htmlFor={`${id}-body`}>
              {type === "LinkedInInvitation" ? "Note" : "Message"}
            </FieldLabel>
            {type === "LinkedInInvitation" && (
              <span
                className={cn(styles.counter, body.length > MAX_INVITE_NOTE && styles.counterOver)}
              >
                {body.length}/{MAX_INVITE_NOTE}
              </span>
            )}
          </div>
          <Textarea
            id={`${id}-body`}
            className={type === "Email" ? styles.emailBody : styles.shortBody}
            aria-invalid={!!errors?.body}
            {...bodyField}
            ref={(element) => {
              registerBody(element)
              bodyElement.current = element
            }}
          />
          <div className={styles.fields}>
            <span className={styles.fieldsLabel}>Insert</span>
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
          {hints[type] && <FieldDescription>{hints[type]}</FieldDescription>}
          <FieldError errors={[errors?.body]} />
        </Field>
      </div>
    </article>
  )
}
