import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import type { RechargeRecord } from "../nesco/types"
import { formatBDT, toBanglaNumber, formatDateBangla } from "@/lib/bangla"

interface RechargeTrendChartProps {
  records: RechargeRecord[]
}

const chartConfig = {
  amountBdt: {
    label: "রিচার্জ অর্থ (৳)",
    color: "var(--color-chart-1)",
  },
  powerKwh: {
    label: "বিদ্যুৎ ইউনিট (kWh)",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig

export function RechargeTrendChart({ records }: RechargeTrendChartProps) {
  const chartData = React.useMemo(() => {
    return [...records]
      .reverse()
      .slice(-8)
      .map((item, idx) => ({
        index: idx + 1,
        date: formatDateBangla(item.date).split(" ").slice(0, 2).join(" "),
        amountBdt: item.amountBdt,
        powerKwh: item.powerKwh,
        via: item.via,
      }))
  }, [records])

  if (!records.length) {
    return null
  }

  return (
    <Card className="rounded-2xl border shadow-xs overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base sm:text-lg font-bold">রিচার্জের ট্রেন্ড ও হিসাব</CardTitle>
            <Badge variant="outline" className="text-[11px] font-normal">
              সর্বশেষ {toBanglaNumber(records.length)}টি লেনদেন
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            প্রতিটি রিচার্জে ক্রয়কৃত বিদ্যুৎ ইউনিট ও অর্থ ব্যয়ের ট্রেন্ড
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-3 pb-2 px-2 sm:px-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRecharge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.6} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} className="text-[11px]" />
            <YAxis tickLine={false} axisLine={false} tickMargin={4} tickFormatter={(v) => toBanglaNumber(v)} className="text-[11px]" />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (name === "amountBdt") {
                      return (
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>রিচার্জ পরিমাণ:</span>
                          <span className="font-bold text-foreground">{formatBDT(Number(value))}</span>
                        </div>
                      )
                    }
                    if (name === "powerKwh") {
                      return (
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>ইউনিট পাওয়া গেছে:</span>
                          <span className="font-bold text-foreground">
                            {toBanglaNumber(Array.isArray(value) ? value[0] : value)} kWh
                          </span>
                        </div>
                      )
                    }
                    return <span>{String(value)}</span>
                  }}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="amountBdt"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill="url(#fillRecharge)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
