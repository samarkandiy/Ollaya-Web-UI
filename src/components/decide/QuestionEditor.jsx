import * as React from "react"
import { PlusIcon, Trash2Icon, GripVerticalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TYPES = [
  { value: "choice", label: "choice — pick one label" },
  { value: "score", label: "score — rank on a scale" },
  { value: "noul", label: "noul — true/false probability" },
]

export function QuestionEditor({ question, onChange, onRemove, index }) {
  const set = (patch) => onChange({ ...question, ...patch })

  const changeType = (type) => {
    if (type === question.type) return
    if (type === "choice") {
      set({
        type,
        criteria: [
          { key: "option_a", desc: "" },
          { key: "option_b", desc: "" },
        ],
      })
    } else if (type === "score") {
      set({ type, criteria: ["Low", "Medium", "High"] })
    } else if (type === "noul") {
      set({ type, noul: { yes: "", no: "" } })
    }
  }

  return (
    <div className="rounded-xl border bg-card/50 p-3">
      <div className="flex items-start gap-2">
        <div className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          <GripVerticalIcon className="size-4" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor={`q-id-${index}`} className="text-xs">
                Question ID
              </Label>
              <Input
                id={`q-id-${index}`}
                value={question.id}
                onChange={(e) => set({ id: e.target.value })}
                placeholder="e.g. department"
                className="h-8"
                spellCheck={false}
              />
            </div>
            <div className="flex w-56 flex-col gap-1">
              <Label className="text-xs">Type</Label>
              <Select value={question.type} onValueChange={changeType}>
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onRemove}
              aria-label="Remove question"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2Icon />
            </Button>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs">Instructions (optional)</Label>
            <Textarea
              value={question.instructions || ""}
              onChange={(e) => set({ instructions: e.target.value })}
              placeholder="If empty, the model reads the question id."
              className="min-h-16"
            />
          </div>

          {question.type === "choice" ? (
            <ChoiceCriteria question={question} set={set} />
          ) : question.type === "score" ? (
            <ScoreCriteria question={question} set={set} />
          ) : (
            <NoulCriteria question={question} set={set} />
          )}
        </div>
      </div>
    </div>
  )
}

function ChoiceCriteria({ question, set }) {
  const rows = question.criteria || []
  const setRows = (next) => set({ criteria: next })
  const canRemove = rows.length > 2
  const addRow = () => setRows([...rows, { key: `option_${rows.length + 1}`, desc: "" }])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">
          Options{" "}
          <span className="text-muted-foreground">
            ({rows.length}/255, at least 2)
          </span>
        </Label>
        <Button variant="outline" size="xs" onClick={addRow}>
          <PlusIcon />
          Add option
        </Button>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <Input
              value={row.key}
              onChange={(e) => {
                const next = rows.slice()
                next[idx] = { ...row, key: e.target.value }
                setRows(next)
              }}
              placeholder="label"
              className="h-8 w-36 shrink-0"
              spellCheck={false}
            />
            <Input
              value={row.desc}
              onChange={(e) => {
                const next = rows.slice()
                next[idx] = { ...row, desc: e.target.value }
                setRows(next)
              }}
              placeholder="Description (optional)"
              className="h-8 flex-1"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!canRemove}
              onClick={() => setRows(rows.filter((_, i) => i !== idx))}
              aria-label="Remove option"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Sent as an object (label → description) when any description is filled,
        otherwise as an array of labels.
      </p>
    </div>
  )
}

function ScoreCriteria({ question, set }) {
  const rows = question.criteria || []
  const setRows = (next) => set({ criteria: next })
  const canRemove = rows.length > 2
  const canAdd = rows.length < 10
  const addRow = () => setRows([...rows, ""])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">
          Levels{" "}
          <span className="text-muted-foreground">
            ({rows.length}/10, at least 2, level 0 first)
          </span>
        </Label>
        <Button variant="outline" size="xs" onClick={addRow} disabled={!canAdd}>
          <PlusIcon />
          Add level
        </Button>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((val, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <Badge variant="outline" className="shrink-0 tabular-nums">
              {idx}
            </Badge>
            <Input
              value={val}
              onChange={(e) => {
                const next = rows.slice()
                next[idx] = e.target.value
                setRows(next)
              }}
              placeholder={`Level ${idx} description`}
              className="h-8 flex-1"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!canRemove}
              onClick={() => setRows(rows.filter((_, i) => i !== idx))}
              aria-label="Remove level"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function NoulCriteria({ question, set }) {
  const value = question.noul || { yes: "", no: "" }
  const patch = (partial) => set({ noul: { ...value, ...partial } })
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs">
        Descriptions{" "}
        <span className="text-muted-foreground">
          (optional; both required together)
        </span>
      </Label>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="shrink-0 bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400"
          >
            true
          </Badge>
          <Input
            value={value.yes}
            onChange={(e) => patch({ yes: e.target.value })}
            placeholder="e.g. Asks for a refund"
            className="h-8 flex-1"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="shrink-0 bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-400"
          >
            false
          </Badge>
          <Input
            value={value.no}
            onChange={(e) => patch({ no: e.target.value })}
            placeholder="e.g. Does not ask for a refund"
            className="h-8 flex-1"
          />
        </div>
      </div>
    </div>
  )
}
