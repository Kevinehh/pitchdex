import { Button } from "@/components/ui/button"
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { CampaignStatus, EnrollResult } from "../types"
import styles from "./CampaignDialogs.module.css"

type EnrollSummaryProps = {
  result: EnrollResult
  campaignStatus: CampaignStatus
  onDone: () => void
}

/** What happened: how many were added, why any were skipped, and what may fail later. */
export function EnrollSummary({ result, campaignStatus, onDone }: EnrollSummaryProps) {
  const skipped = [
    [result.alreadyEnrolled, "already in this campaign"],
    [result.inConversation, "already talking with you"],
  ] as const

  const when =
    campaignStatus === "Active"
      ? "Their first step goes out in the next sending window."
      : "Their first step goes out once you launch the campaign."

  return (
    <div className={styles.form}>
      <DialogHeader>
        <DialogTitle>
          {result.enrolled === 0
            ? "No leads added"
            : `Added ${result.enrolled} lead${result.enrolled === 1 ? "" : "s"}`}
        </DialogTitle>
        {result.enrolled > 0 && <DialogDescription>{when}</DialogDescription>}
      </DialogHeader>

      {skipped.some(([count]) => count > 0) && (
        <ul className={styles.result}>
          {skipped
            .filter(([count]) => count > 0)
            .map(([count, reason]) => (
              <li key={reason}>
                Skipped {count}: {reason}
              </li>
            ))}
        </ul>
      )}

      {/* Added anyway: the email steps still go out, only the LinkedIn ones fail. */}
      {result.missingLinkedIn > 0 && (
        <p className={styles.warning}>
          {result.missingLinkedIn === 1
            ? "1 of them has no LinkedIn link, so its LinkedIn steps will fail."
            : `${result.missingLinkedIn} of them have no LinkedIn link, so their LinkedIn steps will fail.`}
        </p>
      )}

      <DialogFooter>
        <Button onClick={onDone}>Done</Button>
      </DialogFooter>
    </div>
  )
}
