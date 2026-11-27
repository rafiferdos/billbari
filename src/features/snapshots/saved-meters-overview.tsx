import * as React from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/features/i18n/language-context"
import { useMeter } from "@/features/meter/meter-context"
import { maskMeter } from "@/features/meter/meter-input"
import { useSavedMeters } from "@/features/meter/use-saved-meters"
import { newestFirst } from "./snapshot-math"
import type { SnapshotRecord } from "./snapshot-server"

export function SavedMetersOverview({ snapshots }: { snapshots: SnapshotRecord[] }) {
  const { t, formatBDT, formatNumber, formatDate } = useLanguage()
  const { fetchMeter } = useMeter()
  const { meters, isLoading, busyId, load, toggleFavorite } = useSavedMeters()

  React.useEffect(() => {
    void load()
  }, [load])

  const sorted = newestFirst(snapshots)

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg">{t.savedMeters.title}</h2>
      {isLoading && !meters.length ? (
        <Skeleton className="h-32" />
      ) : !meters.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle className="text-sm">{t.savedMeters.none}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-(--bb-grid-gap) sm:grid-cols-2 lg:grid-cols-3">
          {meters.map((meter) => {
            const last = sorted.find((s) => s.meterNumber === meter.meterNumber)
            return (
              <Card key={meter.id} size="sm">
                <CardHeader>
                  <CardTitle className="num">{formatNumber(maskMeter(meter.meterNumber))}</CardTitle>
                  <CardAction>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={busyId === meter.id}
                      aria-label={meter.isFavorite ? t.savedMeters.removeFavorite : t.savedMeters.addFavorite}
                      aria-pressed={meter.isFavorite}
                      onClick={() => toggleFavorite(meter)}
                    >
                      <Star className={meter.isFavorite ? "fill-warning text-warning" : "text-muted-foreground"} />
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-2">
                  {meter.alias && <p className="truncate text-xs text-muted-foreground">{meter.alias}</p>}
                  {last ? (
                    <p>
                      <span className="num block text-2xl font-bold">{formatBDT(last.balance)}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(last.snapshotDate)}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{t.savedMeters.noSnapshot}</p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-auto"
                    onClick={() => void fetchMeter(meter.meterNumber, { force: true })}
                  >
                    {t.savedMeters.load}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
