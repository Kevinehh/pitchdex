import { Link } from "react-router"
import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="This address doesn't match any page in Pitchdex."
      action={
        <Button nativeButton={false} render={<Link to="/dashboard" />}>
          Go to the dashboard
        </Button>
      }
    />
  )
}
