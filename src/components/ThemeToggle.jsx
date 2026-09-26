import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/lib/theme"

const OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const active = OPTIONS.find((o) => o.value === theme) || OPTIONS[2]
  const ActiveIcon = active.icon
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Theme">
          <ActiveIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => setTheme(value)}
            data-active={value === theme || undefined}
          >
            <Icon />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
