import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMarkTipSeen, useSeenTips } from "../hooks/useTips"
import { TOUR_ID } from "../tips"
import styles from "./ProductTour.module.css"

/** One stop on the tour: the element marked data-tour={target}, or the middle of the screen. */
type TourStep = { target?: string; title: string; body: string }

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent)

const WELCOME: TourStep = {
  title: "Welcome to Pitchdex",
  body: "A quick look at how founders use it to reach investors. It takes under a minute.",
}

const STOPS: TourStep[] = [
  {
    target: "explore",
    title: "Find investors",
    body: "Search investors by stage, industry, geography and cheque size, and save the ones that fit as leads.",
  },
  {
    target: "campaigns",
    title: "Reach out in sequence",
    body: "A campaign sends connection requests, LinkedIn messages and emails to your leads on a schedule, from your own accounts. Templates get you started.",
  },
  {
    target: "leads",
    title: "Keep track of every investor",
    body: "Each lead's status moves as they hear from you, reply and book a call, so you always know where things stand.",
  },
  {
    target: "inbox",
    title: "Answer replies",
    body: "Email and LinkedIn replies land here. A reply stops that lead's campaign, so you can take it from there.",
  },
  {
    target: "calendar",
    title: "See your calls",
    body: "Calls booked through your Calendly show up here, linked to the lead you're talking to.",
  },
  {
    target: "search",
    title: "Jump to anything",
    body: `Search leads, campaigns and pages from anywhere. Press ${isMac ? "⌘K" : "Ctrl K"}.`,
  },
  {
    target: "setup",
    title: "Finish setting up",
    body: "Your next setup step waits here. Connect a mailbox and LinkedIn before you launch a campaign.",
  },
  {
    target: "account",
    title: "Your account",
    body: "Connected accounts, theme and signing out. You can replay this tour and the page tips from here too.",
  },
]

/** The visible element marked for a stop: the sidebar's link on a computer, the top row's on a phone. */
function findTarget(name: string): HTMLElement | undefined {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)).find(
    (element) => element.getClientRects().length > 0,
  )
}

/** The first-time tour, until the founder finishes or skips it. */
export function ProductTour() {
  const seen = useSeenTips()
  const markSeen = useMarkTipSeen()

  if (!seen || seen.has(TOUR_ID)) {
    return null
  }
  return <Tour onFinish={() => markSeen.mutate(TOUR_ID)} />
}

function Tour({ onFinish }: { onFinish: () => void }) {
  const id = useId()
  // Stops whose element isn't on screen (setup is done, say) are left out once the tour starts.
  const [steps, setSteps] = useState<TourStep[]>([WELCOME])
  const [index, setIndex] = useState(0)
  const step = steps[index]
  const rect = useTargetRect(step.target)
  const card = useRef<HTMLDivElement>(null)
  const primary = useRef<HTMLButtonElement>(null)
  const last = index === steps.length - 1 && index > 0

  useEffect(() => {
    primary.current?.focus()
  }, [index])

  // Back to wherever focus was before the tour opened.
  useEffect(() => {
    const before = document.activeElement
    return () => {
      if (before instanceof HTMLElement) before.focus()
    }
  }, [])

  function start() {
    setSteps([WELCOME, ...STOPS.filter((stop) => stop.target && findTarget(stop.target))])
    setIndex(1)
  }

  /** Escape skips; Tab stays inside the card. */
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault()
      onFinish()
      return
    }
    if (event.key !== "Tab" || !card.current) return
    const buttons = Array.from(card.current.querySelectorAll<HTMLElement>("button"))
    const first = buttons[0]
    const end = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      end.focus()
    } else if (!event.shiftKey && document.activeElement === end) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div className={styles.root} onKeyDown={onKeyDown}>
      <div className={cn(styles.blocker, !rect && styles.dim)} aria-hidden />
      {rect && (
        <div
          className={styles.spotlight}
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
          aria-hidden
        />
      )}

      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-body`}
        className={cn(styles.card, !rect && styles.centered)}
        style={rect ? placeCard(rect) : undefined}
      >
        <h2 id={`${id}-title`} className={styles.title}>
          {step.title}
        </h2>
        <p id={`${id}-body`} className={styles.body}>
          {step.body}
        </p>

        <div className={styles.footer}>
          {index > 0 && (
            <span className={styles.progress} aria-label={`Step ${index} of ${steps.length - 1}`}>
              {steps.slice(1).map((stop, stopIndex) => (
                <span
                  key={stop.target}
                  className={cn(styles.dot, stopIndex === index - 1 && styles.current)}
                />
              ))}
            </span>
          )}
          <div className={styles.buttons}>
            {index === 0 ? (
              <>
                <Button variant="ghost" size="sm" onClick={onFinish}>
                  Skip
                </Button>
                <Button ref={primary} size="sm" onClick={start}>
                  Show me around
                </Button>
              </>
            ) : (
              <>
                {!last && (
                  <Button variant="ghost" size="sm" onClick={onFinish}>
                    Skip
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setIndex(index - 1)}>
                  Back
                </Button>
                <Button
                  ref={primary}
                  size="sm"
                  onClick={() => (last ? onFinish() : setIndex(index + 1))}
                >
                  {last ? "Done" : "Next"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** Where the marked element is on screen, kept current as the page scrolls or resizes. */
function useTargetRect(name: string | undefined): DOMRect | null {
  // Kept with the name it was measured for, so a stop without an element shows no stale ring.
  const [measured, setMeasured] = useState<{ name: string; rect: DOMRect } | null>(null)

  useLayoutEffect(() => {
    const element = name ? findTarget(name) : undefined
    if (!name || !element) return
    // The phone's row of links scrolls sideways; bring this one into view.
    element.scrollIntoView({ block: "nearest", inline: "center" })
    const update = () => setMeasured({ name, rect: element.getBoundingClientRect() })
    update()
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
    }
  }, [name])

  return measured && measured.name === name ? measured.rect : null
}

const CARD_WIDTH = 320
const CARD_HEIGHT = 220
const GAP = 16

/** Beside the element when there's room (the sidebar), otherwise below it, otherwise above. */
function placeCard(rect: DOMRect): CSSProperties {
  const width = Math.min(CARD_WIDTH, window.innerWidth - GAP * 2)
  const clampLeft = (left: number) => Math.min(Math.max(left, GAP), window.innerWidth - width - GAP)

  if (window.innerWidth - rect.right >= width + GAP * 2) {
    return {
      width,
      left: rect.right + GAP,
      top: Math.min(Math.max(rect.top - 8, GAP), window.innerHeight - CARD_HEIGHT - GAP),
    }
  }
  const left = clampLeft(rect.left + rect.width / 2 - width / 2)
  if (window.innerHeight - rect.bottom >= CARD_HEIGHT + GAP) {
    return { width, left, top: rect.bottom + 12 }
  }
  return { width, left, bottom: window.innerHeight - rect.top + 12 }
}
