import * as React from "react"
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/features/i18n/language-context"
import { useAppTheme } from "@/features/theme/app-theme-context"
import { monthIndex, monthName, sortMonthlyDesc } from "@/lib/nesco-dates"
import type { MonthlyConsumptionRecord } from "../nesco/types"

const METRICS = ["both", "usage", "recharge"] as const

export function ConsumptionChart({
  monthlyData,
  isSampleData,
}: {
  monthlyData: MonthlyConsumptionRecord[]
  isSampleData?: boolean
}) {
  const [metric, setMetric] = React.useState<(typeof METRICS)[number]>("both")
  const { t, isBangla, formatBDT, formatNumber } = useLanguage()
  const { barRadius, strokeWidth, curve, gridDash } = useAppTheme().theme.chart

  const config = {
    usageKwh: { label: t.charts.usage, color: "var(--chart-1)" },
    rechargeBdt: { label: t.charts.recharge, color: "var(--chart-2)" },
  } satisfies ChartConfig

  // oldest on the left
  const data = sortMonthlyDesc(monthlyData)
    .filter((m) => monthIndex(m.month) !== null)
    .reverse()
    .map((m) => ({
      label: `${monthName(monthIndex(m.month)!, isBangla, "short")} ’${formatNumber(String(m.year).slice(-2))}`,
      usageKwh: m.usageKwh,
      rechargeBdt: m.rechargeBdt,
    }))

  if (!data.length) {
    return (
      <Card>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyTitle className="text-sm">{t.dashboard.noMonths}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{t.charts.consumptionTitle}</CardTitle>
            {isSampleData && <Badge variant="secondary">{t.charts.sample}</Badge>}
          </div>
          <CardDescription>{t.charts.consumptionSubtitle}</CardDescription>
        </div>
        <Tabs value={metric} onValueChange={(value) => setMetric(value as typeof metric)}>
          <TabsList aria-label={t.charts.metric}>
            {METRICS.map((m) => (
              <TabsTrigger key={m} value={m} className="text-xs">
                {t.charts[m]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <ComposedChart accessibilityLayer data={data} margin={{ top: 12, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray={gridDash} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={6} tickFormatter={(v) => formatNumber(v)} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full justify-between gap-3">
                      <span className="text-muted-foreground">{config[name as keyof typeof config].label}</span>
                      <span className="num font-semibold">
                        {name === "rechargeBdt" ? formatBDT(Number(value)) : formatNumber(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {metric !== "recharge" && (
              <Bar dataKey="usageKwh" fill="var(--chart-1)" radius={[barRadius, barRadius, 0, 0]} maxBarSize={38} />
            )}
            {metric !== "usage" && (
              <Line dataKey="rechargeBdt" type={curve} stroke="var(--chart-2)" strokeWidth={strokeWidth} dot={false} />
            )}
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
