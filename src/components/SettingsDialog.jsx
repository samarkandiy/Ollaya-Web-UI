import * as React from "react"
import { toast } from "sonner"
import { SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSettingsContext } from "@/components/SettingsContext"
import { DEFAULT_SETTINGS } from "@/lib/settings"
import { ping, OllayaError } from "@/lib/ollaya"

export function SettingsDialog() {
  const { settings, update } = useSettingsContext()
  const [open, setOpen] = React.useState(false)
  const [baseUrl, setBaseUrl] = React.useState(settings.baseUrl)
  const [apiKey, setApiKey] = React.useState(settings.apiKey)
  const [testing, setTesting] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setBaseUrl(settings.baseUrl)
      setApiKey(settings.apiKey)
    }
  }, [open, settings])

  const onSave = () => {
    const trimmed = baseUrl.trim().replace(/\/+$/, "") || DEFAULT_SETTINGS.baseUrl
    update({ baseUrl: trimmed, apiKey: apiKey.trim() })
    toast.success("Settings saved")
    setOpen(false)
  }

  const onTest = async () => {
    setTesting(true)
    const trimmed = baseUrl.trim().replace(/\/+$/, "") || DEFAULT_SETTINGS.baseUrl
    try {
      const ok = await ping({ baseUrl: trimmed, apiKey: apiKey.trim() })
      if (ok) toast.success("Server reachable")
      else toast.error("Server responded with an error")
    } catch (err) {
      const msg =
        err instanceof OllayaError
          ? `${err.code || "ERROR"}: ${err.message}`
          : err?.message || "Request failed"
      toast.error(msg)
    } finally {
      setTesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Settings">
          <SettingsIcon />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Server settings</DialogTitle>
          <DialogDescription>
            Point the UI at any Ollaya server. Values are kept in this browser
            only.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={DEFAULT_SETTINGS.baseUrl}
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              Default is <code>{DEFAULT_SETTINGS.baseUrl}</code>.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="apiKey">
              API key <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="OLLAYA_API_KEY"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              Sent as <code>Authorization: Bearer &lt;key&gt;</code>. Leave empty
              when the server has none.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onTest} disabled={testing}>
            {testing ? "Testing…" : "Test connection"}
          </Button>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
