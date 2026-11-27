import { useState } from "react"
import { Camera, Trash2, TrendingDown, TrendingUp, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { useLanguage } from "@/features/i18n/language-context"
import { snapshotsCollection } from "../db/client-db"
import { burnBetween, newestFirst } from "./snapshot-math"
import { deleteSnapshotFn, type SnapshotRecord } from "./snapshot-server"

type Source = SnapshotRecord["sourceType"]

const SOURCE_STYLE: Record<Source, { variant: "default" | "secondary" | "outline"; className?: string }> = {
  nesco_live: { variant: "default" },
  manual_reading: { variant: "secondary" },
  automated_daily_cron: { variant: "outline", className: "border-success text-success" },
  sample_demo: { variant: "outline", className: "border-warning text-warning" },
}

function SourceTag({ source }: { source: Source }) {
  const { t } = useLanguage()
  return (
    <Badge {...SOURCE_STYLE[source]}>
      {source === "automated_daily_cron" && <Zap aria-hidden />}
      {t.snapshots.sources[source]}
    </Badge>
  )
}

export function SnapshotHistory({
  snapshots,
  meterNumber,
  onSnapshotDeleted,
  sample,
}: {
  snapshots: SnapshotRecord[]
  meterNumber: string
  onSnapshotDeleted?: (id: string) => void
  /** Marks every card of the made-up preview data. */
  sample?: boolean
}) {
  const { t, formatBDT, formatNumber, formatDate } = useLanguage()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selected, setSelected] = useState<SnapshotRecord | null>(null)
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [isDeleting, setIsDeleting] = useState(false)

  // The burn card uses every snapshot of this meter; the source filter narrows only the table.
  const meterSnapshots = newestFirst(snapshots.filter((s) => s.meterNumber === meterNumber))
  const filtered =
    sourceFilter === "all" ? meterSnapshots : meterSnapshots.filter((s) => s.sourceType === sourceFilter)

  const latest = meterSnapshots.at(0)
  const previous = meterSnapshots.at(1)
  const burn = latest && previous ? burnBetween(latest, previous) : null
  const estimate = latest?.dailyEstimatedCost ?? 0
  const faster = burn !== null && burn.perDay > estimate
  const diffPct = burn && estimate > 0 ? Math.round((Math.abs(burn.perDay - estimate) / estimate) * 100) : null

  const sourceItems = [
    { value: "all", label: t.snapshots.allSources },
    ...(Object.keys(SOURCE_STYLE) as Source[]).map((value) => ({ value, label: t.snapshots.sources[value] })),
  ]
  const sampleBadge = sample && <Badge variant="secondary">{t.common.sample}</Badge>
  const dailyCost = (value: number) => (value > 0 ? `~${formatBDT(value)}${t.dashboard.perDay}` : "—")
  const reading = (value: number) => (value > 0 ? `${formatNumber(value)} kWh` : "—")

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const res = await deleteSnapshotFn({ data: { id: deleteId } })
      if (res.success) {
        try {
          snapshotsCollection.delete(deleteId)
        } catch {
          // not in the local cache
        }
        toast.success(t.snapshots.deleted)
        onSnapshotDeleted?.(deleteId)
        setDeleteId(null)
      } else {
        toast.error(t.snapshots.deleteFailed)
      }
    } catch {
      toast.error(t.snapshots.deleteFailed)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="section-stack">
      {burn && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {faster ? <TrendingUp aria-hidden className="size-4" /> : <TrendingDown aria-hidden className="size-4" />}
              {t.snapshots.burnTitle}
            </CardTitle>
            {sampleBadge && <CardAction>{sampleBadge}</CardAction>}
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <p className="num text-3xl font-bold">
              {formatBDT(burn.perDay)}
              {t.dashboard.perDay}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.snapshots.burnOver.replace("{days}", formatNumber(burn.days))}
            </p>
            {diffPct !== null && (
              <p className={faster ? "text-xs text-destructive" : "text-xs text-success"}>
                {(faster ? t.snapshots.faster : t.snapshots.slower).replace("{pct}", formatNumber(diffPct))}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{t.snapshots.historyTitle}</CardTitle>
              {sampleBadge}
            </div>
            <CardDescription>{t.snapshots.historyFor.replace("{meter}", formatNumber(meterNumber))}</CardDescription>
          </div>
          <Select items={sourceItems} value={sourceFilter} onValueChange={(v) => setSourceFilter(v ?? "all")}>
            <SelectTrigger aria-label={t.snapshots.source} className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sourceItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent>
          {!meterSnapshots.length ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Camera aria-hidden />
                </EmptyMedia>
                <EmptyTitle className="text-sm">{t.snapshots.noSnapshotsTitle}</EmptyTitle>
                <EmptyDescription>{t.snapshots.noSnapshotsDesc}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.snapshots.tableDate}</TableHead>
                    <TableHead>{t.snapshots.tableBalance}</TableHead>
                    <TableHead>{t.snapshots.reading}</TableHead>
                    <TableHead>{t.snapshots.tableCost}</TableHead>
                    <TableHead>{t.snapshots.source}</TableHead>
                    <TableHead>{t.snapshots.tableNotes}</TableHead>
                    <TableHead className="text-right">{t.snapshots.tableActions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        {t.snapshots.noneForSource}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((item) => (
                      <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelected(item)}>
                        <TableCell>
                          {/* the keyboard path to the row click: its own click bubbles to the row */}
                          <Button variant="link" size="sm" className="px-0">
                            {formatDate(item.snapshotDate)}
                          </Button>
                        </TableCell>
                        <TableCell className="num font-semibold">{formatBDT(item.balance)}</TableCell>
                        <TableCell className="num text-muted-foreground">{reading(item.readingKwh)}</TableCell>
                        <TableCell className="num">{dailyCost(item.dailyEstimatedCost)}</TableCell>
                        <TableCell>
                          <SourceTag source={item.sourceType} />
                        </TableCell>
                        <TableCell className="max-w-52 truncate text-muted-foreground" title={item.notes}>
                          {item.notes || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {!item.id.startsWith("sample_") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t.snapshots.deleteLabel}
                              className="text-muted-foreground hover:text-destructive"
                              onClick={(event) => {
                                event.stopPropagation()
                                setDeleteId(item.id)
                              }}
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-xs">
          <DialogHeader className="pr-10">
            <DialogTitle>{t.snapshots.deleteTitle}</DialogTitle>
            <DialogDescription>{t.snapshots.deleteDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? t.snapshots.deleting : t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* read-only; deletion stays in its own dialog */}
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader className="pr-10">
            <DialogTitle>{t.snapshots.detailsTitle}</DialogTitle>
            <DialogDescription>{selected ? formatDate(selected.snapshotDate) : ""}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="flex flex-col gap-3 text-sm">
              {sampleBadge}
              <dl className="grid grid-cols-2 gap-2">
                {[
                  [t.snapshots.tableBalance, formatBDT(selected.balance)],
                  [t.snapshots.reading, reading(selected.readingKwh)],
                  [t.snapshots.tableCost, dailyCost(selected.dailyEstimatedCost)],
                  [t.snapshots.source, <SourceTag key="source" source={selected.sourceType} />],
                ].map(([label, value], index) => (
                  <div key={index} className="rounded-lg border border-border p-2.5">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="num font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              {selected.notes && <p className="rounded-lg bg-muted p-3 text-muted-foreground">{selected.notes}</p>}
              <Button variant="outline" className="self-end" onClick={() => setSelected(null)}>
                {t.common.close}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
