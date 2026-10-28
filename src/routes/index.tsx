import * as React from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/features/analytics/stat-card"
import { ConsumptionChart } from "@/features/analytics/consumption-chart"
import { RechargeTrendChart } from "@/features/analytics/recharge-trend-chart"
import { SlabProgressCard } from "@/features/analytics/slab-progress-card"
import { SnapshotDialog } from "@/features/snapshots/snapshot-dialog"
import { getMeterDataFn } from "@/features/nesco/nesco-server"
import { saveMeterFn } from "@/features/auth/auth-server"
import { generateAnalytics } from "@/features/analytics/insights-generator"
import { useAuth } from "@/features/auth/auth-context"
import { recordRecentSearch } from "@/features/db/client-db"
import type { NescoFetchResult } from "@/features/nesco/types"
import { getSampleMeterData } from "@/features/nesco/sample-data"
import { formatBDT, toBanglaNumber, formatDateBangla } from "@/lib/bangla"
import {
  Search,
  Zap,
  Banknote,
  Calendar,
  Hourglass,
  Gauge,
  Bookmark,
  Camera,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  RefreshCw,
} from "lucide-react"

export const Route = createFileRoute("/")({
  component: DashboardPage,
})

function DashboardPage() {
  const { user, openAuthModal } = useAuth()

  // State
  const [meterInput, setMeterInput] = React.useState("12345678")
  const [isLoading, setIsLoading] = React.useState(false)
  const [nescoData, setNescoData] = React.useState<NescoFetchResult>(() => getSampleMeterData("12345678"))
  const [isSnapshotDialogOpen, setIsSnapshotDialogOpen] = React.useState(false)
  const [isSavingMeter, setIsSavingMeter] = React.useState(false)

  // Analytics derived from active NescoData
  const analytics = React.useMemo(() => {
    return generateAnalytics(nescoData)
  }, [nescoData])

  const handleFetchMeter = async (meterToFetch?: string, forceDemo = false) => {
    const target = (meterToFetch || meterInput).replace(/[^0-9]/g, "").trim()
    if (!target) {
      toast.error("অনুগ্রহ করে ৮ থেকে ১১ ডিজিটের মিটার নম্বর দিন।")
      return
    }

    setIsLoading(true)
    try {
      const result = await getMeterDataFn({
        data: { meterNumber: target, forceSample: forceDemo },
      })

      setNescoData(result)
      setMeterInput(target)

      // Save to client TanStack DB recent searches
      recordRecentSearch({
        meterNumber: target,
        customerNumber: result.customerInfo.customerNumber,
        searchedAt: new Date().toISOString(),
        label: result.customerInfo.name,
      })

      if (result.dataSource === "nesco_live") {
        toast.success("সরকারি নেসকো লাইভ পোর্টাল থেকে ডেটা প্রাপ্ত হয়েছে!")
      } else {
        toast.info(result.statusMessage || "রেফারেন্স ডেমো ডেটা লোড হয়েছে।")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "মিটার তথ্য লোড করা সম্ভব হয়নি।")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveMeter = async () => {
    if (!user) {
      openAuthModal("login")
      toast.info("মিটার সেভ করতে অনুগ্রহ করে লগইন করুন।")
      return
    }

    setIsSavingMeter(true)
    try {
      const res = await saveMeterFn({
        data: {
          meterNumber: nescoData.customerInfo.meterNumber,
          customerNumber: nescoData.customerInfo.customerNumber,
          customerName: nescoData.customerInfo.name,
          address: nescoData.customerInfo.address,
          tariff: nescoData.customerInfo.tariff,
          sanctionedLoad: String(nescoData.customerInfo.approvedLoadKw),
          alias: `${nescoData.customerInfo.name} এর মিটার`,
        },
      })

      if (res.success) {
        toast.success("মিটারটি আপনার একাউন্টে সেভ করা হয়েছে!")
      } else {
        toast.error(res.error || "মিটার সংরক্ষণ ব্যর্থ হয়েছে।")
      }
    } catch {
      toast.error("মিটার সংরক্ষণে সমস্যা হয়েছে।")
    } finally {
      setIsSavingMeter(false)
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-6xl">
      {/* Hero / Meter Search Banner */}
      <div className="relative rounded-3xl bg-linear-to-b from-primary/10 via-primary/5 to-transparent border border-primary/20 p-5 sm:p-8 overflow-hidden shadow-xs">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 font-semibold px-2.5 py-0.5 text-xs">
              ⚡ নেসকো প্রিপেইড প্যানেল ইন্টিগ্রেশন
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            আপনার বিদ্যুৎ ব্যবহারের <span className="text-primary">স্মার্ট হিসাব ও বিশ্লেষণ</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            নেসকো প্রি-পেইড মিটার নম্বর দিয়ে সরাসরি রিচার্জ ইতিহাস, মাসিক ব্যবহার, ট্যারিফ স্ল্যাব এবং দৈনিক আনুমানিক ব্যয়ের আধুনিক পরিসংখ্যান জানুন।
          </p>

          {/* Search Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleFetchMeter()
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="নেসকো গ্রাহক বা মিটার নম্বর টাইপ করুন (যেমন: ১২৩৪৫৬৭৮)"
                value={meterInput}
                onChange={(e) => setMeterInput(e.target.value)}
                className="pl-10 h-11 bg-background text-sm rounded-xl font-medium"
                maxLength={11}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 px-6 rounded-xl font-semibold gap-2 shrink-0 shadow-xs"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  <span>লোড হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  <span>তথ্য দেখুন</span>
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Pill Selectors */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
            <span className="font-medium text-[11px]">দ্রুত পরীক্ষা করুন:</span>
            <button
              type="button"
              onClick={() => handleFetchMeter("12345678", true)}
              className="px-2.5 py-1 rounded-lg bg-background/80 hover:bg-background border border-border text-foreground hover:border-primary/40 transition-colors font-medium cursor-pointer"
            >
              রাজশাহী সদর (১২৩৪৫৬৭৮)
            </button>
            <button
              type="button"
              onClick={() => handleFetchMeter("11019842510", true)}
              className="px-2.5 py-1 rounded-lg bg-background/80 hover:bg-background border border-border text-foreground hover:border-primary/40 transition-colors font-medium cursor-pointer"
            >
              বগুড়া শহর (১১০১৯৮৪২৫১০)
            </button>
          </div>
        </div>
      </div>

      {/* Data Source Status Banner */}
      {nescoData.statusMessage && (
        <Alert
          className={
            nescoData.dataSource === "nesco_live"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200"
              : "bg-muted/70 border-border"
          }
        >
          <div className="flex items-center gap-2">
            {nescoData.dataSource === "nesco_live" ? (
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Info className="size-4 text-primary" />
            )}
            <AlertTitle className="text-xs font-bold mb-0">
              {nescoData.dataSource === "nesco_live"
                ? "সরকারি নেসকো লাইভ পোর্টাল থেকে সংগৃহীত"
                : "টেস্ট রেফারেন্স ডেটা (NESCO Reference Dataset)"}
            </AlertTitle>
          </div>
          <AlertDescription className="text-xs mt-1 text-muted-foreground">
            {nescoData.statusMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Customer / Meter Details Card */}
          <Card className="rounded-2xl border shadow-xs overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                      {nescoData.customerInfo.name}
                    </h2>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {nescoData.customerInfo.tariff}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      মিটার: <strong className="text-foreground">{nescoData.customerInfo.meterNumber}</strong>
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      গ্রাহক নং: <strong className="text-foreground">{nescoData.customerInfo.customerNumber}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      অনুমোদিত লোড: <strong className="text-foreground">{toBanglaNumber(nescoData.customerInfo.approvedLoadKw)} kW</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveMeter}
                    disabled={isSavingMeter}
                    className="h-9 text-xs font-semibold gap-1.5"
                  >
                    <Bookmark className="size-3.5 text-primary" />
                    <span>{isSavingMeter ? "সেভ হচ্ছে..." : "মিটার সেভ করুন"}</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsSnapshotDialogOpen(true)}
                    className="h-9 text-xs font-semibold gap-1.5"
                  >
                    <Camera className="size-3.5" />
                    <span>আজকের স্ন্যাপশট</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground block text-[11px]">ঠিকানা:</span>
                    <span className="font-medium text-foreground">{nescoData.customerInfo.address}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground block text-[11px]">বিদ্যুৎ অফিস (S&D):</span>
                    <span className="font-medium text-foreground">{nescoData.customerInfo.electricityOffice}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground block text-[11px]">ফিডার লাইন:</span>
                    <span className="font-medium text-foreground">{nescoData.customerInfo.feederName}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI Stat Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="অবশিষ্ট ব্যালেন্স"
              value={formatBDT(analytics.actual.currentBalance)}
              subvalue="নেসকো মিটার স্ট্যাটাস"
              icon={<Banknote className="size-5" />}
              highlight
            />

            <StatCard
              title="আনুমানিক বাকি দিন"
              value={`~${toBanglaNumber(analytics.estimates.estimatedDaysRemaining)} দিন`}
              subvalue="বর্তমান ব্যালেন্সের মেয়াদ"
              icon={<Hourglass className="size-5" />}
              isEstimate
              trend={
                analytics.estimates.estimatedDaysRemaining < 7
                  ? { value: "জরুরি", isPositive: false, label: "রিচার্জ প্রয়োজন" }
                  : { value: "স্বস্তিদায়ক", isPositive: true, label: "পর্যাপ্ত ব্যালেন্স" }
              }
            />

            <StatCard
              title="দৈনিক গড় ব্যয় (Estimate)"
              value={`${formatBDT(analytics.estimates.avgDailyCostBdt)}/দিন`}
              subvalue={`গড় ব্যবহার: ~${toBanglaNumber(analytics.estimates.avgDailyKwh)} kWh/দিন`}
              icon={<Gauge className="size-5" />}
              isEstimate
            />

            <StatCard
              title="সর্বশেষ রিচার্জ"
              value={formatBDT(analytics.actual.lastRechargeAmount)}
              subvalue={`${formatDateBangla(analytics.actual.lastRechargeDate)} (${analytics.actual.lastRechargeVia})`}
              icon={<Calendar className="size-5" />}
            />
          </div>

          {/* Smart Bangla Insights Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="text-base sm:text-lg font-bold">স্মার্ট বিদ্যুৎ বিশ্লেষণ ও পরামর্শ</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {analytics.insights.map((insight) => (
                <Card
                  key={insight.id}
                  className="rounded-2xl border p-4 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                        {insight.type === "warning" && <AlertTriangle className="size-3.5 text-amber-500" />}
                        {insight.type === "success" && <CheckCircle2 className="size-3.5 text-emerald-500" />}
                        {insight.type === "info" && <Info className="size-3.5 text-primary" />}
                        <span>{insight.title}</span>
                      </h4>
                      {insight.isCalculatedEstimate && (
                        <Badge variant="outline" className="text-[10px] h-4 font-normal">
                          অনুমান
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                  {insight.metric && (
                    <div className="pt-2 text-xs font-semibold text-primary">
                      {insight.metric}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Main Charts & Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ConsumptionChart
                monthlyData={nescoData.monthlyUsage}
                isSampleData={nescoData.dataSource === "sample_demo"}
              />

              <RechargeTrendChart records={nescoData.rechargeHistory} />
            </div>

            <div className="space-y-6">
              <SlabProgressCard
                billBreakdown={analytics.billBreakdown}
                monthlyUnits={analytics.actual.latestMonthUnits || 250}
              />

              {/* Quick Navigation Card */}
              <Card className="rounded-2xl border p-5 shadow-xs bg-linear-to-br from-card to-muted/40 space-y-4">
                <h4 className="font-bold text-sm">আরও বিস্তারিত এক্সপ্লোর করুন</h4>
                <div className="space-y-2">
                  <Link
                    to="/history"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background hover:border-primary/40 transition-colors text-xs font-medium"
                  >
                    <span>সম্পূর্ণ রিচার্জ ও টোকেন ভাউচার</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                  </Link>
                  <Link
                    to="/snapshots"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background hover:border-primary/40 transition-colors text-xs font-medium"
                  >
                    <span>সংরক্ষিত দৈনিক ট্র্যাকিং হিস্ট্রি</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                  </Link>
                  <Link
                    to="/tariffs"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background hover:border-primary/40 transition-colors text-xs font-medium"
                  >
                    <span>নেসকো ট্যারিফ স্ল্যাব ও বিল ক্যালকুলেটর</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Snapshot Dialog */}
      <SnapshotDialog
        open={isSnapshotDialogOpen}
        onOpenChange={setIsSnapshotDialogOpen}
        meterNumber={nescoData.customerInfo.meterNumber}
        currentBalance={analytics.actual.currentBalance}
        dailyEstimatedCost={analytics.estimates.avgDailyCostBdt}
        monthlyEstimatedCost={analytics.estimates.projectedMonthlyCostBdt}
        sourceType={nescoData.dataSource}
      />
    </div>
  )
}
