import { UserRound } from "lucide-react"
import { NavLink, Outlet, useLocation, useNavigation } from "react-router"
import { BrandMark } from "@/components/common/BrandMark"
import { PageBanner } from "@/components/common/pageBanner"
import { PageIcon } from "@/components/common/pageIcon"
import { SetupPrompt } from "@/features/dashboard/components/SetupPrompt"
import { useConversationCounts } from "@/features/inbox"
import { PageTip, ProductTour } from "@/features/onboarding"
import { cn } from "@/lib/utils"
import { AccountMenu } from "./AccountMenu"
import { mainNav, settingsNav, type NavItem } from "./navigation"
import { QuickSearch } from "./QuickSearch"
import styles from "./AppLayout.module.css"

/** Pages whose header shows an icon: the sidebar's, plus My account from the avatar menu. */
const iconPages = [...mainNav, settingsNav, { to: "/account", icon: UserRound }]

/**
 * The signed-in shell: a sidebar (a scrolling row of links on phones) and a top bar with search
 * and the account menu.
 */
export function AppLayout() {
  const navigation = useNavigation()
  const { pathname } = useLocation()
  // A campaign's own page (/campaigns/:id) takes the Campaigns icon.
  const icon =
    iconPages.find((page) => pathname === page.to || pathname.startsWith(`${page.to}/`))?.icon ??
    null

  return (
    <div className={styles.shell}>
      {navigation.state === "loading" && <div className={styles.loadingBar} />}

      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <BrandMark />
          Pitchdex
        </div>
        <nav className={styles.nav} aria-label="Main">
          {mainNav.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
          <div className={styles.navFoot}>
            <SetupPrompt />
            <NavItemLink item={settingsNav} />
          </div>
        </nav>
      </aside>

      <div className={styles.content}>
        <header className={styles.topBar}>
          <div className={styles.mobileBrand}>
            <BrandMark />
            Pitchdex
          </div>
          <div className={styles.search}>
            <QuickSearch />
          </div>
          <AccountMenu />
        </header>
        <nav className={styles.mobileNav} aria-label="Main">
          {[...mainNav, settingsNav].map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </nav>

        <main className={styles.main}>
          <PageIcon.Provider value={icon}>
            <PageBanner.Provider value={<PageTip />}>
              <Outlet />
            </PageBanner.Provider>
          </PageIcon.Provider>
        </main>
      </div>

      <ProductTour />
    </div>
  )
}

function NavItemLink({ item }: { item: NavItem }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) => cn(styles.link, isActive && styles.active)}
      data-tour={item.to.slice(1)}
    >
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
