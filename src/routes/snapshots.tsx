import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useLiveQuery } from "@tanstack/react-db"
import { Camera, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { useAuth } from "@/features/auth/auth-context"
import { snapshotsCollection, syncSnapshotsToClient } from "@/features/db/client-db"
import { useLanguage } from "@/features/i18n/language-context"
import { useMeter } from "@/features/meter/meter-context"
import { ProGate, useEntitlement } from "@/features/payments/pro-gate"
import { BalanceTrendChart } from "@/features/snapshots/balance-trend-chart"
import { SAMPLE_PRO_SNAPSHOTS } from "@/features/snapshots/sample-snapshots"
import { SavedMetersOverview } from "@/features/snapshots/saved-meters-overview"
import { SnapshotDialog } from "@/features/snapshots/snapshot-dialog"
import { SnapshotHistory } from "@/features/snapshots/snapshot-history"
import { snapshotDefaults } from "@/features/snapshots/snapshot-math"
import { getSnapshotsFn, syncAutomatedDailyPulseFn, type SnapshotRecord } from "@/features/snapshots/snapshot-server"

const SAMPLE_METER = SAMPLE_PRO_SNAPSHOTS[0].meterNumber

export const Route = createFileRoute("/snapshots")({
  component: SnapshotsPage,
})

function SnapshotsPage() {
  const { t } = useLanguage()
  const { isLoading } = useAuth()
  const { allowed } = useEntitlement("snapshots")

  return (
    <div className="section-stack">
      <h1 className="text-2xl">{t.nav.tracking}</h1>
      {!allowed && isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <ProGate feature="snapshots" variant="section">
            <Tracking />
          </ProGate>
          {!allowed && <SamplePreview />}
        </>
      )}
    </div>
  )
}

function SamplePreview() {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <>
      <Button variant="outline" className="self-center" aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? t.snapshots.hideSample : t.snapshots.showSample}
      </Button>
      {isOpen && (
        <>
          <BalanceTrendChart snapshots={SAMPLE_PRO_SNAPSHOTS} meterNumber={SAMPLE_METER} sample />
          <SnapshotHistory snapshots={SAMPLE_PRO_SNAPSHOTS} meterNumber={SAMPLE_METER} sample />
        </>
      )}
    </>
  )
}

function Tracking() {
  const { user } = useAuth()
  const { activeMeter, activeMeterData } = useMeter()
  const { t, formatBDT } = useLanguage()

  // a search may use the consumer number; snapshots are stored under the meter number
  const openMeter = activeMeterData?.customerInfo.meterNumber || activeMeter
  const [meter, setMeter] = React.useState(openMeter)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [serverSnapshots, setServerSnapshots] = React.useState<SnapshotRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSyncing, setIsSyncing] = React.useState(false)

  React.useEffect(() => {
    if (openMeter) setMeter(openMeter)
  }, [openMeter])

  // Reactive subscription from client TanStack DB
  const cached = useLiveQuery(snapshotsCollection).data

  const loadSnapshots = React.useCallback(async () => {
    if (!user) return
    try {
      const records = await getSnapshotsFn()
      setServerSnapshots(records)
      syncSnapshotsToClient(records.map((r) => ({ ...r })))
    } catch {
      // offline: the cached copy stays on screen
    } finally {
      setIsLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    void loadSnapshots()
  }, [loadSnapshots])

  // client copy takes precedence: it updates the moment a snapshot is added or deleted
  const snapshots: SnapshotRecord[] = React.useMemo(
    () => (cached?.length ? cached.map((c) => ({ ...c, userId: user?.id ?? "" })) : serverSnapshots),
    [cached, serverSnapshots, user]
  )
  const defaults = React.useMemo(
    () => snapshotDefaults(meter, activeMeterData, snapshots),
    [meter, activeMeterData, snapshots]
  )

  const syncToday = async () => {
    setIsSyncing(true)
    try {
      const res = await syncAutomatedDailyPulseFn({ data: { meterNumber: meter || undefined } })
      if (res.success && res.snapshot) {
        try {
          snapshotsCollection.insert({ ...res.snapshot })
        } catch {
          // already in the local cache
        }
        toast.success(t.snapshots.synced.replace("{balance}", formatBDT(res.snapshot.balance)))
        await loadSnapshots()
      } else {
        toast.error(res.error || t.snapshots.syncFailed)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.snapshots.syncFailed)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="section-stack">
      <SavedMetersOverview snapshots={snapshots} />

      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={!meter} onClick={() => setIsDialogOpen(true)}>
          <Camera />
          {t.dashboard.snapshot}
        </Button>
        <Button variant="outline" disabled={isSyncing} onClick={syncToday}>
          {isSyncing ? <Spinner /> : <RefreshCw />}
          {t.snapshots.syncToday}
        </Button>
        {!meter && <p className="text-xs text-muted-foreground">{t.snapshots.pickMeter}</p>}
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        meter && (
          <>
            <BalanceTrendChart snapshots={snapshots} meterNumber={meter} />
            <SnapshotHistory snapshots={snapshots} meterNumber={meter} onSnapshotDeleted={() => void loadSnapshots()} />
          </>
        )
      )}

      <SnapshotDialog
        // fresh form per meter, so one meter's balance never carries into another's entry
        key={meter}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        meterNumber={meter}
        currentBalance={defaults.balance}
        dailyEstimatedCost={defaults.daily}
        monthlyEstimatedCost={defaults.monthly}
        sourceType="manual_reading"
        onSaved={() => void loadSnapshots()}
      />
    </div>
  )
}
