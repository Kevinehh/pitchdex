import { useId } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { Link } from "react-router"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AccountPicker, useAccounts, type Account, type AccountChannel } from "@/features/accounts"
import { FROM_HOURS, timeZoneOptions, UNTIL_HOURS } from "@/lib/sendingWindow"
import type { CampaignForm } from "../schemas"
import styles from "./CampaignEditor.module.css"

/** Name, sender accounts and sending hours. */
export function SendingSettings() {
  const id = useId()
  const { control, register, formState, getValues } = useFormContext<CampaignForm>()
  const { errors } = formState
  const accounts = useAccounts()

  const { zones, labels: zoneItems } = timeZoneOptions(getValues("timeZoneId"))

  return (
    <div className={styles.settings}>
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor={`${id}-name`}>Campaign name</FieldLabel>
          <Input
            id={`${id}-name`}
            autoComplete="off"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>
      </FieldGroup>

      <FieldSet>
        <FieldLegend>Send from</FieldLegend>
        <FieldDescription>
          Each account sends at a safe daily pace, shared across all your campaigns.
        </FieldDescription>
        <FieldGroup>
          <SenderField
            id={`${id}-email`}
            label="Mailbox for email steps"
            name="emailAccountId"
            channel="Email"
            accounts={accounts.data ?? []}
            loading={accounts.isPending}
          />
          <SenderField
            id={`${id}-linkedin`}
            label="LinkedIn account for LinkedIn steps"
            name="linkedInAccountId"
            channel="LinkedIn"
            accounts={accounts.data ?? []}
            loading={accounts.isPending}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Sending hours</FieldLegend>
        <FieldDescription>
          Steps only go out in this window. Set it to your investors&apos; working day.
        </FieldDescription>
        <FieldGroup>
          <Field data-invalid={!!errors.timeZoneId}>
            <FieldLabel htmlFor={`${id}-zone`}>Time zone</FieldLabel>
            <Controller
              control={control}
              name="timeZoneId"
              render={({ field }) => (
                <Select
                  modal={false}
                  items={zoneItems}
                  value={field.value}
                  onValueChange={(value) => value && field.onChange(value)}
                >
                  <SelectTrigger id={`${id}-zone`} className={styles.wideSelect}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} align="start">
                    {zones.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zoneItems[zone]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.timeZoneId]} />
          </Field>

          <div className={styles.hours}>
            <HourField id={`${id}-from`} label="From" name="sendFromHour" items={FROM_HOURS} />
            <HourField id={`${id}-until`} label="Until" name="sendUntilHour" items={UNTIL_HOURS} />
          </div>
          <FieldError errors={[errors.sendUntilHour]} />

          <Field orientation="horizontal">
            <Controller
              control={control}
              name="weekdaysOnly"
              render={({ field }) => (
                <Checkbox
                  id={`${id}-weekdays`}
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked)}
                />
              )}
            />
            <FieldLabel htmlFor={`${id}-weekdays`}>Weekdays only</FieldLabel>
          </Field>
        </FieldGroup>
      </FieldSet>
    </div>
  )
}

type SenderFieldProps = {
  id: string
  label: string
  name: "emailAccountId" | "linkedInAccountId"
  channel: AccountChannel
  accounts: Account[]
  loading: boolean
}

function SenderField({ id, label, name, channel, accounts, loading }: SenderFieldProps) {
  const { control } = useFormContext<CampaignForm>()
  const options = accounts
    .filter((account) => account.channel === channel)
    .map((account) => ({
      ...account,
      displayName:
        account.status === "Connected"
          ? account.displayName
          : `${account.displayName} (${account.status === "NeedsReconnect" ? "needs reconnecting" : "disconnected"})`,
    }))

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {!loading && options.length === 0 ? (
        <p className={styles.notice}>
          None connected. Connect one on the{" "}
          <Link to={channel === "Email" ? "/account?tab=email" : "/account"}>Account</Link> page.
        </p>
      ) : (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <AccountPicker
              id={id}
              accounts={options}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      )}
    </Field>
  )
}

type HourFieldProps = {
  id: string
  label: string
  name: "sendFromHour" | "sendUntilHour"
  items: Record<string, string>
}

function HourField({ id, label, name, items }: HourFieldProps) {
  const { control } = useFormContext<CampaignForm>()
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            modal={false}
            items={items}
            value={String(field.value)}
            onValueChange={(value) => value && field.onChange(Number(value))}
          >
            <SelectTrigger id={id}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start">
              {Object.entries(items).map(([value, text]) => (
                <SelectItem key={value} value={value}>
                  {text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  )
}
