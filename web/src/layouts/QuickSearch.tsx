import { Megaphone, Search, UserRound, type LucideIcon } from "lucide-react"
import { useEffect, useId, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useCampaigns } from "@/features/campaigns"
import { useLeads } from "@/features/leads"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { cn } from "@/lib/utils"
import { mainNav, settingsNav } from "./navigation"
import styles from "./QuickSearch.module.css"

type Result = {
  id: string
  group: "Leads" | "Campaigns" | "Pages"
  label: string
  detail?: string
  to: string
  icon: LucideIcon
}

const SHOWN_PER_GROUP = 5

/** Leads are searched on the server, so only from this many letters. */
const MIN_LEAD_SEARCH = 2

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent)

/** The search box in the top bar. Ctrl+K (Cmd+K on a Mac) opens it from any page. */
export function QuickSearch() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-label="Search"
        aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
      >
        <Search className={styles.triggerIcon} aria-hidden />
        <span className={styles.triggerText}>Search leads and campaigns</span>
        <kbd className={styles.kbd}>{isMac ? "⌘K" : "Ctrl K"}</kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className={styles.dialog}>
          <SearchPanel onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}

/** The input and its results. Mounted each time the dialog opens, so it starts empty. */
function SearchPanel({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate()
  const listId = useId()
  const [term, setTerm] = useState("")
  const [active, setActive] = useState(0)
  const search = useDebouncedValue(term.trim(), 200)
  const searchLeads = search.length >= MIN_LEAD_SEARCH
  const campaigns = useCampaigns()
  const leads = useLeads(
    { page: 1, pageSize: SHOWN_PER_GROUP, search },
    { enabled: searchLeads },
  )

  const results = useMemo(() => {
    const needle = term.trim().toLowerCase()
    const matches = (text: string) => text.toLowerCase().includes(needle)

    const pages: Result[] = [...mainNav, settingsNav]
      .filter((item) => matches(item.label))
      .map((item) => ({ id: item.to, group: "Pages", label: item.label, to: item.to, icon: item.icon }))
    const campaignResults: Result[] = (campaigns.data ?? [])
      .filter((campaign) => matches(campaign.name))
      .slice(0, SHOWN_PER_GROUP)
      .map((campaign) => ({
        id: campaign.id,
        group: "Campaigns",
        label: campaign.name,
        detail: campaign.status,
        to: `/campaigns/${campaign.id}`,
        icon: Megaphone,
      }))
    const leadResults: Result[] = searchLeads
      ? (leads.data?.items ?? []).map((lead) => ({
          id: lead.id,
          group: "Leads",
          label: lead.fullName,
          detail: lead.firm ?? lead.email,
          to: `/inbox/${lead.id}`,
          icon: UserRound,
        }))
      : []

    // With nothing typed it's a list of places to go; once searching, people come first.
    return needle ? [...leadResults, ...campaignResults, ...pages] : [...pages, ...campaignResults]
  }, [term, campaigns.data, leads.data, searchLeads])

  const current = Math.min(active, results.length - 1)
  const optionId = (index: number) => `${listId}-${index}`

  useEffect(() => {
    document.getElementById(optionId(current))?.scrollIntoView({ block: "nearest" })
  })

  function go(result: Result) {
    navigate(result.to)
    onDone()
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (results.length === 0) {
      return
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const step = event.key === "ArrowDown" ? 1 : -1
      setActive((current + step + results.length) % results.length)
    } else if (event.key === "Enter") {
      event.preventDefault()
      go(results[current])
    }
  }

  return (
    <>
      <DialogTitle className={styles.visuallyHidden}>Search</DialogTitle>
      <div className={styles.inputRow}>
        <Search className={styles.inputIcon} aria-hidden />
        <input
          className={styles.input}
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={results.length > 0 ? optionId(current) : undefined}
          aria-autocomplete="list"
          placeholder="Search leads, campaigns and pages"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          autoFocus
        />
      </div>

      <div id={listId} role="listbox" aria-label="Results" className={styles.results}>
        {results.map((result, index) => {
          const Icon = result.icon
          return (
            <div key={`${result.group}-${result.id}`}>
              {result.group !== results[index - 1]?.group && (
                <div role="presentation" className={styles.group}>
                  {result.group}
                </div>
              )}
              <div
                id={optionId(index)}
                role="option"
                aria-selected={index === current}
                className={cn(styles.option, index === current && styles.active)}
                onMouseMove={() => setActive(index)}
                onClick={() => go(result)}
              >
                <Icon className={styles.optionIcon} aria-hidden />
                <span className={styles.label}>{result.label}</span>
                {result.detail && <span className={styles.detail}>{result.detail}</span>}
              </div>
            </div>
          )
        })}
        {results.length === 0 && !leads.isFetching && (
          <p className={styles.empty}>Nothing matches &ldquo;{term.trim()}&rdquo;.</p>
        )}
        {searchLeads && leads.isFetching && <p className={styles.empty}>Searching leads…</p>}
      </div>

      <footer className={styles.footer} aria-hidden>
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> to move
        </span>
        <span>
          <kbd>Enter</kbd> to open
        </span>
        <span>
          <kbd>Esc</kbd> to close
        </span>
      </footer>
    </>
  )
}
