import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { useLanguage } from "@/features/i18n/language-context"
import { useAppTheme } from "@/features/theme/app-theme-context"
import { sortRechargesDesc } from "@/lib/nesco-dates"
import type { RechargeRecord } from "../nesco/types"

const SHOWN = 8

export function RechargeTrendChart({ records }: { records: RechargeRecord[] }) {
  const { t, formatBDT, formatNumber, formatDate } = useLanguage()
  const { strokeWidth, curve, gridDash } = useAppTheme().theme.chart

  if (!records.length) return null

  const config = { amountBdt: { label: t.charts.recharge, color: "var(--chart-1)" } } satisfies ChartConfig
  // oldest on the left
  const data = sortRechargesDesc(records)
    .slice(0, SHOWN)
    .reverse()
    .map((record) => ({
      date: formatDate(record.date).split(" ").slice(0, 2).join(" "),
      amountBdt: record.amountBdt,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.charts.rechargeTrendTitle}</CardTitle>
        <CardDescription>
          {t.charts.rechargeTrendSubtitle} · {t.charts.rechargeCount.replace("{n}", formatNumber(data.length))}
        </CardDescription>
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
                      <span className="text-muted-foreground">{config.amountBdt.label}</span>
                      <span className="num font-semibold">{formatBDT(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <Area
              dataKey="amountBdt"
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
