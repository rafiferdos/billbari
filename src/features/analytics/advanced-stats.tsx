import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { EnergyAnalytics } from "./insights-generator"
import { useLanguage } from "@/features/i18n/language-context"
import {
  CreditCard,
  Coins,
  TrendingUp,
  Leaf,
  CalendarClock,
  Sparkles,
  Flame,
  Snowflake,
  Layers,
  Crown,
} from "lucide-react"

interface AdvancedStatsProps {
  analytics: EnergyAnalytics
  isAuthenticated: boolean
  isPremium?: boolean
  onLoginClick?: () => void
  onUpgradeClick?: () => void
}

export function AdvancedStats({
  analytics,
  isAuthenticated,
  isPremium = false,
  onLoginClick,
  onUpgradeClick,
}: AdvancedStatsProps) {
  const { isBangla, formatBDT, formatNumber, formatDateWithDay } = useLanguage()
  const { rechargeStats, costEfficiency, seasonality, runway, eco, slabStats } = analytics
  const isUnlocked = isAuthenticated && isPremium

  const totalDeductions = Math.max(0, rechargeStats.totalAmountBdt - rechargeStats.totalNetEnergyBdt)
  const depletionDateObj = new Date(Date.now() + runway.estimatedDaysRemaining * 86400000)
  const formattedDepletionDate = formatDateWithDay(depletionDateObj)
  const hoursRemaining = Math.round(runway.estimatedDaysRemaining * 24)

  const highestMonthLabel = seasonality.highestMonth
    ? isBangla
      ? seasonality.highestMonth.labelBangla
      : `${seasonality.highestMonth.month} ${seasonality.highestMonth.year}`
    : "-"
  const lowestMonthLabel = seasonality.lowestMonth
    ? isBangla
      ? seasonality.lowestMonth.labelBangla
      : `${seasonality.lowestMonth.month} ${seasonality.lowestMonth.year}`
    : "-"

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {isBangla ? "বাস্তব বিশ্লেষণ ও গুরুত্বপূর্ণ পরিসংখ্যান" : "Consumption Telemetry & Intelligence"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isBangla
                ? "নেসকো পোর্টালের রেকর্ড ও বিদ্যুৎ ব্যবহারের ওপর ভিত্তি করে নির্ভুল হিসাব"
                : "Precise metrics modeled from official NESCO consumption telemetry"}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs self-start sm:self-auto font-medium">
          {isBangla ? "স্বয়ংক্রিয় হিসাব" : "Automated Insights"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Recharge Intelligence */}
        <Card className="rounded-2xl border shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/70 bg-muted/30 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                {isBangla ? "রিচার্জ আচরণ ও অভ্যাসের পরিসংখ্যান" : "Recharge Trajectory & Patterns"}
              </h4>
            </div>
            <Badge variant="secondary" className="text-[10px] font-semibold">
              {formatNumber(rechargeStats.totalCount)} {isBangla ? "টি রিচার্জ" : "recharges"}
            </Badge>
          </div>
          <CardContent className="p-4 sm:p-5 space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border/60">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">
                  {isBangla ? "মোট রিচার্জের পরিমাণ" : "Lifetime Recharge Sum"}
                </span>
                <span className="text-base sm:text-lg font-extrabold text-foreground font-mono">
                  {formatBDT(rechargeStats.totalAmountBdt)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {isBangla
                    ? `গড় টিকেট: ${formatBDT(rechargeStats.averageAmountBdt)}`
                    : `Avg ticket: ${formatBDT(rechargeStats.averageAmountBdt)}`}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">
                  {isBangla ? "বিদ্যুৎ বাবদ প্রকৃত জমা" : "Net Energy Credited"}
                </span>
                <span className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatBDT(rechargeStats.totalNetEnergyBdt)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {isBangla
                    ? `কাটতি বাদ গেছে: ${formatBDT(totalDeductions)}`
                    : `Deductions: ${formatBDT(totalDeductions)}`}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                <span>{isBangla ? "সর্বোচ্চ একক রিচার্জ:" : "Largest Single Recharge:"}</span>
                <span className="font-semibold text-foreground">{formatBDT(rechargeStats.maxAmountBdt)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                <span>{isBangla ? "সর্বনিম্ন রিচার্জ:" : "Minimum Single Recharge:"}</span>
                <span className="font-semibold text-foreground">{formatBDT(rechargeStats.minAmountBdt)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                <span>{isBangla ? "রিচার্জের প্রধান মাধ্যম:" : "Primary Recharge Channel:"}</span>
                <span className="font-semibold text-foreground">{rechargeStats.favoriteVia}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: True Cost Efficiency */}
        <Card className="rounded-2xl border shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/70 bg-muted/30 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Coins className="size-4 text-chart-2" />
              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                {isBangla ? "প্রকৃত খরচ দক্ষতা ও সরকারি সুবিধা" : "Cost Efficiency & Incentives"}
              </h4>
            </div>
            <Badge variant="outline" className="text-[10px] font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              {isBangla ? "১% রিবেট সংযুক্ত" : "1% Rebate Active"}
            </Badge>
          </div>
          <CardContent className="p-4 sm:p-5 space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border/60">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">
                  {isBangla ? "কার্যকর ইউনিট দর" : "Effective Unit Rate"}
                </span>
                <span className="text-base sm:text-lg font-extrabold text-foreground font-mono">
                  {formatBDT(costEfficiency.effectiveCostPerKwh)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {isBangla ? "ভ্যাট ও রেন্ট সমন্বিত প্রতি ইউনিট" : "All-inclusive per kWh"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">
                  {isBangla ? "সরকারি ১% রিবেট আয়" : "Government 1% Rebate"}
                </span>
                <span className="text-base sm:text-lg font-extrabold text-primary font-mono">
                  +{formatBDT(costEfficiency.totalGovernmentRebateBdt)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {isBangla ? "রিচার্জে সরকারি ক্যাশব্যাক" : "Official incentive savings"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                <span>{isBangla ? "মাসিক ফিক্সড ওভারহেড:" : "Monthly Fixed Overhead:"}</span>
                <span className="font-semibold text-foreground">
                  {formatBDT(costEfficiency.fixedOverheadPerMonthBdt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                <span>{isBangla ? "নেট বিদ্যুৎ শক্তি দর:" : "Pure Energy Cost:"}</span>
                <span className="font-semibold text-foreground">
                  {formatBDT(costEfficiency.netCostWithoutOverheadPerKwh)}/kWh
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Seasonality & Depletion Forecasting.
            Phase 3: when locked, this renders a clear locked Card only.
            The old design rendered the real depletion date, runway, and
            seasonal numbers underneath a blurred overlay. */}
        {!isUnlocked ? (
          <Card className="rounded-2xl border border-amber-500/30 shadow-xs overflow-hidden">
            <CardContent className="p-4 sm:p-5 space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" />
                <h4 className="font-bold text-xs sm:text-sm text-foreground">
                  {isBangla ? "ব্যালেন্স শেষ হওয়ার পূর্বাভাস ও ঋতুভিত্তিক প্রভাব" : "Runway Forecasting & Seasonality"}
                </h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isBangla
                  ? "ব্যালেন্স শেষ হওয়ার পূর্বাভাস ও ঋতুভিত্তিক ব্যবহারের গভীর বিশ্লেষণ দেখতে লগইন ও মিটার প্লাস প্রয়োজন।"
                  : "Runway forecasting and seasonal consumption analysis need sign-in and Meter Plus."}
              </p>
              {!isAuthenticated && onLoginClick ? (
                <Button size="sm" onClick={onLoginClick} className="w-full">
                  {isBangla ? "লগইন করুন" : "Sign In"}
                </Button>
              ) : onUpgradeClick ? (
                <Button size="sm" onClick={onUpgradeClick} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                  <Crown className="size-3.5 fill-current" />
                  <span>{isBangla ? "আনলক করুন (৳২০)" : "Unlock (৳20)"}</span>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
        <Card className="rounded-2xl border shadow-xs overflow-hidden relative">
          <div className="px-5 py-3.5 border-b border-border/70 bg-muted/30 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-primary" />
              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                {isBangla ? "ব্যালেন্স শেষ হওয়ার পূর্বাভাস ও ঋতুভিত্তিক প্রভাব" : "Runway Forecasting & Seasonality"}
              </h4>
            </div>
            <Badge variant="outline" className="text-[10px] font-semibold">
              {isBangla ? "স্মার্ট ফোরকাস্ট" : "Predictive Model"}
            </Badge>
          </div>

          <CardContent className="p-4 sm:p-5 space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {isBangla ? "ব্যালেন্স শেষ হওয়ার সম্ভাব্য তারিখ:" : "Projected Exhaustion Date:"}
                </span>
                <span className="font-extrabold text-foreground font-mono">
                  {formattedDepletionDate}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-muted-foreground">{isBangla ? "অবশিষ্ট সময়সীমা:" : "Estimated Runway:"}</span>
                <span className="font-bold text-primary font-mono">
                  ~{formatNumber(runway.estimatedDaysRemaining)} {isBangla ? "দিন" : "days"} ({formatNumber(hoursRemaining)} {isBangla ? "ঘণ্টা" : "hrs"})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                  <Flame className="size-3.5" />
                  <span>{isBangla ? "গ্রীষ্মকালীন শীর্ষ" : "Summer Peak"}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {highestMonthLabel} ({formatNumber(seasonality.highestMonth?.usageKwh ?? 0)} kWh)
                </div>
              </div>
              <div className="p-2.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
                <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold text-[11px]">
                  <Snowflake className="size-3.5" />
                  <span>{isBangla ? "শীতকালীন সর্বনিম্ন" : "Winter Low"}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {lowestMonthLabel} ({formatNumber(seasonality.lowestMonth?.usageKwh ?? 0)} kWh)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Card 4: Slab Dynamics & Eco Footprint */}
        <Card className="rounded-2xl border shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/70 bg-muted/30 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                {isBangla ? "ট্যারিফ স্ল্যাব অপ্টিমাইজেশন ও পরিবেশগত প্রভাব" : "Slab Dynamics & Eco Footprint"}
              </h4>
            </div>
            <Badge variant="outline" className="text-[10px] font-semibold">
              {isBangla ? "গ্রিন অ্যানালিটিক্স" : "Eco Telemetry"}
            </Badge>
          </div>
          <CardContent className="p-4 sm:p-5 space-y-3.5 text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="size-3.5 text-primary" />
                  <span>{isBangla ? "বর্তমান ট্যারিফ ধাপ:" : "Active Tariff Tier:"}</span>
                </span>
                <span className="font-semibold text-foreground">
                  {isBangla ? `ধাপ ${formatNumber(slabStats.activeSlabStep)}` : `Tier ${formatNumber(slabStats.activeSlabStep)}`} ({formatBDT(slabStats.ratePerUnit)}/kWh)
                </span>
              </div>

              {slabStats.unitsRemainingInSlab !== null && slabStats.nextSlabRate && (
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/50 border border-border/50">
                  <span className="text-[11px] text-muted-foreground">
                    {isBangla ? "পরবর্তী ধাপে যেতে বাকি:" : "Units to Next Tier:"}
                  </span>
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <span>{formatNumber(slabStats.unitsRemainingInSlab)} {isBangla ? "ইউনিট" : "kWh"}</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                      (+{formatBDT(slabStats.slabJumpCostDelta)})
                    </span>
                  </span>
                </div>
              )}

              {/* Eco footprint */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Leaf className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isBangla ? "পরিবেশগত প্রভাব (CO₂):" : "Carbon Footprint (CO₂):"}</span>
                </span>
                <span className="font-semibold text-foreground">
                  ~{formatNumber(eco.carbonKg)} {isBangla ? "কেজি কার্বন নির্গমন" : "kg CO₂ emitted"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span>{isBangla ? "কার্বন সমতায় বছরে প্রয়োজনীয় গাছ:" : "Trees required to offset:"}</span>
                <Badge variant="outline" className="text-[11px] font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  ~{formatNumber(eco.treesNeeded)} {isBangla ? "টি গাছ" : "trees"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
