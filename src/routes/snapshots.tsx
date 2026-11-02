import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useLiveQuery } from "@tanstack/react-db"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { SnapshotHistory } from "@/features/snapshots/snapshot-history"
import { SnapshotDialog } from "@/features/snapshots/snapshot-dialog"
import {
  getSnapshotsFn,
  syncAutomatedDailyPulseFn,
  type SnapshotRecord,
} from "@/features/snapshots/snapshot-server"
import { SAMPLE_PRO_SNAPSHOTS } from "@/features/snapshots/sample-snapshots"
import { snapshotsCollection, syncSnapshotsToClient } from "@/features/db/client-db"
import { useAuth } from "@/features/auth/auth-context"
import { useMeter } from "@/features/meter/meter-context"
import { useLanguage } from "@/features/i18n/language-context"
import {
  Camera,
  Sparkles,
  Loader2,
  Crown,
  Clock,
  CheckCircle2,
  RefreshCw,
  Eye,
  RotateCcw,
} from "lucide-react"

export const Route = createFileRoute("/snapshots")({
  component: SnapshotsPage,
})

function SnapshotsPage() {
  const { user, isPremium, openAuthModal, openPricingModal } = useAuth()
  const { activeMeter, activeMeterData } = useMeter()
  const { t, isBangla, formatBDT } = useLanguage()

  const [meterFilter, setMeterFilter] = React.useState<string>(activeMeter || "")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [serverSnapshots, setServerSnapshots] = React.useState<SnapshotRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [isPreviewMode, setIsPreviewMode] = React.useState(false)

  React.useEffect(() => {
    if (activeMeter) {
      setMeterFilter(activeMeter)
    }
  }, [activeMeter])

  // Reactive subscription from client TanStack DB
  const liveQueryResult = useLiveQuery(snapshotsCollection)
  const clientSnapshots = liveQueryResult.data || []

  // Load server snapshots on mount or when user changes
  const loadSnapshots = React.useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const records = await getSnapshotsFn()
      setServerSnapshots(records)
      // Sync into reactive client-side TanStack DB
      syncSnapshotsToClient(
        records.map((r) => ({
          id: r.id,
          meterNumber: r.meterNumber,
          snapshotDate: r.snapshotDate,
          balance: r.balance,
          readingKwh: r.readingKwh,
          dailyEstimatedCost: r.dailyEstimatedCost,
          monthlyEstimatedCost: r.monthlyEstimatedCost,
          sourceType: r.sourceType,
          notes: r.notes,
          createdAt: r.createdAt,
        }))
      )
    } catch {
      // offline or error
    } finally {
      setIsLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    loadSnapshots()
  }, [loadSnapshots])

  // Merge server and reactive client snapshots (client takes precedence)
  const combinedSnapshots: SnapshotRecord[] = React.useMemo(() => {
    if (clientSnapshots.length > 0) {
      return clientSnapshots.map((cs) => ({
        id: cs.id,
        userId: user?.id || "guest",
        meterNumber: cs.meterNumber,
        snapshotDate: cs.snapshotDate,
        balance: cs.balance,
        readingKwh: cs.readingKwh,
        dailyEstimatedCost: cs.dailyEstimatedCost,
        monthlyEstimatedCost: cs.monthlyEstimatedCost,
        sourceType: cs.sourceType,
        notes: cs.notes,
        createdAt: cs.createdAt,
      }))
    }
    return serverSnapshots
  }, [clientSnapshots, serverSnapshots, user])

  // Handle on-demand automated pulse sync for subscribed users
  const handleSyncPulseNow = async () => {
    if (!isPremium) {
      openPricingModal()
      toast.info(
        isBangla
          ? "স্বয়ংক্রিয় মিডনাইট পালস সিঙ্ক সুবিধা পেতে মিটার প্লাস চালু করুন।"
          : "Please unlock Meter Plus to enable automated daily pulse sync."
      )
      return
    }

    setIsSyncing(true)
    try {
      const res = await syncAutomatedDailyPulseFn({
        data: { meterNumber: meterFilter || activeMeter || undefined },
      })

      if (res.success && res.snapshot) {
        try {
          snapshotsCollection.insert({
            id: res.snapshot.id,
            meterNumber: res.snapshot.meterNumber,
            snapshotDate: res.snapshot.snapshotDate,
            balance: res.snapshot.balance,
            readingKwh: res.snapshot.readingKwh,
            dailyEstimatedCost: res.snapshot.dailyEstimatedCost,
            monthlyEstimatedCost: res.snapshot.monthlyEstimatedCost,
            sourceType: res.snapshot.sourceType,
            notes: res.snapshot.notes,
            createdAt: res.snapshot.createdAt,
          })
        } catch {
          // ignore client TanStack DB errors
        }

        toast.success(
          isBangla
            ? `আজকের লাইভ পালস সফলভাবে সিঙ্ক হয়েছে! ব্যালেন্স: ${formatBDT(res.snapshot.balance)}`
            : `Today's live pulse synced successfully! Balance: ${formatBDT(res.snapshot.balance)}`
        )
        await loadSnapshots()
      } else {
        toast.error(
          res.error ||
            (isBangla
              ? "নেসকো থেকে লাইভ পালস সিঙ্ক করা সম্ভব হয়নি।"
              : "Failed to sync live pulse from NESCO.")
        )
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : isBangla
          ? "লাইভ পালস সিঙ্কে সমস্যা হয়েছে।"
          : "An error occurred during pulse sync."
      )
    } finally {
      setIsSyncing(false)
    }
  }

  // Active snapshots list based on preview mode
  const displayedSnapshots = isPreviewMode ? SAMPLE_PRO_SNAPSHOTS : combinedSnapshots
  const displayedMeter = isPreviewMode ? "36023363" : (meterFilter || activeMeter || "")

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Clock className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t.snapshots.title}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isBangla
              ? "প্রতি রাত ১২:৩০ মিনিটে নেসকো সার্ভার থেকে স্বয়ংক্রিয়ভাবে ব্যালেন্স সংগ্রহ ও দিনভিত্তিক খরচের নির্ভুল হিসাব।"
              : "Automated 12:30 AM midnight telemetry & precision daily burn rate tracking."}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isPremium ? (
            <>
              <Button
                onClick={handleSyncPulseNow}
                disabled={isSyncing}
                className="h-9 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
              >
                {isSyncing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                <span>
                  {isSyncing
                    ? isBangla
                      ? "সিঙ্ক হচ্ছে..."
                      : "Syncing..."
                    : isBangla
                    ? "⚡ এখনই লাইভ সিঙ্ক করুন"
                    : "⚡ Sync Latest Pulse Now"}
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(true)}
                className="h-9 text-xs font-medium gap-1.5 cursor-pointer"
              >
                <Camera className="size-3.5 text-muted-foreground" />
                <span>{isBangla ? "+ ম্যানুয়াল এন্ট্রি" : "+ Manual Log"}</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant={isPreviewMode ? "secondary" : "outline"}
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="h-9 text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
              >
                {isPreviewMode ? <RotateCcw className="size-3.5" /> : <Eye className="size-3.5" />}
                <span>
                  {isPreviewMode
                    ? isBangla
                      ? "পূর্বের তালিকায় ফিরুন"
                      : "Exit Preview"
                    : isBangla
                    ? "🔮 প্রো প্রিভিউ: নমুনা ডেটা দেখুন"
                    : "🔮 Preview Pro Sample Data"}
                </span>
              </Button>

              <Button
                onClick={openPricingModal}
                className="h-9 text-xs font-semibold gap-1.5 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs cursor-pointer"
              >
                <Crown className="size-3.5 fill-current" />
                <span>{isBangla ? "মিটার প্লাস (৳২০)" : "Unlock Meter Plus (৳20)"}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Preview Mode Notification Banner */}
      {isPreviewMode && (
        <Card className="rounded-2xl border-amber-500/40 bg-amber-500/10 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
                <Sparkles className="size-4 shrink-0" />
                <span>
                  {isBangla
                    ? "🔮 প্রো মেম্বারশিপ লাইভ প্রিভিউ মোড চালু রয়েছে"
                    : "🔮 Pro Membership Live Preview Mode Active"}
                </span>
                <Badge className="bg-amber-500 text-white text-[10px] h-4">
                  {isBangla ? "নমুনা ডেটা" : "Demo Telemetry"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isBangla
                  ? "নিচে প্রো মেম্বারদের জন্য ১৪ দিনের স্বয়ংক্রিয় মিডনাইট সিঙ্কের নমুনা দেখানো হচ্ছে। সাবস্ক্রিপশন নিলে কোনো ম্যানুয়াল এন্ট্রি ছাড়া প্রতি রাত ১২:৩০ মিনিটে আপনার মিটারের এই হিসাব স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।"
                  : "Displaying a 14-day sample of automated midnight tracking for Pro members. Upgrading enables this hands-free daily tracking for your meter every night at 12:30 AM without manual typing."}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={openPricingModal}
                className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 cursor-pointer"
              >
                <Crown className="size-3.5 fill-current" />
                <span>{isBangla ? "মিটার প্লাস চালু করুন (৳২০)" : "Unlock Meter Plus (৳20)"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(false)}
                className="h-8 text-xs font-medium cursor-pointer"
              >
                {isBangla ? "প্রিভিউ বন্ধ করুন" : "Exit Preview"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Subscribed User Status: Automated Midnight Telemetry Active */}
      {isPremium && !isPreviewMode && (
        <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {isBangla
                      ? "স্বয়ংক্রিয় মিডনাইট পালস সিঙ্ক সক্রিয়"
                      : "Automated Midnight Pulse Active"}
                  </span>
                </h4>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold"
                >
                  {isBangla ? "প্রতি রাত ১২:৩০" : "Daily 00:30 AM BD"}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                {isBangla
                  ? "নেসকো সার্ভারে প্রতিদিন রাত ১২:০৫ এ ডেটা আপডেট হয়। আপনার মিটার প্লাস থাকায় প্রতি রাত ১২:৩০ মিনিটে বিলবাড়ি স্বয়ংক্রিয়ভাবে নেসকো পোর্টাল থেকে নতুন ব্যালেন্স সংগ্রহ করে এবং ২৪ ঘণ্টার আসল বিদ্যুৎ খরচ হিসাব করে।"
                  : "NESCO portal data refreshes nightly at 12:05 AM. BillBari automatically fetches your updated meter balance every night at 12:30 AM, charting your exact 24-hour daily burn rate without any manual effort."}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 p-3 rounded-xl bg-background border border-border/80 text-xs text-center">
              <div>
                <span className="text-[10px] text-muted-foreground block">
                  {isBangla ? "শিডিউল সময়:" : "Schedule:"}
                </span>
                <span className="font-extrabold text-foreground font-mono">12:30 AM</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div>
                <span className="text-[10px] text-muted-foreground block">
                  {isBangla ? "স্ট্যাটাস:" : "Status:"}
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {isBangla ? "সক্রিয়" : "Active"}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Free / Non-Subscribed User Showcase & CTA Card */}
      {!isPremium && !isPreviewMode && (
        <Card className="rounded-2xl border shadow-xs p-5 bg-linear-to-br from-primary/5 via-background to-muted/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-amber-500/10 text-amber-500">
                  <Crown className="size-4 fill-amber-500" />
                </span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {isBangla ? "প্রো অটোমেশন ফিচার" : "Pro Automation Telemetry"}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {isBangla
                  ? "ম্যানুয়াল এন্ট্রির দিন শেষ: প্রতি রাত ১২:৩০ মিনিটে স্বয়ংক্রিয় পালস সিঙ্ক"
                  : "Hands-Free Midnight Telemetry: Automatic NESCO Sync at 12:30 AM"}
              </h3>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {isBangla
                  ? "প্রতিদিন কষ্ট করে মিটারের ব্যালেন্স লিখে রাখার কোনো প্রয়োজন নেই। মিটার প্লাস চালু থাকলে প্রতি রাত ১২:৩০ মিনিটে বিলবাড়ি নিজে নিজেই নেসকো সার্ভার থেকে ব্যালেন্স সংগ্রহ করে এবং ২৪ ঘণ্টার আসল বিদ্যুৎ খরচ হিসাব করে সংরক্ষণ করে।"
                  : "No more manually jotting down meter readings. BillBari Pro automatically checks the NESCO portal every single night at 12:30 AM, calculating and preserving your true daily consumption completely hands-free."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              <Button
                onClick={() => setIsPreviewMode(true)}
                variant="outline"
                className="h-9 text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
              >
                <Eye className="size-3.5" />
                <span>
                  {isBangla
                    ? "🔮 প্রো কিনলে কেমন দেখাবে? নমুনা দেখুন"
                    : "🔮 Preview Pro Sample Data"}
                </span>
              </Button>

              <Button
                onClick={openPricingModal}
                className="h-9 text-xs font-semibold gap-1.5 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white cursor-pointer"
              >
                <Crown className="size-3.5 fill-current" />
                <span>
                  {isBangla ? "মিটার প্লাস আনলক করুন (৳২০)" : "Unlock Meter Plus (৳20)"}
                </span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Main Snapshots Table & Trajectory */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span>{isBangla ? "স্ন্যাপশট ডেটা লোড হচ্ছে..." : "Loading pulse records..."}</span>
        </div>
      ) : !user && !isPreviewMode ? (
        <Card className="rounded-2xl border shadow-xs p-6 text-center space-y-3">
          <div className="mx-auto p-3 rounded-full bg-primary/10 text-primary w-fit">
            <Clock className="size-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-foreground">
              {isBangla
                ? "দিনভিত্তিক হিসাব ও স্ন্যাপশট দেখতে লগইন করুন"
                : "Sign in to access daily pulse intelligence"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isBangla
                ? "আপনার মিটারের প্রতিদিনের ব্যালেন্স, খরচ এবং দিনভিত্তিক খরচের হিসাব দেখতে একটি ফ্রি একাউন্টে লগইন করুন অথবা নমুনা ডেটা প্রিভিউ দেখুন।"
                : "Track exact daily electricity expenditure and burn rate with a free BillBari account or preview the sample Pro dashboard."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button
              onClick={() => setIsPreviewMode(true)}
              variant="outline"
              className="h-9 px-4 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
            >
              <Eye className="size-3.5" />
              <span>{isBangla ? "নমুনা ডেটা দেখুন (প্রো প্রিভিউ)" : "View Sample Data (Pro Preview)"}</span>
            </Button>
            <Button
              onClick={() => openAuthModal("login")}
              className="h-9 px-5 text-xs font-semibold cursor-pointer"
            >
              {isBangla ? "লগইন বা নিবন্ধন করুন" : "Sign In or Register"}
            </Button>
          </div>
        </Card>
      ) : (
        <SnapshotHistory
          snapshots={displayedSnapshots}
          meterNumber={displayedMeter}
          onTakeSnapshotClick={() => setIsDialogOpen(true)}
          onSnapshotDeleted={() => loadSnapshots()}
        />
      )}

      {/* Snapshot Dialog for optional manual entry */}
      <SnapshotDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        meterNumber={meterFilter || activeMeter || ""}
        currentBalance={activeMeterData?.customerInfo?.balance ?? combinedSnapshots[0]?.balance ?? 0}
        dailyEstimatedCost={combinedSnapshots[0]?.dailyEstimatedCost || 85.0}
        monthlyEstimatedCost={combinedSnapshots[0]?.monthlyEstimatedCost || 2550.0}
        sourceType="manual_reading"
        onSaved={() => loadSnapshots()}
      />
    </div>
  )
}
