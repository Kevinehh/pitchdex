import { useState } from "react"
import { Link } from "react-router"
import { EmptyState } from "@/components/common/EmptyState"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CampaignsTable, NewCampaignDialog } from "@/features/campaigns"
import { NeedsYou } from "@/features/dashboard/components/NeedsYou"
import { Pipeline } from "@/features/dashboard/components/Pipeline"
import { RecentActivity } from "@/features/dashboard/components/RecentActivity"
import { SendingChart } from "@/features/dashboard/components/SendingChart"
import { ThisWeek } from "@/features/dashboard/components/ThisWeek"
import { useSession } from "@/features/auth"
import { useDashboard } from "@/features/dashboard/hooks/useDashboard"
import styles from "./DashboardPage.module.css"

const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
})

function greeting(now: Date) {
  const hour = now.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

/** Home after sign-in: what needs the founder, where leads stand, the week's calls, sending, campaigns. */
export default function DashboardPage() {
  const dashboard = useDashboard()
  const firstName = useSession().data?.user.firstName
  const [now] = useState(() => new Date())

  if (dashboard.isPending) {
    return (
      <div className={styles.loading} aria-busy="true">
        <PageHeader title="Dashboard" />
        <Skeleton className={styles.loadingCards} />
        <Skeleton className={styles.loadingChart} />
      </div>
    )
  }

  if (dashboard.isError) {
    return (
      <EmptyState
        title="The dashboard couldn't load"
        description={dashboard.error.message}
        action={
          <Button variant="outline" onClick={() => dashboard.refetch()}>
            Try again
          </Button>
        }
      />
    )
  }

  const summary = dashboard.data

  return (
    <>
      <PageHeader
        title={firstName ? `${greeting(now)}, ${firstName}` : greeting(now)}
        description={dateFormat.format(now)}
        actions={<NewCampaignDialog />}
      />

      <div className={styles.page}>
        <div className={styles.top}>
          <NeedsYou setup={summary.setup} />
          <Pipeline stages={summary.pipeline} />
          <ThisWeek />
        </div>

        <div className={styles.overview}>
          <SendingChart
            days={summary.days}
            sending={summary.sending}
            replies={summary.replies}
            pendingInvitations={summary.pendingInvitations}
          />
          <RecentActivity activity={summary.activity} className={styles.activity} />
        </div>

        <section aria-labelledby="campaigns-title">
          <header className={styles.sectionHeader}>
            <h2 id="campaigns-title" className={styles.sectionTitle}>
              Campaigns
            </h2>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link to="/campaigns" />}
            >
              All campaigns
            </Button>
          </header>
          <CampaignsTable limit={5} />
        </section>
      </div>
    </>
  )
}
