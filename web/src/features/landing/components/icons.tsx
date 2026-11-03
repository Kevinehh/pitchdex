import type { SVGProps } from "react"
import shared from "./Landing.module.css"

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

/** The stroke icons the page draws, all 24×24 line art. */
function Stroke({ size = 16, strokeWidth = 2.5, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

export const CheckIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M20 6 9 17l-5-5" />
  </Stroke>
)

export const SendIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
  </Stroke>
)

export const CalendarIcon = (props: IconProps) => (
  <Stroke {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Stroke>
)

export const GridIcon = (props: IconProps) => (
  <Stroke {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18" />
  </Stroke>
)

export const MailIcon = (props: IconProps) => (
  <Stroke {...props}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </Stroke>
)

export const SearchIcon = (props: IconProps) => (
  <Stroke {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Stroke>
)

export const TargetIcon = (props: IconProps) => (
  <Stroke {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </Stroke>
)

export const BoltIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
  </Stroke>
)

export const ShieldIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Stroke>
)

export const ArrowUpIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Stroke>
)

export const SunIcon = (props: IconProps) => (
  <Stroke {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Stroke>
)

export const MoonIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </Stroke>
)

/** The Pitchdex mark and name. */
export function Logo() {
  return (
    <span className={shared.logo}>
      <span className={shared.logoMark}>
        <Stroke size={16} strokeWidth={2.4} stroke="#fff">
          <path d="M4 20V4h9a5 5 0 0 1 0 10H4" />
        </Stroke>
      </span>
      Pitchdex
    </span>
  )
}
