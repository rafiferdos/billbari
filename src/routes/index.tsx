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
import { AdvancedStats } from "@/features/analytics/advanced-stats"
import { ConsumptionChart } from "@/features/analytics/consumption-chart"
import { RechargeTrendChart } from "@/features/analytics/recharge-trend-chart"
import { SlabProgressCard } from "@/features/analytics/slab-progress-card"
import { SnapshotDialog } from "@/features/snapshots/snapshot-dialog"
import { saveMeterFn } from "@/features/auth/auth-server"
import { generateAnalytics } from "@/features/analytics/insights-generator"
import { useAuth } from "@/features/auth/auth-context"
import { useMeter } from "@/features/meter/meter-context"
import { useLanguage } from "@/features/i18n/language-context"
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
  ClipboardPaste,
  CreditCard,
  BarChart3,
  X,
  Clock,
} from "lucide-react"

export const Route = createFileRoute("/")({
  component: DashboardPage,
})

function DashboardPage() {
  const { user, isPremium, openAuthModal, openPricingModal } = useAuth()
  const { t, isBangla, formatBDT, formatNumber, formatDate } = useLanguage()
  const {
    activeMeter,
    activeMeterData: nescoData,
    isLoading,
    error: searchError,
    fetchMeter,
    clearActiveMeter,
  } = useMeter()

  const [meterInput, setMeterInput] = React.useState(activeMeter)
  const [isSnapshotDialogOpen, setIsSnapshotDialogOpen] = React.useState(false)
  const [isSavingMeter, setIsSavingMeter] = React.useState(false)

  // Sync meterInput with activeMeter
  React.useEffect(() => {
    if (activeMeter) {
      setMeterInput(activeMeter)
    }
  }, [activeMeter])

  // Analytics derived from active NescoData
  const analytics = React.useMemo(() => {
    if (!nescoData) return null
    return generateAnalytics(nescoData)
  }, [nescoData])

  const handleFetchMeter = async (meterToFetch?: string) => {
    const target = (meterToFetch || meterInput).replace(/[^0-9]/g, "").trim()
    if (!target || target.length < 8) {
      toast.error("অনুগ্রহ করে ৮ থেকে ১১ ডিজিটের সঠিক মিটার বা গ্রাহক নম্বর দিন।")
      return
    }

    setMeterInput(target)
    await fetchMeter(target, { force: true })
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const clean = text.replace(/[^0-9]/g, "").slice(0, 11)
      if (clean) {
        setMeterInput(clean)
        toast.success("নম্বর পেস্ট হয়েছে!")
        handleFetchMeter(clean)
      } else {
        toast.error("ক্লিপবোর্ডে কোনো সঠিক সংখ্যা পাওয়া যায়নি।")
      }
    } catch {
      toast.info("ব্রাউজার ক্লিপবোর্ড অনুমতি দেয়নি। সরাসরি বক্সে পেস্ট করুন।")
    }
  }

  const handleSaveMeter = async () => {
    if (!nescoData) return
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
        toast.error(res.error || "মিটার সংরক্ষণ করা যায়নি।")
      }
    } catch {
      toast.error("মিটার সংরক্ষণে সমস্যা হয়েছে।")
    } finally {
      setIsSavingMeter(false)
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-6xl">
      {/* Search Header Banner */}
      <div className="relative rounded-3xl bg-linear-to-b from-primary/10 via-primary/5 to-transparent border border-primary/20 p-5 sm:p-8 overflow-hidden shadow-xs">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 font-semibold px-2.5 py-0.5 text-xs">
              ⚡ {t.hero.badge}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            {isBangla ? (
              <>
                আপনার বিদ্যুৎ খরচের <span className="text-primary">সহজ হিসাব</span>
              </>
            ) : (
              <>
                Clarity for your power. <span className="text-primary">Instant and precise.</span>
              </>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t.hero.subtitle}
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
                placeholder={t.hero.meterInputPlaceholder}
                value={meterInput}
                onChange={(e) => setMeterInput(e.target.value)}
                className="pl-10 pr-24 h-11 bg-background text-sm rounded-xl font-medium"
                maxLength={11}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {meterInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setMeterInput("")
                      clearActiveMeter()
                    }}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title={t.hero.clearSearch}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1 cursor-pointer"
                  title={t.hero.pasteFromClipboard}
                >
                  <ClipboardPaste className="size-3" />
                  <span>{t.hero.pasteFromClipboard}</span>
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 px-6 rounded-xl font-semibold gap-2 shrink-0 shadow-xs"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  <span>{t.hero.searchingButton}</span>
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  <span>{t.hero.searchButton}</span>
                </>
              )}
            </Button>
          </form>

          {searchError && (
            <div className="mt-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-foreground space-y-2 text-xs">
              <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                <AlertTriangle className="size-4 shrink-0" />
                <span>নেসকো সার্ভার সংযোগ বার্তা</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {searchError}
              </p>
              {searchError.includes("403") && (
                <div className="pt-2 border-t border-destructive/20 text-[11px] text-muted-foreground space-y-1.5">
                  <p className="font-semibold text-foreground">
                    {isBangla ? "💡 লাইভ ডেটা পাওয়ার উপায়:" : "💡 How to access live telemetry:"}
                  </p>
                  <p>
                    • <strong>{isBangla ? "লোকালহোস্টে:" : "Locally:"}</strong>{" "}
                    {isBangla
                      ? "আপনার টার্মিনালে "
                      : "Run "}
                    <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-primary font-bold">pnpm dev</code>{" "}
                    {isBangla
                      ? "চালিয়ে ব্রাউজ করুন। আপনার লোকাল ইন্টারনেট সংযোগ বাংলাদেশি হওয়ায় লাইভ সরকারি সার্ভার সরাসরি সংযোগ পাবে।"
                      : "in Bangladesh. Since your local ISP IP is within Bangladesh, it connects directly without restrictions."}
                  </p>
                  <p>
                    • <strong>{isBangla ? "লাইভ সাইটে (যেমন Vercel):" : "On Live Deployment (Vercel):"}</strong>{" "}
                    {isBangla
                      ? "টার্মিনালে "
                      : "Run "}
                    <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-primary font-bold">pnpm bridge</code>{" "}
                    {isBangla
                      ? "চালিয়ে টানেল লিংকটি Vercel-এর Environment Variable-এ NESCO_PROXY_URL হিসেবে সেভ করে দিন।"
                      : "and set the public tunnel URL as NESCO_PROXY_URL in Vercel's Environment Variables."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      )}

      {/* Clean Welcoming State when no meter is searched yet */}
      {!isLoading && !nescoData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <Card className="rounded-2xl border p-5 shadow-xs space-y-2">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Zap className="size-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">
              {t.stats.currentBalance}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isBangla
                ? "আপনার মিটারে কত টাকা অবশিষ্ট আছে এবং মিটারের সার্বিক অবস্থা এক পলকে দেখতে পাবেন।"
                : "Instantly view your remaining meter balance, credit runway, and connectivity status."}
            </p>
          </Card>

          <Card className="rounded-2xl border p-5 shadow-xs space-y-2">
            <div className="size-9 rounded-xl bg-chart-1/10 text-chart-1 flex items-center justify-center font-bold">
              <CreditCard className="size-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">
              {t.history.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isBangla
                ? "বিকাশ, নগদ, রকেটে রিচার্জের পর টোকেন কোড হারিয়ে গেলে সহজেই এখান থেকে কপি করে নিতে পারবেন।"
                : "Easily inspect and copy 20-digit recharge tokens whenever you recharge via bKash or Nagad."}
            </p>
          </Card>

          <Card className="rounded-2xl border p-5 shadow-xs space-y-2">
            <div className="size-9 rounded-xl bg-chart-2/10 text-chart-2 flex items-center justify-center font-bold">
              <BarChart3 className="size-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">
              {t.stats.latestMonthUnits}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isBangla
                ? "প্রতি মাসে কত ইউনিট বিদ্যুৎ ব্যবহার করছেন এবং সরকারি ট্যারিফ ধাপ অনুযায়ী খরচ দেখতে পাবেন।"
                : "Track how many units you consume each month and model your power costs across stepped tariff tiers."}
            </p>
          </Card>
        </div>
      )}

      {/* Main Content when Meter Data is Loaded */}
      {!isLoading && nescoData && analytics && (
        <>
          {/* Data Source Status Banner */}
          {nescoData.statusMessage && (
            <Alert
              className={
                nescoData.dataSource === "nesco_live"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200"
                  : nescoData.dataSource === "cached_real"
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200"
                  : "bg-muted/70 border-border"
              }
            >
              <div className="flex items-center gap-2">
                {nescoData.dataSource === "nesco_live" ? (
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                ) : nescoData.dataSource === "cached_real" ? (
                  <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Info className="size-4 text-primary" />
                )}
                <AlertTitle className="text-xs font-bold mb-0">
                  {nescoData.dataSource === "nesco_live"
                    ? t.status.liveSuccessTitle
                    : nescoData.dataSource === "cached_real"
                    ? t.status.cachedTitle
                    : t.status.demoTitle}
                </AlertTitle>
              </div>
              <AlertDescription className="text-xs mt-1 text-muted-foreground">
                {nescoData.statusMessage}
              </AlertDescription>
            </Alert>
          )}

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
                      {t.nav.meterBadge}: <strong className="text-foreground">{formatNumber(nescoData.customerInfo.meterNumber)}</strong>
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      {t.customer.customerNo}: <strong className="text-foreground">{formatNumber(nescoData.customerInfo.customerNumber)}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      {t.customer.sanctionedLoad}: <strong className="text-foreground">{formatNumber(nescoData.customerInfo.approvedLoadKw)} kW</strong>
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
                    <span>{isSavingMeter ? t.common.loading : t.customer.saveMeter}</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!user) openAuthModal("login")
                      else setIsSnapshotDialogOpen(true)
                    }}
                    className="h-9 text-xs font-semibold gap-1.5"
                  >
                    <Camera className="size-3.5" />
                    <span>{t.stats.takeSnapshot}</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground block text-[11px]">{t.customer.address}:</span>
                    <span className="font-medium text-foreground">{nescoData.customerInfo.address}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground block text-[11px]">{isBangla ? "বিদ্যুৎ অফিস:" : "Electric Office:"}</span>
                    <span className="font-medium text-foreground">{nescoData.customerInfo.electricityOffice}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground block text-[11px]">{t.customer.feeder}:</span>
                    <span className="font-medium text-foreground">{nescoData.customerInfo.feederName}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI Stat Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Actual Balance - Always visible */}
            <StatCard
              title={t.stats.currentBalance}
              value={formatBDT(analytics.actual.currentBalance)}
              subvalue={t.stats.currentBalanceSub}
              icon={<Banknote className="size-5" />}
              highlight
            />

            {/* Estimated Days Remaining */}
            <StatCard
              title={t.stats.runwayDays}
              value={`~${formatNumber(analytics.estimates.estimatedDaysRemaining)} ${t.stats.runwayDaysUnit}`}
              subvalue={t.stats.runwayDaysSub}
              icon={<Hourglass className="size-5" />}
              isEstimate
              requiresAuth={!user}
              requiresPremium={!isPremium}
              onLoginClick={() => openAuthModal("login")}
              onUpgradeClick={() => openPricingModal()}
              trend={
                analytics.estimates.estimatedDaysRemaining < 7
                  ? { value: isBangla ? "জরুরি" : "Urgent", isPositive: false, label: isBangla ? "রিচার্জ প্রয়োজন" : "Recharge Soon" }
                  : { value: isBangla ? "ভালো অবস্থা" : "Healthy", isPositive: true, label: isBangla ? "পর্যাপ্ত ব্যালেন্স" : "Sufficient Credit" }
              }
            />

            {/* Estimated Daily Cost */}
            <StatCard
              title={t.stats.avgDailyCost}
              value={`${formatBDT(analytics.estimates.avgDailyCostBdt)}/${t.stats.days}`}
              subvalue={`${isBangla ? "গড় ব্যবহার:" : "Avg usage:"} ~${formatNumber(analytics.estimates.avgDailyKwh)} kWh/${t.stats.days}`}
              icon={<Gauge className="size-5" />}
              isEstimate
              requiresAuth={!user}
              requiresPremium={!isPremium}
              onLoginClick={() => openAuthModal("login")}
              onUpgradeClick={() => openPricingModal()}
            />

            {/* Last Recharge */}
            <StatCard
              title={isBangla ? "সর্বশেষ রিচার্জ" : "Last Recharge"}
              value={formatBDT(analytics.actual.lastRechargeAmount)}
              subvalue={
                analytics.actual.lastRechargeDeductionsBdt > 0
                  ? isBangla
                    ? `মিটারে জমা: ${formatBDT(analytics.actual.lastRechargeNetEnergyBdt)} (${formatNumber(analytics.actual.lastRechargePowerKwh)} kWh)`
                    : `Credited: ${formatBDT(analytics.actual.lastRechargeNetEnergyBdt)} (${formatNumber(analytics.actual.lastRechargePowerKwh)} kWh)`
                  : `${formatDate(analytics.actual.lastRechargeDate)} (${analytics.actual.lastRechargeVia})`
              }
              icon={<Calendar className="size-5" />}
            />
          </div>

          {/* Advanced Real-World Statistics & Behavior Analysis */}
          <AdvancedStats
            analytics={analytics}
            isAuthenticated={!!user}
            isPremium={isPremium}
            onLoginClick={() => openAuthModal("login")}
            onUpgradeClick={() => openPricingModal()}
          />

          {/* Bangla / English Insights Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="text-base sm:text-lg font-bold">
                {isBangla ? "খরচের গুরুত্বপূর্ণ তথ্য ও পরামর্শ" : "Consumption Insights & Intelligence"}
              </h3>
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
                          {isBangla ? "হিসাব" : "Est."}
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
                <h4 className="font-bold text-sm">
                  {isBangla ? "অন্যান্য পেজ দেখুন" : "Explore More"}
                </h4>
                <div className="space-y-2">
                  <Link
                    to="/history"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background hover:border-primary/40 transition-colors text-xs font-medium"
                  >
                    <span>{t.history.title}</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                  </Link>
                  <Link
                    to="/snapshots"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background hover:border-primary/40 transition-colors text-xs font-medium"
                  >
                    <span>{t.snapshots.title}</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                  </Link>
                  <Link
                    to="/tariffs"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background hover:border-primary/40 transition-colors text-xs font-medium"
                  >
                    <span>{t.tariffs.title}</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Snapshot Dialog */}
      {nescoData && analytics && (
        <SnapshotDialog
          open={isSnapshotDialogOpen}
          onOpenChange={setIsSnapshotDialogOpen}
          meterNumber={nescoData.customerInfo.meterNumber}
          currentBalance={analytics.actual.currentBalance}
          dailyEstimatedCost={analytics.estimates.avgDailyCostBdt}
          monthlyEstimatedCost={analytics.estimates.projectedMonthlyCostBdt}
          sourceType={nescoData.dataSource === "sample_demo" ? "sample_demo" : "nesco_live"}
        />
      )}
    </div>
  )
}
