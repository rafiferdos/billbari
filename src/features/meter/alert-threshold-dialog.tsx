import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Bell } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/features/i18n/language-context"

// Phase 5 retention: a low-balance alert threshold. This is deliberately
// local-only for now: it is stored on this device and browser, not on the
// server, because saved_meters has no alert-threshold field yet. A server
// field is a backend change and is out of scope for this design phase.
// The dialog says so plainly, so a user does not expect a push alert.
export function alertThresholdKey(meterNumber: string): string {
  return `billbari_alert_threshold_${meterNumber.replace(/[^0-9]/g, "")}`
}

export function getAlertThreshold(meterNumber: string | null | undefined): number | null {
  if (!meterNumber || typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(alertThresholdKey(meterNumber))
    if (!raw) return null
    const value = Number(raw)
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

export function AlertThresholdDialog({
  open,
  onOpenChange,
  meterNumber,
  currentBalance,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  meterNumber: string
  currentBalance: number
  onSaved?: (threshold: number) => void
}) {
  const { isBangla, formatBDT } = useLanguage()
  const [threshold, setThreshold] = React.useState(500)

  React.useEffect(() => {
    if (open) {
      setThreshold(getAlertThreshold(meterNumber) ?? 500)
    }
  }, [open, meterNumber])

  const handleSave = () => {
    try {
      window.localStorage.setItem(alertThresholdKey(meterNumber), String(threshold))
    } catch {
      toast.error(isBangla ? "এই ডিভাইসে সেটিং সংরক্ষণ করা যায়নি।" : "Could not save this setting on this device.")
      return
    }
    onSaved?.(threshold)
    onOpenChange(false)
    toast.success(
      isBangla
        ? `ব্যালেন্স ${formatBDT(threshold)}-এর নিচে গেলে সতর্কতা দেখানো হবে।`
        : `You will see a warning when balance falls below ${formatBDT(threshold)}.`
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Bell className="size-4 text-primary" />
            {isBangla ? "কম ব্যালেন্স সতর্কতা" : "Low-balance alert"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {isBangla
              ? "ব্যালেন্স এই সীমার নিচে গেলে হোম পেজে সতর্কতা দেখানো হবে। এটি শুধু এই ডিভাইসে সংরক্ষিত হবে, সার্ভারে নয়।"
              : "When balance falls below this limit, home will show a warning. This is stored only on this device, not on the server."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs">
            <Label>
              {isBangla ? "সতর্কতার সীমা" : "Alert limit"}
            </Label>
            <span className="font-extrabold text-foreground">{formatBDT(threshold)}</span>
          </div>
          <Slider
            value={[threshold]}
            min={100}
            max={2000}
            step={50}
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value
              if (typeof next === "number") setThreshold(next)
            }}
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{formatBDT(100)}</span>
            <span>
              {isBangla ? `বর্তমান ব্যালেন্স: ${formatBDT(currentBalance)}` : `Current balance: ${formatBDT(currentBalance)}`}
            </span>
            <span>{formatBDT(2000)}</span>
          </div>
          <Button onClick={handleSave} className="w-full">
            {isBangla ? "সতর্কতা সংরক্ষণ করুন" : "Save alert"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
