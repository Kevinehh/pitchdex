import { Link } from "react-router"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAccounts } from "@/features/accounts"
import type { components } from "@/lib/api/schema"
import styles from "./ContactLeadDialog.module.css"
import { EmailComposer } from "./EmailComposer"
import { LinkedInComposer } from "./LinkedInComposer"

type Lead = components["schemas"]["LeadDto"]

type ContactLeadDialogProps = {
  /** The lead to contact. The dialog is closed while this is empty. */
  lead: Lead | null
  onClose: () => void
}

/** Sends one email or LinkedIn step to a lead by hand, from a connected account. */
export function ContactLeadDialog({ lead, onClose }: ContactLeadDialogProps) {
  const accounts = useAccounts()
  const connected = (accounts.data ?? []).filter((account) => account.status === "Connected")

  return (
    <Dialog open={lead !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={styles.content}>
        {lead && (
          <>
            <DialogHeader>
              <DialogTitle>Contact {lead.fullName}</DialogTitle>
              <DialogDescription>
                {lead.firm ? `${lead.firm} · ` : ""}
                {lead.email}
              </DialogDescription>
            </DialogHeader>

            {!accounts.isPending && connected.length === 0 ? (
              <p className={styles.notice}>
                Connect an email or LinkedIn account on the <Link to="/account">Account</Link> page
                first.
              </p>
            ) : (
              <Tabs defaultValue="email">
                <TabsList>
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
                </TabsList>
                <TabsContent value="email">
                  <EmailComposer
                    lead={lead}
                    accounts={connected.filter((account) => account.channel === "Email")}
                    onSent={onClose}
                  />
                </TabsContent>
                <TabsContent value="linkedin">
                  <LinkedInComposer
                    lead={lead}
                    accounts={connected.filter((account) => account.channel === "LinkedIn")}
                    onSent={onClose}
                  />
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
