import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MonthlyConsumptionRecord } from "../nesco/types"
import { formatMonthBangla, toBanglaNumber, formatBDT } from "@/lib/bangla"

interface ConsumptionChartProps {
  monthlyData: MonthlyConsumptionRecord[]
  isSampleData?: boolean
}

const chartConfig = {
  usageKwh: {
    label: "বিদ্যুৎ ব্যবহার (kWh)",
    color: "var(--color-primary)",
  },
  rechargeBdt: {
    label: "রিচার্জ টাকা (৳)",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig

export function ConsumptionChart({ monthlyData, isSampleData }: ConsumptionChartProps) {
  const [metric, setMetric] = React.useState<"both" | "usage" | "recharge">("both")

  // Reverse so oldest is on the left, newest is on the right
  const formattedData = React.useMemo(() => {
    return [...monthlyData].reverse().map((item) => ({
      month: formatMonthBangla(item.month),
      year: item.year,
      label: `${formatMonthBangla(item.month)} '${String(item.year).slice(-2)}`,
      usageKwh: item.usageKwh,
      rechargeBdt: item.rechargeBdt,
      discountBdt: Math.abs(item.discountBdt),
    }))
  }, [monthlyData])

  if (!formattedData.length) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          কোনো মাসিক ব্যবহারের ডেটা পাওয়া যায়নি।
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border shadow-xs overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base sm:text-lg font-bold">
              মাসিক ব্যবহার ও রিচার্জ ট্রেন্ড
            </CardTitle>
            <Badge variant={isSampleData ? "secondary" : "outline"} className="text-[11px] font-normal">
              {isSampleData ? "রেফারেন্স ডেটা" : "নেসকো অফিশিয়াল"}
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            প্রতি মাসের মোট বিদ্যুৎ খরচ (kWh) ও রিচার্জ অর্থের ধারাবাহিক তুলনা
          </CardDescription>
        </div>

        <Tabs value={metric} onValueChange={(val) => { if (val) setMetric(val as typeof metric) }}>
          <TabsList className="h-8">
            <TabsTrigger value="both" className="text-xs px-2.5">উভয়</TabsTrigger>
            <TabsTrigger value="usage" className="text-xs px-2.5">kWh ইউনিট</TabsTrigger>
            <TabsTrigger value="recharge" className="text-xs px-2.5">টাকা (৳)</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="pt-4 pb-2 px-2 sm:px-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <BarChart data={formattedData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.6} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => v}
              className="text-[11px] font-medium"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tickFormatter={(v) => toBanglaNumber(v)}
              className="text-[11px] text-muted-foreground"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (name === "usageKwh") {
                      return (
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>ব্যবহার:</span>
                          <span className="font-bold text-foreground">
                            {toBanglaNumber(Array.isArray(value) ? value[0] : value)} kWh
                          </span>
                        </div>
                      )
                    }
                    if (name === "rechargeBdt") {
                      return (
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>রিচার্জ:</span>
                          <span className="font-bold text-foreground">{formatBDT(Number(value))}</span>
                        </div>
                      )
                    }
                    return <span>{String(value)}</span>
                  }}
                />
              }
            />
            {(metric === "both" || metric === "usage") && (
              <Bar
                dataKey="usageKwh"
                fill="var(--color-primary)"
                radius={[6, 6, 0, 0]}
                maxBarSize={38}
              />
            )}
            {(metric === "both" || metric === "recharge") && (
              <Bar
                dataKey="rechargeBdt"
                fill="var(--color-chart-2)"
                radius={[6, 6, 0, 0]}
                maxBarSize={38}
              />
            )}
          </BarChart>
        </ChartContainer>

        <div className="flex items-center justify-center gap-6 pt-3 pb-1 text-xs text-muted-foreground border-t border-border mt-3">
          {(metric === "both" || metric === "usage") && (
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-primary" />
              <span>বিদ্যুৎ ইউনিট (kWh)</span>
            </div>
          )}
          {(metric === "both" || metric === "recharge") && (
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-chart-2" />
              <span>রিচার্জ অর্থ (BDT ৳)</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
