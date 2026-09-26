import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function AboutPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About this UI</CardTitle>
        <CardDescription>
          A thin client for the Ollaya decision server.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <p>
          The <b>Decide</b> tab sends questions to <code>/api/decide</code> and
          renders the typed answers (choice, score, noul) with calibrated
          probabilities.
        </p>
        <p>
          The <b>Models</b> tab wraps <code>/api/tags</code>,{" "}
          <code>/api/show</code>, <code>/api/pull</code>,{" "}
          <code>/api/delete</code>, <code>/api/copy</code> and{" "}
          <code>/api/create</code>. Pull and create stream progress line by
          line.
        </p>
        <p>
          The <b>Running</b> tab reflects <code>/api/ps</code> so you can see
          what's loaded and where.
        </p>
        <Separator />
        <p className="text-xs text-muted-foreground">
          This is a purely local client. Base URL and the optional API key are
          stored in <code>localStorage</code> and only ever leave the browser
          when calling the Ollaya server you configure.
        </p>
      </CardContent>
    </Card>
  )
}
