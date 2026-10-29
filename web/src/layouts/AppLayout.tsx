import {
  BookOpen,
  ChartColumn,
  Inbox,
  LayoutDashboard,
  Megaphone,
  Search,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"
import { NavLink, Outlet, useMatches, useNavigation } from "react-router"
import { isWideRoute } from "@/app/routeHandle"
import { useConversationCounts } from "@/features/inbox"
import { cn } from "@/lib/utils"
import { AccountMenu } from "./AccountMenu"
import styles from "./AppLayout.module.css"

/** `unread` shows the Inbox's unread count beside the link. */
type NavItem = { to: string; label: string; icon: LucideIcon; unread?: boolean }

const mainNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/explore", label: "Explore", icon: Search },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/inbox", label: "Inbox", icon: Inbox, unread: true },
  { to: "/analytics", label: "Analytics", icon: ChartColumn },
  { to: "/resources", label: "Resources", icon: BookOpen },
]

const settingsNav: NavItem = { to: "/settings", label: "Settings", icon: Settings }

/** The signed-in shell: sidebar on desktop, a scrolling row of links on phones. */
export function AppLayout() {
  const navigation = useNavigation()
  // Pages with wide tables (Explore) set handle: { wide: true } in the router.
  const wide = isWideRoute(useMatches())

  return (
    <div className={styles.shell}>
      {navigation.state === "loading" && <div className={styles.loadingBar} />}

      <aside className={styles.sidebar}>
        <div className={styles.brand}>Pitchdex</div>
        <AccountMenu />
        <nav className={styles.nav} aria-label="Main">
          {mainNav.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
          <hr className={styles.divider} />
          <NavItemLink item={settingsNav} />
        </nav>
      </aside>

      <div className={styles.content}>
        <header className={styles.mobileHeader}>
          <div className={styles.mobileBrand}>Pitchdex</div>
          <nav className={styles.mobileNav} aria-label="Main">
            {[...mainNav, settingsNav].map((item) => (
              <NavItemLink key={item.to} item={item} />
            ))}
          </nav>
        </header>

        <main className={cn(styles.main, wide && styles.wide)}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function NavItemLink({ item }: { item: NavItem }) {
  const Icon = item.icon

  return (
    <NavLink to={item.to} className={({ isActive }) => cn(styles.link, isActive && styles.active)}>
      <Icon className={styles.linkIcon} aria-hidden />
      {item.label}
      {item.unread && <UnreadBadge />}
    </NavLink>
  )
}

/** How many conversations have replies the founder hasn't read. Hidden at zero. */
function UnreadBadge() {
  const counts = useConversationCounts()
  const unread = counts.data?.unread ?? 0
  if (unread === 0) {
    return null
  }
  return (
    <span className={styles.badge} aria-label={`${unread} unread`}>
      {unread > 99 ? "99+" : unread}
    </span>
  )
}
