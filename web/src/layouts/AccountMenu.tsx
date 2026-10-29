import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react"
import { useNavigate } from "react-router"
import { Avatar } from "@/components/common/Avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession, useSignOut } from "@/features/auth"
import styles from "./AccountMenu.module.css"

/** Who's signed in, with links to their account and settings, and signing out. */
export function AccountMenu() {
  const navigate = useNavigate()
  const session = useSession()
  const signOut = useSignOut()
  const user = session.data?.user
  const name = user ? `${user.firstName} ${user.lastName}`.trim() : ""

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className={styles.trigger}>
        <Avatar name={name} />
        <span className={styles.name}>{name}</span>
        <ChevronDown className={styles.chevron} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={styles.menu}>
        {user && (
          <DropdownMenuGroup>
            <DropdownMenuLabel className={styles.email}>{user.email}</DropdownMenuLabel>
          </DropdownMenuGroup>
        )}
        <DropdownMenuItem onClick={() => navigate("/account")}>
          <UserRound aria-hidden /> My account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings aria-hidden /> Settings
        </DropdownMenuItem>
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
