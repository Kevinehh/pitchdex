import type { components } from "@/lib/api/schema"

export type Campaign = components["schemas"]["CampaignDto"]
export type CampaignSummary = components["schemas"]["CampaignSummaryDto"]
export type CampaignStatus = components["schemas"]["CampaignStatus"]
export type EnrollmentCounts = components["schemas"]["EnrollmentCounts"]
export type StepType = components["schemas"]["StepType"]
export type Enrollment = components["schemas"]["EnrollmentDto"]
export type EnrollmentStatus = components["schemas"]["EnrollmentStatus"]
export type EnrollResult = components["schemas"]["EnrollResult"]
export type UpdateCampaignInput = components["schemas"]["UpdateCampaignCommand"]

export type CampaignAction = "launch" | "pause" | "resume"

export type EnrollmentsQuery = {
  page: number
  pageSize?: number
  status?: EnrollmentStatus
}

/** How each kind of step is named in the editor, in the order the Add buttons show them. */
export const STEP_TYPES = {
  Email: "Email",
  LinkedInInvitation: "LinkedIn invitation",
  LinkedInMessage: "LinkedIn message",
} as const satisfies Record<StepType, string>

export const ENROLLMENT_STATUSES = [
  "Active",
  "Completed",
  "Replied",
  "Failed",
  "Stopped",
] as const satisfies readonly EnrollmentStatus[]
