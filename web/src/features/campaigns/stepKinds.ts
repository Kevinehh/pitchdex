import { AtSign, Eye, Mail, MessageSquare, Split, UserPlus, type LucideIcon } from "lucide-react"
import type { StepType } from "./types"

export const STEP_ICONS: Record<StepType, LucideIcon> = {
  Email: Mail,
  LinkedInInvitation: UserPlus,
  LinkedInMessage: MessageSquare,
  LinkedInProfileView: Eye,
  IfInvitationAccepted: Split,
  IfHasEmail: AtSign,
}

/**
 * The colour family a step is drawn in, set as data-kind on the element: each stylesheet maps
 * these to the app's channel colours, so a step looks the same in the builder and in previews.
 */
export type StepKind = "invitation" | "message" | "view" | "email" | "condition"

export function stepKind(type: StepType): StepKind {
  switch (type) {
    case "LinkedInInvitation":
      return "invitation"
    case "LinkedInMessage":
      return "message"
    case "LinkedInProfileView":
      return "view"
    case "Email":
      return "email"
    case "IfInvitationAccepted":
    case "IfHasEmail":
      return "condition"
  }
}
