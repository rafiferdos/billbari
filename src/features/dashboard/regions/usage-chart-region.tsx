import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useLanguage } from "@/features/i18n/language-context"
import { useAppTheme } from "@/features/theme/app-theme-context"
import { monthIndex, monthName, sortMonthlyDesc } from "@/lib/nesco-dates"
import { EmptyRegion } from "../region-parts"
import type { DashboardData } from "../types"

export function UsageChartRegion({ data }: DashboardData) {
  const { t, isBangla } = useLanguage()
  const months = sortMonthlyDesc(data.monthlyUsage)
    .filter((m) => monthIndex(m.month) !== null)
    .slice(0, 12)
    .reverse()
    .map((m) => ({ month: monthName(monthIndex(m.month)!, isBangla, "short"), usageKwh: m.usageKwh }))

  if (!months.length) return <EmptyRegion title={t.dashboard.usageChart} message={t.dashboard.noMonths} />

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.dashboard.usageChart}</CardTitle>
      </CardHeader>
      <CardContent>
        <Chart months={months} />
      </CardContent>
    </Card>
  )
}

// separate so the theme is only needed when there is something to draw
function Chart({ months }: { months: { month: string; usageKwh: number }[] }) {
  const { t } = useLanguage()
  const { barRadius, gridDash } = useAppTheme().theme.chart
  const config = { usageKwh: { label: t.dashboard.units, color: "var(--chart-1)" } } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-48 w-full sm:h-56">
      <BarChart accessibilityLayer data={months}>
        <CartesianGrid vertical={false} strokeDasharray={gridDash} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="usageKwh" fill="var(--chart-1)" radius={[barRadius, barRadius, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
