import * as React from "react"

const STORAGE_KEY = "ollaya-ui:settings"

export const DEFAULT_SETTINGS = {
  baseUrl: "http://127.0.0.1:11435",
  apiKey: "",
}

function readFromStorage() {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function writeToStorage(next) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent("ollaya-ui:settings"))
  } catch {
    // ignore quota / privacy-mode errors
  }
}

/**
 * React hook that keeps `baseUrl` and `apiKey` in sync with localStorage.
 * Also listens to same-tab and cross-tab updates.
 */
export function useSettings() {
  const [settings, setSettings] = React.useState(readFromStorage)

  React.useEffect(() => {
    function sync() {
      setSettings(readFromStorage())
    }
    window.addEventListener("storage", sync)
    window.addEventListener("ollaya-ui:settings", sync)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("ollaya-ui:settings", sync)
    }
  }, [])

  const update = React.useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      writeToStorage(next)
      return next
    })
  }, [])

  return { settings, update }
}

export function getSettings() {
  return readFromStorage()
}
