import * as React from "react"
import { toast } from "sonner"
import { DownloadCloudIcon } from "lucide-react"
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
import { StreamProgress } from "@/components/models/StreamProgress"
import { useSettingsContext } from "@/components/SettingsContext"
import { pullModel, OllayaError } from "@/lib/ollaya"

export function PullDialog({ onDone }) {
  const { settings } = useSettingsContext()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("laya:en")
  const [lines, setLines] = React.useState([])
  const [state, setState] = React.useState("idle")
  const [error, setError] = React.useState(null)
  const abortRef = React.useRef(null)

  const reset = () => {
    setLines([])
    setState("idle")
    setError(null)
  }

  const start = async () => {
    if (!name.trim()) return
    reset()
    setState("streaming")
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const stream = pullModel(settings, name.trim(), { signal: controller.signal })
      for await (const line of stream) {
        setLines((prev) => [...prev, line])
        if (line?.status === "success") setState("done")
      }
      setState((prev) => (prev === "streaming" ? "done" : prev))
      toast.success(`Pulled ${name.trim()}`)
      onDone?.()
    } catch (err) {
      if (err?.name === "AbortError") {
        setState("idle")
        return
      }
      const msg =
        err instanceof OllayaError
          ? `${err.code || "ERROR"}: ${err.message}`
          : err?.message || "Pull failed"
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
    if (!next && state === "streaming") {
      cancel()
    }
    if (!next) reset()
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <DownloadCloudIcon />
          Pull
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Pull a model</DialogTitle>
          <DialogDescription>
            Downloads a model into the local store and verifies each blob
            against its sha256.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="pull-name">Model name</Label>
          <Input
            id="pull-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="laya, laya:en, laya:multilingual"
            spellCheck={false}
            disabled={state === "streaming"}
          />
        </div>

        {state !== "idle" ? (
          <div className="rounded-lg border bg-muted/30 p-3">
            <StreamProgress lines={lines} state={state} error={error} />
          </div>
        ) : null}

        <DialogFooter>
          {state === "streaming" ? (
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
            disabled={state === "streaming" || !name.trim()}
          >
            {state === "done" ? "Pull again" : "Start pull"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
