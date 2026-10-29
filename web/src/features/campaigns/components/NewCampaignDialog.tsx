import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router"
import { z } from "zod"
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useCreateCampaign } from "../hooks/useCampaigns"
import styles from "./CampaignDialogs.module.css"

const newCampaignSchema = z.object({
  name: z.string().trim().min(1, "Name the campaign").max(200),
})

type NewCampaignForm = z.infer<typeof newCampaignSchema>

/** Names a new campaign, then opens it in the editor with a first email step to start from. */
export function NewCampaignDialog() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const create = useCreateCampaign()
  const form = useForm<NewCampaignForm>({
    resolver: zodResolver(newCampaignSchema),
    defaultValues: { name: "" },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async ({ name }) => {
    try {
      const campaign = await create.mutateAsync(name)
      await navigate(`/campaigns/${campaign.id}`)
    } catch {
      // The reason is shown under the form from create.error.
    }
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) form.reset()
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus aria-hidden /> New campaign
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={onSubmit} noValidate className={styles.form}>
          <DialogHeader>
            <DialogTitle>New campaign</DialogTitle>
            <DialogDescription>
              A sequence of emails and LinkedIn steps that goes out to the leads you add.
            </DialogDescription>
          </DialogHeader>

          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="campaign-name">Name</FieldLabel>
            <Input
              id="campaign-name"
              autoComplete="off"
              placeholder="Seed round, US angels"
              aria-invalid={!!errors.name}
              {...form.register("name")}
            />
            <FieldError errors={[errors.name]} />
          </Field>

          {create.isError && (
            <p role="alert" className={styles.error}>
              {create.error.message}
            </p>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
