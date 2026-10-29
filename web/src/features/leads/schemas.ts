import { z } from "zod"

/** A LinkedIn profile link, like https://www.linkedin.com/in/jane-doe. Matches the backend's check. */
const LINKEDIN_PROFILE = /^https?:\/\/([a-z]+\.)?linkedin\.com\/in\/[^/]+/i

/** Same limits as CreateLeadValidator on the backend, so most errors show before submitting. */
export const createLeadSchema = z.object({
  fullName: z.string().trim().min(1, "Enter the investor's name").max(200),
  email: z.email("Enter a valid email address").max(320),
  firm: z.string().trim().max(200).optional(),
  linkedInUrl: z
    .string()
    .trim()
    .max(500)
    .refine((url) => url === "" || LINKEDIN_PROFILE.test(url), {
      message: "Enter a LinkedIn profile link, like https://www.linkedin.com/in/name",
    })
    .optional(),
  /** Not sent with the lead: the page adds the new lead to this campaign afterwards. */
  campaignId: z.string().optional(),
})

export type CreateLeadForm = z.infer<typeof createLeadSchema>
