import * as React from "react"
import { toast } from "sonner"
import {
  RefreshCcwIcon,
  ActivityIcon,
  CpuIcon,
  PowerOffIcon,
  InfinityIcon,
} from "lucide-react"
import { cn } from "cn"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useRunning } from "@/lib/hooks"
import { useSettingsContext } from "@/components/SettingsContext"
import { decide, OllayaError } from "@/lib/ollaya"
import { formatBytes, formatRfc3339 } from "@/lib/format"

const AUTO_REFRESH_MS = 5_000

export function RunningPage() {
  const running = useRunning()
  const { settings } = useSettingsContext()
  const [autoRefresh, setAutoRefresh] = React.useState(true)
  const [unloading, setUnloading] = React.useState(null)

  React.useEffect(() => {
    if (!autoRefresh) return
    const id = window.setInterval(running.refresh, AUTO_REFRESH_MS)
    return () => window.clearInterval(id)
  }, [autoRefresh, running.refresh])

  const list = running.data?.models || []
  const empty = !running.loading && !running.error && list.length === 0

  const unload = async (name) => {
    setUnloading(name)
    try {
      await decide(settings, { model: name, keep_alive: 0 })
      toast.success(`Unloaded ${name}`)
      running.refresh()
    } catch (err) {
      const msg =
        err instanceof OllayaError
          ? `${err.code || "ERROR"}: ${err.message}`
          : err?.message || "Unload failed"
      toast.error(msg)
    } finally {
      setUnloading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Running models</CardTitle>
        <CardDescription>
          Snapshot of <code>/api/ps</code>. Routers don't appear here; their
          loaded targets do.
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh" className="text-xs">
                Auto refresh
              </Label>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={running.refresh}
              aria-label="Refresh"
              disabled={running.loading}
            >
              <RefreshCcwIcon
                className={running.loading ? "animate-spin" : ""}
              />
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {running.error ? (
          <Alert variant="destructive">
            <AlertTitle>Couldn't reach the server</AlertTitle>
            <AlertDescription>{running.error}</AlertDescription>
          </Alert>
        ) : empty ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
            <ActivityIcon className="size-8 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-medium">Nothing loaded</h3>
              <p className="text-sm text-muted-foreground">
                Run a decision or load a model to see it here.
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Precision</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>VRAM</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-24 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {running.loading && list.length === 0
                ? Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : list.map((m) => {
                    const forever = m.expires_at == null
                    return (
                      <TableRow key={m.name}>
                        <TableCell>
                          <span className="font-mono">{m.name}</span>
                        </TableCell>
                        <TableCell>
                          <DeviceBadge device={m.device} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.details?.quantization_level || "—"}
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {m.context_length ?? "—"}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatBytes(m.size)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatBytes(m.size_vram)}
                        </TableCell>
                        <TableCell>
                          {forever ? (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <InfinityIcon className="size-3.5" />
                              Kept loaded
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {formatRfc3339(m.expires_at)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => unload(m.name)}
                            disabled={unloading === m.name}
                          >
                            <PowerOffIcon />
                            {unloading === m.name ? "Unloading…" : "Unload"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function DeviceBadge({ device }) {
  const type = deviceType(device)
  const tone =
    type === "cuda"
      ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400"
      : type === "metal"
        ? "bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400"
        : "bg-muted text-muted-foreground ring-border"
  return (
    <Badge variant="outline" className={cn("gap-1 ring-1", tone)}>
      <CpuIcon className="size-3" />
      {device || "—"}
    </Badge>
  )
}

function deviceType(device) {
  if (!device) return "cpu"
  if (device.startsWith("cuda")) return "cuda"
  if (device === "metal") return "metal"
  return "cpu"
}
