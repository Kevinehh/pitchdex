import { z } from "zod"
import type { Campaign, StepType, UpdateCampaignInput } from "./types"

/** The fields a step can use. Matches MessageTemplate on the backend. */
export const TEMPLATE_FIELDS = ["firstName", "fullName", "firm"] as const

/** LinkedIn caps connection-request notes at 300 characters. */
export const MAX_INVITE_NOTE = 300

export const MAX_STEPS = 10

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
    type: z.enum(["Email", "LinkedInInvitation", "LinkedInMessage"] satisfies StepType[]),
    delayDays: z
      .number({ error: "Enter a number of days" })
      .int("Use whole days")
      .min(0, "Can't be negative")
      .max(60, "At most 60 days"),
    subject: z.string().trim().max(300),
    body: z.string().trim().max(20_000),
  })
  .superRefine((step, ctx) => {
    if (step.type === "Email" && step.subject.length === 0) {
      ctx.addIssue({ code: "custom", path: ["subject"], message: "Add a subject" })
    }
    if (step.type !== "LinkedInInvitation" && step.body.length === 0) {
      ctx.addIssue({ code: "custom", path: ["body"], message: "Write the message for this step" })
    }
    if (step.type === "LinkedInInvitation" && step.body.length > MAX_INVITE_NOTE) {
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: `Connection notes can be at most ${MAX_INVITE_NOTE} characters`,
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

/** A new step's starting text, so the founder edits rather than starts from nothing. */
export function newStep(type: StepType): StepForm {
  switch (type) {
    case "Email":
      return {
        type,
        delayDays: 3,
        subject: "Following up",
        body: "Hi {{firstName}},\n\nJust following up on my note below. Would you be open to a short call?\n\nThanks",
      }
    case "LinkedInInvitation":
      return { type, delayDays: 1, subject: "", body: "Hi {{firstName}}, I'd love to connect." }
    case "LinkedInMessage":
      return {
        type,
        delayDays: 3,
        subject: "",
        body: "Thanks for connecting, {{firstName}}! I'm raising our seed round and thought {{firm}} could be a great fit.",
      }
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
        type: step.type,
        delayDays: step.delayDays,
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
      type: step.type,
      delayDays: step.delayDays,
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
