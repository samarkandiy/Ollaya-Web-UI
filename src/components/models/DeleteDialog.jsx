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
import { useSettingsContext } from "@/components/SettingsContext"
import { deleteModel, OllayaError } from "@/lib/ollaya"

export function DeleteDialog({ open, onOpenChange, name, onDone }) {
  const { settings } = useSettingsContext()
  const [busy, setBusy] = React.useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      await deleteModel(settings, name)
      toast.success(`Deleted ${name}`)
      onDone?.()
      onOpenChange(false)
    } catch (err) {
      const msg =
        err instanceof OllayaError
          ? `${err.code || "ERROR"}: ${err.message}`
          : err?.message || "Delete failed"
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this model?</DialogTitle>
          <DialogDescription>
            Removes <code>{name}</code> from the local store. Blobs shared with
            other models are kept. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={busy}>
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
