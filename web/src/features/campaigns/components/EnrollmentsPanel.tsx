import { CircleStop, Users } from "lucide-react"
import { useState } from "react"
import { EmptyState } from "@/components/common/EmptyState"
import { Pagination } from "@/components/common/Pagination"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DEFAULT_PAGE_SIZE } from "@/lib/paging"
import { useEnrollments, useStopEnrollment } from "../hooks/useEnrollments"
import type { Campaign, Enrollment, EnrollmentCounts, EnrollmentStatus } from "../types"
import { AddLeadsDialog } from "./AddLeadsDialog"
import styles from "./EnrollmentsPanel.module.css"
import { EnrollmentStatusBadge } from "./StatusBadges"

const filters: { status?: EnrollmentStatus; label: string; count: keyof EnrollmentCounts }[] = [
  { label: "All", count: "total" },
  { status: "Active", label: "In progress", count: "active" },
  { status: "Replied", label: "Replied", count: "replied" },
  { status: "Completed", label: "Finished", count: "completed" },
  { status: "Failed", label: "Failed", count: "failed" },
  { status: "Stopped", label: "Stopped", count: "stopped" },
]

const timeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" })

/** The leads in a campaign: where each one is in the sequence and when its next step goes out. */
export function EnrollmentsPanel({ campaign }: { campaign: Campaign }) {
  const [status, setStatus] = useState<EnrollmentStatus>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const enrollments = useEnrollments(campaign.id, { page, pageSize, status }, campaign.status)
  const stop = useStopEnrollment(campaign.id)

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.filters} role="group" aria-label="Show leads">
          {filters.map((filter) => (
            <Button
              key={filter.label}
              variant={status === filter.status ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={status === filter.status}
              onClick={() => {
                setStatus(filter.status)
                setPage(1)
              }}
            >
              {filter.label}
              <span className={styles.count}>{campaign.counts[filter.count]}</span>
            </Button>
          ))}
        </div>
        <AddLeadsDialog campaign={campaign} />
      </div>

      {stop.isError && (
        <p role="alert" className={styles.error}>
          {stop.error.message}
        </p>
      )}

      {enrollments.isPending ? (
        <div className={styles.skeletons} aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className={styles.skeletonRow} />
          ))}
        </div>
      ) : enrollments.isError ? (
        <EmptyState
          title="Leads couldn't load"
          description={enrollments.error.message}
          action={
            <Button variant="outline" onClick={() => enrollments.refetch()}>
              Try again
            </Button>
          }
        />
      ) : enrollments.data.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title={status ? "No leads here" : "No leads in this campaign yet"}
          description={
            status
              ? "Try another filter."
              : "Add leads with the Add leads button. Each one starts at step 1."
          }
        />
      ) : (
        <div className={styles.table}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Next step</TableHead>
                <TableHead className={styles.action}>
                  <span className={styles.muted}>Stop</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={enrollments.isPlaceholderData ? styles.loadingNext : undefined}>
              {enrollments.data.items.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div className={styles.lead}>
                      <span className={styles.name}>{enrollment.leadName}</span>
                      {enrollment.leadFirm && (
                        <span className={styles.muted}>{enrollment.leadFirm}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <EnrollmentStatusBadge status={enrollment.status} />
                  </TableCell>
                  <TableCell className={styles.muted}>
                    {progress(enrollment, campaign.steps.length)}
                  </TableCell>
                  <TableCell>
                    <div className={styles.next}>
                      <span>{nextStep(enrollment, campaign)}</span>
                      {enrollment.lastError && (
                        <span className={styles.note}>{enrollment.lastError}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={styles.action}>
                    {enrollment.status === "Active" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Stop the sequence for ${enrollment.leadName}`}
                        title="Stop the sequence for this lead"
                        disabled={stop.isPending}
                        onClick={() => stop.mutate(enrollment.id)}
                      >
                        <CircleStop />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            page={enrollments.data.page}
            pageSize={enrollments.data.pageSize}
            total={enrollments.data.total}
            itemCount={enrollments.data.items.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        </div>
      )}
    </div>
  )
}

function progress(enrollment: Enrollment, stepCount: number): string {
  if (enrollment.status === "Completed") {
    return `All ${stepCount} steps sent`
  }
  if (enrollment.status === "Active") {
    return `Step ${Math.min(enrollment.nextStepPosition + 1, stepCount)} of ${stepCount}`
  }
  return `${enrollment.nextStepPosition} of ${stepCount} sent`
}

function nextStep(enrollment: Enrollment, campaign: Campaign): string {
  if (enrollment.status !== "Active") {
    return "—"
  }
  if (campaign.status === "Draft") {
    return "When you launch"
  }
  if (campaign.status === "Paused") {
    return "Paused"
  }
  if (!enrollment.nextRunAt || new Date(enrollment.nextRunAt).getTime() <= Date.now()) {
    return "Due now"
  }
  return timeFormat.format(new Date(enrollment.nextRunAt))
}
