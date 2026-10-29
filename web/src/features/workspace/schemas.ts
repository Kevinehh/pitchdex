import { z } from "zod"

/** Same rules as UpdateWorkingHoursValidator on the backend. */
export const workingHoursSchema = z
  .object({
    timeZoneId: z.string().min(1, "Choose a time zone"),
    sendFromHour: z.number().int().min(0).max(23),
    sendUntilHour: z.number().int().min(1).max(24),
    weekdaysOnly: z.boolean(),
  })
  .refine((hours) => hours.sendUntilHour > hours.sendFromHour, {
    path: ["sendUntilHour"],
    message: "Sending must end after it starts",
  })

export type WorkingHoursForm = z.infer<typeof workingHoursSchema>
