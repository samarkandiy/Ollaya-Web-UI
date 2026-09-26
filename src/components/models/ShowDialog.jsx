import * as React from "react"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useSettingsContext } from "@/components/SettingsContext"
import { showModel, OllayaError } from "@/lib/ollaya"
import { formatBytes, formatRfc3339 } from "@/lib/format"

export function ShowDialog({ open, onOpenChange, name, size }) {
  const { settings } = useSettingsContext()
  const [data, setData] = React.useState(null)
  const [error, setError] = React.useState(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open || !name) return
    const controller = new AbortController()
    setData(null)
    setError(null)
    setLoading(true)
    showModel(settings, name, { signal: controller.signal })
      .then(setData)
      .catch((err) => {
        if (err?.name === "AbortError") return
        const msg =
          err instanceof OllayaError
            ? `${err.code || "ERROR"}: ${err.message}`
            : err?.message || "Request failed"
        setError(msg)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [open, name, settings])

  const copyModelfile = () => {
    if (!data?.modelfile) return
    navigator.clipboard
      .writeText(data.modelfile)
      .then(() => toast.success("Modelfile copied"))
      .catch(() => toast.error("Copy failed"))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle className="truncate font-mono">{name}</DialogTitle>
          {size ? (
            <DialogDescription>
              {formatBytes(size)} on disk
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            Loading details…
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : data ? (
          <ScrollArea className="-mx-6 max-h-[60vh] px-6">
            <Details data={data} onCopyModelfile={copyModelfile} />
          </ScrollArea>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Details({ data, onCopyModelfile }) {
  const capabilities = data.capabilities || []
  const details = data.details || {}
  const families = details.families || []
  const modelInfo = data.model_info || {}

  return (
    <div className="flex flex-col gap-5 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {capabilities.map((c) => (
          <Badge key={c} variant="outline" className="capitalize">
            {c}
          </Badge>
        ))}
        {details.format ? (
          <Badge variant="outline">format: {details.format}</Badge>
        ) : null}
        {details.parameter_size ? (
          <Badge variant="outline">{details.parameter_size}</Badge>
        ) : null}
        {details.quantization_level ? (
          <Badge variant="outline">{details.quantization_level}</Badge>
        ) : null}
      </div>

      <Section title="Details">
        <KV k="Family" v={details.family} />
        {families.length > 0 ? (
          <KV k="Families" v={families.join(", ")} />
        ) : null}
        <KV k="Parent" v={details.parent_model || "—"} />
        <KV k="Modified" v={formatRfc3339(data.modified_at)} />
      </Section>

      {Object.keys(modelInfo).length > 0 ? (
        <Section title="Model info">
          {Object.entries(modelInfo).map(([k, v]) => (
            <KV
              key={k}
              k={k}
              v={
                Array.isArray(v) ? v.join(", ") : typeof v === "object"
                  ? JSON.stringify(v)
                  : String(v)
              }
            />
          ))}
        </Section>
      ) : null}

      {data.router ? (
        <Section title="Router">
          <KV k="Strategy" v={data.router.strategy} />
          <KV k="Default" v={data.router.default} />
          {data.router.routes ? (
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Routes
              </div>
              <div className="mt-1 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
                {Object.entries(data.router.routes).map(([route, target]) => (
                  <React.Fragment key={route}>
                    <code className="text-xs">{route}</code>
                    <span className="text-xs">{target}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : null}
        </Section>
      ) : null}

      <Section title="Built-in questions">
        {data.questions ? (
          <pre className="rounded-md bg-muted/40 p-3 text-xs">
            {JSON.stringify(data.questions, null, 2)}
          </pre>
        ) : (
          <p className="text-xs text-muted-foreground">
            None. Callers pass questions with every request.
          </p>
        )}
      </Section>

      {data.parameters ? (
        <Section title="Parameters">
          <pre className="rounded-md bg-muted/40 p-3 text-xs whitespace-pre-wrap">
            {data.parameters}
          </pre>
        </Section>
      ) : null}

      {data.modelfile ? (
        <Section
          title="Modelfile"
          action={
            <Button variant="outline" size="xs" onClick={onCopyModelfile}>
              Copy
            </Button>
          }
        >
          <pre className="max-h-64 overflow-auto rounded-md bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap">
            {data.modelfile}
          </pre>
        </Section>
      ) : null}

      {data.license ? (
        <Section title="License">
          <details className="rounded-md bg-muted/40 p-3 text-xs">
            <summary className="cursor-pointer select-none text-muted-foreground">
              Show license text
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap">
              {data.license}
            </pre>
          </details>
        </Section>
      ) : null}
    </div>
  )
}

function Section({ title, action, children }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h4 className="font-heading text-sm font-medium">{title}</h4>
        {action}
      </div>
      <Separator />
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  )
}

function KV({ k, v }) {
  return (
    <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className="truncate font-mono" title={String(v)}>
        {v ?? "—"}
      </span>
    </div>
  )
}
