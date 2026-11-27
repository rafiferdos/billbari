import * as React from "react"
import { AlertTriangle, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Label } from "@/components/ui/label"
import { NumberField } from "@/components/ui/number-field"
import { estimateDailyKwh } from "@/features/analytics/daily-rate"
import { EstimateBadge, StatRow } from "@/features/dashboard/region-parts"
import { EKPAY_RECHARGE_URL } from "@/features/help/nesco-links"
import { useLanguage } from "@/features/i18n/language-context"
import { useMeter } from "@/features/meter/meter-context"
import { MeterSearch } from "@/features/meter/meter-search"
import { toNum } from "@/features/nesco/parse-utils"
import type { NescoFetchResult } from "@/features/nesco/types"
import { ProGate } from "@/features/payments/pro-gate"
import { isSameCalendarMonth, sortMonthlyDesc } from "@/lib/nesco-dates"
import { planRecharge } from "./recharge-planner"

export function RechargePlannerCard() {
  return (
    <ProGate feature="rechargePlanner" variant="card">
      <Planner />
    </ProGate>
  )
}

function Planner() {
  const { t } = useLanguage()
  const { activeMeterData: data } = useMeter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.planner.title}</CardTitle>
        <CardDescription>{t.planner.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {data ? (
          <Plan data={data} />
        ) : (
          <Empty className="p-4">
            <EmptyHeader>
              <EmptyTitle className="text-sm">{t.planner.noMeter}</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <MeterSearch variant="compact" />
            </EmptyContent>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}

function Plan({ data }: { data: NescoFetchResult }) {
  const { t, formatBDT, formatNumber } = useLanguage()
  const [days, setDays] = React.useState<number | null>(30)
  const id = React.useId()
  const today = new Date()
  const usage = estimateDailyKwh(data.monthlyUsage, today)

  if (!usage) {
    return (
      <Empty className="p-4">
        <EmptyHeader>
          <EmptyTitle className="text-sm">{t.stats.notEnoughData}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  const latest = sortMonthlyDesc(data.monthlyUsage).at(0)
  const targetDays = days ?? 30
  const plan = planRecharge({
    balanceBdt: data.customerInfo.balance,
    dailyKwh: usage.kwhPerDay,
    monthUnitsSoFar: latest && isSameCalendarMonth(latest, today) ? latest.usageKwh : 0,
    today,
    targetDays,
    sanctionedLoadKw: toNum(String(data.customerInfo.approvedLoadKw)) || 2,
  })

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={id}>{t.planner.days}</Label>
          <NumberField id={id} value={days} onValueChange={setDays} min={1} max={90} className="max-w-48" />
        </div>
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {t.planner.recommended}
            <EstimateBadge />
          </p>
          <p aria-live="polite" className="num text-4xl font-bold text-primary">
            {formatBDT(plan.recommendedRechargeBdt, { decimals: 0 })}
          </p>
          {plan.recommendedRechargeBdt === 0 && <p className="text-sm text-success">{t.planner.covered}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <StatRow label={t.planner.needed} value={`${formatNumber(plan.neededKwh)} kWh`} />
        <StatRow label={t.planner.cost} value={formatBDT(plan.estimatedCostBdt, { decimals: 0 })} />
        <StatRow label={t.stats.currentBalance} value={formatBDT(data.customerInfo.balance)} />
        {plan.crossesSlab && (
          <Alert>
            <AlertTriangle className="text-warning" />
            <AlertDescription>{t.planner.slabWarning.replace("{n}", formatNumber(plan.slabAfter))}</AlertDescription>
          </Alert>
        )}
        <a href={EKPAY_RECHARGE_URL} target="_blank" rel="noopener noreferrer" className={buttonVariants()}>
          <ExternalLink />
          {t.dashboard.recharge}
        </a>
      </div>
    </div>
  )
}
