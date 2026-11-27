import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/features/i18n/language-context"
import { ProGate } from "@/features/payments/pro-gate"
import { EmptyRegion, EstimateBadge, StatRow, UrgencyBadge } from "../region-parts"
import type { DashboardData } from "../types"

export function RunwayRegion(props: DashboardData) {
  return (
    <ProGate feature="runway">
      <Runway {...props} />
    </ProGate>
  )
}

function Runway({ analytics }: DashboardData) {
  const { t, formatBDT, formatUnits, formatNumber, formatDateWithDay } = useLanguage()
  if (!analytics.hasEnoughData) return <EmptyRegion title={t.dashboard.runway} message={t.stats.notEnoughData} />

  const { estimatedDaysRemaining: days, urgencyLevel } = analytics.runway
  const { avgDailyCostBdt, avgDailyKwh } = analytics.estimates

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.dashboard.runway}</CardTitle>
        <CardAction>
          <EstimateBadge />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="flex flex-wrap items-baseline gap-2">
          <span className="num text-5xl font-bold">{formatNumber(days)}</span>
          <span className="text-sm text-muted-foreground">{t.dashboard.daysLeft}</span>
          <UrgencyBadge level={urgencyLevel} />
        </p>
        <p className="text-xs text-muted-foreground">
          {t.dashboard.runsOut}: {formatDateWithDay(new Date(Date.now() + days * 86_400_000))}
        </p>
        <div className="mt-auto flex flex-col gap-2">
          <StatRow label={t.dashboard.dailyCost} value={`${formatBDT(avgDailyCostBdt)}${t.dashboard.perDay}`} />
          <StatRow label={t.dashboard.dailyUnits} value={`${formatUnits(avgDailyKwh)}${t.dashboard.perDay}`} />
        </div>
      </CardContent>
    </Card>
  )
}
