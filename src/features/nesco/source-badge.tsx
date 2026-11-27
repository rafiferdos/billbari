import { CheckCircle2, Clock, Info, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/features/i18n/language-context"
import type { DataSource, NescoFetchResult } from "./types"

// Phase 4 trust rule: fetchedAt was already in the data model but was
// never shown anywhere. A balance without a fetch time looks current even
// when it is a restored session from days ago.
export const STALE_AFTER_MS = 24 * 60 * 60 * 1000 // 24 hours

export function isStaleSource(dataSource: DataSource, fetchedAt?: string): boolean {
  // Sample data is never "stale": it is not real data at any age, and it
  // gets its own sample treatment instead of a stale warning.
  if (dataSource === "sample_demo") return false
  if (!fetchedAt) return true
  const time = new Date(fetchedAt).getTime()
  if (Number.isNaN(time)) return true
  return Date.now() - time > STALE_AFTER_MS
}

export function formatFetchedAt(fetchedAt: string, isBangla: boolean): string {
  const date = new Date(fetchedAt)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString(isBangla ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type Tone = "sample" | "warning" | "live"

const toneOf = (dataSource: DataSource, stale: boolean): Tone =>
  dataSource === "sample_demo" ? "sample" : stale || dataSource === "cached_real" ? "warning" : "live"

// Text stays in the theme's foreground; the tone colors only borders and icons, which stay readable in every theme.
const TONES: Record<Tone, { border: string; icon: string; Icon: typeof Info }> = {
  sample: { border: "border-primary", icon: "text-primary", Icon: Info },
  warning: { border: "border-warning", icon: "text-warning", Icon: Clock },
  live: { border: "border-success", icon: "text-success", Icon: CheckCircle2 },
}

export function SourceBadge({
  dataSource,
  fetchedAt,
  className,
}: {
  dataSource: DataSource
  fetchedAt?: string
  className?: string
}) {
  const { t } = useLanguage()
  const stale = isStaleSource(dataSource, fetchedAt)
  const label = { nesco_live: t.source.live, cached_real: t.source.cached, sample_demo: t.common.sample }[dataSource]

  return (
    <Badge variant="outline" className={`${TONES[toneOf(dataSource, stale)].border} ${className ?? ""}`}>
      {label}
      {stale ? ` • ${t.source.stale}` : ""}
    </Badge>
  )
}

export function SourceBanner({
  data,
  onRefresh,
}: {
  data: NescoFetchResult
  onRefresh?: () => void
}) {
  const { t, isBangla } = useLanguage()
  const stale = isStaleSource(data.dataSource, data.fetchedAt)
  const isSample = data.dataSource === "sample_demo"
  const isCached = data.dataSource === "cached_real"
  const { border, icon, Icon } = TONES[toneOf(data.dataSource, stale)]

  const title = isSample ? t.status.demoTitle : isCached ? t.status.cachedTitle : t.status.liveSuccessTitle
  // NESCO status messages arrive in Bangla only
  const note = isSample
    ? t.source.sampleNote
    : (isBangla && data.statusMessage) || (isCached ? t.source.cachedNote : t.source.liveNote)

  return (
    <Alert className={border}>
      <div className="flex flex-wrap items-center gap-2">
        <Icon aria-hidden className={`size-4 ${icon}`} />
        <AlertTitle className="text-xs font-bold">{title}</AlertTitle>
        <SourceBadge dataSource={data.dataSource} fetchedAt={data.fetchedAt} />
      </div>
      <AlertDescription className="mt-1 flex flex-col gap-1 text-xs">
        <p>{note}</p>
        {!isSample && <p>{t.source.fetched.replace("{time}", formatFetchedAt(data.fetchedAt, isBangla))}</p>}
        {stale && <p className="font-semibold text-foreground">{t.source.staleNote}</p>}
      </AlertDescription>
      {stale && onRefresh && (
        <Button size="sm" variant="outline" onClick={onRefresh} className="mt-2 w-fit">
          <RefreshCw />
          <span>{t.source.refresh}</span>
        </Button>
      )}
    </Alert>
  )
}
