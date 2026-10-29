import { z } from "zod"

/** LinkedIn caps connection-request notes at 300 characters. Matches the backend's limit. */
export const MAX_INVITE_NOTE = 300

export const emailSchema = z.object({
  accountId: z.string().min(1, "Choose an email account"),
  subject: z.string().trim().min(1, "Add a subject").max(300),
  body: z.string().trim().min(1, "Write a message").max(20_000),
})

export const linkedInSchema = z
  .object({
    accountId: z.string().min(1, "Choose a LinkedIn account"),
    action: z.enum(["Invitation", "Message"]),
    text: z.string().trim().max(8_000),
  })
  .superRefine((value, ctx) => {
    if (value.action === "Invitation" && value.text.length > MAX_INVITE_NOTE) {
      ctx.addIssue({
        code: "custom",
        path: ["text"],
        message: `Connection notes can be at most ${MAX_INVITE_NOTE} characters`,
      })
    }
    if (value.action === "Message" && value.text.length === 0) {
      ctx.addIssue({ code: "custom", path: ["text"], message: "Write a message" })
    }
  })

export type EmailForm = z.infer<typeof emailSchema>
export type LinkedInForm = z.infer<typeof linkedInSchema>
