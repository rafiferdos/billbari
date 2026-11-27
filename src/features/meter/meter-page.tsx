import type * as React from "react"
import type { LucideIcon } from "lucide-react"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/features/i18n/language-context"
import { SourceBanner } from "@/features/nesco/source-badge"
import type { NescoFetchResult } from "@/features/nesco/types"
import { useMeter } from "./meter-context"
import { MeterError } from "./meter-error"
import { maskMeter } from "./meter-input"
import { MeterSearch } from "./meter-search"

/** Frame for pages about one meter: search, empty, error and loading states, then the meter's name. */
export function MeterPage({
  icon: Icon,
  emptyTitle,
  children,
}: {
  icon: LucideIcon
  emptyTitle: string
  children: (data: NescoFetchResult) => React.ReactNode
}) {
  const { activeMeterData: data, isLoading, error, failedMeter, fetchMeter } = useMeter()
  const { formatNumber } = useLanguage()

  return (
    <>
      {data ? (
        <MeterSearch variant="compact" />
      ) : (
        !isLoading && (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Icon aria-hidden />
              </EmptyMedia>
              <EmptyTitle>{emptyTitle}</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <MeterSearch variant="compact" />
            </EmptyContent>
          </Empty>
        )
      )}
      {error && !isLoading && (
        <MeterError error={error} onRetry={() => void fetchMeter(failedMeter, { force: true })} />
      )}
      {isLoading ? (
        <div className="section-stack">
          <Skeleton className="h-10 max-w-sm" />
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        data && (
          <>
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="min-w-0 font-semibold break-words">{data.customerInfo.name}</span>
              <span className="num text-sm text-muted-foreground">
                {formatNumber(maskMeter(data.customerInfo.meterNumber))}
              </span>
            </p>
            <SourceBanner data={data} onRefresh={() => void fetchMeter(undefined, { force: true })} />
            {children(data)}
          </>
        )
      )}
    </>
  )
}
