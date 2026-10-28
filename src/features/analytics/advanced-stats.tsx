import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { EnergyAnalytics } from "./insights-generator"
import { formatBDT, toBanglaNumber } from "@/lib/bangla"
import {
  CreditCard,
  Coins,
  TrendingUp,
  Leaf,
  CalendarClock,
  Sparkles,
  Lock,
  Flame,
  Snowflake,
  Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AdvancedStatsProps {
  analytics: EnergyAnalytics
  isAuthenticated: boolean
  onLoginClick?: () => void
}

export function AdvancedStats({
  analytics,
  isAuthenticated,
  onLoginClick,
}: AdvancedStatsProps) {
  const { rechargeStats, costEfficiency, seasonality, runway, eco, slabStats } = analytics

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              বাস্তব বিশ্লেষণ ও গুরুত্বপূর্ণ পরিসংখ্যান
            </h3>
            <p className="text-xs text-muted-foreground">
              নেসকো পোর্টালের রেকর্ড ও বিদ্যুৎ ব্যবহারের ওপর ভিত্তি করে নির্ভুল হিসাব
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs self-start sm:self-auto font-medium">
          স্বয়ংক্রিয় হিসাব
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Recharge Intelligence */}
        <Card className="rounded-2xl border shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/70 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                রিচার্জ আচরণ ও অভ্যাসের পরিসংখ্যান
              </h4>
            </div>
            <Badge variant="secondary" className="text-[10px] font-semibold">
              {toBanglaNumber(rechargeStats.totalCount)}টি রিচার্জ
            </Badge>
          </div>
          <CardContent className="p-5 space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border/60">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">মোট রিচার্জের পরিমাণ</span>
                <span className="text-base sm:text-lg font-extrabold text-foreground font-mono">
                  {formatBDT(rechargeStats.totalAmountBdt)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  মোট {toBanglaNumber(rechargeStats.totalKwh)} kWh ক্রয়
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">গড় রিচার্জের আকার</span>
                <span className="text-base sm:text-lg font-extrabold text-primary font-mono">
                  {formatBDT(rechargeStats.averageAmountBdt)}
                </span>
                <span className="text-[10px] text-muted-foreground block">প্রতি লেনদেনে গড়</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">পছন্দের রিচার্জ মাধ্যম:</span>
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[11px] font-semibold">
                    {rechargeStats.favoriteVia}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    ({toBanglaNumber(rechargeStats.favoriteViaPct)}% লেনদেন)
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">এককালীন সর্বনিম্ন ও সর্বোচ্চ:</span>
                <span className="font-semibold text-foreground font-mono">
                  {formatBDT(rechargeStats.minAmountBdt)} — {formatBDT(rechargeStats.maxAmountBdt)}
                </span>
              </div>

              {/* Day-based metric: Interval between recharges */}
              <div className="relative pt-1">
                {!isAuthenticated && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-xs rounded-lg flex items-center justify-between px-3 z-10 border border-primary/20">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Lock className="size-3 text-primary" />
                      দিনভিত্তিক রিচার্জ ব্যবধান
                    </span>
                    <button
                      type="button"
                      onClick={onLoginClick}
                      className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      লগইন করে দেখুন
                    </button>
                  </div>
                )}
                <div
                  className={cn(
                    "flex items-center justify-between",
                    !isAuthenticated && "filter blur-xs opacity-40 select-none"
                  )}
                >
                  <span className="text-muted-foreground">রিচার্জের গড় ব্যবধান:</span>
                  <span className="font-semibold text-foreground">
                    {rechargeStats.averageDaysBetweenRecharges
                      ? `প্রতি ~${toBanglaNumber(rechargeStats.averageDaysBetweenRecharges)} দিন পর পর`
                      : "যথেষ্ট রেকর্ড নেই"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: True Cost & Financial Efficiency */}
        <Card className="rounded-2xl border shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/70 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="size-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                প্রকৃত বিদ্যুৎ ব্যয় ও আর্থিক সাশ্রয়
              </h4>
            </div>
            <Badge variant="secondary" className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              ১% রিবেট অন্তর্ভুক্ত
            </Badge>
          </div>
          <CardContent className="p-5 space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border/60">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">প্রকৃত গড় ইউনিট দর</span>
                <span className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatBDT(costEfficiency.effectiveCostPerKwh)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  ভ্যাট ও ডিমান্ড চার্জসহ / kWh
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">মোট সরকারি রিবেট সঞ্চয়</span>
                <span className="text-base sm:text-lg font-extrabold text-foreground font-mono">
                  {formatBDT(costEfficiency.totalGovernmentRebateBdt)}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
                  ১% প্রিপেইড ক্যাশব্যাক
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">বর্তমান ব্যালেন্সে মিলবে:</span>
                <span className="font-semibold text-foreground">
                  ~{toBanglaNumber(costEfficiency.estimatedUnitsRemaining)} kWh ইউনিট বিদ্যুৎ
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">মাসিক স্থায়ী ফিক্সড চার্জ:</span>
                <span className="font-semibold text-foreground font-mono">
                  {formatBDT(costEfficiency.fixedOverheadPerMonthBdt)} / মাস
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">শুধুমাত্র বিদ্যুতের নিট রেট:</span>
                <span className="font-semibold text-foreground font-mono">
                  {formatBDT(costEfficiency.netCostWithoutOverheadPerKwh)} / kWh
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Seasonality & Peak/Off-Peak Extremes */}
        <Card className="rounded-2xl border shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/70 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-amber-500" />
              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                মৌসুমী ও সর্বোচ্চ/সর্বনিম্ন খরচের প্যাটার্ন
              </h4>
            </div>
            <Badge variant="secondary" className="text-[10px] font-semibold">
              বার্ষিক বিশ্লেষণ
            </Badge>
          </div>
          <CardContent className="p-5 space-y-3.5 text-xs">
            {seasonality.highestMonth && seasonality.lowestMonth ? (
              <>
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border/60">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <Flame className="size-3" />
                      <span>সর্বোচ্চ খরচের মাস (পিক)</span>
                    </div>
                    <div className="font-bold text-foreground text-xs">
                      {seasonality.highestMonth.labelBangla}
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground">
                      {toBanglaNumber(seasonality.highestMonth.usageKwh)} kWh ({formatBDT(seasonality.highestMonth.rechargeBdt)})
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      <Snowflake className="size-3" />
                      <span>সর্বনিম্ন খরচের মাস (অফ-পিক)</span>
                    </div>
                    <div className="font-bold text-foreground text-xs">
                      {seasonality.lowestMonth.labelBangla}
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground">
                      {toBanglaNumber(seasonality.lowestMonth.usageKwh)} kWh ({formatBDT(seasonality.lowestMonth.rechargeBdt)})
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">মৌসুমী খরচের তারতম্য:</span>
                    <span className="font-bold text-foreground">
                      {toBanglaNumber(seasonality.seasonalityGapPct)}% পরিবর্তন (শীত বনাম গরম)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">প্রতি মাসের গড় ব্যবহার:</span>
                    <span className="font-semibold text-foreground">
                      ~{toBanglaNumber(seasonality.averageMonthlyKwh)} kWh ({formatBDT(seasonality.averageMonthlyExpenseBdt)})
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground py-4 text-center">
                মৌসুমী তথ্য পর্যালোচনার জন্য পর্যাপ্ত মাসিক রেকর্ড পাওয়া যায়নি।
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Runway, Slab Warnings & Eco Footprint */}
        <Card className="rounded-2xl border shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/70 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-primary" />
              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                মেয়াদ, স্ল্যাব সতর্কতা ও পরিবেশ
              </h4>
            </div>
            <Badge
              variant={
                runway.urgencyLevel === "critical"
                  ? "destructive"
                  : runway.urgencyLevel === "warning"
                  ? "secondary"
                  : "outline"
              }
              className="text-[10px] font-semibold"
            >
              {runway.urgencyLevel === "critical"
                ? "জরুরি রিচার্জ"
                : runway.urgencyLevel === "warning"
                ? "সতর্কতা"
                : "পর্যাপ্ত ব্যালেন্স"}
            </Badge>
          </div>
          <CardContent className="p-5 space-y-3.5 text-xs">
            {/* Day-based metric: Depletion date */}
            <div className="relative pb-3 border-b border-border/60">
              {!isAuthenticated && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-xs rounded-xl flex items-center justify-between px-3 z-10 border border-primary/20">
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Lock className="size-3 text-primary" />
                    ব্যালেন্স শেষ হওয়ার সুনির্দিষ্ট দিন দেখতে
                  </span>
                  <button
                    type="button"
                    onClick={onLoginClick}
                    className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    লগইন করুন
                  </button>
                </div>
              )}
              <div
                className={cn(
                  "space-y-1",
                  !isAuthenticated && "filter blur-xs opacity-40 select-none"
                )}
              >
                <span className="text-[11px] text-muted-foreground block">
                  ব্যালেন্স আনুমানিক শেষ হওয়ার তারিখ
                </span>
                <span className="text-sm sm:text-base font-extrabold text-foreground block">
                  {runway.depletionDate}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  বর্তমান খরচে আর প্রায় {toBanglaNumber(runway.estimatedDaysRemaining)} দিন চলবে
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {/* Slab Headroom */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Layers className="size-3.5 text-primary" />
                  <span>বর্তমান ট্যারিফ ধাপ:</span>
                </span>
                <span className="font-semibold text-foreground">
                  ধাপ {toBanglaNumber(slabStats.activeSlabStep)} ({formatBDT(slabStats.ratePerUnit)}/kWh)
                </span>
              </div>

              {slabStats.unitsRemainingInSlab !== null && slabStats.nextSlabRate && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/50 border border-border/50">
                  <span className="text-[11px] text-muted-foreground">পরবর্তী ধাপে যেতে বাকি:</span>
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <span>{toBanglaNumber(slabStats.unitsRemainingInSlab)} ইউনিট</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                      (+৳{toBanglaNumber(slabStats.slabJumpCostDelta)} বৃদ্ধি)
                    </span>
                  </span>
                </div>
              )}

              {/* Eco footprint */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Leaf className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>পরিবেশগত প্রভাব (CO₂):</span>
                </span>
                <span className="font-semibold text-foreground">
                  ~{toBanglaNumber(eco.carbonKg)} কেজি কার্বন নির্গমন
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>কার্বন সমতায় বছরে প্রয়োজনীয় গাছ:</span>
                <Badge variant="outline" className="text-[11px] font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  ~{toBanglaNumber(eco.treesNeeded)}টি গাছ
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
