import * as React from "react"
import {
  FlaskConicalIcon,
  LifeBuoyIcon,
  MailIcon,
  BugIcon,
  ShieldAlertIcon,
  StarIcon,
  TrendingUpIcon,
  GitPullRequestIcon,
  CalendarIcon,
  LanguagesIcon,
  BoxIcon,
} from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SAMPLES, loadSample } from "@/components/decide/samples"

// Map icon names in samples.js to actual lucide components.
const ICONS = {
  LifeBuoy: LifeBuoyIcon,
  Mail: MailIcon,
  Bug: BugIcon,
  ShieldAlert: ShieldAlertIcon,
  Star: StarIcon,
  TrendingUp: TrendingUpIcon,
  GitPullRequest: GitPullRequestIcon,
  Calendar: CalendarIcon,
  Languages: LanguagesIcon,
}

// Tailwind can't see class names that only exist as data, so keep the full
// class strings inline here for JIT to pick them up.
const ACCENTS = {
  sky: "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400",
  blue: "bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-400",
  rose: "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400",
  amber: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  yellow:
    "bg-yellow-500/10 text-yellow-600 ring-yellow-500/20 dark:text-yellow-400",
  emerald:
    "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  violet:
    "bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400",
  orange:
    "bg-orange-500/10 text-orange-600 ring-orange-500/20 dark:text-orange-400",
  cyan: "bg-cyan-500/10 text-cyan-600 ring-cyan-500/20 dark:text-cyan-400",
}

const TYPE_BADGE = {
  choice: "bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 dark:text-sky-400",
  score:
    "bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20 dark:text-violet-400",
  noul: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400",
}

export function SamplesDialog({ onPick }) {
  const [open, setOpen] = React.useState(false)

  const pick = (id) => {
    const loaded = loadSample(id)
    if (loaded) {
      onPick(loaded)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FlaskConicalIcon />
          Samples
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>Load a sample</DialogTitle>
          <DialogDescription>
            Prefill the state and questions from a real-world scenario. Each
            sample fits within laya:en's 512-token context.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="-mx-6 max-h-[65vh] px-6">
          <div className="grid gap-2 py-2 sm:grid-cols-2">
            {SAMPLES.map((s) => (
              <SampleCard key={s.id} sample={s} onPick={() => pick(s.id)} />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function SampleCard({ sample, onPick }) {
  const Icon = ICONS[sample.icon] || BoxIcon
  const accentClass = ACCENTS[sample.accent] || ACCENTS.sky
  const types = React.useMemo(() => {
    const seen = new Set()
    for (const q of sample.questions) {
      if (q.type) seen.add(q.type)
    }
    return Array.from(seen)
  }, [sample])

  return (
    <button
      type="button"
      onClick={onPick}
      className="group flex flex-col gap-2 rounded-xl border bg-card p-3 text-left transition-colors hover:border-foreground/20 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg ring-1",
            accentClass
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-heading text-sm font-medium leading-tight">
            {sample.title}
          </span>
          <span className="text-xs text-muted-foreground">
            {sample.subtitle}
          </span>
        </div>
      </div>

      <p className="line-clamp-2 text-xs text-muted-foreground/90">
        {sample.state}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        {types.map((t) => (
          <Badge
            key={t}
            variant="outline"
            className={cn("text-[10px]", TYPE_BADGE[t])}
          >
            {t}
          </Badge>
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground">
          {sample.questions.length} question
          {sample.questions.length === 1 ? "" : "s"}
        </span>
      </div>
    </button>
  )
}
