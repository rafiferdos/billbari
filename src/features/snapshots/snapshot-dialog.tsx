import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { saveSnapshotFn, type SnapshotRecord } from "./snapshot-server"
import { snapshotsCollection } from "../db/client-db"
import { useAuth } from "../auth/auth-context"
import { formatBDT } from "@/lib/bangla"
import { Camera, Calendar, Hash, Banknote, Gauge, FileText, CheckCircle2 } from "lucide-react"

interface SnapshotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meterNumber: string
  currentBalance?: number
  dailyEstimatedCost?: number
  monthlyEstimatedCost?: number
  sourceType?: "nesco_live" | "manual_reading" | "sample_demo"
  onSaved?: (snapshot: SnapshotRecord) => void
}

export function SnapshotDialog({
  open,
  onOpenChange,
  meterNumber,
  currentBalance = 0,
  dailyEstimatedCost = 0,
  monthlyEstimatedCost = 0,
  sourceType = "nesco_live",
  onSaved,
}: SnapshotDialogProps) {
  const { user, openAuthModal } = useAuth()

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [balance, setBalance] = useState<string>(() => String(currentBalance || ""))
  const [readingKwh, setReadingKwh] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  React.useEffect(() => {
    if (currentBalance) {
      setBalance(String(currentBalance))
    }
  }, [currentBalance])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      openAuthModal("login")
      toast.error("স্ন্যাপশট সংরক্ষণ করতে লগইন করা প্রয়োজন।")
      return
    }

    const numBalance = parseFloat(balance) || 0
    const numReading = parseFloat(readingKwh) || 0

    setIsSubmitting(true)
    try {
      const res = await saveSnapshotFn({
        data: {
          meterNumber,
          snapshotDate: date,
          balance: numBalance,
          readingKwh: numReading,
          dailyEstimatedCost,
          monthlyEstimatedCost,
          sourceType,
          notes: notes.trim() || undefined,
        },
      })

      if (res.success && res.snapshot) {
        // Reactive local update via TanStack DB
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
          // ignore duplicate in local
        }

        toast.success("মিটার স্ন্যাপশট সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে!")
        onSaved?.(res.snapshot)
        onOpenChange(false)
      } else {
        toast.error(res.error || "সংরক্ষণ করতে ব্যর্থ হয়েছে।")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "সংরক্ষণে ত্রুটি দেখা দিয়েছে।")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Camera className="size-4" />
              </span>
              <DialogTitle className="text-lg font-bold">দৈনিক খরচের স্ন্যাপশট নিন</DialogTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              মিটার: {meterNumber}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            আজকের ব্যালেন্স ও রিডিং লিখে রেখে প্রতিদিনের আসল খরচের হিসাব রাখুন।
          </DialogDescription>
        </DialogHeader>

        {!user && (
          <Alert className="py-2.5 bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200">
            <AlertDescription className="text-xs flex items-center justify-between gap-2">
              <span>স্ন্যাপশট সংরক্ষণ করতে বিনামূল্যে লগইন করুন।</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-amber-500/30 font-medium"
                onClick={() => openAuthModal("login")}
              >
                লগইন করুন
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="snap-date" className="text-xs flex items-center gap-1.5">
                <Calendar className="size-3 text-muted-foreground" />
                <span>তারিখ</span>
              </Label>
              <Input
                id="snap-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="snap-balance" className="text-xs flex items-center gap-1.5">
                <Banknote className="size-3 text-muted-foreground" />
                <span>অবশিষ্ট ব্যালেন্স (৳)</span>
              </Label>
              <Input
                id="snap-balance"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="h-9 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="snap-reading" className="text-xs flex items-center gap-1.5">
                <Gauge className="size-3 text-muted-foreground" />
                <span>মিটার রিডিং (ঐচ্ছিক kWh)</span>
              </Label>
              <Input
                id="snap-reading"
                type="number"
                step="0.1"
                placeholder="যেমন: ৩২৪৫.২"
                value={readingKwh}
                onChange={(e) => setReadingKwh(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="snap-meter" className="text-xs flex items-center gap-1.5">
                <Hash className="size-3 text-muted-foreground" />
                <span>মিটার নম্বর</span>
              </Label>
              <Input
                id="snap-meter"
                disabled
                value={meterNumber}
                className="h-9 text-xs bg-muted/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="snap-notes" className="text-xs flex items-center gap-1.5">
              <FileText className="size-3 text-muted-foreground" />
              <span>নোট বা মন্তব্য (ঐচ্ছিক)</span>
            </Label>
            <Input
              id="snap-notes"
              type="text"
              placeholder="যেমন: বাসায় মেহমান এসেছিল / ফ্রিজ সার্ভিসিং করা হয়েছে"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Estimates preview section */}
          <div className="rounded-xl bg-muted/60 p-3 border border-border/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">আনুমানিক দৈনিক খরচ:</span>
              <span className="font-bold text-foreground">{formatBDT(dailyEstimatedCost)} / দিন</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">পুরো মাসের সম্ভাব্য খরচ:</span>
              <span className="font-bold text-primary">{formatBDT(monthlyEstimatedCost)}</span>
            </div>
            <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/60">
              * প্রকৃত ব্যালেন্স থেকে প্রতিদিনের খরচ স্বয়ংক্রিয়ভাবে তুলনা করা হবে।
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !user}
              className="h-8 text-xs font-semibold gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              <span>{isSubmitting ? "সংরক্ষিত হচ্ছে..." : "স্ন্যাপশট সেভ করুন"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
