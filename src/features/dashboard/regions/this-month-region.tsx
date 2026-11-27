import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Meter } from "@/components/ui/meter"
import { useLanguage } from "@/features/i18n/language-context"
import { monthName } from "@/lib/nesco-dates"
import { EmptyRegion, EstimateBadge, StatRow } from "../region-parts"
import type { DashboardData } from "../types"

export function ThisMonthRegion({ stats }: DashboardData) {
  const { t, isBangla, formatBDT, formatUnits, formatNumber } = useLanguage()
  const { latestMonth: month, currentSlab: slab, monthOverMonthKwhPct: change } = stats

  if (!month) return <EmptyRegion title={t.dashboard.monthUsage} message={t.dashboard.noMonths} />

  const unitsLeft = slab?.maxUnits != null ? Math.max(0, Math.floor(slab.maxUnits - month.usageKwh)) : null
  const Arrow = change === null || change === 0 ? ArrowRight : change > 0 ? ArrowUp : ArrowDown

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {monthName(month.monthIndex, isBangla)} {formatNumber(month.year)}
        </CardTitle>
        {month.isCurrentMonth && <CardDescription>{t.dashboard.monthSoFar}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="num text-4xl font-bold">{formatUnits(month.usageKwh)}</p>

        <div className="flex flex-wrap gap-2">
          {change !== null && (
            <Badge
              variant="outline"
              title={t.dashboard.momLabel}
              className={change > 0 ? "border-warning text-warning" : change < 0 ? "border-success text-success" : undefined}
            >
              <Arrow aria-hidden />
              {formatNumber(Math.abs(change))}%<span className="sr-only"> {t.dashboard.momLabel}</span>
            </Badge>
          )}
          {slab && (
            <Badge variant="secondary">
              {slab.step === 0 ? (isBangla ? slab.nameBn : slab.nameEn) : `${t.dashboard.step} ${formatNumber(slab.step)}`}
              {" · "}
              {formatBDT(slab.ratePerUnit)}
              {t.dashboard.perUnit}
            </Badge>
          )}
        </div>

        {slab?.maxUnits != null && unitsLeft !== null && (
          <Meter
            value={month.usageKwh - slab.minUnits}
            max={slab.maxUnits - slab.minUnits}
            label={t.dashboard.unitsLeft.replace("{n}", formatNumber(unitsLeft))}
          />
        )}

        <div className="mt-auto flex flex-col gap-2">
          {stats.avgMonthlyKwh !== null && (
            <StatRow label={t.dashboard.avgMonthly} value={formatUnits(stats.avgMonthlyKwh)} />
          )}
          {stats.balanceUnitsEstimate !== null && (
            <StatRow
              label={t.dashboard.balanceBuys.replace("{n}", formatNumber(stats.balanceUnitsEstimate))}
              value={<EstimateBadge />}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
