import * as React from "react"
import { useSettingsContext } from "@/components/SettingsContext"
import { listModels, listRunning, OllayaError } from "@/lib/ollaya"

function useEndpoint(fetcher) {
  const { settings } = useSettingsContext()
  const [state, setState] = React.useState({
    data: null,
    error: null,
    loading: true,
  })
  const [nonce, setNonce] = React.useState(0)

  React.useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true }))

    fetcher(settings, { signal: controller.signal })
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false })
      })
      .catch((err) => {
        if (cancelled || err?.name === "AbortError") return
        const msg =
          err instanceof OllayaError
            ? `${err.code || "ERROR"}: ${err.message}`
            : err?.message || "Request failed"
        setState({ data: null, error: msg, loading: false })
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [settings, fetcher, nonce])

  const refresh = React.useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, refresh }
}

export function useModels() {
  return useEndpoint(listModels)
}

export function useRunning() {
  return useEndpoint(listRunning)
}
