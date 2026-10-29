import { isRouteErrorResponse, useRouteError } from "react-router"
import { EmptyState } from "@/components/common/EmptyState"

export function RouteError() {
  const error = useRouteError()

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Something unexpected happened."

  return <EmptyState title="This page hit an error" description={message} />
}
