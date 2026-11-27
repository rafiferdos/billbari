import { AlertTriangle } from "lucide-react"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Meter } from "@/components/ui/meter"
import { StatRow } from "@/features/dashboard/region-parts"
import { useLanguage } from "@/features/i18n/language-context"
import { featureText } from "@/features/payments/entitlements"
import { LIFELINE_RATE, NESCO_LTA_SLABS } from "@/lib/tariff-constants"
import { SectionCard, type SectionProps } from "./section-card"

const [, , , TIER_FOUR, TIER_FIVE] = NESCO_LTA_SLABS
const TIER_FIVE_JUMP_PCT = Math.round((TIER_FIVE.ratePerUnit / TIER_FOUR.ratePerUnit - 1) * 100)

export function SlabForecastSection({ analytics }: SectionProps) {
  const { t, isBangla, formatBDT, formatUnits, formatNumber } = useLanguage()
  const { slabStats, estimates, billBreakdown } = analytics
  const units = estimates.projectedMonthlyUnits
  // Up to 50 units the bill uses the lifeline rate, though the slab stats report tier 1.
  const lifeline = billBreakdown.slabBreakdown[0]?.step === 0
  const { minUnits, maxUnits } = lifeline ? { minUnits: 0, maxUnits: 50 } : billBreakdown.activeStep
  const rate = lifeline ? LIFELINE_RATE : slabStats.ratePerUnit
  const nextRate = lifeline ? NESCO_LTA_SLABS[0].ratePerUnit : slabStats.nextSlabRate
  const unitsLeft = maxUnits === null ? null : Math.max(0, maxUnits - units)

  return (
    <SectionCard title={featureText("slabForecast", isBangla).name} estimate>
      <StatRow
        label={t.insightsPage.activeStep}
        value={
          lifeline ? t.tariffs.lifeline : t.tariffs.stepNumber.replace("{n}", formatNumber(slabStats.activeSlabStep))
        }
      />
      <StatRow label={t.insightsPage.stepRate} value={`${formatBDT(rate)}${t.dashboard.perUnit}`} />
      {maxUnits !== null && unitsLeft !== null ? (
        <Meter
          value={units - minUnits}
          max={maxUnits - minUnits}
          label={t.dashboard.unitsLeft.replace("{n}", formatNumber(unitsLeft))}
        />
      ) : (
        <p className="text-sm text-muted-foreground">{t.insightsPage.topStep}</p>
      )}
      {nextRate !== null && (
        <>
          <StatRow label={t.insightsPage.nextRate} value={`${formatBDT(nextRate)}${t.dashboard.perUnit}`} />
          <StatRow label={t.insightsPage.jump} value={`+${formatBDT(nextRate - rate)}`} />
        </>
      )}
      <StatRow label={t.insightsPage.projectedUnits} value={formatUnits(units)} />
      <StatRow label={t.insightsPage.projectedBill} value={formatBDT(estimates.projectedMonthlyCostBdt)} />
      {estimates.activeSlabStep >= TIER_FIVE.step && (
        <Alert className="border-warning text-warning">
          <AlertTriangle aria-hidden />
          <AlertTitle>
            {t.insightsPage.tierFive
              .replace("{rate}", formatBDT(TIER_FIVE.ratePerUnit))
              .replace("{pct}", formatNumber(TIER_FIVE_JUMP_PCT))}
          </AlertTitle>
        </Alert>
      )}
    </SectionCard>
  )
}
