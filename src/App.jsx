import { AppShell } from "@/components/AppShell"
import { SettingsProvider } from "@/components/SettingsContext"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <SettingsProvider>
      <TooltipProvider delayDuration={200}>
        <AppShell />
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </SettingsProvider>
  )
}

export default App
