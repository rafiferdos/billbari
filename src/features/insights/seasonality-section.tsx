import { ConsumptionChart } from "@/features/analytics/consumption-chart"
import type { ExtendedSeasonalityStats } from "@/features/analytics/insights-generator"
import { RechargeTrendChart } from "@/features/analytics/recharge-trend-chart"
import { StatRow } from "@/features/dashboard/region-parts"
import { useLanguage } from "@/features/i18n/language-context"
import { featureText } from "@/features/payments/entitlements"
import { monthIndex, monthName } from "@/lib/nesco-dates"
import { orDash, SectionCard, type SectionProps } from "./section-card"

export function SeasonalitySection({ analytics, data }: SectionProps) {
  const { t, isBangla, formatBDT, formatUnits, formatNumber } = useLanguage()
  const season = analytics.seasonality

  const extreme = (label: string, month: ExtendedSeasonalityStats["highestMonth"]) => {
    if (!month) return <StatRow label={label} value="—" />
    const index = monthIndex(month.month)
    const name = index === null ? month.month : monthName(index, isBangla)
    return (
      <StatRow
        label={`${label} · ${name} ${formatNumber(month.year)}`}
        value={`${formatUnits(month.usageKwh)} · ${formatBDT(month.rechargeBdt)}`}
      />
    )
  }

  return (
    <>
      <SectionCard title={featureText("seasonality", isBangla).name}>
        {extreme(t.insightsPage.highest, season.highestMonth)}
        {extreme(t.insightsPage.lowest, season.lowestMonth)}
        <StatRow
          label={t.insightsPage.seasonGap}
          value={orDash(season.seasonalityGapPct, (pct) => `${formatNumber(pct)}%`)}
        />
        <StatRow label={t.insightsPage.averageUnits} value={orDash(season.averageMonthlyKwh, formatUnits)} />
        <StatRow label={t.insightsPage.averageSpend} value={orDash(season.averageMonthlyExpenseBdt, formatBDT)} />
      </SectionCard>
      <ConsumptionChart monthlyData={data.monthlyUsage} isSampleData={data.dataSource === "sample_demo"} />
      <RechargeTrendChart records={data.rechargeHistory} />
    </>
  )
}
