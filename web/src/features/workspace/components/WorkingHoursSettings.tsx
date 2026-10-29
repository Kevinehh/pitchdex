import { zodResolver } from "@hookform/resolvers/zod"
import { useId } from "react"
import { Controller, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { FROM_HOURS, timeZoneOptions, UNTIL_HOURS } from "@/lib/sendingWindow"
import { useUpdateWorkingHours, useWorkingHours } from "../hooks/useWorkingHours"
import { workingHoursSchema, type WorkingHoursForm } from "../schemas"
import type { WorkingHours } from "../types"
import styles from "./WorkingHoursSettings.module.css"

/** The sending window new campaigns start with. Each campaign can still change its own. */
export function WorkingHoursSettings() {
  const hours = useWorkingHours()

  if (hours.isPending) {
    return <p className={styles.muted}>Loading…</p>
  }

  if (hours.isError) {
    return (
      <p role="alert" className={styles.error}>
        {hours.error.message}
      </p>
    )
  }

  return <WorkingHoursEditor saved={hours.data} />
}

function WorkingHoursEditor({ saved }: { saved: WorkingHours }) {
  const id = useId()
  const update = useUpdateWorkingHours()
  const form = useForm<WorkingHoursForm>({
    resolver: zodResolver(workingHoursSchema),
    defaultValues: saved,
  })
  const { errors, isDirty, isSubmitting } = form.formState
  const { zones, labels } = timeZoneOptions(saved.timeZoneId)

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      form.reset(await update.mutateAsync(values))
    } catch {
      // The reason is shown above the button from update.error.
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className={styles.form}>
      <p className={styles.muted}>
        New campaigns send only in this window. Set it to your investors&apos; working day. Each
        campaign can change its own in its Settings tab.
      </p>

      <FieldGroup>
        <Field data-invalid={!!errors.timeZoneId}>
          <FieldLabel htmlFor={`${id}-zone`}>Time zone</FieldLabel>
          <Controller
            control={form.control}
            name="timeZoneId"
            render={({ field }) => (
              <Select
                modal={false}
                items={labels}
                value={field.value}
                onValueChange={(value) => value && field.onChange(value)}
              >
                <SelectTrigger id={`${id}-zone`} className={styles.select}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} align="start">
                  {zones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {labels[zone]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.timeZoneId]} />
        </Field>

        <div className={styles.hours}>
          {(
            [
              { name: "sendFromHour", label: "From", items: FROM_HOURS },
              { name: "sendUntilHour", label: "Until", items: UNTIL_HOURS },
            ] as const
          ).map((hour) => (
            <Field key={hour.name} data-invalid={!!errors[hour.name]}>
              <FieldLabel htmlFor={`${id}-${hour.name}`}>{hour.label}</FieldLabel>
              <Controller
                control={form.control}
                name={hour.name}
                render={({ field }) => (
                  <Select
                    modal={false}
                    items={hour.items}
                    value={String(field.value)}
                    onValueChange={(value) => value && field.onChange(Number(value))}
                  >
                    <SelectTrigger id={`${id}-${hour.name}`} className={styles.select}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} align="start">
                      {Object.entries(hour.items).map(([value, text]) => (
                        <SelectItem key={value} value={value}>
                          {text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          ))}
        </div>
        <FieldError errors={[errors.sendUntilHour]} />

        <Field orientation="horizontal">
          <Controller
            control={form.control}
            name="weekdaysOnly"
            render={({ field }) => (
              <Switch
                id={`${id}-weekdays`}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
              />
            )}
          />
          <div>
            <FieldLabel htmlFor={`${id}-weekdays`}>Weekdays only</FieldLabel>
            <FieldDescription>Nothing goes out on Saturdays and Sundays.</FieldDescription>
          </div>
        </Field>
      </FieldGroup>

      {update.isError && (
        <p role="alert" className={styles.error}>
          {update.error.message}
        </p>
      )}

      <div>
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? "Saving…" : isDirty ? "Save working hours" : "Saved"}
        </Button>
      </div>
    </form>
  )
}
