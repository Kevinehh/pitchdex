import { Badge } from "@/components/ui/badge"
import type { Lead, LeadStatus } from "../types"

const variants: Record<LeadStatus, "default" | "secondary" | "outline" | "destructive"> = {
  New: "outline",
  Contacted: "secondary",
  Replied: "default",
  Meeting: "default",
  Passed: "destructive",
}

export function LeadStatusBadge({ status }: { status: Lead["status"] }) {
  if (!status) {
    return null
  }
  return <Badge variant={variants[status]}>{status}</Badge>
}
