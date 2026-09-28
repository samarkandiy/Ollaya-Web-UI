import * as React from "react"
import { toast } from "sonner"
import {
  PlayIcon,
  PlusIcon,
  RefreshCcwIcon,
  PowerIcon,
  Loader2Icon,
  ChevronDownIcon,
} from "lucide-react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AnswerCard } from "@/components/decide/AnswerCard"
import { QuestionEditor } from "@/components/decide/QuestionEditor"
import { SamplesDialog } from "@/components/decide/SamplesDialog"
import { loadSample } from "@/components/decide/samples"
import { useSettingsContext } from "@/components/SettingsContext"
import { useModels } from "@/lib/hooks"
import { decide, OllayaError } from "@/lib/ollaya"
import { formatNs, formatRfc3339, truncate } from "@/lib/format"

// ----- Default form state -----

function newChoice(id = "department") {
  return {
    uid: crypto.randomUUID(),
    id,
    type: "choice",
    instructions: "",
    criteria: [
      { key: "option_a", desc: "" },
      { key: "option_b", desc: "" },
    ],
  }
}

// First-load sample so the page opens with something to run.
const INITIAL_SAMPLE = loadSample("support-ticket")

const KEEP_ALIVE_PRESETS = [
  { value: "", label: "Server default" },
  { value: "5m", label: "5 minutes" },
  { value: "10m", label: "10 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "0", label: "Unload after request" },
  { value: "-1", label: "Keep loaded (until stopped)" },
  { value: "custom", label: "Custom…" },
]

// ----- Serialisation -----

function serializeQuestions(questions) {
  const out = {}
  for (const q of questions) {
    const key = (q.id || "").trim()
    if (!key) throw new Error("Every question needs an id.")
    if (key in out) throw new Error(`Duplicate question id: "${key}".`)

    const base = {}
    if (q.instructions && q.instructions.trim()) {
      base.instructions = q.instructions.trim()
    }

    if (q.type === "choice") {
      const rows = (q.criteria || []).map((r) => ({
        key: (r.key || "").trim(),
        desc: (r.desc || "").trim(),
      }))
      if (rows.length < 2) throw new Error(`"${key}": choice needs at least 2 options.`)
      const keys = rows.map((r) => r.key)
      if (keys.some((k) => !k)) throw new Error(`"${key}": every option needs a label.`)
      const seen = new Set()
      for (const k of keys) {
        if (seen.has(k)) throw new Error(`"${key}": duplicate option "${k}".`)
        seen.add(k)
      }
      const hasDesc = rows.some((r) => r.desc)
      out[key] = {
        type: "choice",
        ...base,
        criteria: hasDesc
          ? Object.fromEntries(rows.map((r) => [r.key, r.desc || r.key]))
          : rows.map((r) => r.key),
      }
    } else if (q.type === "score") {
      const rows = (q.criteria || []).map((r) => (r || "").trim())
      if (rows.length < 2) throw new Error(`"${key}": score needs at least 2 levels.`)
      if (rows.length > 10) throw new Error(`"${key}": score allows at most 10 levels.`)
      if (rows.some((r) => !r)) throw new Error(`"${key}": every score level needs a description.`)
      out[key] = { type: "score", ...base, criteria: rows }
    } else if (q.type === "noul") {
      out[key] = { type: "noul", ...base }
      const yes = (q.noul?.yes || "").trim()
      const no = (q.noul?.no || "").trim()
      if (yes && no) out[key].criteria = { true: yes, false: no }
      else if (yes || no)
        throw new Error(`"${key}": noul needs both true and false descriptions, or neither.`)
    }
  }
  return out
}

function parseState(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return { value: undefined, mode: "empty" }
  const first = trimmed[0]
  if (first === "{" || first === "[" || first === '"') {
    try {
      return { value: JSON.parse(trimmed), mode: "json" }
    } catch {
      return { value: raw, mode: "string" }
    }
  }
  return { value: raw, mode: "string" }
}

function parseKeepAlive(raw) {
  const t = raw.trim()
  if (!t) return undefined
  if (/^-?\d+$/.test(t)) return Number(t)
  return t
}

// ----- Page -----

export function DecidePage() {
  const { settings } = useSettingsContext()
  const models = useModels()

  const [model, setModel] = React.useState("")
  const [stateInput, setStateInput] = React.useState(INITIAL_SAMPLE.state)
  const [questions, setQuestions] = React.useState(INITIAL_SAMPLE.questions)
  const [keepAlivePreset, setKeepAlivePreset] = React.useState("")
  const [keepAliveCustom, setKeepAliveCustom] = React.useState("")
  const [extrasLaya, setExtrasLaya] = React.useState(false)
  const [busy, setBusy] = React.useState(null) // "decide" | "load" | "unload" | null
  const [result, setResult] = React.useState(null)
  const [error, setError] = React.useState(null)

  const availableModels = React.useMemo(
    () => models.data?.models || [],
    [models.data]
  )

  // Preselect a model as soon as we have the list, only if the current one
  // isn't there.
  React.useEffect(() => {
    if (availableModels.length === 0) return
    if (!model || !availableModels.some((m) => m.name === model)) {
      setModel(availableModels[0].name)
    }
  }, [availableModels, model])

  const setQuestion = (uid, next) => {
    setQuestions((prev) => prev.map((q) => (q.uid === uid ? next : q)))
  }
  const removeQuestion = (uid) => {
    setQuestions((prev) => prev.filter((q) => q.uid !== uid))
  }
  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      newChoice(`question_${prev.length + 1}`),
    ])
  }
  const applySample = (sample) => {
    setStateInput(sample.state)
    setQuestions(sample.questions)
    setResult(null)
    setError(null)
    toast.info(`Loaded sample: ${sample.title}`)
  }

  const keepAliveEffective =
    keepAlivePreset === "custom" ? keepAliveCustom : keepAlivePreset

  const stateInfo = React.useMemo(() => parseState(stateInput), [stateInput])

  const run = async (action = "decide") => {
    setBusy(action)
    setError(null)
    setResult(null)

    try {
      if (!model) throw new Error("Pick a model first.")
      const payload = { model }

      if (action === "decide") {
        if (stateInfo.mode === "empty") throw new Error("State is required.")
        if (questions.length === 0)
          throw new Error("Add at least one question.")
        payload.state = stateInfo.value
        payload.questions = serializeQuestions(questions)
        if (extrasLaya) payload.extras = ["laya"]
      } else if (action === "load") {
        payload.keep_alive = -1
      } else if (action === "unload") {
        payload.keep_alive = 0
      }

      const ka = parseKeepAlive(keepAliveEffective || "")
      if (action === "decide" && ka !== undefined) payload.keep_alive = ka

      const res = await decide(settings, payload)
      setResult(res)

      if (action === "load") toast.success("Model loaded")
      else if (action === "unload") toast.success("Model unloaded")
    } catch (err) {
      if (err instanceof OllayaError) {
        setError({
          message: err.message,
          code: err.code,
          detail: err.detail,
          status: err.status,
        })
      } else {
        setError({ message: err.message || "Request failed" })
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Decide</CardTitle>
            <CardAction>
              <div className="flex items-center gap-1.5">
                <SamplesDialog onPick={applySample} />
                <div className="inline-flex overflow-hidden rounded-lg">
                  <Button
                    onClick={() => run("decide")}
                    disabled={busy !== null || !model}
                    className="rounded-r-none"
                  >
                    {busy === "decide" ? (
                      <Loader2Icon className="animate-spin" />
                    ) : (
                      <PlayIcon />
                    )}
                    Run decide
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="rounded-l-none border-l border-primary-foreground/20 px-1.5"
                        disabled={busy !== null || !model}
                        aria-label="More actions"
                      >
                        <ChevronDownIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => run("load")}>
                        <PowerIcon />
                        Load model (keep_alive: -1)
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => run("unload")}>
                        <PowerIcon />
                        Unload model (keep_alive: 0)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardAction>
          </div>
          <CardDescription>
            Send typed questions to <code>/api/decide</code>. Answers arrive
            with calibrated probabilities and a confidence score.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Model + refresh */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Model</Label>
            <div className="flex items-center gap-1.5">
              <Select
                value={model || undefined}
                onValueChange={setModel}
                disabled={models.loading || availableModels.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      models.loading
                        ? "Loading models…"
                        : availableModels.length === 0
                          ? "No models available"
                          : "Pick a model"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((m) => (
                    <SelectItem key={m.name} value={m.name}>
                      <div className="flex items-center gap-2">
                        <span>{m.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {m.details?.family} · {m.details?.parameter_size}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={models.refresh}
                aria-label="Refresh models"
                disabled={models.loading}
              >
                <RefreshCcwIcon
                  className={models.loading ? "animate-spin" : ""}
                />
              </Button>
            </div>
            {models.error ? (
              <p className="text-xs text-destructive">{models.error}</p>
            ) : null}
          </div>

          {/* State */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="state" className="text-xs">
                State
              </Label>
              <Badge variant="outline" className="text-[10px] uppercase">
                sent as {stateInfo.mode === "empty" ? "—" : stateInfo.mode}
              </Badge>
            </div>
            <Textarea
              id="state"
              value={stateInput}
              onChange={(e) => setStateInput(e.target.value)}
              placeholder="Plain text works. Paste JSON to send it as an object/array."
              className="min-h-28"
            />
            <p className="text-xs text-muted-foreground">
              Up to 65,536 tokens. Longer states are truncated by the server.
            </p>
          </div>

          <Separator />

          {/* Questions */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">
              Questions{" "}
              <span className="text-muted-foreground">
                ({questions.length}/256)
              </span>
            </Label>
            <Button variant="outline" size="xs" onClick={addQuestion}>
              <PlusIcon />
              Add question
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {questions.map((q, idx) => (
              <QuestionEditor
                key={q.uid}
                index={idx}
                question={q}
                onChange={(next) => setQuestion(q.uid, next)}
                onRemove={() => removeQuestion(q.uid)}
              />
            ))}
            {questions.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No questions yet. Add one to start.
              </div>
            ) : null}
          </div>

          <Separator />

          {/* Advanced */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">keep_alive</Label>
              <Select
                value={keepAlivePreset}
                onValueChange={setKeepAlivePreset}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Server default" />
                </SelectTrigger>
                <SelectContent>
                  {KEEP_ALIVE_PRESETS.map((p) => (
                    <SelectItem key={p.value || "default"} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {keepAlivePreset === "custom" ? (
                <Input
                  value={keepAliveCustom}
                  onChange={(e) => setKeepAliveCustom(e.target.value)}
                  placeholder="e.g. 5m, 1h30m, 300, -1"
                  className="h-8"
                />
              ) : null}
            </div>
            <div className="flex items-center justify-between rounded-lg border p-2.5">
              <div className="flex flex-col">
                <Label className="text-xs">
                  extras: <code>laya</code>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Adds laya confidence and act probability to every answer.
                </p>
              </div>
              <Switch
                checked={extrasLaya}
                onCheckedChange={setExtrasLaya}
                aria-label="Include laya extras"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ResultPanel busy={busy} result={result} error={error} questions={questions} />
    </div>
  )
}

function ResultPanel({ busy, result, error, questions }) {
  if (busy === "decide") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
          <CardDescription>Running decision…</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {questions.map((q) => (
            <Skeleton key={q.uid} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>
              {error.code || "Error"}
              {error.status ? ` · ${error.status}` : ""}
            </AlertTitle>
            <AlertDescription>
              <div>{error.message}</div>
              {Array.isArray(error.detail) && error.detail.length > 0 ? (
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                  {error.detail.map((d, i) => (
                    <li key={i}>
                      <code>{Array.isArray(d.loc) ? d.loc.join(".") : ""}</code>
                      : {d.msg}
                    </li>
                  ))}
                </ul>
              ) : null}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
          <CardDescription>
            Nothing here yet. Run a decision to see typed answers with
            calibrated probabilities.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const answers = result.answers || {}
  const questionMap = Object.fromEntries(questions.map((q) => [q.id, q]))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Result
          {result.done_reason && result.done_reason !== "decide" ? (
            <Badge variant="outline">{result.done_reason}</Badge>
          ) : null}
        </CardTitle>
        <CardDescription>
          Answered by <b>{result.model}</b>
          {result.routing ? (
            <>
              {" "}
              via router <b>{result.routing.router}</b> (
              <code>{result.routing.route}</code>
              {result.routing.reason
                ? ` — ${truncate(result.routing.reason, 60)}`
                : ""}
              )
            </>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {result.state_truncated ? (
          <Alert>
            <AlertTitle>State truncated</AlertTitle>
            <AlertDescription>
              Part of your state was dropped to fit the model's context.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3">
          {Object.entries(answers).map(([id, ans]) => (
            <AnswerCard
              key={id}
              id={id}
              answer={ans}
              question={questionMap[id]}
            />
          ))}
        </div>

        <Separator />

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
          <MetaRow label="Total" value={formatNs(result.total_duration)} />
          <MetaRow label="Load" value={formatNs(result.load_duration)} />
          <MetaRow label="Eval" value={formatNs(result.eval_duration)} />
          <MetaRow
            label="Input tokens"
            value={result.usage?.input_tokens ?? "—"}
          />
          <MetaRow label="Created" value={formatRfc3339(result.created_at)} />
        </dl>
      </CardContent>
    </Card>
  )
}

function MetaRow({ label, value }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[10px] uppercase tracking-wider">{label}</dt>
      <dd className="tabular-nums text-foreground/90">{value}</dd>
    </div>
  )
}
