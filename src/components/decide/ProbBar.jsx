import { cn } from "cn"
import { formatPercent } from "@/lib/format"

/**
 * A row that shows a label on the left, a probability bar in the middle, and
 * the value on the right. `highlight` gets the accent color so the picked
 * option pops.
 */
export function ProbBar({ label, value = 0, highlight = false, description }) {
  const percent = Math.max(0, Math.min(1, Number(value) || 0))
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <div className="flex min-w-0 items-baseline gap-2">
          <span
            className={cn(
              "truncate font-medium",
              highlight ? "text-foreground" : "text-foreground/80"
            )}
            title={label}
          >
            {label}
          </span>
          {description ? (
            <span className="truncate text-xs text-muted-foreground" title={description}>
              {description}
            </span>
          ) : null}
        </div>
        <span
          className={cn(
            "tabular-nums",
            highlight ? "font-semibold" : "text-muted-foreground"
          )}
        >
          {formatPercent(percent, 2)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            highlight ? "bg-primary" : "bg-primary/40"
          )}
          style={{ width: `${percent * 100}%` }}
        />
      </div>
    </div>
  )
}
