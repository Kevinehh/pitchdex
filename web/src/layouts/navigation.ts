import {
  BookOpen,
  CalendarDays,
  ChartColumn,
  Inbox,
  LayoutDashboard,
  Megaphone,
  Search,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

/** `unread` shows the Inbox's unread count beside the link. */
export type NavItem = { to: string; label: string; icon: LucideIcon; unread?: boolean }

export const mainNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/explore", label: "Explore", icon: Search },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/inbox", label: "Inbox", icon: Inbox, unread: true },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/analytics", label: "Analytics", icon: ChartColumn },
  { to: "/resources", label: "Resources", icon: BookOpen },
]

export const settingsNav: NavItem = { to: "/settings", label: "Settings", icon: Settings }
