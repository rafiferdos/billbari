import { StatRow } from "@/features/dashboard/region-parts"
import { useLanguage } from "@/features/i18n/language-context"
import { orDash, SectionCard, type SectionProps } from "./section-card"

export function EcoSection({ analytics }: SectionProps) {
  const { t, formatNumber } = useLanguage()
  const { carbonKg, treesNeeded } = analytics.eco

  return (
    <SectionCard title={t.insightsPage.eco} estimate>
      <StatRow label={t.insightsPage.carbon} value={orDash(carbonKg, formatNumber)} />
      <StatRow label={t.insightsPage.trees} value={orDash(treesNeeded, formatNumber)} />
    </SectionCard>
  )
}
