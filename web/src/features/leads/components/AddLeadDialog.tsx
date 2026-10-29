import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiError } from "@/lib/api/client"
import { useCreateLead } from "../hooks/useCreateLead"
import { createLeadSchema, type CreateLeadForm } from "../schemas"
import type { Lead } from "../types"
import styles from "./AddLeadDialog.module.css"

const emptyForm: CreateLeadForm = {
  fullName: "",
  email: "",
  firm: "",
  linkedInUrl: "",
  campaignId: "",
}

const NO_CAMPAIGN = "none"

type AddLeadDialogProps = {
  /** Campaigns the new lead can go straight into. The field is hidden when there are none. */
  campaigns?: { id: string; name: string }[]
  /** Called with the new lead, and the campaign chosen for it if any. */
  onCreated?: (lead: Lead, campaignId: string | undefined) => void
}

export function AddLeadDialog({ campaigns = [], onCreated }: AddLeadDialogProps) {
  const [open, setOpen] = useState(false)
  const createLead = useCreateLead()
  const form = useForm<CreateLeadForm>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: emptyForm,
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async ({ campaignId, ...values }) => {
    try {
      const lead = await createLead.mutateAsync({
        ...values,
        firm: values.firm || null,
        linkedInUrl: values.linkedInUrl || null,
      })
      form.reset(emptyForm)
      setOpen(false)
      onCreated?.(lead, campaignId || undefined)
    } catch (error) {
      showServerErrors(error)
    }
  })

  // Puts the API's validation messages next to the matching inputs.
  function showServerErrors(error: unknown) {
    const fieldErrors = error instanceof ApiError ? Object.entries(error.fieldErrors) : []
    const knownFields = fieldErrors.filter(([field]) => field in createLeadSchema.shape)

    if (knownFields.length === 0) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "The lead couldn't be saved.",
      })
      return
    }

    for (const [field, messages] of knownFields) {
      form.setError(field as keyof CreateLeadForm, { message: messages[0] })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) form.reset(emptyForm)
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus aria-hidden /> Add lead
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={onSubmit} noValidate className={styles.form}>
          <DialogHeader>
            <DialogTitle>Add a lead</DialogTitle>
            <DialogDescription>Add an investor you want to contact.</DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field data-invalid={!!errors.fullName}>
              <FieldLabel htmlFor="lead-full-name">Name</FieldLabel>
              <Input
                id="lead-full-name"
                autoComplete="off"
                aria-invalid={!!errors.fullName}
                {...form.register("fullName")}
              />
              <FieldError errors={[errors.fullName]} />
            </Field>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="lead-email">Email</FieldLabel>
              <Input
                id="lead-email"
                type="email"
                autoComplete="off"
                aria-invalid={!!errors.email}
                {...form.register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field data-invalid={!!errors.firm}>
              <FieldLabel htmlFor="lead-firm">Firm (optional)</FieldLabel>
              <Input
                id="lead-firm"
                autoComplete="off"
                aria-invalid={!!errors.firm}
                {...form.register("firm")}
              />
              <FieldError errors={[errors.firm]} />
            </Field>

            <Field data-invalid={!!errors.linkedInUrl}>
              <FieldLabel htmlFor="lead-linkedin">LinkedIn profile (optional)</FieldLabel>
              <Input
                id="lead-linkedin"
                type="url"
                autoComplete="off"
                placeholder="https://www.linkedin.com/in/name"
                aria-invalid={!!errors.linkedInUrl}
                {...form.register("linkedInUrl")}
              />
              <FieldError errors={[errors.linkedInUrl]} />
            </Field>

            {campaigns.length > 0 && (
              <Field>
                <FieldLabel htmlFor="lead-campaign">Add to campaign (optional)</FieldLabel>
                <Controller
                  control={form.control}
                  name="campaignId"
                  render={({ field }) => (
                    <Select
                      modal={false}
                      items={{
                        [NO_CAMPAIGN]: "Don't add to a campaign",
                        ...Object.fromEntries(campaigns.map((c) => [c.id, c.name])),
                      }}
                      value={field.value || NO_CAMPAIGN}
                      onValueChange={(value) =>
                        field.onChange(value === NO_CAMPAIGN || value === null ? "" : value)
                      }
                    >
                      <SelectTrigger id="lead-campaign" className={styles.select}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} align="start">
                        <SelectItem value={NO_CAMPAIGN}>Don&apos;t add to a campaign</SelectItem>
                        {campaigns.map((campaign) => (
                          <SelectItem key={campaign.id} value={campaign.id}>
                            {campaign.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldDescription>
                  The lead starts at step 1. Campaigns with LinkedIn steps need the LinkedIn link.
                </FieldDescription>
              </Field>
            )}
          </FieldGroup>

          {errors.root && (
            <p role="alert" className={styles.formError}>
              {errors.root.message}
            </p>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding…" : "Add lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
