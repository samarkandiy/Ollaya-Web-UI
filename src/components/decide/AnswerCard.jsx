import { cn } from "cn"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProbBar } from "@/components/decide/ProbBar"
import { formatPercent } from "@/lib/format"

const TYPE_STYLES = {
  choice: "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400",
  score: "bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400",
  noul: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
}

export function AnswerCard({ id, answer, question }) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="truncate">{id}</CardTitle>
          <Badge
            variant="outline"
            className={cn("ring-1", TYPE_STYLES[answer.type])}
          >
            {answer.type}
          </Badge>
        </div>
        {question?.instructions ? (
          <CardDescription className="line-clamp-2">
            {typeof question.instructions === "string"
              ? question.instructions
              : JSON.stringify(question.instructions)}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        {answer.type === "choice" ? (
          <ChoiceBody answer={answer} />
        ) : answer.type === "score" ? (
          <ScoreBody answer={answer} />
        ) : answer.type === "noul" ? (
          <NoulBody answer={answer} />
        ) : (
          <pre className="text-xs">{JSON.stringify(answer, null, 2)}</pre>
        )}
        {answer.laya ? (
          <div className="mt-3 flex flex-wrap gap-3 border-t pt-3 text-xs text-muted-foreground">
            <span>
              laya.confidence: <b>{formatPercent(answer.laya.confidence, 2)}</b>
            </span>
            {answer.laya.act_probability != null ? (
              <span>
                laya.act_probability:{" "}
                <b>{formatPercent(answer.laya.act_probability, 2)}</b>
              </span>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function ChoiceBody({ answer }) {
  const entries = Object.entries(answer.probabilities || {})
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            choice
          </span>
          <span className="font-heading text-xl font-semibold">
            {answer.choice}
          </span>
        </div>
        <ConfidenceBadge value={answer.confidence} />
      </div>
      <div className="flex flex-col gap-2">
        {entries.map(([label, p]) => (
          <ProbBar
            key={label}
            label={label}
            value={p}
            highlight={label === answer.choice}
          />
        ))}
      </div>
    </div>
  )
}

function ScoreBody({ answer }) {
  const entries = Object.entries(answer.probabilities || {}).sort(
    ([a], [b]) => Number(a) - Number(b)
  )
  const rounded = Math.round(answer.score)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            score
          </span>
          <span className="font-heading text-xl font-semibold tabular-nums">
            {Number(answer.score).toFixed(4)}
          </span>
        </div>
        <ConfidenceBadge value={answer.confidence} />
      </div>
      <div className="flex flex-col gap-2">
        {entries.map(([lvl, p]) => {
          const desc = answer.legend?.[lvl]
          return (
            <ProbBar
              key={lvl}
              label={`Level ${lvl}`}
              description={desc}
              value={p}
              highlight={Number(lvl) === rounded}
            />
          )
        })}
      </div>
    </div>
  )
}

function NoulBody({ answer }) {
  const p = Number(answer.noul) || 0
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          noul
        </span>
        <span className="font-heading text-xl font-semibold tabular-nums">
          {formatPercent(p, 2)}
        </span>
      </div>
      <ProbBar label="P(true)" value={p} highlight />
    </div>
  )
}

function ConfidenceBadge({ value }) {
  if (value == null) return null
  const tone =
    value >= 0.75
      ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400"
      : value >= 0.4
        ? "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400"
        : "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400"
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1",
        tone
      )}
    >
      <span className="text-muted-foreground">confidence</span>
      <span className="tabular-nums">{formatPercent(value, 2)}</span>
    </div>
  )
}
