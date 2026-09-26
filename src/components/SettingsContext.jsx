import * as React from "react"
import { useSettings } from "@/lib/settings"

const SettingsContext = React.createContext(null)

export function SettingsProvider({ children }) {
  const value = useSettings()
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsContext() {
  const ctx = React.useContext(SettingsContext)
  if (!ctx) {
    throw new Error("useSettingsContext must be used within a SettingsProvider")
  }
  return ctx
}
