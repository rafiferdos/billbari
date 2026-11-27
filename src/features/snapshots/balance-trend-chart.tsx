import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useLanguage } from "@/features/i18n/language-context"
import { useAppTheme } from "@/features/theme/app-theme-context"
import { balanceSeries } from "./snapshot-math"
import type { SnapshotRecord } from "./snapshot-server"

export function BalanceTrendChart({
  snapshots,
  meterNumber,
  sample,
}: {
  snapshots: SnapshotRecord[]
  meterNumber: string
  sample?: boolean
}) {
  const { t, formatBDT, formatNumber, formatDate } = useLanguage()
  const { strokeWidth, curve, gridDash } = useAppTheme().theme.chart
  const data = balanceSeries(snapshots, meterNumber).map((point) => ({
    date: formatDate(point.date).split(" ").slice(0, 2).join(" "),
    balance: point.balance,
  }))

  if (!data.length) return null

  const config = { balance: { label: t.snapshots.tableBalance, color: "var(--chart-1)" } } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.snapshots.chartTitle}</CardTitle>
        {sample && (
          <CardAction>
            <Badge variant="secondary">{t.common.sample}</Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-56 w-full">
          <AreaChart accessibilityLayer data={data} margin={{ top: 12, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray={gridDash} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={6} tickFormatter={(v) => formatNumber(v)} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <div className="flex w-full justify-between gap-3">
                      <span className="text-muted-foreground">{config.balance.label}</span>
                      <span className="num font-semibold">{formatBDT(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <Area
              dataKey="balance"
              type={curve}
              stroke="var(--chart-1)"
              strokeWidth={strokeWidth}
              fill="var(--chart-1)"
              fillOpacity={0.2}
              dot={data.length === 1}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
