import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Sparkles } from "lucide-react"
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { generateAnalytics } from "@/features/analytics/insights-generator"
import { useAuth } from "@/features/auth/auth-context"
import { useLanguage } from "@/features/i18n/language-context"
import { CostEfficiencySection } from "@/features/insights/cost-efficiency-section"
import { EcoSection } from "@/features/insights/eco-section"
import { InsightsListSection } from "@/features/insights/insights-list-section"
import { InsightsLocked } from "@/features/insights/insights-locked"
import { RechargeBehaviourSection } from "@/features/insights/recharge-behaviour-section"
import { RunwaySection } from "@/features/insights/runway-section"
import { SeasonalitySection } from "@/features/insights/seasonality-section"
import { SlabForecastSection } from "@/features/insights/slab-forecast-section"
import { MeterPage } from "@/features/meter/meter-page"
import type { NescoFetchResult } from "@/features/nesco/types"
import { useEntitlement } from "@/features/payments/pro-gate"

export const Route = createFileRoute("/insights")({
  component: InsightsPage,
})

function InsightsPage() {
  const { t } = useLanguage()
  const { isLoading } = useAuth()
  const { allowed } = useEntitlement("personalInsights")

  return (
    <div className="section-stack">
      <h1 className="text-2xl">{t.nav.insights}</h1>
      {allowed ? (
        <MeterPage icon={Sparkles} emptyTitle={t.insightsPage.noMeter}>
          {(data) => <Insights data={data} />}
        </MeterPage>
      ) : isLoading ? (
        // a Pro viewer would otherwise see the lock flash while the account loads
        <Skeleton className="h-64" />
      ) : (
        <InsightsLocked />
      )}
    </div>
  )
}

function Insights({ data }: { data: NescoFetchResult }) {
  const { t } = useLanguage()
  const analytics = React.useMemo(() => generateAnalytics(data), [data])
  const props = { analytics, data }

  return (
    <div className="section-stack">
      {analytics.hasEnoughData ? (
        <>
          <RunwaySection {...props} />
          <SlabForecastSection {...props} />
        </>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle className="text-sm">{t.stats.notEnoughData}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      )}
      <InsightsListSection {...props} />
      <CostEfficiencySection {...props} />
      <RechargeBehaviourSection {...props} />
      <SeasonalitySection {...props} />
      <EcoSection {...props} />
    </div>
  )
}
