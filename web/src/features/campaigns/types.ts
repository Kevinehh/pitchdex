import type { components } from "@/lib/api/schema"

export type Campaign = components["schemas"]["CampaignDto"]
export type CampaignSummary = components["schemas"]["CampaignSummaryDto"]
export type CampaignStatus = components["schemas"]["CampaignStatus"]
export type EnrollmentCounts = components["schemas"]["EnrollmentCounts"]
export type StepType = components["schemas"]["StepType"]
export type StepBranch = NonNullable<components["schemas"]["StepBranch"]>
export type CampaignTemplate = components["schemas"]["CampaignTemplate"]
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

/** How each kind of step is named in the editor. */
export const STEP_TYPES = {
  Email: "Email",
  LinkedInInvitation: "Connection request",
  LinkedInMessage: "LinkedIn message",
  LinkedInProfileView: "View profile",
  IfInvitationAccepted: "Accepted invitation?",
  IfHasEmail: "Has an email address?",
} as const satisfies Record<StepType, string>

/** Steps that send or do something, as opposed to conditions, which only pick a branch. */
export const ACTION_TYPES = [
  "LinkedInProfileView",
  "LinkedInInvitation",
  "LinkedInMessage",
  "Email",
] as const satisfies readonly StepType[]

export const CONDITION_TYPES = [
  "IfInvitationAccepted",
  "IfHasEmail",
] as const satisfies readonly StepType[]

export function isCondition(type: StepType): boolean {
  return (CONDITION_TYPES as readonly StepType[]).includes(type)
}

export const ENROLLMENT_STATUSES = [
  "Active",
  "Completed",
  "Replied",
  "Failed",
  "Stopped",
] as const satisfies readonly EnrollmentStatus[]
