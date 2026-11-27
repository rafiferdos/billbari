import { computeDeductionTotals } from "@/features/analytics/free-stats"
import { StatRow } from "@/features/dashboard/region-parts"
import { useLanguage } from "@/features/i18n/language-context"
import { featureText } from "@/features/payments/entitlements"
import { orDash, SectionCard, type SectionProps } from "./section-card"

export function CostEfficiencySection({ analytics, data }: SectionProps) {
  const { t, isBangla, formatBDT } = useLanguage()
  const cost = analytics.costEfficiency
  const { gross, net } = computeDeductionTotals(data.rechargeHistory)

  return (
    <SectionCard title={featureText("costEfficiency", isBangla).name} estimate>
      <StatRow label={t.insightsPage.effectiveRate} value={orDash(cost.effectiveCostPerKwh, formatBDT)} />
      <StatRow label={t.insightsPage.energyRate} value={orDash(cost.netCostWithoutOverheadPerKwh, formatBDT)} />
      <StatRow label={t.insightsPage.fixedOverhead} value={formatBDT(cost.fixedOverheadPerMonthBdt)} />
      <StatRow label={t.insightsPage.deductions} value={orDash(gross - net, formatBDT)} />
      <StatRow label={t.insightsPage.rebate} value={orDash(cost.totalGovernmentRebateBdt, formatBDT)} />
    </SectionCard>
  )
}
