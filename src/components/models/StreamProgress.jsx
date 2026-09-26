import * as React from "react"
import { cn } from "cn"
import { CheckIcon, Loader2Icon, OctagonXIcon } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { formatBytes, pullProgress, truncate } from "@/lib/format"

/**
 * Renders streamed NDJSON status lines from /api/pull and /api/create.
 *
 * The parent owns the list of lines; this component derives per-layer progress
 * and shows the most recent overall status.
 *
 * `state` is one of: "idle" | "streaming" | "done" | "error".
 */
export function StreamProgress({ lines, state, error }) {
  const last = lines[lines.length - 1]
  const status = last?.status || (state === "idle" ? "Waiting…" : "")

  // Group lines by digest so multiple progress updates on the same layer collapse.
  const layers = React.useMemo(() => {
    const map = new Map()
    for (const line of lines) {
      if (!line || !line.digest) continue
      map.set(line.digest, line)
    }
    return Array.from(map.values())
  }, [lines])

  const StatusIcon =
    state === "error"
      ? OctagonXIcon
      : state === "done"
        ? CheckIcon
        : Loader2Icon

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "flex items-center gap-2 text-sm",
          state === "error" && "text-destructive",
          state === "done" && "text-emerald-600 dark:text-emerald-400"
        )}
      >
        <StatusIcon
          className={cn(
            "size-4 shrink-0",
            state === "streaming" && "animate-spin"
          )}
        />
        <span className="truncate">{state === "error" ? error : status}</span>
      </div>

      {layers.length > 0 ? (
        <div className="flex flex-col gap-2">
          {layers.map((layer) => {
            const p = pullProgress(layer)
            const done =
              layer.completed != null &&
              layer.total != null &&
              layer.completed >= layer.total
            return (
              <div key={layer.digest} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 truncate font-mono">
                    {done ? (
                      <CheckIcon className="size-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Loader2Icon className="size-3 animate-spin text-muted-foreground" />
                    )}
                    <span className="truncate">{truncate(layer.digest, 24)}</span>
                  </div>
                  <div className="tabular-nums text-muted-foreground">
                    {layer.total ? (
                      <>
                        {formatBytes(layer.completed || 0)} /{" "}
                        {formatBytes(layer.total)}
                      </>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
                <Progress value={Math.round(p * 100)} />
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
