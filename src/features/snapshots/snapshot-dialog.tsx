import * as React from "react"
import { format, parseISO } from "date-fns"
import { bn, enUS } from "date-fns/locale"
import { Calendar as CalendarIcon, Camera } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/toast"
import { StatRow } from "@/features/dashboard/region-parts"
import { useLanguage } from "@/features/i18n/language-context"
import { useAuth } from "../auth/auth-context"
import { snapshotsCollection } from "../db/client-db"
import { saveSnapshotFn, type SnapshotRecord } from "./snapshot-server"

export function SnapshotDialog({
  open,
  onOpenChange,
  meterNumber,
  currentBalance = 0,
  dailyEstimatedCost = 0,
  monthlyEstimatedCost = 0,
  sourceType = "nesco_live",
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  meterNumber: string
  currentBalance?: number
  dailyEstimatedCost?: number
  monthlyEstimatedCost?: number
  sourceType?: SnapshotRecord["sourceType"]
  onSaved?: (snapshot: SnapshotRecord) => void
}) {
  const { user, openAuthModal } = useAuth()
  const { t, isBangla, formatBDT, formatNumber } = useLanguage()

  // local calendar day: the UTC date is still yesterday until 6 AM in Bangladesh
  const [date, setDate] = React.useState(() => format(new Date(), "yyyy-MM-dd"))
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
  const [balance, setBalance] = React.useState(() => String(currentBalance || ""))
  const [readingKwh, setReadingKwh] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (currentBalance) setBalance(String(currentBalance))
  }, [currentBalance])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      openAuthModal("login")
      toast.error(t.snapshots.signInHint)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await saveSnapshotFn({
        data: {
          meterNumber,
          snapshotDate: date,
          balance: parseFloat(balance) || 0,
          readingKwh: parseFloat(readingKwh) || 0,
          dailyEstimatedCost,
          monthlyEstimatedCost,
          sourceType,
          notes: notes.trim() || undefined,
        },
      })

      if (res.success && res.snapshot) {
        try {
          snapshotsCollection.insert({ ...res.snapshot })
        } catch {
          // already in the local cache
        }
        toast.success(t.snapshots.saved)
        onSaved?.(res.snapshot)
        onOpenChange(false)
      } else {
        toast.error(res.error || t.snapshots.saveFailed)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.snapshots.saveFailed)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader className="pr-10 text-left">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2">
              <Camera aria-hidden className="size-4 text-primary" />
              {t.snapshots.dialogTitle}
            </DialogTitle>
            <Badge variant="outline">
              {t.nav.meterBadge}: {formatNumber(meterNumber)}
            </Badge>
          </div>
          <DialogDescription>{t.snapshots.dialogDesc}</DialogDescription>
        </DialogHeader>

        {!user && (
          <Alert>
            <AlertDescription className="flex items-center justify-between gap-2">
              <span>{t.snapshots.signInHint}</span>
              <Button size="sm" variant="outline" onClick={() => openAuthModal("login")}>
                {t.nav.login}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="snap-date-trigger">{t.snapshots.dateLabel}</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger
                  id="snap-date-trigger"
                  render={<Button type="button" variant="outline" className="w-full justify-start" />}
                >
                  <CalendarIcon />
                  <span className="truncate">{format(parseISO(date), "PPP", { locale: isBangla ? bn : enUS })}</span>
                </PopoverTrigger>
                <PopoverContent className="z-[100] w-auto p-0" align="start">
                  <CalendarPicker
                    mode="single"
                    selected={parseISO(date)}
                    onSelect={(day) => {
                      if (day) {
                        setDate(format(day, "yyyy-MM-dd"))
                        setIsCalendarOpen(false)
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="snap-balance">{t.snapshots.balanceLabel}</Label>
              <Input
                id="snap-balance"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="snap-reading">{t.snapshots.readingLabel}</Label>
              <Input
                id="snap-reading"
                type="number"
                step="0.1"
                value={readingKwh}
                onChange={(e) => setReadingKwh(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="snap-meter">{t.snapshots.meterLabel}</Label>
              <Input id="snap-meter" disabled value={meterNumber} className="num" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="snap-notes">{t.snapshots.notesLabel}</Label>
            <Input
              id="snap-notes"
              type="text"
              placeholder={t.snapshots.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {dailyEstimatedCost > 0 && (
            <div className="flex flex-col gap-1.5 rounded-lg bg-muted p-3">
              <StatRow label={t.dashboard.dailyCost} value={`${formatBDT(dailyEstimatedCost)}${t.dashboard.perDay}`} />
              <StatRow label={t.snapshots.projectedMonthly} value={formatBDT(monthlyEstimatedCost)} />
              <p className="text-xs text-muted-foreground">{t.snapshots.burnHint}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.snapshots.cancelBtn}
            </Button>
            <Button type="submit" disabled={isSubmitting || !user}>
              {isSubmitting ? t.snapshots.saving : t.snapshots.saveBtn}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
