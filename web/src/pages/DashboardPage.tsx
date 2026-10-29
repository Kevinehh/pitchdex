import { Link } from "react-router"
import { EmptyState } from "@/components/common/EmptyState"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CampaignsTable, NewCampaignDialog } from "@/features/campaigns"
import { RecentActivity } from "@/features/dashboard/components/RecentActivity"
import { RecentReplies } from "@/features/dashboard/components/RecentReplies"
import { SetupChecklist } from "@/features/dashboard/components/SetupChecklist"
import { Statistics } from "@/features/dashboard/components/Statistics"
import { useSession } from "@/features/auth"
import { useDashboard } from "@/features/dashboard/hooks/useDashboard"
import styles from "./DashboardPage.module.css"

function greeting(now = new Date()) {
  const hour = now.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

/** Home after sign-in: how sending is going, what happened, and how each campaign is doing. */
export default function DashboardPage() {
  const dashboard = useDashboard()
  const firstName = useSession().data?.user.firstName

  if (dashboard.isPending) {
    return (
      <div className={styles.loading} aria-busy="true">
        <PageHeader title="Dashboard" />
        <Skeleton className={styles.loadingTop} />
        <Skeleton className={styles.loadingCampaigns} />
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
  const running = summary.activeCampaigns

  return (
    <>
      <PageHeader
        title={firstName ? `${greeting()}, ${firstName}` : greeting()}
        description={`${running} ${running === 1 ? "campaign" : "campaigns"} running · ${summary.unreadConversations} unread`}
        actions={<NewCampaignDialog />}
      />

      <div className={styles.top}>
        <Statistics
          sending={summary.sending}
          replies={summary.replies}
          unreadConversations={summary.unreadConversations}
          pendingInvitations={summary.pendingInvitations}
        />
        <RecentActivity activity={summary.activity} />
      </div>

      <section className={styles.campaigns} aria-labelledby="recent-campaigns">
        <header className={styles.sectionHeader}>
          <h2 id="recent-campaigns" className={styles.sectionTitle}>
            Recent campaigns
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

      <div className={styles.grid}>
        <RecentReplies />
        <SetupChecklist setup={summary.setup} />
      </div>
    </>
  )
}
