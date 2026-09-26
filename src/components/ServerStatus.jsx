import * as React from "react"
import { RefreshCcwIcon } from "lucide-react"
import { cn } from "cn"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSettingsContext } from "@/components/SettingsContext"
import { getVersion, OllayaError } from "@/lib/ollaya"

const REFRESH_INTERVAL_MS = 30_000

export function ServerStatus() {
  const { settings } = useSettingsContext()
  const [state, setState] = React.useState({
    status: "checking",
    version: null,
    error: null,
  })

  const check = React.useCallback(
    async (signal) => {
      setState((prev) => ({ ...prev, status: "checking" }))
      try {
        const info = await getVersion(settings, { signal })
        setState({
          status: "ok",
          version: info?.version || null,
          error: null,
        })
      } catch (err) {
        if (err?.name === "AbortError") return
        const msg =
          err instanceof OllayaError
            ? `${err.code || "ERROR"}: ${err.message}`
            : err?.message || "Unreachable"
        setState({ status: "down", version: null, error: msg })
      }
    },
    [settings]
  )

  React.useEffect(() => {
    const controller = new AbortController()
    check(controller.signal)
    const id = window.setInterval(() => check(controller.signal), REFRESH_INTERVAL_MS)
    return () => {
      controller.abort()
      window.clearInterval(id)
    }
  }, [check])

  const dot =
    state.status === "ok"
      ? "bg-emerald-500"
      : state.status === "checking"
        ? "bg-amber-500 animate-pulse"
        : "bg-destructive"

  const label =
    state.status === "ok"
      ? `Connected · v${state.version || "?"}`
      : state.status === "checking"
        ? "Checking…"
        : "Unreachable"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => check()}
          className={cn(
            "inline-flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <span className={cn("size-2 rounded-full", dot)} aria-hidden />
          <span>{label}</span>
          <RefreshCcwIcon
            className={cn(
              "size-3 text-muted-foreground",
              state.status === "checking" && "animate-spin"
            )}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div className="max-w-xs text-xs">
          <div className="font-medium">{settings.baseUrl}</div>
          {state.error ? (
            <div className="mt-1 text-destructive">{state.error}</div>
          ) : (
            <div className="mt-1 text-muted-foreground">Click to re-check</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
