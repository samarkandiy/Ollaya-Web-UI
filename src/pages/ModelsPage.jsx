import * as React from "react"
import {
  RefreshCcwIcon,
  MoreHorizontalIcon,
  EyeIcon,
  CopyIcon,
  Trash2Icon,
  BoxIcon,
} from "lucide-react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { PullDialog } from "@/components/models/PullDialog"
import { CreateDialog } from "@/components/models/CreateDialog"
import { CopyDialog } from "@/components/models/CopyDialog"
import { DeleteDialog } from "@/components/models/DeleteDialog"
import { ShowDialog } from "@/components/models/ShowDialog"
import { useModels } from "@/lib/hooks"
import { formatBytes, formatRfc3339 } from "@/lib/format"

export function ModelsPage() {
  const models = useModels()
  const [copyTarget, setCopyTarget] = React.useState(null)
  const [deleteTarget, setDeleteTarget] = React.useState(null)
  const [showTarget, setShowTarget] = React.useState(null)

  const list = models.data?.models || []
  const empty = !models.loading && !models.error && list.length === 0

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Models</CardTitle>
          <CardDescription>
            Local models on this server. Pull, copy, or delete them here.
          </CardDescription>
          <CardAction>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={models.refresh}
                aria-label="Refresh"
                disabled={models.loading}
              >
                <RefreshCcwIcon
                  className={models.loading ? "animate-spin" : ""}
                />
              </Button>
              <CreateDialog onDone={models.refresh} />
              <PullDialog onDone={models.refresh} />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          {models.error ? (
            <Alert variant="destructive">
              <AlertTitle>Couldn't reach the server</AlertTitle>
              <AlertDescription>{models.error}</AlertDescription>
            </Alert>
          ) : empty ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
              <BoxIcon className="size-8 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <h3 className="font-heading font-medium">No models yet</h3>
                <p className="text-sm text-muted-foreground">
                  Pull one to get started. Try{" "}
                  <code className="rounded bg-muted px-1">laya:en</code>.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Family</TableHead>
                  <TableHead>Params</TableHead>
                  <TableHead>Quantization</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead className="w-10 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.loading && list.length === 0
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={`sk-${i}`}>
                        <TableCell colSpan={7}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : list.map((m) => (
                      <TableRow key={m.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BoxIcon className="size-4 text-muted-foreground" />
                            <span className="font-mono">{m.name}</span>
                            {m.details?.format === "router" ? (
                              <Badge variant="outline">router</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.details?.family || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.details?.parameter_size || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.details?.quantization_level || "—"}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatBytes(m.size)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatRfc3339(m.modified_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Actions"
                              >
                                <MoreHorizontalIcon />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() =>
                                  setShowTarget({ name: m.name, size: m.size })
                                }
                              >
                                <EyeIcon />
                                Show details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => setCopyTarget(m.name)}
                              >
                                <CopyIcon />
                                Copy
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleteTarget(m.name)}
                              >
                                <Trash2Icon />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ShowDialog
        open={showTarget !== null}
        onOpenChange={(open) => !open && setShowTarget(null)}
        name={showTarget?.name}
        size={showTarget?.size}
      />
      <CopyDialog
        open={copyTarget !== null}
        onOpenChange={(open) => !open && setCopyTarget(null)}
        source={copyTarget || ""}
        onDone={models.refresh}
      />
      <DeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        name={deleteTarget || ""}
        onDone={models.refresh}
      />
    </>
  )
}
