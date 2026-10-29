import { Badge } from "@/components/ui/badge"
import type { CampaignStatus, EnrollmentStatus } from "../types"

type Variant = "default" | "secondary" | "outline" | "destructive"

const campaignVariants: Record<CampaignStatus, Variant> = {
  Draft: "outline",
  Active: "default",
  Paused: "secondary",
}

const campaignLabels: Record<CampaignStatus, string> = {
  Draft: "Draft",
  Active: "Running",
  Paused: "Paused",
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge variant={campaignVariants[status]}>{campaignLabels[status]}</Badge>
}

const enrollmentVariants: Record<EnrollmentStatus, Variant> = {
  Active: "secondary",
  Completed: "outline",
  Replied: "default",
  Failed: "destructive",
  Stopped: "outline",
}

export function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  return <Badge variant={enrollmentVariants[status]}>{status}</Badge>
}
