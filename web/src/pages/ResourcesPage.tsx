import { BookOpen } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"
import { PageHeader } from "@/components/common/PageHeader"

export default function ResourcesPage() {
  return (
    <>
      <PageHeader title="Resources" description="Guides and templates for running a raise." />
      <EmptyState
        icon={BookOpen}
        title="Resources come after launch"
        description="Articles and email templates will live here."
      />
    </>
  )
}
