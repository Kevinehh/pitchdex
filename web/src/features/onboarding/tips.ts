import {
  AtSign,
  CalendarCheck,
  ChartColumn,
  Filter,
  GitBranch,
  LayoutTemplate,
  Link2,
  ListChecks,
  MessageSquareReply,
  MousePointerClick,
  Send,
  Tags,
  UserPlus,
  type LucideIcon,
} from "lucide-react"

/** A banner at the top of a page the first time it's opened: what the page is for. */
export type PageTip = {
  /** Saved on the account once closed. Lowercase words, as the API expects. */
  id: string
  path: string
  title: string
  body: string
  points: { icon: LucideIcon; text: string }[]
}

export const pageTips: PageTip[] = [
  {
    id: "dashboard",
    path: "/dashboard",
    title: "Your raise at a glance",
    body: "What needs you today, where your leads stand, and what went out.",
    points: [
      {
        icon: ListChecks,
        text: "Needs you lists replies to answer, calls to join and paused campaigns.",
      },
      { icon: MousePointerClick, text: "Click a stage in Pipeline to see the leads in it." },
      {
        icon: ChartColumn,
        text: "The chart shows the last 14 days of sends against your daily limits.",
      },
    ],
  },
  {
    id: "explore",
    path: "/explore",
    title: "Find investors for your round",
    body: "Search the investor database, then save the ones that fit as leads.",
    points: [
      { icon: Filter, text: "Filter by stage, industry, geography, fund type and cheque size." },
      { icon: UserPlus, text: "Add to leads saves an investor, ready to put in a campaign." },
      { icon: Tags, text: "Investors you've saved read In leads, so you won't add anyone twice." },
    ],
  },
  {
    id: "campaigns",
    path: "/campaigns",
    title: "How campaigns work",
    body: "A campaign sends a sequence of steps to the leads you add, from your own LinkedIn and mailbox.",
    points: [
      {
        icon: LayoutTemplate,
        text: "Start from a template made for fundraising, or build your own.",
      },
      {
        icon: GitBranch,
        text: "Conditions split leads into Yes and No paths, like whether they accepted.",
      },
      { icon: MessageSquareReply, text: "A reply at any point stops the sequence for that lead." },
    ],
  },
  {
    id: "leads",
    path: "/leads",
    title: "Everyone you're reaching out to",
    body: "Each investor you've saved, grouped by campaign, with where things stand.",
    points: [
      { icon: Tags, text: "Status moves on its own: New, Contacted, Replied, Meeting." },
      { icon: Send, text: "Select leads to add them to a campaign in one go." },
      { icon: UserPlus, text: "Add someone by hand with Add lead, or find more in Explore." },
    ],
  },
  {
    id: "inbox",
    path: "/inbox",
    title: "Every reply in one place",
    body: "Email and LinkedIn conversations with your leads, side by side.",
    points: [
      { icon: AtSign, text: "Replying here sends from your own mailbox or LinkedIn account." },
      {
        icon: MessageSquareReply,
        text: "When a lead replies, their campaign stops so you can take over.",
      },
      { icon: Link2, text: "The panel on the right shows the lead, their campaigns and calls." },
    ],
  },
  {
    id: "calendar",
    path: "/calendar",
    title: "Your investor calls",
    body: "Calls booked through your Calendly, matched to your leads.",
    points: [
      { icon: Link2, text: "Connect Calendly in Settings to bring your bookings in." },
      {
        icon: CalendarCheck,
        text: "Calls from leads open their conversation, and move them to Meeting.",
      },
    ],
  },
]

/** The tip for a page, matched on its exact path, so a campaign's own page doesn't show the list's. */
export function tipFor(pathname: string): PageTip | undefined {
  return pageTips.find((tip) => tip.path === pathname)
}

/** The id the tour is saved under once finished or skipped. */
export const TOUR_ID = "tour"
