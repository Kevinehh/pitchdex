import { ChevronDown, LogOut, Monitor, Moon, Settings, Sun, UserRound } from "lucide-react"
import { useNavigate } from "react-router"
import { Avatar } from "@/components/common/Avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession, useSignOut } from "@/features/auth"
import { useTheme, type ThemePreference } from "@/lib/theme"
import styles from "./AccountMenu.module.css"

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

/** The avatar in the top bar: who's signed in, their account and settings, the theme, and signing out. */
export function AccountMenu() {
  const navigate = useNavigate()
  const session = useSession()
  const signOut = useSignOut()
  const { preference, setPreference } = useTheme()
  const user = session.data?.user
  const name = user ? `${user.firstName} ${user.lastName}`.trim() : ""

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className={styles.trigger} aria-label="Account menu">
        <Avatar name={name} />
        <ChevronDown className={styles.chevron} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={styles.menu}>
        {user && (
          <DropdownMenuGroup>
            <DropdownMenuLabel className={styles.who}>
              <span className={styles.name}>{name}</span>
              <span className={styles.email}>{user.email}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
        )}
        <DropdownMenuItem onClick={() => navigate("/account")}>
          <UserRound aria-hidden /> My account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings aria-hidden /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className={styles.groupLabel}>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={preference}
            onValueChange={(value) => setPreference(value as ThemePreference)}
          >
            {themes.map(({ value, label, icon: Icon }) => (
              <DropdownMenuRadioItem key={value} value={value} closeOnClick>
                <Icon aria-hidden /> {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signOut.isPending}
          onClick={() =>
            signOut.mutate(undefined, {
              onSuccess: () => navigate("/sign-in", { replace: true }),
            })
          }
        >
          <LogOut aria-hidden /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
