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
import { Form } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { format, parseISO } from "date-fns"
import { bn, enUS } from "date-fns/locale"
import { cn } from "cn"
import { toast } from "sonner"
import { saveSnapshotFn, type SnapshotRecord } from "./snapshot-server"
import { snapshotsCollection } from "../db/client-db"
import { useAuth } from "../auth/auth-context"
import { useLanguage } from "@/features/i18n/language-context"
import { Camera, Calendar as CalendarIcon, Hash, Banknote, Gauge, FileText, CheckCircle2 } from "lucide-react"

interface SnapshotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meterNumber: string
  currentBalance?: number
  dailyEstimatedCost?: number
  monthlyEstimatedCost?: number
  sourceType?: "nesco_live" | "manual_reading" | "sample_demo" | "automated_daily_cron"
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
  const { t, isBangla, formatBDT, formatNumber } = useLanguage()

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0])
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
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
      toast.error(isBangla ? "স্ন্যাপশট সংরক্ষণ করতে লগইন করা প্রয়োজন।" : "Please sign in to log a snapshot.")
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

        toast.success(isBangla ? "মিটার স্ন্যাপশট সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে!" : "Snapshot saved successfully!")
        onSaved?.(res.snapshot)
        onOpenChange(false)
      } else {
        toast.error(res.error || (isBangla ? "সংরক্ষণ করতে ব্যর্থ হয়েছে।" : "Failed to save snapshot."))
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (isBangla ? "সংরক্ষণে ত্রুটি দেখা দিয়েছে।" : "An error occurred."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Camera className="size-4" />
              </span>
              <DialogTitle className="text-lg font-bold">
                {t.snapshots.dialogTitle}
              </DialogTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {t.nav.meterBadge}: {formatNumber(meterNumber)}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {t.snapshots.dialogDesc}
          </DialogDescription>
        </DialogHeader>

        {!user && (
          <Alert className="py-2.5 bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200">
            <AlertDescription className="text-xs flex items-center justify-between gap-2">
              <span>{isBangla ? "স্ন্যাপশট সংরক্ষণ করতে বিনামূল্যে লগইন করুন।" : "Sign in to save your daily pulse log."}</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-amber-500/30 font-medium"
                onClick={() => openAuthModal("login")}
              >
                {t.nav.login}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="snap-date-trigger" className="text-xs flex items-center gap-1.5">
                <CalendarIcon className="size-3 text-muted-foreground" />
                <span>{isBangla ? "তারিখ" : "Date"}</span>
              </Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger
                  id="snap-date-trigger"
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-start rounded-md border border-input bg-transparent px-3 text-left font-normal text-xs h-9 shadow-xs hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 size-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">
                    {date ? (
                      format(parseISO(date), "PPP", { locale: isBangla ? bn : enUS })
                    ) : (
                      <span>{isBangla ? "তারিখ নির্বাচন করুন" : "Pick a date"}</span>
                    )}
                  </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100]" align="start">
                  <CalendarPicker
                    mode="single"
                    selected={date ? parseISO(date) : undefined}
                    onSelect={(selectedDay) => {
                      if (selectedDay) {
                        setDate(format(selectedDay, "yyyy-MM-dd"))
                        setIsCalendarOpen(false)
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="snap-balance" className="text-xs flex items-center gap-1.5">
                <Banknote className="size-3 text-muted-foreground" />
                <span>{t.snapshots.balanceLabel}</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="snap-reading" className="text-xs flex items-center gap-1.5">
                <Gauge className="size-3 text-muted-foreground" />
                <span>{isBangla ? "মিটার রিডিং (ঐচ্ছিক kWh)" : "Meter Reading (Optional kWh)"}</span>
              </Label>
              <Input
                id="snap-reading"
                type="number"
                step="0.1"
                placeholder={isBangla ? "যেমন: ৩২৪৫.২" : "e.g. 3245.2"}
                value={readingKwh}
                onChange={(e) => setReadingKwh(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="snap-meter" className="text-xs flex items-center gap-1.5">
                <Hash className="size-3 text-muted-foreground" />
                <span>{t.snapshots.meterLabel}</span>
              </Label>
              <Input
                id="snap-meter"
                disabled
                value={meterNumber}
                className="h-9 text-xs bg-muted/50 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="snap-notes" className="text-xs flex items-center gap-1.5">
              <FileText className="size-3 text-muted-foreground" />
              <span>{t.snapshots.notesLabel}</span>
            </Label>
            <Input
              id="snap-notes"
              type="text"
              placeholder={isBangla ? "যেমন: বাসায় মেহমান এসেছিল / ফ্রিজ সার্ভিসিং করা হয়েছে" : "e.g. Guests over / AC ran all night"}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Estimates preview section */}
          <div className="rounded-xl bg-muted/60 p-3 border border-border/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {isBangla ? "আনুমানিক দৈনিক খরচ:" : "Estimated Daily Cost:"}
              </span>
              <span className="font-bold text-foreground">
                {formatBDT(dailyEstimatedCost)} / {isBangla ? "দিন" : "day"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {isBangla ? "পুরো মাসের সম্ভাব্য খরচ:" : "Projected Monthly Cost:"}
              </span>
              <span className="font-bold text-primary">{formatBDT(monthlyEstimatedCost)}</span>
            </div>
            <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/60">
              {isBangla
                ? "* প্রকৃত ব্যালেন্স থেকে প্রতিদিনের খরচ স্বয়ংক্রিয়ভাবে তুলনা করা হবে।"
                : "* Daily burn rate calculated automatically from subsequent balance changes."}
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
              {t.snapshots.cancelBtn}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !user}
              className="h-8 text-xs font-semibold gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              <span>{isSubmitting ? (isBangla ? "সংরক্ষিত হচ্ছে..." : "Saving...") : t.snapshots.saveBtn}</span>
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
