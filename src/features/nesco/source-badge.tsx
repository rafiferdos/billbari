import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, Info, RefreshCw } from "lucide-react"
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
  if (Number.isNaN(date.getTime())) return isBangla ? "সময় অজানা" : "Unknown time"
  return date.toLocaleString(isBangla ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function sourceLabel(dataSource: DataSource, isBangla: boolean): string {
  if (dataSource === "nesco_live") return isBangla ? "লাইভ" : "Live"
  if (dataSource === "cached_real") return isBangla ? "সংরক্ষিত" : "Cached"
  return isBangla ? "নমুনা" : "Sample"
}

function sourceBadgeClass(dataSource: DataSource, stale: boolean): string {
  if (dataSource === "sample_demo") {
    return "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30"
  }
  if (stale) {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
  }
  if (dataSource === "nesco_live") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
  }
  return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
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
  const { isBangla } = useLanguage()
  const stale = isStaleSource(dataSource, fetchedAt)
  return (
    <Badge variant="outline" className={`${sourceBadgeClass(dataSource, stale)} text-xs font-medium ${className ?? ""}`}>
      {sourceLabel(dataSource, isBangla)}
      {stale ? (isBangla ? " • পুরনো" : " • Stale") : ""}
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

  const title = isSample
    ? t.status.demoTitle
    : data.dataSource === "cached_real"
    ? t.status.cachedTitle
    : t.status.liveSuccessTitle

  const bannerClass = isSample
    ? "bg-violet-500/10 border-violet-500/30 text-violet-900 dark:text-violet-200"
    : stale
    ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
    : data.dataSource === "cached_real"
    ? "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200"
    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200"

  return (
    <Alert className={bannerClass}>
      <div className="flex flex-wrap items-center gap-2">
        {isSample ? (
          <Info className="size-4 text-violet-600 dark:text-violet-400" />
        ) : stale || data.dataSource === "cached_real" ? (
          <Clock className="size-4 text-amber-600 dark:text-amber-400" />
        ) : (
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
        )}
        <AlertTitle className="text-xs font-bold mb-0">{title}</AlertTitle>
        <SourceBadge dataSource={data.dataSource} fetchedAt={data.fetchedAt} />
      </div>
      <AlertDescription className="text-xs mt-1 text-muted-foreground space-y-1">
        <p>
          {isSample
            ? isBangla
              ? "এটি নমুনা রেফারেন্স ডেটা, আসল মিটার ডেটা নয়।"
              : "This is sample reference data, not real meter data."
            : isBangla
            ? data.statusMessage
            : data.dataSource === "cached_real"
            ? "Displaying previously verified session data."
            : "Live telemetry retrieved from official NESCO server."}
        </p>
        {!isSample && (
          <p>
            {isBangla
              ? `সংগৃহীত: ${formatFetchedAt(data.fetchedAt, true)}`
              : `Fetched: ${formatFetchedAt(data.fetchedAt, false)}`}
          </p>
        )}
        {stale && (
          <p className="font-semibold text-amber-700 dark:text-amber-300">
            {isBangla
              ? "এই ডেটা ২৪ ঘণ্টার বেশি পুরনো। নতুন ডেটার জন্য আবার সার্চ করুন।"
              : "This data is more than 24 hours old. Search again for fresh data."}
          </p>
        )}
      </AlertDescription>
      {stale && onRefresh && (
        <Button size="sm" variant="outline" onClick={onRefresh} className="mt-2 h-8 text-xs font-semibold gap-1.5">
          <RefreshCw className="size-3.5" />
          <span>{isBangla ? "নতুন ডেটা আনুন" : "Refresh data"}</span>
        </Button>
      )}
    </Alert>
  )
}
