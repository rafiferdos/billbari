import * as React from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { AlertTriangle, CheckCircle2, Info, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { AdvancedStats } from "@/features/analytics/advanced-stats"
import { ConsumptionChart } from "@/features/analytics/consumption-chart"
import { generateAnalytics, type ConsumptionInsight } from "@/features/analytics/insights-generator"
import { RechargeTrendChart } from "@/features/analytics/recharge-trend-chart"
import { SlabProgressCard } from "@/features/analytics/slab-progress-card"
import { useLanguage } from "@/features/i18n/language-context"
import { useMeter } from "@/features/meter/meter-context"
import type { NescoFetchResult } from "@/features/nesco/types"
import { ProGate } from "@/features/payments/pro-gate"

export const Route = createFileRoute("/insights")({
  component: InsightsPage,
})

const ICONS = {
  warning: <AlertTriangle aria-hidden className="size-4 shrink-0 text-warning" />,
  success: <CheckCircle2 aria-hidden className="size-4 shrink-0 text-success" />,
  info: <Info aria-hidden className="size-4 shrink-0 text-primary" />,
  tip: <Sparkles aria-hidden className="size-4 shrink-0 text-success" />,
} satisfies Record<ConsumptionInsight["type"], React.ReactNode>

function InsightsPage() {
  const { t } = useLanguage()
  const { activeMeterData: data } = useMeter()

  return (
    <div className="section-stack">
      <h1 className="text-2xl">{t.nav.insights}</h1>
      {data ? (
        <ProGate feature="personalInsights" variant="section">
          <Insights data={data} />
        </ProGate>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t.insightsPage.noMeter}</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/" className={buttonVariants()}>
              {t.insightsPage.goHome}
            </Link>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}

function Insights({ data }: { data: NescoFetchResult }) {
  const { t, isBangla } = useLanguage()
  const analytics = React.useMemo(() => generateAnalytics(data), [data])

  return (
    <>
      <AdvancedStats analytics={analytics} isAuthenticated isPremium />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg">{t.insightsPage.listTitle}</h2>
        <div className="grid gap-(--bb-grid-gap) sm:grid-cols-2 lg:grid-cols-3">
          {analytics.insights.map((insight) => (
            <Card key={insight.id} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  {ICONS[insight.type]}
                  {isBangla ? insight.title : (insight.titleEnglish ?? insight.title)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  {isBangla ? insight.description : (insight.descriptionEnglish ?? insight.description)}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="num text-xs font-semibold text-primary">
                    {isBangla ? insight.metric : (insight.metricEnglish ?? insight.metric)}
                  </span>
                  {insight.isCalculatedEstimate && <Badge variant="outline">{t.common.estimate}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <ConsumptionChart monthlyData={data.monthlyUsage} isSampleData={data.dataSource === "sample_demo"} />
      <RechargeTrendChart records={data.rechargeHistory} />
      {analytics.hasEnoughData && (
        <SlabProgressCard billBreakdown={analytics.billBreakdown} monthlyUnits={analytics.billBreakdown.units} />
      )}
    </>
  )
}
