import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { SnapshotRecord } from "./snapshot-server"
import { deleteSnapshotFn } from "./snapshot-server"
import { snapshotsCollection } from "../db/client-db"
import { formatBDT, toBanglaNumber, formatDateBangla } from "@/lib/bangla"
import { Trash2, TrendingDown, TrendingUp, AlertCircle, Camera } from "lucide-react"

interface SnapshotHistoryProps {
  snapshots: SnapshotRecord[]
  meterNumber: string
  onSnapshotDeleted?: (id: string) => void
  onTakeSnapshotClick?: () => void
}

export function SnapshotHistory({
  snapshots,
  meterNumber,
  onSnapshotDeleted,
  onTakeSnapshotClick,
}: SnapshotHistoryProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter for this meter
  const meterSnapshots = snapshots.filter((s) => s.meterNumber === meterNumber)

  // Calculate trajectory if at least 2 snapshots exist
  const trajectory = (() => {
    if (meterSnapshots.length < 2) return null
    const latest = meterSnapshots[0]
    const previous = meterSnapshots[1]

    const d1 = new Date(latest.snapshotDate).getTime()
    const d2 = new Date(previous.snapshotDate).getTime()
    const diffDays = Math.max(1, Math.round(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24)))

    // Burn rate = (previous balance - latest balance) / diffDays
    const balanceDiff = previous.balance - latest.balance
    const actualDailyBurn = balanceDiff > 0 ? Math.round((balanceDiff / diffDays) * 100) / 100 : 0

    const isHigherThanEstimate = actualDailyBurn > latest.dailyEstimatedCost
    const diffPct = latest.dailyEstimatedCost > 0
      ? Math.round((Math.abs(actualDailyBurn - latest.dailyEstimatedCost) / latest.dailyEstimatedCost) * 100)
      : 0

    return {
      diffDays,
      actualDailyBurn,
      isHigherThanEstimate,
      diffPct,
      latestDate: latest.snapshotDate,
      prevDate: previous.snapshotDate,
    }
  })()

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const res = await deleteSnapshotFn({ data: { id: deleteId } })
      if (res.success) {
        try {
          snapshotsCollection.delete(deleteId)
        } catch {
          // ignore
        }
        toast.success("স্ন্যাপশট ডিলিট করা হয়েছে।")
        onSnapshotDeleted?.(deleteId)
        setDeleteId(null)
      } else {
        toast.error("স্ন্যাপশট ডিলিট করতে সমস্যা হয়েছে।")
      }
    } catch {
      toast.error("স্ন্যাপশট ডিলিট করা যায়নি।")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Trajectory comparison card if multiple snapshots exist */}
      {trajectory && (
        <Card className="rounded-2xl border border-primary/20 bg-primary/5">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="p-2.5 rounded-xl bg-primary text-primary-foreground shrink-0 mt-0.5">
                {trajectory.isHigherThanEstimate ? (
                  <TrendingUp className="size-5" />
                ) : (
                  <TrendingDown className="size-5" />
                )}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm sm:text-base">বাস্তব ব্যয়ের গতিপথ (Actual Burn Trajectory)</h4>
                  <Badge variant="outline" className="text-[10px] bg-background">
                    {toBanglaNumber(trajectory.diffDays)} দিনের বিশ্লেষণ
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  গত {toBanglaNumber(trajectory.diffDays)} দিনে আপনার প্রতিদিন গড়ে{" "}
                  <strong className="text-foreground">{formatBDT(trajectory.actualDailyBurn)}</strong> খরচ হয়েছে।
                  {trajectory.isHigherThanEstimate ? (
                    <span className="text-rose-600 dark:text-rose-400 font-medium">
                      {" "}(অনুমানকৃত খরচের চেয়ে প্রায় {toBanglaNumber(trajectory.diffPct)}% বেশি দ্রুত ব্যালেন্স শেষ হচ্ছে)।
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {" "}(অনুমানের চেয়ে {toBanglaNumber(trajectory.diffPct)}% কম খরচে সাশ্রয়ী ব্যবহার হচ্ছে)।
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
              <span className="text-[11px] text-muted-foreground block">বাস্তব দৈনিক ক্ষয়:</span>
              <span className="text-xl font-extrabold text-foreground">
                {formatBDT(trajectory.actualDailyBurn)} / দিন
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Snapshots Table Card */}
      <Card className="rounded-2xl border shadow-xs overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold">
              সংরক্ষিত মিটার স্ন্যাপশট হিস্ট্রি
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              মিটার নং {meterNumber}-এর তারিখভিত্তিক রেকর্ডকৃত ব্যালেন্স ও আনুমানিক দৈনিক খরচ
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={onTakeSnapshotClick}
            className="h-8 text-xs font-semibold gap-1.5"
          >
            <Camera className="size-3.5" />
            <span>নতুন স্ন্যাপশট তুলুন</span>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {!meterSnapshots.length ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <Camera className="size-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-medium">এই মিটারের কোনো স্ন্যাপশট এখনও সংরক্ষিত হয়নি।</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                আজকের ব্যালেন্স সংরক্ষণ করে প্রতিদিনের খরচের ওঠানামা ট্র্যাক করতে উপরের বাটনে ক্লিক করুন।
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>তারিখ</TableHead>
                    <TableHead>অবশিষ্ট ব্যালেন্স (৳)</TableHead>
                    <TableHead>মিটার রিডিং (kWh)</TableHead>
                    <TableHead>দৈনিক আনুমানিক ব্যয়</TableHead>
                    <TableHead>উৎস</TableHead>
                    <TableHead>নোট / মন্তব্য</TableHead>
                    <TableHead className="text-right">একশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meterSnapshots.map((item) => (
                    <TableRow key={item.id} className="text-xs hover:bg-muted/40">
                      <TableCell className="font-semibold whitespace-nowrap">
                        {formatDateBangla(item.snapshotDate)}
                      </TableCell>
                      <TableCell className="font-bold text-foreground">
                        {formatBDT(item.balance)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.readingKwh > 0 ? `${toBanglaNumber(item.readingKwh)} kWh` : "-"}
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        ~{formatBDT(item.dailyEstimatedCost)}/দিন
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.sourceType === "nesco_live" ? "default" : "secondary"}
                          className="text-[10px] font-normal"
                        >
                          {item.sourceType === "nesco_live"
                            ? "নেসকো লাইভ"
                            : item.sourceType === "sample_demo"
                            ? "ডেমো রেফারেন্স"
                            : "ম্যানুয়াল রিডিং"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[180px] truncate">
                        {item.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Deletion */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertCircle className="size-4" />
              <DialogTitle className="text-base font-bold">স্ন্যাপশট মুছে ফেলতে চান?</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              এই রেকর্ডটি আপনার ট্র্যাকিং হিস্ট্রি থেকে স্থায়ীভাবে মুছে ফেলা হবে।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
            >
              বাতিল
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-8 text-xs font-semibold"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "মুছে ফেলা হচ্ছে..." : "মুছে ফেলুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
