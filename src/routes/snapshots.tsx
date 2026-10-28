import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useLiveQuery } from "@tanstack/react-db"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"
import { SnapshotHistory } from "@/features/snapshots/snapshot-history"
import { SnapshotDialog } from "@/features/snapshots/snapshot-dialog"
import { getSnapshotsFn, type SnapshotRecord } from "@/features/snapshots/snapshot-server"
import { snapshotsCollection, syncSnapshotsToClient } from "@/features/db/client-db"
import { useAuth } from "@/features/auth/auth-context"
import { Camera, ShieldCheck, Sparkles, Loader2 } from "lucide-react"

export const Route = createFileRoute("/snapshots")({
  component: SnapshotsPage,
})

function SnapshotsPage() {
  const { user, openAuthModal } = useAuth()
  const [meterFilter] = React.useState("12345678")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [serverSnapshots, setServerSnapshots] = React.useState<SnapshotRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

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

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Camera className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              দৈনিক খরচের হিসাব ও স্ন্যাপশট
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            নিয়মিত ব্যালেন্স লিখে রেখে প্রতিদিন কত টাকা খরচ হচ্ছে তা সহজে দেখুন
          </p>
        </div>

        <Button
          onClick={() => {
            if (!user) {
              openAuthModal("login")
            } else {
              setIsDialogOpen(true)
            }
          }}
          className="h-9 text-xs font-semibold gap-1.5"
        >
          <Camera className="size-4" />
          <span>আজকের স্ন্যাপশট তুলুন</span>
        </Button>
      </div>

      {!user ? (
        <Alert className="py-4 bg-primary/5 border-primary/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h4 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                <Sparkles className="size-4 text-primary" />
                <span>দৈনিক স্ন্যাপশট হিস্ট্রি সেভ করতে লগইন করুন</span>
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                লগইন করলে আপনার মিটার স্ন্যাপশট ক্লাউড ডাটাবেজে স্থায়ীভাবে সংরক্ষিত থাকবে এবং যেকোনো ডিভাইস থেকে অ্যাক্সেস করা যাবে।
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => openAuthModal("login")}
              className="h-8 text-xs font-semibold shrink-0"
            >
              বিনামূল্যে লগইন / নিবন্ধন
            </Button>
          </div>
        </Alert>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-emerald-500" />
          <span>
            লগইন রয়েছে: <strong className="text-foreground">{user.name}</strong> ({user.email}) | TanStack DB রিয়েক্টিভ স্টোরেজ সক্রিয়
          </span>
        </div>
      )}

      {/* Main Snapshots History Component */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span>স্ন্যাপশট ডেটা লোড হচ্ছে...</span>
        </div>
      ) : !user ? (
        <div className="relative rounded-2xl overflow-hidden border border-border">
          {/* Lock Overlay */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-background/80 backdrop-blur-xs text-center space-y-3">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Camera className="size-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-bold text-foreground">
                দিনভিত্তিক হিসাব ও স্ন্যাপশট দেখতে লগইন করুন
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                আপনার মিটারের প্রতিদিনের ব্যালেন্স, খরচ এবং দিনভিত্তিক খরচের হিসাব দেখতে একটি ফ্রি একাউন্টে লগইন করুন।
              </p>
            </div>
            <Button
              onClick={() => openAuthModal("login")}
              className="h-9 px-5 text-xs font-semibold"
            >
              লগইন বা নিবন্ধন করুন
            </Button>
          </div>

          {/* Blurred Background Table Preview */}
          <div className="filter blur-md select-none opacity-30 pointer-events-none p-2">
            <SnapshotHistory
              snapshots={combinedSnapshots}
              meterNumber={meterFilter}
              onTakeSnapshotClick={() => {}}
            />
          </div>
        </div>
      ) : (
        <SnapshotHistory
          snapshots={combinedSnapshots}
          meterNumber={meterFilter}
          onTakeSnapshotClick={() => setIsDialogOpen(true)}
          onSnapshotDeleted={() => loadSnapshots()}
        />
      )}

      {/* Snapshot Dialog */}
      <SnapshotDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        meterNumber={meterFilter}
        currentBalance={combinedSnapshots[0]?.balance || 987.43}
        dailyEstimatedCost={combinedSnapshots[0]?.dailyEstimatedCost || 85.0}
        monthlyEstimatedCost={combinedSnapshots[0]?.monthlyEstimatedCost || 2550.0}
        sourceType="manual_reading"
        onSaved={() => loadSnapshots()}
      />
    </div>
  )
}
