import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Pause, Play } from "lucide-react"
import { useState } from "react"
import { FormProvider, useForm, type FieldErrors, type FieldPath } from "react-hook-form"
import { Link } from "react-router"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiError } from "@/lib/api/client"
import { useChangeCampaignStatus, useUpdateCampaign } from "../hooks/useCampaigns"
import { campaignSchema, toCommand, toForm, toFormPath, type CampaignForm } from "../schemas"
import type { Campaign, CampaignAction } from "../types"
import styles from "./CampaignEditor.module.css"
import { CampaignStatsStrip } from "./CampaignStatsStrip"
import { DeleteCampaignDialog } from "./DeleteCampaignDialog"
import { EnrollmentsPanel } from "./EnrollmentsPanel"
import { SendingSettings } from "./SendingSettings"
import { SequenceBuilder } from "./SequenceBuilder"
import { CampaignStatusBadge } from "./StatusBadges"

type Tab = "sequence" | "leads" | "settings"

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`

/**
 * One campaign: its steps, its leads and its settings, with Save, Launch and Pause.
 * Steps and settings are one form, saved together.
 */
export function CampaignEditor({ campaign }: { campaign: Campaign }) {
  const [tab, setTab] = useState<Tab>("sequence")
  const form = useForm<CampaignForm>({
    resolver: zodResolver(campaignSchema),
    defaultValues: toForm(campaign),
  })
  const update = useUpdateCampaign(campaign.id)
  const changeStatus = useChangeCampaignStatus(campaign.id)
  const { isDirty, isSubmitting } = form.formState

  /** Opens the tab with the first problem, unless the current one already shows it. */
  function showTabWithErrors(errors: FieldErrors<CampaignForm>) {
    const inSequence = !!errors.steps
    const inSettings = Object.keys(errors).some((field) => field !== "steps" && field !== "root")
    setTab((current) => {
      if ((current === "sequence" && inSequence) || (current === "settings" && inSettings)) {
        return current
      }
      return inSequence ? "sequence" : "settings"
    })
  }

  async function save(values: CampaignForm): Promise<boolean> {
    try {
      const saved = await update.mutateAsync(toCommand(campaign.id, values))
      form.reset(toForm(saved))
      return true
    } catch (error) {
      // Puts the API's validation messages next to the matching fields.
      if (error instanceof ApiError) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          form.setError(toFormPath(field) as FieldPath<CampaignForm>, { message: messages[0] })
        }
        showTabWithErrors(form.formState.errors)
      }
      return false
    }
  }

  const onSave = form.handleSubmit(async (values) => {
    changeStatus.reset()
    await save(values)
  }, showTabWithErrors)

  function runAction(action: CampaignAction) {
    update.reset()
    changeStatus.reset()
    if (action === "pause" || !isDirty) {
      changeStatus.mutate(action)
      return
    }
    // Unsaved edits are saved first, so what goes out is what's on screen.
    void form.handleSubmit(async (values) => {
      if (await save(values)) {
        changeStatus.mutate(action)
      }
    }, showTabWithErrors)()
  }

  // Field problems show next to the fields; anything else (a lost connection, say) shows here.
  const saveProblem =
    update.error instanceof ApiError && Object.keys(update.error.fieldErrors).length > 0
      ? undefined
      : update.error?.message
  const problem = changeStatus.error?.message ?? saveProblem
  const { counts } = campaign

  return (
    <FormProvider {...form}>
      <Link to="/campaigns" className={styles.back}>
        <ArrowLeft aria-hidden /> Campaigns
      </Link>

      <PageHeader
        title={campaign.name}
        description={
          <span className={styles.summary}>
            <CampaignStatusBadge status={campaign.status} />
            {plural(campaign.steps.length, "step")} · {plural(counts.total, "lead")} ·{" "}
            {counts.replied} replied
          </span>
        }
        actions={
          <>
            <Button variant="outline" onClick={onSave} disabled={!isDirty || isSubmitting}>
              {isSubmitting ? "Saving…" : isDirty ? "Save changes" : "Saved"}
            </Button>
            {campaign.status === "Active" ? (
              <Button
                variant="secondary"
                disabled={changeStatus.isPending}
                onClick={() => runAction("pause")}
              >
                <Pause aria-hidden /> Pause
              </Button>
            ) : (
              <Button
                disabled={changeStatus.isPending || isSubmitting}
                onClick={() => runAction(campaign.status === "Draft" ? "launch" : "resume")}
              >
                <Play aria-hidden /> {campaign.status === "Draft" ? "Launch" : "Resume"}
              </Button>
            )}
            <DeleteCampaignDialog campaign={campaign} />
          </>
        }
      />

      {problem && (
        <p role="alert" className={styles.problem}>
          {problem}
        </p>
      )}

      {campaign.status !== "Draft" && <CampaignStatsStrip campaign={campaign} />}

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList>
          <TabsTrigger value="sequence">Sequence</TabsTrigger>
          <TabsTrigger value="leads">Leads ({counts.total})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="sequence" className={styles.tab}>
          {campaign.status !== "Draft" && (
            <p className={styles.notice}>
              Leads keep their place when you edit. Changes apply to the steps they haven&apos;t
              reached yet.
            </p>
          )}
          <form onSubmit={onSave} noValidate>
            <SequenceBuilder />
          </form>
        </TabsContent>

        <TabsContent value="leads" className={styles.tab}>
          <EnrollmentsPanel campaign={campaign} />
        </TabsContent>

        <TabsContent value="settings" className={styles.tab}>
          <form onSubmit={onSave} noValidate>
            <SendingSettings />
          </form>
        </TabsContent>
      </Tabs>
    </FormProvider>
  )
}
