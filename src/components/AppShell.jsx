import * as React from "react"
import { BrainCircuitIcon, BoxesIcon, ActivityIcon, InfoIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ServerStatus } from "@/components/ServerStatus"
import { SettingsDialog } from "@/components/SettingsDialog"
import { ThemeToggle } from "@/components/ThemeToggle"
import { DecidePage } from "@/pages/DecidePage"
import { ModelsPage } from "@/pages/ModelsPage"
import { RunningPage } from "@/pages/RunningPage"
import { AboutPage } from "@/pages/AboutPage"

const TABS = [
  { value: "decide", label: "Decide", icon: BrainCircuitIcon, Page: DecidePage },
  { value: "models", label: "Models", icon: BoxesIcon, Page: ModelsPage },
  { value: "running", label: "Running", icon: ActivityIcon, Page: RunningPage },
  { value: "about", label: "About", icon: InfoIcon, Page: AboutPage },
]

export function AppShell() {
  const [tab, setTab] = React.useState("decide")

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Logo />
          <div className="flex-1" />
          <ServerStatus />
          <SettingsDialog />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList variant="line" className="mb-4">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value}>
                <Icon />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map(({ value, Page }) => (
            <TabsContent key={value} value={value}>
              <Page />
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted-foreground">
        Ollaya Web UI · client-side only, no data is stored anywhere but this
        browser.
      </footer>
    </div>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <BrainCircuitIcon className="size-4" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-heading text-sm font-semibold">Ollaya</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Decision console
        </span>
      </div>
    </div>
  )
}
