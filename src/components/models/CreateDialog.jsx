import * as React from "react"
import { toast } from "sonner"
import { HammerIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StreamProgress } from "@/components/models/StreamProgress"
import { useSettingsContext } from "@/components/SettingsContext"
import { useModels } from "@/lib/hooks"
import { createModel, OllayaError } from "@/lib/ollaya"

const PRECISIONS = [
  { value: "", label: "As-is (no override)" },
  { value: "fp16", label: "fp16" },
  { value: "fp32", label: "fp32" },
]

export function CreateDialog({ onDone }) {
  const { settings } = useSettingsContext()
  const models = useModels()
  const [open, setOpen] = React.useState(false)

  const [name, setName] = React.useState("")
  const [from, setFrom] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [precision, setPrecision] = React.useState("")
  const [questionsJson, setQuestionsJson] = React.useState("")
  const [jsonError, setJsonError] = React.useState(null)

  const [lines, setLines] = React.useState([])
  const [state, setState] = React.useState("idle")
  const [error, setError] = React.useState(null)
  const abortRef = React.useRef(null)

  React.useEffect(() => {
    if (open && !from && models.data?.models?.length) {
      setFrom(models.data.models[0].name)
    }
  }, [open, from, models.data])

  const reset = () => {
    setLines([])
    setState("idle")
    setError(null)
    setJsonError(null)
  }

  const start = async () => {
    if (!name.trim() || !from) return
    reset()

    const payload = { model: name.trim(), from }
    if (description.trim()) payload.description = description.trim()
    if (precision) payload.parameters = { precision }

    if (questionsJson.trim()) {
      try {
        payload.questions = JSON.parse(questionsJson)
      } catch (err) {
        setJsonError(`Invalid JSON: ${err.message}`)
        return
      }
    }

    setState("streaming")
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const stream = createModel(settings, payload, { signal: controller.signal })
      for await (const line of stream) {
        setLines((prev) => [...prev, line])
        if (line?.status === "success") setState("done")
      }
      setState((prev) => (prev === "streaming" ? "done" : prev))
      toast.success(`Created ${name.trim()}`)
      onDone?.()
    } catch (err) {
      if (err?.name === "AbortError") {
        setState("idle")
        return
      }
      const msg =
        err instanceof OllayaError
          ? `${err.code || "ERROR"}: ${err.message}`
          : err?.message || "Create failed"
      setError(msg)
      setState("error")
      toast.error(msg)
    } finally {
      abortRef.current = null
    }
  }

  const cancel = () => {
    abortRef.current?.abort()
    abortRef.current = null
  }

  const handleOpenChange = (next) => {
    if (!next && state === "streaming") cancel()
    if (!next) {
      reset()
      setName("")
      setFrom("")
      setDescription("")
      setPrecision("")
      setQuestionsJson("")
    }
    setOpen(next)
  }

  const availableModels = models.data?.models || []
  const streaming = state === "streaming"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <HammerIcon />
          Create
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create a model</DialogTitle>
          <DialogDescription>
            Derives a new model from a local one. Set built-in questions,
            pin a precision, add a description.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-name">New name</Label>
            <Input
              id="create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-triage"
              spellCheck={false}
              disabled={streaming}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>From</Label>
            <Select
              value={from || undefined}
              onValueChange={setFrom}
              disabled={streaming || availableModels.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pick a base model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((m) => (
                  <SelectItem key={m.name} value={m.name}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-desc">Description</Label>
            <Input
              id="create-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One-line description"
              disabled={streaming}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Precision</Label>
            <Select
              value={precision}
              onValueChange={setPrecision}
              disabled={streaming}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRECISIONS.map((p) => (
                  <SelectItem key={p.value || "auto"} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="create-questions">Built-in questions (JSON, optional)</Label>
          <Textarea
            id="create-questions"
            value={questionsJson}
            onChange={(e) => {
              setQuestionsJson(e.target.value)
              setJsonError(null)
            }}
            placeholder={`{\n  "department": {\n    "type": "choice",\n    "criteria": ["billing", "technical", "account"]\n  }\n}`}
            className="min-h-32 font-mono text-xs"
            spellCheck={false}
            disabled={streaming}
          />
          {jsonError ? (
            <p className="text-xs text-destructive">{jsonError}</p>
          ) : null}
        </div>

        {state !== "idle" ? (
          <div className="rounded-lg border bg-muted/30 p-3">
            <StreamProgress lines={lines} state={state} error={error} />
          </div>
        ) : null}

        <DialogFooter>
          {streaming ? (
            <Button variant="outline" onClick={cancel}>
              Cancel
            </Button>
          ) : (
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          )}
          <Button
            onClick={start}
            disabled={streaming || !name.trim() || !from}
          >
            {state === "done" ? "Create again" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
