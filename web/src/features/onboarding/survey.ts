import {
  Building2,
  Globe,
  Leaf,
  Megaphone,
  Mic,
  Search,
  Sprout,
  TrendingUp,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react"
import type { components } from "@/lib/api/schema"

export type RaiseSize = NonNullable<components["schemas"]["RaiseSize"]>
export type HeardFrom = NonNullable<components["schemas"]["HeardFrom"]>
export type OnboardingAnswers = components["schemas"]["CompleteOnboardingCommand"]

export type Choice = { value: string; label: string; icon?: LucideIcon }

/** The investor filter values the survey offers, so its answers can switch on Explore's filters. */
export type SurveyOptions = { stages: string[]; industries: string[]; geographies: string[] }

/** The survey's answers while it's being filled in. */
export type Answers = {
  companyName: string
  stage: string | null
  raiseSize: RaiseSize | null
  industries: string[]
  geographies: string[]
  heardFrom: HeardFrom | null
}

export const EMPTY_ANSWERS: Answers = {
  companyName: "",
  stage: null,
  raiseSize: null,
  industries: [],
  geographies: [],
  heardFrom: null,
}

export const MAX_INDUSTRIES = 3

/** Each question: text, one choice (picking it moves on), or several (Continue moves on). */
export type Question =
  | { id: "companyName"; kind: "text"; title: string; hint: string; placeholder: string }
  | {
      id: "stage" | "raiseSize" | "heardFrom"
      kind: "single"
      title: string
      hint: string
      choices: Choice[]
    }
  | {
      id: "industries" | "geographies"
      kind: "multi"
      title: string
      hint: string
      choices: Choice[]
      max?: number
    }

const STAGE_ICONS: Record<string, LucideIcon> = {
  "Pre-Seed": Sprout,
  Seed: Leaf,
  "Series A": TrendingUp,
  "Series B+": Building2,
}

/** Earliest round first, rather than alphabetical; stages we don't know go at the end. */
const STAGE_ORDER = ["Pre-Seed", "Seed", "Series A", "Series B+"]

const RAISE_SIZES: Choice[] = [
  { value: "Under500K", label: "Under $500k" },
  { value: "From500KTo2M", label: "$500k to $2M" },
  { value: "From2MTo5M", label: "$2M to $5M" },
  { value: "From5MTo15M", label: "$5M to $15M" },
  { value: "Over15M", label: "More than $15M" },
] satisfies { value: RaiseSize; label: string }[]

const HEARD_FROM: Choice[] = [
  { value: "LinkedIn", label: "LinkedIn", icon: UsersRound },
  { value: "Search", label: "Google or another search", icon: Search },
  { value: "Friend", label: "A friend or colleague", icon: Users },
  { value: "Community", label: "An accelerator or founder community", icon: Globe },
  { value: "Media", label: "A podcast, newsletter or article", icon: Mic },
  { value: "Other", label: "Somewhere else", icon: Megaphone },
] satisfies { value: HeardFrom; label: string; icon: LucideIcon }[]

export function surveyQuestions(options: SurveyOptions): Question[] {
  const stages = [...options.stages].sort(
    (a, b) => rank(STAGE_ORDER, a) - rank(STAGE_ORDER, b) || a.localeCompare(b),
  )

  const questions: Question[] = [
    {
      id: "companyName",
      kind: "text",
      title: "What's your company called?",
      hint: "It names your workspace.",
      placeholder: "Acme Robotics",
    },
    {
      id: "stage",
      kind: "single",
      title: "What round are you raising?",
      hint: "We'll look for investors who back companies at this stage.",
      choices: stages.map((stage) => ({ value: stage, label: stage, icon: STAGE_ICONS[stage] })),
    },
    {
      id: "raiseSize",
      kind: "single",
      title: "How much are you raising?",
      hint: "A rough figure is fine.",
      choices: RAISE_SIZES,
    },
    {
      id: "industries",
      kind: "multi",
      title: "What does your company do?",
      hint: `Pick up to ${MAX_INDUSTRIES}.`,
      choices: options.industries.map((industry) => ({ value: industry, label: industry })),
      max: MAX_INDUSTRIES,
    },
    {
      id: "geographies",
      kind: "multi",
      title: "Where do you want investors from?",
      hint: "Pick as many as you like.",
      choices: options.geographies.map((geography) => ({ value: geography, label: geography })),
    },
    {
      id: "heardFrom",
      kind: "single",
      title: "How did you hear about Pitchdex?",
      hint: "It helps us reach more founders like you.",
      choices: HEARD_FROM,
    },
  ]

  // No investors loaded yet means no choices to offer, so those questions wait.
  return questions.filter((question) => question.kind === "text" || question.choices.length > 0)
}

function rank(order: string[], value: string) {
  const index = order.indexOf(value)
  return index === -1 ? order.length : index
}

/** What's sent to the API: only what was answered. */
export function toCommand(answers: Answers): OnboardingAnswers {
  return {
    companyName: answers.companyName.trim() || null,
    stage: answers.stage,
    raiseSize: answers.raiseSize,
    industries: answers.industries,
    geographies: answers.geographies,
    heardFrom: answers.heardFrom,
  }
}

/** The Explore filters the answers switch on, as they're written in its address. */
export function exploreParams(answers: Answers): URLSearchParams {
  const params = new URLSearchParams()
  if (answers.stage) params.append("stages", answers.stage)
  for (const industry of answers.industries) params.append("industries", industry)
  for (const geography of answers.geographies) params.append("geographies", geography)
  return params
}
