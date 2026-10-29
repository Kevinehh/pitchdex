import { ShieldCheck } from "lucide-react"
import { useSearchParams } from "react-router"
import { PageHeader } from "@/components/common/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SendingLimitsEditor } from "@/features/accounts"
import { WorkingHoursSettings } from "@/features/workspace"
import styles from "./SettingsPage.module.css"

type Tab = "limits" | "hours"

/** How Pitchdex sends: each account's daily limits, and the default working hours. */
export default function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get("tab") === "hours" ? "hours" : "limits"

  return (
    <>
      <PageHeader title="Settings" />

      <Tabs
        value={tab}
        onValueChange={(value) => setParams(value === "hours" ? { tab: "hours" } : {})}
        className={styles.card}
      >
        <TabsList variant="line">
          <TabsTrigger value="limits">Limits &amp; activity control</TabsTrigger>
          <TabsTrigger value="hours">Working hours</TabsTrigger>
        </TabsList>

        <TabsContent value="limits" className={styles.limits}>
          <section aria-labelledby="limits-title" className={styles.section}>
            <h2 id="limits-title" className={styles.title}>
              Maximum actions per day
            </h2>
            <SendingLimitsEditor />
          </section>

          <aside className={styles.advice} aria-labelledby="activity-title">
            <ShieldCheck className={styles.adviceIcon} aria-hidden />
            <h2 id="activity-title" className={styles.title}>
              Activity control
            </h2>
            <p className={styles.text}>
              Every account is held to its own limits over a rolling 24 hours, counting campaign and
              manual sends. Once an account reaches a limit, campaign steps wait until it has room
              again.
            </p>
            <ul className={styles.tips}>
              <li>
                LinkedIn connection requests are also capped at 80 a week, under LinkedIn&apos;s own
                limit.
              </li>
              <li>Keep cold email under about 50 a day per mailbox so it lands in the inbox.</li>
              <li>For a new or quiet account, start low and raise the limits over a few weeks.</li>
            </ul>
          </aside>
        </TabsContent>

        <TabsContent value="hours" className={styles.single}>
          <section aria-labelledby="hours-title" className={styles.section}>
            <h2 id="hours-title" className={styles.title}>
              Working hours
            </h2>
            <WorkingHoursSettings />
          </section>
        </TabsContent>
      </Tabs>
    </>
  )
}
