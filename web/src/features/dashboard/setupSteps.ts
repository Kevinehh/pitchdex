import type { Setup } from "./types"

export type SetupStep = {
  id: string
  label: string
  /** One line on why, for the reminder in the sidebar. */
  hint: string
  done: boolean
  to: string
}

/** The first-run steps, in order, ticked off from what exists. */
export function setupSteps(setup: Setup): SetupStep[] {
  return [
    {
      id: "mailbox",
      label: "Connect a mailbox",
      hint: "Send emails from your own Gmail or Outlook.",
      done: setup.hasMailbox,
      to: "/account?tab=email",
    },
    {
      id: "linkedin",
      label: "Connect LinkedIn",
      hint: "Send invitations and messages from your profile.",
      done: setup.hasLinkedIn,
      to: "/account",
    },
    {
      id: "leads",
      label: "Save investors as leads",
      hint: "Find investors in Explore and save the ones you like.",
      done: setup.hasLeads,
      to: "/explore",
    },
    {
      id: "campaign",
      label: "Create a campaign",
      hint: "Write the steps your leads get.",
      done: setup.hasCampaign,
      to: "/campaigns",
    },
    {
      id: "launch",
      label: "Launch your first campaign",
      hint: "Start sending to your leads.",
      done: setup.hasLaunchedCampaign,
      to: "/campaigns",
    },
  ]
}
