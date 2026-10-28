import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { NESCO_LTA_SLABS, type BillBreakdown } from "@/lib/tariff-constants"
import { toBanglaNumber, formatBDT } from "@/lib/bangla"
import { Info, Zap, AlertTriangle } from "lucide-react"

interface SlabProgressCardProps {
  billBreakdown: BillBreakdown
  monthlyUnits: number
}

export function SlabProgressCard({ billBreakdown, monthlyUnits }: SlabProgressCardProps) {
  const currentSlab = billBreakdown.activeStep
  const nextSlab = NESCO_LTA_SLABS.find((s) => s.step === currentSlab.step + 1) || null

  const maxCapacity = currentSlab.maxUnits || 600
  const progressPct = Math.min(100, Math.round((monthlyUnits / maxCapacity) * 100))

  return (
    <Card className="rounded-2xl border shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Zap className="size-4" />
            </span>
            <CardTitle className="text-base font-bold">ট্যারিফ স্ল্যাব ট্র্যাকার</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs bg-muted/50 border-primary/20 text-primary font-medium">
            গণনাকৃত বিশ্লেষণ (Estimate)
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          নেসকো আবাসিক (LT-A) ট্যারিফ ধাপ অনুযায়ী বর্তমান অবস্থান
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">বর্তমান সক্রিয় ধাপ</p>
            <h4 className="text-lg font-bold text-foreground flex items-center gap-1.5 mt-0.5">
              <span>{currentSlab.nameBangla}</span>
            </h4>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium">প্রতি ইউনিট মূল্য</p>
            <span className="text-lg font-extrabold text-primary">
              {formatBDT(currentSlab.ratePerUnit)}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span>মাসিক মোট ব্যবহার: {toBanglaNumber(monthlyUnits)} kWh</span>
            <span>স্ল্যাব সীমা: {currentSlab.maxUnits ? `${toBanglaNumber(currentSlab.maxUnits)} kWh` : "অসীম"}</span>
          </div>
          <Progress value={progressPct} className="h-2.5 rounded-full" />
        </div>

        {nextSlab ? (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-start gap-2 text-xs">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-amber-900 dark:text-amber-200 leading-relaxed">
              আর মাত্র <strong>{toBanglaNumber(Math.max(0, (currentSlab.maxUnits || 0) - monthlyUnits))} kWh</strong> ব্যবহার করলে আপনার ট্যারিফ <strong>{nextSlab.nameBangla}</strong>-এ উন্নীত হবে এবং প্রতি ইউনিটের রেট <strong>{formatBDT(nextSlab.ratePerUnit)}</strong> হবে।
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-muted/60 p-2.5 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
            <span>আপনি সর্বোচ্চ ট্যারিফ ধাপে অবস্থান করছেন (প্রতি ইউনিট ৳১৪.৬১)।</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">আনুমানিক ভ্যাট (৫%):</span>
            <span className="font-semibold">{formatBDT(billBreakdown.vatAmount)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">প্রিপেইড রিবেট (১% সাশ্রয়):</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              -{formatBDT(billBreakdown.rebateAmount)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
