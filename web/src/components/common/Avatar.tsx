import { cn } from "@/lib/utils"
import styles from "./Avatar.module.css"

type AvatarProps = {
  name: string
  size?: "sm" | "lg"
  className?: string
}

/** A person's initials in a circle. The hue comes from the name, so each person keeps theirs. */
export function Avatar({ name, size = "sm", className }: AvatarProps) {
  const words = name.trim().split(/\s+/)
  const initials = (
    (words[0]?.[0] ?? "") + (words.length > 1 ? (words.at(-1)?.[0] ?? "") : "")
  ).toUpperCase()
  const hue = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360

  return (
    <span
      className={cn(styles.avatar, size === "lg" && styles.large, className)}
      style={{ "--avatar-hue": hue } as React.CSSProperties}
      aria-hidden
    >
      {initials}
    </span>
  )
}
