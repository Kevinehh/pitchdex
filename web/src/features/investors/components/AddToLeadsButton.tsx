import { Check, UserPlus } from "lucide-react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { useSaveInvestor } from "../hooks/useSaveInvestor"
import type { Investor } from "../types"

/** Adds the investor to your leads. Once added it reads "In leads" and links to the Leads page. */
export function AddToLeadsButton({ investor }: { investor: Investor }) {
  const save = useSaveInvestor()

  // isSuccess switches the label straight away, before the refreshed list arrives.
  if (investor.leadId || save.isSuccess) {
    return (
      <Button variant="ghost" size="sm" nativeButton={false} render={<Link to="/leads" />}>
        <Check aria-hidden /> In leads
      </Button>
    )
  }

  return (
    <Button
      variant={save.isError ? "destructive" : "outline"}
      size="sm"
      disabled={save.isPending}
      onClick={() => save.mutate(investor.id)}
      aria-label={`Add ${investor.fullName} to leads`}
    >
      <UserPlus aria-hidden />
      {save.isPending ? "Adding…" : save.isError ? "Try again" : "Add to leads"}
    </Button>
  )
}
