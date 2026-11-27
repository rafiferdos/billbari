import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { computeFreeStats } from "@/features/analytics/free-stats"
import { generateAnalytics } from "@/features/analytics/insights-generator"
import { useLanguage } from "@/features/i18n/language-context"
import { useMeter } from "@/features/meter/meter-context"
import { maskMeter } from "@/features/meter/meter-input"
import { SourceBanner } from "@/features/nesco/source-badge"
import type { NescoFetchResult } from "@/features/nesco/types"
import { DashboardLayout } from "./dashboard-layout"
import { REGIONS } from "./regions"
import { BalanceRegion } from "./regions/balance-region"
import { CustomerInfoRegion } from "./regions/customer-info-region"
import { LastRechargeRegion } from "./regions/last-recharge-region"
import { ProInsightsRegion } from "./regions/pro-insights-region"
import { QuickActionsRegion } from "./regions/quick-actions-region"
import { RecentRechargesRegion } from "./regions/recent-recharges-region"
import { RunwayRegion } from "./regions/runway-region"
import { ThisMonthRegion } from "./regions/this-month-region"
import { UsageChartRegion } from "./regions/usage-chart-region"

export function DashboardSkeleton() {
  return (
    <DashboardLayout
      regions={Object.fromEntries(
        // min-h, not h: the layout stretches its children to full height
        REGIONS.map((r) => [r.id, <Skeleton className={r.id === "usageChart" ? "min-h-56" : "min-h-40"} />])
      )}
    />
  )
}

export function Dashboard({ data }: { data: NescoFetchResult }) {
  const { formatNumber } = useLanguage()
  const { fetchMeter } = useMeter()
  const stats = React.useMemo(() => computeFreeStats(data), [data])
  const analytics = React.useMemo(() => generateAnalytics(data), [data])
  const props = { data, stats, analytics }
  const { name, meterNumber, arrearNotice } = data.customerInfo

  return (
    <>
      <h1 className="flex flex-wrap items-baseline gap-x-2 text-lg">
        <span className="min-w-0 break-words">{name}</span>
        <span className="num text-sm text-muted-foreground">{formatNumber(maskMeter(meterNumber))}</span>
      </h1>

      <SourceBanner data={data} onRefresh={() => void fetchMeter(undefined, { force: true })} />

      {arrearNotice && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertDescription>{arrearNotice}</AlertDescription>
        </Alert>
      )}

      <DashboardLayout
        regions={{
          balance: <BalanceRegion {...props} />,
          lastRecharge: <LastRechargeRegion {...props} />,
          runway: <RunwayRegion {...props} />,
          thisMonth: <ThisMonthRegion {...props} />,
          quickActions: <QuickActionsRegion {...props} />,
          usageChart: <UsageChartRegion {...props} />,
          recentRecharges: <RecentRechargesRegion {...props} />,
          customerInfo: <CustomerInfoRegion {...props} />,
          proInsights: <ProInsightsRegion {...props} />,
        }}
      />
    </>
  )
}
