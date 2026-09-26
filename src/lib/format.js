/**
 * Small formatting helpers used across the UI.
 */

export function formatBytes(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return "—"
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB", "TB"]
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`
}

/**
 * Ollaya durations are integers in nanoseconds.
 * Returns a compact human string.
 */
export function formatNs(ns) {
  if (ns == null) return "—"
  const n = Number(ns)
  if (!Number.isFinite(n)) return "—"
  if (n < 1_000) return `${n} ns`
  if (n < 1_000_000) return `${(n / 1_000).toFixed(1)} µs`
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(1)} ms`
  const s = n / 1_000_000_000
  if (s < 60) return `${s.toFixed(2)} s`
  const m = Math.floor(s / 60)
  const rem = s - m * 60
  return `${m}m ${rem.toFixed(0)}s`
}

export function formatRfc3339(ts) {
  if (!ts) return "—"
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return String(ts)
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function formatPercent(p, digits = 1) {
  if (p == null || Number.isNaN(p)) return "—"
  return `${(Number(p) * 100).toFixed(digits)}%`
}

export function truncate(str, max = 32) {
  if (!str) return ""
  if (str.length <= max) return str
  return `${str.slice(0, max - 1)}…`
}

/** Percentage 0..1 for a pull progress line { total, completed }. */
export function pullProgress(line) {
  if (!line || !line.total) return 0
  return Math.max(0, Math.min(1, (line.completed || 0) / line.total))
}
