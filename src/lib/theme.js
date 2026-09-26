import * as React from "react"

const STORAGE_KEY = "ollaya-ui:theme"

function readTheme() {
  if (typeof window === "undefined") return "system"
  try {
    return window.localStorage.getItem(STORAGE_KEY) || "system"
  } catch {
    return "system"
  }
}

function applyTheme(theme) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  root.classList.toggle("dark", dark)
}

export function useTheme() {
  const [theme, setThemeState] = React.useState(readTheme)

  React.useEffect(() => {
    applyTheme(theme)
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  React.useEffect(() => {
    if (theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const listener = () => applyTheme("system")
    mq.addEventListener("change", listener)
    return () => mq.removeEventListener("change", listener)
  }, [theme])

  return { theme, setTheme: setThemeState }
}

/** Read initial theme synchronously so first paint is right. */
export function applyInitialTheme() {
  applyTheme(readTheme())
}
