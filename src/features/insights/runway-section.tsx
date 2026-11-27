import { StatRow, UrgencyBadge } from "@/features/dashboard/region-parts"
import { useLanguage } from "@/features/i18n/language-context"
import { featureText } from "@/features/payments/entitlements"
import { SectionCard, type SectionProps } from "./section-card"

export function RunwaySection({ analytics }: SectionProps) {
  const { t, isBangla, formatBDT, formatUnits, formatNumber, formatDateWithDay } = useLanguage()
  const { estimatedDaysRemaining: days, urgencyLevel } = analytics.runway
  const { avgDailyCostBdt, avgDailyKwh, dailyKwhSource } = analytics.estimates

  return (
    <SectionCard title={featureText("runway", isBangla).name} estimate>
      <p className="flex flex-wrap items-baseline gap-2">
        <span className="num text-6xl font-bold">{formatNumber(days)}</span>
        <span className="text-sm text-muted-foreground">{t.dashboard.daysLeft}</span>
        <UrgencyBadge level={urgencyLevel} />
      </p>
      <StatRow label={t.dashboard.runsOut} value={formatDateWithDay(new Date(Date.now() + days * 86_400_000))} />
      <StatRow label={t.insightsPage.hoursLeft} value={formatNumber(days * 24)} />
      <StatRow label={t.dashboard.dailyCost} value={`${formatBDT(avgDailyCostBdt)}${t.dashboard.perDay}`} />
      <StatRow label={t.dashboard.dailyUnits} value={`${formatUnits(avgDailyKwh)}${t.dashboard.perDay}`} />
      <StatRow
        label={t.insightsPage.rateSource}
        value={dailyKwhSource === "current_month" ? t.insightsPage.currentMonthRate : t.insightsPage.lastMonthRate}
      />
    </SectionCard>
  )
}
