import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSettingsContext } from "@/components/SettingsContext"
import { copyModel, OllayaError } from "@/lib/ollaya"

export function CopyDialog({ open, onOpenChange, source, onDone }) {
  const { settings } = useSettingsContext()
  const [destination, setDestination] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (open && source) setDestination(`${source.replace(/:.*$/, "")}-copy`)
  }, [open, source])

  const submit = async () => {
    if (!destination.trim()) return
    setBusy(true)
    try {
      await copyModel(settings, source, destination.trim())
      toast.success(`Copied ${source} → ${destination.trim()}`)
      onDone?.()
      onOpenChange(false)
    } catch (err) {
      const msg =
        err instanceof OllayaError
          ? `${err.code || "ERROR"}: ${err.message}`
          : err?.message || "Copy failed"
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copy model</DialogTitle>
          <DialogDescription>
            Duplicates <code>{source}</code> under a new name. If the
            destination exists, it is overwritten.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="copy-dest">Destination name</Label>
          <Input
            id="copy-dest"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="my-model"
            spellCheck={false}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !destination.trim()}>
            {busy ? "Copying…" : "Copy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
