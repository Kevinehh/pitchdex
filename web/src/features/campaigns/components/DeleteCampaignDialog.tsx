import { Trash2 } from "lucide-react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useDeleteCampaign } from "../hooks/useCampaigns"
import type { Campaign } from "../types"
import styles from "./CampaignDialogs.module.css"

export function DeleteCampaignDialog({ campaign }: { campaign: Campaign }) {
  const navigate = useNavigate()
  const remove = useDeleteCampaign()

  async function onDelete() {
    try {
      await remove.mutateAsync(campaign.id)
      await navigate("/campaigns", { replace: true })
    } catch {
      // The reason is shown in the dialog from remove.error.
    }
  }

  return (
    <Dialog onOpenChange={(open) => !open && remove.reset()}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Delete campaign" />}>
        <Trash2 />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete “{campaign.name}”?</DialogTitle>
          <DialogDescription>
            {campaign.counts.active > 0
              ? `${campaign.counts.active} leads still in progress stop getting steps. `
              : ""}
            Messages already sent stay in your inbox and on each lead.
          </DialogDescription>
        </DialogHeader>

        {remove.isError && (
          <p role="alert" className={styles.error}>
            {remove.error.message}
          </p>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant="destructive" disabled={remove.isPending} onClick={onDelete}>
            {remove.isPending ? "Deleting…" : "Delete campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
