import { ArrowLeft, Check, CornerDownLeft, Target } from "lucide-react"
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { BrandMark } from "@/components/common/BrandMark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useCompleteOnboarding, useMatchCount } from "../hooks/useOnboarding"
import {
  EMPTY_ANSWERS,
  exploreParams,
  surveyQuestions,
  toCommand,
  type Answers,
  type Question,
  type SurveyOptions,
} from "../survey"
import styles from "./OnboardingSurvey.module.css"

/** How long a picked answer shows as picked before the next question slides in. */
const ADVANCE_DELAY = 250

/**
 * The first-run survey, one question at a time. Its answers name the workspace and become
 * Explore's filters, so the founder lands on investors that fit their round.
 */
export function OnboardingSurvey({ options }: { options: SurveyOptions }) {
  const navigate = useNavigate()
  const questions = useMemo(() => surveyQuestions(options), [options])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS)
  const [finished, setFinished] = useState(false)
  const complete = useCompleteOnboarding()
  const skip = useCompleteOnboarding()
  const question = questions[index]

  function next(latest: Answers) {
    if (index < questions.length - 1) {
      setIndex(index + 1)
      return
    }
    complete.mutate(toCommand(latest), { onSuccess: () => setFinished(true) })
  }

  const progress = finished ? 1 : index / questions.length

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <span className={styles.brand}>
          <BrandMark />
          Pitchdex
        </span>
        {!finished && (
          <Button
            variant="ghost"
            size="sm"
            disabled={skip.isPending || complete.isPending}
            onClick={() =>
              skip.mutate({}, { onSuccess: () => navigate("/dashboard", { replace: true }) })
            }
          >
            Skip for now
          </Button>
        )}
      </header>
      <div
        className={styles.progress}
        role="progressbar"
        aria-label="Survey progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <span style={{ width: `${progress * 100}%` }} />
      </div>

      <main className={styles.main}>
        {finished ? (
          <Matches answers={answers} />
        ) : (
          <QuestionView
            key={question.id}
            question={question}
            number={index + 1}
            total={questions.length}
            answers={answers}
            saving={complete.isPending}
            error={
              complete.isError ? complete.error.message : skip.isError ? skip.error.message : null
            }
            onChange={(update) =>
              setAnswers((current) => ({
                ...current,
                ...(typeof update === "function" ? update(current) : update),
              }))
            }
            onNext={next}
            onBack={index > 0 ? () => setIndex(index - 1) : undefined}
          />
        )}
      </main>
    </div>
  )
}

type QuestionViewProps = {
  question: Question
  number: number
  total: number
  answers: Answers
  saving: boolean
  error: string | null
  /** A change to the answers, or one worked out from the latest answers (quick clicks in a row). */
  onChange: (update: Partial<Answers> | ((current: Answers) => Partial<Answers>)) => void
  /** Moves on with the answers as they are now, which may be newer than the last render's. */
  onNext: (latest: Answers) => void
  onBack?: () => void
}

function QuestionView({
  question,
  number,
  total,
  answers,
  saving,
  error,
  onChange,
  onNext,
  onBack,
}: QuestionViewProps) {
  const id = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  const advance = useRef<number | undefined>(undefined)
  const last = number === total
  const answered = isAnswered(question, answers)

  // Each question opens with focus on its heading, so a screen reader reads it out; the
  // company name's box takes focus itself.
  useEffect(() => {
    if (question.kind !== "text") heading.current?.focus()
    return () => window.clearTimeout(advance.current)
  }, [question.kind])

  function choose(value: string) {
    const patch = { [question.id]: value } as Partial<Answers>
    onChange(patch)
    window.clearTimeout(advance.current)
    advance.current = window.setTimeout(() => onNext({ ...answers, ...patch }), ADVANCE_DELAY)
  }

  function toggle(value: string) {
    if (question.kind !== "multi") return
    const { id: key, max } = question
    onChange((latest) => {
      const current = latest[key]
      if (current.includes(value)) return { [key]: current.filter((v) => v !== value) }
      return max && current.length >= max ? {} : { [key]: [...current, value] }
    })
  }

  // Letters pick an answer to a one-choice question; Enter moves on. Enter on a focused
  // button or in the name box does what it normally does.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || saving) return
      const typing = event.target instanceof HTMLInputElement
      const onButton = event.target instanceof HTMLButtonElement
      if (event.key === "Enter") {
        if (!typing && !onButton && (question.kind !== "single" || answered)) {
          event.preventDefault()
          onNext(answers)
        }
        return
      }
      if (question.kind !== "single" || typing) return
      const letter = event.key.length === 1 ? event.key.toUpperCase().charCodeAt(0) - 65 : -1
      const choice = question.choices[letter]
      if (choice) {
        event.preventDefault()
        choose(choice.value)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    onNext(answers)
  }

  return (
    <form className={styles.question} onSubmit={onSubmit} aria-labelledby={`${id}-title`}>
      <p className={styles.count}>
        Question {number} of {total}
      </p>
      <h1 id={`${id}-title`} ref={heading} tabIndex={-1} className={styles.title}>
        {question.title}
      </h1>
      <p id={`${id}-hint`} className={styles.hint}>
        {question.hint}
      </p>

      {question.kind === "text" && (
        <Input
          autoFocus
          autoComplete="organization"
          maxLength={200}
          className={styles.text}
          placeholder={question.placeholder}
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-hint`}
          value={answers.companyName}
          onChange={(event) => onChange({ companyName: event.target.value })}
        />
      )}

      {question.kind === "single" && (
        <div
          className={styles.choices}
          role="radiogroup"
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-hint`}
        >
          {question.choices.map((choice, choiceIndex) => {
            const Icon = choice.icon
            const chosen = answers[question.id] === choice.value
            return (
              <button
                key={choice.value}
                type="button"
                role="radio"
                aria-checked={chosen}
                className={cn(styles.choice, chosen && styles.chosen)}
                onClick={() => choose(choice.value)}
              >
                {Icon && <Icon className={styles.choiceIcon} aria-hidden />}
                <span className={styles.choiceLabel}>{choice.label}</span>
                <kbd className={styles.key} aria-hidden>
                  {chosen ? <Check /> : String.fromCharCode(65 + choiceIndex)}
                </kbd>
              </button>
            )
          })}
        </div>
      )}

      {question.kind === "multi" && (
        <div
          className={styles.chips}
          role="group"
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-hint`}
        >
          {question.choices.map((choice) => {
            const picked = answers[question.id].includes(choice.value)
            const full = !!question.max && answers[question.id].length >= question.max
            return (
              <button
                key={choice.value}
                type="button"
                aria-pressed={picked}
                disabled={!picked && full}
                className={cn(styles.chip, picked && styles.chosen)}
                onClick={() => toggle(choice.value)}
              >
                {picked && <Check aria-hidden />}
                {choice.label}
              </button>
            )
          })}
        </div>
      )}

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <div className={styles.footer}>
        {onBack ? (
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft aria-hidden /> Back
          </Button>
        ) : (
          <span />
        )}
        <div className={styles.next}>
          {answered ? (
            <>
              <span className={styles.enter} aria-hidden>
                press Enter <CornerDownLeft />
              </span>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : last ? "Finish" : "Continue"}
              </Button>
            </>
          ) : (
            <Button type="submit" variant="ghost" size="sm" disabled={saving}>
              {saving ? "Saving…" : last ? "Skip and finish" : "Skip question"}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

function isAnswered(question: Question, answers: Answers) {
  const answer = answers[question.id]
  return Array.isArray(answer) ? answer.length > 0 : !!answer?.trim()
}

/** The survey's payoff: how many investors fit, and a way straight to them. */
function Matches({ answers }: { answers: Answers }) {
  const filters = {
    stages: answers.stage ? [answers.stage] : [],
    industries: answers.industries,
    geographies: answers.geographies,
  }
  const filtered =
    filters.stages.length + filters.industries.length + filters.geographies.length > 0
  const count = useMatchCount(filters)
  const params = exploreParams(answers).toString()
  const summary = [answers.stage, answers.industries.join(", "), answers.geographies.join(", ")]
    .filter(Boolean)
    .join(" · ")
  const total = count.data ?? 0

  let title = "Your workspace is ready"
  if (count.isPending) title = "Finding investors…"
  else if (filtered && total > 0)
    title = `${total.toLocaleString()} ${total === 1 ? "investor fits" : "investors fit"} your round`
  else if (filtered) title = "No investors match all of that yet"

  return (
    <section className={styles.matches} aria-live="polite">
      <span className={styles.matchIcon} aria-hidden>
        <Target />
      </span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.hint}>
        {filtered && total > 0
          ? summary
          : filtered
            ? "Try Explore with fewer filters, or look through every investor."
            : "Look through every investor in Explore, or start from your dashboard."}
      </p>
      <div className={styles.matchActions}>
        <Button variant="outline" nativeButton={false} render={<Link to="/dashboard" />}>
          Go to dashboard
        </Button>
        <Button
          nativeButton={false}
          render={<Link to={filtered && total > 0 ? `/explore?${params}` : "/explore"} />}
        >
          {filtered && total > 0 ? "See my matches" : "Explore investors"}
        </Button>
      </div>
      <p className={styles.note}>A quick tour of Pitchdex starts next.</p>
    </section>
  )
}
