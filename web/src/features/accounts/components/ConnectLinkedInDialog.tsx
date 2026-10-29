import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useConnectAccount } from "../hooks/useAccounts"
import styles from "./ConnectLinkedInDialog.module.css"

type ConnectLinkedInDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Explains the risk of automating LinkedIn before the founder connects an account. */
export function ConnectLinkedInDialog({ open, onOpenChange }: ConnectLinkedInDialogProps) {
  const [understood, setUnderstood] = useState(false)
  const connect = useConnectAccount()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setUnderstood(false)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect LinkedIn</DialogTitle>
          <DialogDescription>
            You'll sign in to LinkedIn on our messaging provider's page. Pitchdex never sees your
            password.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.notice}>
          <p>
            LinkedIn's user agreement doesn't allow automated activity. LinkedIn can restrict an
            account that looks automated, whichever tool sends the messages.
          </p>
          <p>
            Pitchdex keeps daily limits low and paces actions like a person would, which lowers the
            risk but doesn't remove it.
          </p>
        </div>

        <label className={styles.agree}>
          <Checkbox checked={understood} onCheckedChange={setUnderstood} />
          <span>I understand the risk and want to connect my LinkedIn account.</span>
        </label>

        {connect.isError && (
          <p role="alert" className={styles.error}>
            {connect.error.message}
          </p>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
          <Button
            disabled={!understood || connect.isPending}
            onClick={() => connect.mutate("LinkedIn")}
          >
            {connect.isPending ? "Opening sign-in…" : "Continue to LinkedIn sign-in"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
