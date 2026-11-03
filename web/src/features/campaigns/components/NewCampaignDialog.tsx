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
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useCampaignTemplates, useCreateCampaign } from "../hooks/useCampaigns"
import { channels, longestDays } from "../sequenceTree"
import type { CampaignTemplate } from "../types"
import styles from "./NewCampaignDialog.module.css"
import { SequencePreview } from "./SequencePreview"

const newCampaignSchema = z.object({
  name: z.string().trim().min(1, "Name the campaign").max(200),
})

type NewCampaignForm = z.infer<typeof newCampaignSchema>

/** null is "Start from scratch": one email to build on. */
type Choice = string | null

/** Picks a template (or none), names the campaign, then opens it in the builder. */
export function NewCampaignDialog() {
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState<Choice>(null)
  const navigate = useNavigate()
  const create = useCreateCampaign()
  const templates = useCampaignTemplates()
  const form = useForm<NewCampaignForm>({
    resolver: zodResolver(newCampaignSchema),
    defaultValues: { name: "" },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async ({ name }) => {
    try {
      const campaign = await create.mutateAsync({ name, templateId: choice })
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
        if (!next) {
          form.reset()
          setChoice(null)
          create.reset()
        }
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus aria-hidden /> New campaign
      </DialogTrigger>

      <DialogContent className={styles.dialog}>
        <form onSubmit={onSubmit} noValidate className={styles.form}>
          <DialogHeader>
            <DialogTitle>Start a campaign</DialogTitle>
            <DialogDescription>
              Pick a sequence made for reaching investors, or build your own. You can change every
              step after.
            </DialogDescription>
          </DialogHeader>

          <div className={styles.gallery} role="radiogroup" aria-label="Start from">
            <button
              type="button"
              role="radio"
              aria-checked={choice === null}
              className={cn(styles.card, styles.scratch, choice === null && styles.chosen)}
              onClick={() => setChoice(null)}
            >
              <span className={styles.plus} aria-hidden>
                <Plus />
              </span>
              <span className={styles.name}>Start from scratch</span>
              <span className={styles.description}>One email to build on</span>
            </button>

            {templates.isPending
              ? Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} className={styles.skeleton} />
                ))
              : templates.data?.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    chosen={choice === template.id}
                    onChoose={() => setChoice(template.id)}
                  />
                ))}
          </div>
          {templates.isError && (
            <p className={styles.error}>
              Templates couldn&apos;t load. You can still start from scratch.
            </p>
          )}

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

type TemplateCardProps = {
  template: CampaignTemplate
  chosen: boolean
  onChoose: () => void
}

function TemplateCard({ template, chosen, onChoose }: TemplateCardProps) {
  const days = longestDays(template.steps)

  return (
    <button
      type="button"
      role="radio"
      aria-checked={chosen}
      className={cn(styles.card, chosen && styles.chosen)}
      onClick={onChoose}
    >
      <span className={styles.tags}>
        {channels(template.steps).map((channel) => (
          <span key={channel} className={styles.tag} data-channel={channel}>
            {channel}
          </span>
        ))}
      </span>
      <SequencePreview steps={template.steps} />
      <span className={styles.name}>{template.name}</span>
      <span className={styles.description}>{template.description}</span>
      <span className={styles.meta}>
        {template.steps.length} steps · up to {days} {days === 1 ? "day" : "days"}
      </span>
    </button>
  )
}
