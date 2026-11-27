import { StatRow } from "@/features/dashboard/region-parts"
import { useLanguage } from "@/features/i18n/language-context"
import { featureText } from "@/features/payments/entitlements"
import { orDash, SectionCard, type SectionProps } from "./section-card"

export function RechargeBehaviourSection({ analytics }: SectionProps) {
  const { t, isBangla, formatBDT, formatNumber } = useLanguage()
  const stats = analytics.rechargeStats
  const channel = isBangla ? stats.favoriteVia : stats.favoriteViaRaw

  return (
    <SectionCard title={featureText("rechargeBehaviour", isBangla).name}>
      {stats.totalCount === 0 ? (
        <p className="text-sm text-muted-foreground">{t.dashboard.noRecharges}</p>
      ) : (
        <>
          <StatRow label={t.insightsPage.count} value={formatNumber(stats.totalCount)} />
          <StatRow label={t.insightsPage.total} value={formatBDT(stats.totalAmountBdt)} />
          <StatRow label={t.insightsPage.average} value={formatBDT(stats.averageAmountBdt)} />
          <StatRow label={t.insightsPage.smallest} value={orDash(stats.minAmountBdt, formatBDT)} />
          <StatRow label={t.insightsPage.largest} value={orDash(stats.maxAmountBdt, formatBDT)} />
          <StatRow label={t.insightsPage.channel} value={`${channel} (${formatNumber(stats.favoriteViaPct)}%)`} />
          <StatRow label={t.insightsPage.gap} value={orDash(stats.averageDaysBetweenRecharges, formatNumber)} />
          <StatRow
            label={t.insightsPage.sinceLast}
            value={stats.daysSinceLastRecharge === null ? "—" : formatNumber(stats.daysSinceLastRecharge)}
          />
        </>
      )}
    </SectionCard>
  )
}
