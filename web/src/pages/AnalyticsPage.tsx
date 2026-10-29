import { ChartColumn } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"
import { PageHeader } from "@/components/common/PageHeader"

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Open, reply and meeting rates across your campaigns."
      />
      <EmptyState
        icon={ChartColumn}
        title="Analytics come after launch"
        description="The dashboard covers the key numbers until then."
      />
    </>
  )
}
