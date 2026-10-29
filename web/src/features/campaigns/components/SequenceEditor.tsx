import { Plus } from "lucide-react"
import { useFieldArray, useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { MAX_STEPS, newStep, type CampaignForm } from "../schemas"
import { STEP_TYPES, type StepType } from "../types"
import styles from "./CampaignEditor.module.css"
import { StepCard } from "./StepCard"

/** The campaign's steps in order, with buttons to add, move and remove them. */
export function SequenceEditor() {
  const { control, formState } = useFormContext<CampaignForm>()
  const { fields, append, move, remove } = useFieldArray({ control, name: "steps" })
  const listError = formState.errors.steps?.message ?? formState.errors.steps?.root?.message

  return (
    <div className={styles.sequence}>
      <ol className={styles.steps}>
        {fields.map((field, index) => (
          <li key={field.id}>
            <StepCard index={index} total={fields.length} onMove={move} onRemove={remove} />
          </li>
        ))}
      </ol>

      {listError && (
        <p role="alert" className={styles.error}>
          {listError}
        </p>
      )}

      <div className={styles.addRow}>
        <span className={styles.addLabel}>
          {fields.length >= MAX_STEPS
            ? `A campaign can have up to ${MAX_STEPS} steps.`
            : "Add a step"}
        </span>
        {(Object.entries(STEP_TYPES) as [StepType, string][]).map(([type, label]) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            disabled={fields.length >= MAX_STEPS}
            onClick={() => append(newStep(type))}
          >
            <Plus aria-hidden /> {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
