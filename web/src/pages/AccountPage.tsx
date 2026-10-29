import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import { PageHeader } from "@/components/common/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChannelAccounts, useSyncAccounts } from "@/features/accounts"
import { ChangePasswordForm, ProfileForm, useSession } from "@/features/auth"
import styles from "./AccountPage.module.css"

type Tab = "account" | "email"

/** Who the founder is, and the LinkedIn account and mailboxes Pitchdex sends from. */
export default function AccountPage() {
  const [params, setParams] = useSearchParams()
  const session = useSession()
  const tab: Tab = params.get("tab") === "email" ? "email" : "account"
  const { mutate: syncAccounts, isSuccess: synced } = useSyncAccounts()

  // "1" or "0" when the provider's sign-in page has just sent the founder back here.
  const [signInResult] = useState(() => params.get("connected"))
  const handled = useRef(false)

  // Pick up the new account once, then tidy the address so a refresh doesn't repeat it.
  useEffect(() => {
    if (handled.current) return
    handled.current = true

    if (signInResult === "1") syncAccounts()
    if (signInResult !== null) {
      setParams(tab === "email" ? { tab } : {}, { replace: true })
    }
  }, [signInResult, syncAccounts, setParams, tab])

  return (
    <>
      <PageHeader title="Account settings" />

      {signInResult === "1" && synced && (
        <p role="status" className={styles.notice}>
          Account connected.
        </p>
      )}
      {signInResult === "0" && (
        <p role="alert" className={styles.failed}>
          The sign-in didn&apos;t finish, so no account was connected. Try again.
        </p>
      )}

      <Tabs
        value={tab}
        onValueChange={(value) => setParams(value === "email" ? { tab: "email" } : {})}
        className={styles.card}
      >
        <TabsList variant="line">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="email">Email accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className={styles.columns}>
          <section aria-labelledby="login-title" className={styles.section}>
            <h2 id="login-title" className={styles.title}>
              Pitchdex login
            </h2>
            <div className={styles.subsection}>
              <h3 className={styles.subtitle}>Login</h3>
              <p className={styles.login}>{session.data?.user.email}</p>
            </div>
            <div className={styles.subsection}>
              <h3 className={styles.subtitle}>Name</h3>
              <ProfileForm />
            </div>
            <div className={styles.subsection}>
              <h3 className={styles.subtitle}>Password</h3>
              <ChangePasswordForm />
            </div>
          </section>

          <section aria-labelledby="linkedin-title" className={styles.section}>
            <h2 id="linkedin-title" className={styles.title}>
              LinkedIn account
            </h2>
            <p className={styles.text}>
              You sign in on our provider&apos;s secure page, and it sends your invitations and
              messages in the background. Pitchdex never sees your LinkedIn password.
            </p>
            <ChannelAccounts channel="LinkedIn" />
          </section>
        </TabsContent>

        <TabsContent value="email" className={styles.single}>
          <section aria-labelledby="mailboxes-title" className={styles.section}>
            <h2 id="mailboxes-title" className={styles.title}>
              Mailboxes
            </h2>
            <p className={styles.text}>
              Campaign emails go out from these, and replies come back to your Inbox. You sign in
              with Google or Microsoft; Pitchdex never sees your password.
            </p>
            <ChannelAccounts channel="Email" />
          </section>
        </TabsContent>
      </Tabs>
    </>
  )
}
