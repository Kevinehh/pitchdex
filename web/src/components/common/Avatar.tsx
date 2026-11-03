import { useState } from "react"
import { cn } from "@/lib/utils"
import styles from "./Avatar.module.css"

type AvatarProps = {
  name: string
  /** A profile picture. Falls back to initials when missing or when it fails to load. */
  src?: string | null
  size?: "sm" | "lg"
  className?: string
}

/** A person's picture, or their initials in a circle. The hue comes from the name, so each person keeps theirs. */
export function Avatar({ name, src, size = "sm", className }: AvatarProps) {
  // LinkedIn picture links expire; a broken one shows initials until a fresh link arrives.
  const [failedSrc, setFailedSrc] = useState<string>()
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
      {src && src !== failedSrc ? (
        <img
          src={src}
          alt=""
          className={styles.image}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        initials
      )}
    </span>
  )
}
