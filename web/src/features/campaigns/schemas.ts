import { z } from "zod"
import type { Campaign, StepBranch, StepType, UpdateCampaignInput } from "./types"

/** The fields a step can use. Matches MessageTemplate on the backend. */
export const TEMPLATE_FIELDS = ["firstName", "fullName", "firm", "calendly"] as const

/** LinkedIn caps connection-request notes at 300 characters. */
export const MAX_INVITE_NOTE = 300

/** Matches SequenceTree on the backend. */
export const MAX_STEPS = 20
export const MAX_WAIT_DAYS = 30

const PLACEHOLDER = /\{\{\s*([A-Za-z]+)\s*\}\}/g

/** Placeholders that aren't one of TEMPLATE_FIELDS, so a typo is caught before saving. */
export function unknownFields(text: string): string[] {
  const known = TEMPLATE_FIELDS.map((field) => field.toLowerCase())
  const names = [...text.matchAll(PLACEHOLDER)].map((match) => match[1])
  return [...new Set(names.filter((name) => !known.includes(name.toLowerCase())))]
}

const fieldsMessage = `Use only these fields: ${TEMPLATE_FIELDS.map((f) => `{{${f}}}`).join(", ")}`

const stepSchema = z
  .object({
    /** A saved step's id, or a made-up key for a step added in this edit. */
    key: z.string().min(1),
    parentKey: z.string().nullable(),
    branch: z.enum(["Yes", "No"] satisfies StepBranch[]).nullable(),
    type: z.enum([
      "Email",
      "LinkedInInvitation",
      "LinkedInMessage",
      "LinkedInProfileView",
      "IfInvitationAccepted",
      "IfHasEmail",
    ] satisfies StepType[]),
    delayDays: z
      .number({ error: "Enter a number of days" })
      .int("Use whole days")
      .min(0, "Can't be negative")
      .max(60, "At most 60 days"),
    waitDays: z.number({ error: "Enter a number of days" }).int("Use whole days"),
    subject: z.string().trim().max(300),
    body: z.string().trim().max(20_000),
  })
  .superRefine((step, ctx) => {
    if (step.type === "Email" && step.subject.length === 0) {
      ctx.addIssue({ code: "custom", path: ["subject"], message: "Add a subject" })
    }
    if ((step.type === "Email" || step.type === "LinkedInMessage") && step.body.length === 0) {
      ctx.addIssue({ code: "custom", path: ["body"], message: "Write the message for this step" })
    }
    if (step.type === "LinkedInInvitation" && step.body.length > MAX_INVITE_NOTE) {
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: `Connection notes can be at most ${MAX_INVITE_NOTE} characters`,
      })
    }
    if (
      step.type === "IfInvitationAccepted" &&
      (step.waitDays < 1 || step.waitDays > MAX_WAIT_DAYS)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["waitDays"],
        message: `Wait between 1 and ${MAX_WAIT_DAYS} days`,
      })
    }
    if (unknownFields(step.subject).length > 0) {
      ctx.addIssue({ code: "custom", path: ["subject"], message: fieldsMessage })
    }
    if (unknownFields(step.body).length > 0) {
      ctx.addIssue({ code: "custom", path: ["body"], message: fieldsMessage })
    }
  })

export const campaignSchema = z
  .object({
    name: z.string().trim().min(1, "Name the campaign").max(200),
    emailAccountId: z.string(),
    linkedInAccountId: z.string(),
    timeZoneId: z.string().min(1, "Choose a time zone"),
    sendFromHour: z.number().int().min(0).max(23),
    sendUntilHour: z.number().int().min(1).max(24),
    weekdaysOnly: z.boolean(),
    steps: z.array(stepSchema).min(1, "Add at least one step").max(MAX_STEPS),
  })
  .refine((campaign) => campaign.sendUntilHour > campaign.sendFromHour, {
    path: ["sendUntilHour"],
    message: "Sending must end after it starts",
  })

export type CampaignForm = z.infer<typeof campaignSchema>
export type StepForm = CampaignForm["steps"][number]

let created = 0

/** A key for a step added in the editor. Saved steps use their id instead. */
function newKey() {
  created += 1
  return `new-${Date.now().toString(36)}-${created}`
}

/**
 * A new step's starting text, so the founder edits rather than starts from nothing. Where it
 * goes in the sequence is set by whoever inserts it.
 */
export function newStep(type: StepType): StepForm {
  const step: StepForm = {
    key: newKey(),
    parentKey: null,
    branch: null,
    type,
    delayDays: 1,
    waitDays: 0,
    subject: "",
    body: "",
  }
  switch (type) {
    case "Email":
      return {
        ...step,
        delayDays: 3,
        subject: "Following up",
        body: "Hi {{firstName}},\n\nJust following up on my note below. Would you be open to a short call?\n\nThanks",
      }
    case "LinkedInInvitation":
      return { ...step, body: "Hi {{firstName}}, I'd love to connect." }
    case "LinkedInMessage":
      return {
        ...step,
        delayDays: 3,
        body: "Thanks for connecting, {{firstName}}! I'm raising our seed round and thought {{firm}} could be a great fit.",
      }
    case "IfInvitationAccepted":
      return { ...step, delayDays: 0, waitDays: 7 }
    case "IfHasEmail":
      return { ...step, delayDays: 0 }
    case "LinkedInProfileView":
      return step
  }
}

/** The form starts from the saved campaign. Empty strings stand in for "none chosen". */
export function toForm(campaign: Campaign): CampaignForm {
  return {
    name: campaign.name,
    emailAccountId: campaign.emailAccountId ?? "",
    linkedInAccountId: campaign.linkedInAccountId ?? "",
    timeZoneId: campaign.timeZoneId,
    sendFromHour: campaign.sendFromHour,
    sendUntilHour: campaign.sendUntilHour,
    weekdaysOnly: campaign.weekdaysOnly,
    steps: [...campaign.steps]
      .sort((a, b) => a.position - b.position)
      .map((step) => ({
        key: step.id,
        parentKey: step.parentStepId,
        branch: step.branch,
        type: step.type,
        delayDays: step.delayDays,
        waitDays: step.waitDays,
        subject: step.subject ?? "",
        body: step.body,
      })),
  }
}

export function toCommand(campaignId: string, form: CampaignForm): UpdateCampaignInput {
  return {
    campaignId,
    name: form.name,
    emailAccountId: form.emailAccountId || null,
    linkedInAccountId: form.linkedInAccountId || null,
    timeZoneId: form.timeZoneId,
    sendFromHour: form.sendFromHour,
    sendUntilHour: form.sendUntilHour,
    weekdaysOnly: form.weekdaysOnly,
    steps: form.steps.map((step) => ({
      key: step.key,
      parentKey: step.parentKey,
      branch: step.branch,
      type: step.type,
      delayDays: step.delayDays,
      waitDays: step.waitDays,
      // Only emails have a subject.
      subject: step.type === "Email" ? step.subject : null,
      body: step.body,
    })),
  }
}

/** The API names fields like "steps[0].body"; the form names them "steps.0.body". */
export function toFormPath(apiField: string): string {
  return apiField.replace(/\[(\d+)\]/g, ".$1")
}
