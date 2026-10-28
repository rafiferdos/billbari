import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { calculateNescoBill, NESCO_LTA_SLABS, LIFELINE_RATE } from "@/lib/tariff-constants"
import { formatBDT, toBanglaNumber } from "@/lib/bangla"
import { Calculator, Sparkles, CheckCircle2, Flame, Wind, Tv } from "lucide-react"

export const Route = createFileRoute("/tariffs")({
  component: TariffsPage,
})

function TariffsPage() {
  const [unitsInput, setUnitsInput] = React.useState<number>(240)
  const [loadKw, setLoadKw] = React.useState<number>(2)
  const [isSinglePhase, setIsSinglePhase] = React.useState<boolean>(true)

  const breakdown = React.useMemo(() => {
    return calculateNescoBill(unitsInput, loadKw, isSinglePhase)
  }, [unitsInput, loadKw, isSinglePhase])

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-5xl">
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-primary/10 text-primary">
            <Calculator className="size-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            নেসকো প্রিপেইড ট্যারিফ ও বিল ক্যালকুলেটর
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          বাংলাদেশ এনার্জি রেগুলেটরি কমিশন (BERC) কর্তৃক নির্ধারিত আবাসিক LT-A ট্যারিফ অনুযায়ী বিল হিসাব
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Controls */}
        <Card className="rounded-2xl border shadow-xs h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">ব্যবহারের পরিমাণ দিন</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              মাসিক আনুমানিক বিদ্যুৎ ইউনিট ও সংযোগ তথ্য
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="units" className="text-xs font-medium">
                মাসিক বিদ্যুৎ খরচ (kWh ইউনিট)
              </Label>
              <div className="relative">
                <Input
                  id="units"
                  type="number"
                  min="0"
                  max="5000"
                  value={unitsInput}
                  onChange={(e) => setUnitsInput(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="h-10 text-sm font-bold pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                  kWh
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="800"
                step="5"
                value={unitsInput}
                onChange={(e) => setUnitsInput(parseInt(e.target.value, 10))}
                className="w-full accent-primary mt-2 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="load" className="text-xs font-medium">
                  অনুমোদিত লোড (kW)
                </Label>
                <Input
                  id="load"
                  type="number"
                  min="1"
                  max="50"
                  value={loadKw}
                  onChange={(e) => setLoadKw(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">সংযোগের ধরন</Label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsSinglePhase(true)}
                    className={`flex-1 py-1.5 text-xs rounded-lg border font-medium cursor-pointer transition-colors ${
                      isSinglePhase
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    1-Phase
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSinglePhase(false)}
                    className={`flex-1 py-1.5 text-xs rounded-lg border font-medium cursor-pointer transition-colors ${
                      !isSinglePhase
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    3-Phase
                  </button>
                </div>
              </div>
            </div>

            {/* Total Bill Highlight Box */}
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 text-center space-y-1 mt-4">
              <span className="text-xs font-medium text-muted-foreground block">
                আনুমানিক মোট প্রদেয় বিল
              </span>
              <div className="text-3xl font-extrabold text-primary">
                {formatBDT(breakdown.totalBill)}
              </div>
              <span className="text-[11px] text-muted-foreground block">
                গড় রেট: <strong>{formatBDT(breakdown.effectiveRatePerUnit)}</strong> প্রতি kWh
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Bill Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border shadow-xs overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">ধাপভিত্তিক ট্যারিফ বিল বিভাজন</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {breakdown.activeStep.nameBangla}
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                কোন ধাপে কত ইউনিট এবং কত টাকা ধার্য হয়েছে
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>ট্যারিফ ধাপ</TableHead>
                    <TableHead>ব্যবহার ইউনিট</TableHead>
                    <TableHead>প্রতি ইউনিট রেট</TableHead>
                    <TableHead className="text-right">মোট অর্থ (৳)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdown.slabBreakdown.map((item, idx) => (
                    <TableRow key={idx} className="text-xs">
                      <TableCell className="font-medium text-foreground">
                        {item.nameBangla}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {toBanglaNumber(item.unitsInSlab)} kWh
                      </TableCell>
                      <TableCell>{formatBDT(item.rate)}</TableCell>
                      <TableCell className="text-right font-bold">
                        {formatBDT(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Summary Rows */}
                  <TableRow className="text-xs bg-muted/30">
                    <TableCell colSpan={3} className="text-muted-foreground font-medium">
                      বিদ্যুৎ শক্তি চার্জ (Energy Charge):
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatBDT(breakdown.energyCharge)}
                    </TableCell>
                  </TableRow>

                  <TableRow className="text-xs bg-muted/30">
                    <TableCell colSpan={3} className="text-muted-foreground">
                      ডিমান্ড চার্জ ({toBanglaNumber(loadKw)} kW × ৳৪২):
                    </TableCell>
                    <TableCell className="text-right">{formatBDT(breakdown.demandCharge)}</TableCell>
                  </TableRow>

                  <TableRow className="text-xs bg-muted/30">
                    <TableCell colSpan={3} className="text-muted-foreground">
                      মিটার ভাড়া ({isSinglePhase ? "সিঙ্গেল ফেজ" : "থ্রি ফেজ"}):
                    </TableCell>
                    <TableCell className="text-right">{formatBDT(breakdown.meterRent)}</TableCell>
                  </TableRow>

                  <TableRow className="text-xs bg-muted/30">
                    <TableCell colSpan={3} className="text-muted-foreground">
                      সরকারি ভ্যাট (৫%):
                    </TableCell>
                    <TableCell className="text-right">{formatBDT(breakdown.vatAmount)}</TableCell>
                  </TableRow>

                  <TableRow className="text-xs bg-muted/30 text-emerald-600 dark:text-emerald-400">
                    <TableCell colSpan={3} className="font-medium">
                      প্রিপেইড রিবেট / ছাড় (১%):
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      -{formatBDT(breakdown.rebateAmount)}
                    </TableCell>
                  </TableRow>

                  <TableRow className="text-sm bg-primary/5 font-extrabold border-t-2 border-primary/20">
                    <TableCell colSpan={3} className="text-foreground">
                      সর্বমোট আনুমানিক প্রদেয় বিল:
                    </TableCell>
                    <TableCell className="text-right text-primary text-base">
                      {formatBDT(breakdown.totalBill)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Official Slabs Reference Table */}
      <Card className="rounded-2xl border shadow-xs overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">নেসকো LT-A অফিশিয়াল ট্যারিফ চার্ট</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            বাংলাদেশে বাংলাদেশ এনার্জি রেগুলেটরি কমিশন কর্তৃক অনুমোদিত সর্বশেষ রেট তালিকা
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>ধাপ ক্রম</TableHead>
                <TableHead>ইউনিট সীমা</TableHead>
                <TableHead>প্রতি ইউনিট রেট (৳)</TableHead>
                <TableHead>মন্তব্য</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="text-xs">
                <TableCell className="font-semibold">লাইফলাইন</TableCell>
                <TableCell>০ - ৫০ ইউনিট</TableCell>
                <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatBDT(LIFELINE_RATE)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  শুধুমাত্র মোট মাসিক ব্যবহার ৫০ ইউনিটের মধ্যে সীমাবদ্ধ থাকলে প্রযোজ্য
                </TableCell>
              </TableRow>
              {NESCO_LTA_SLABS.map((s) => (
                <TableRow key={s.step} className="text-xs">
                  <TableCell className="font-semibold">{toBanglaNumber(s.step)}</TableCell>
                  <TableCell>
                    {toBanglaNumber(s.minUnits)} - {s.maxUnits ? `${toBanglaNumber(s.maxUnits)} ইউনিট` : "ঊর্ধ্বে"}
                  </TableCell>
                  <TableCell className="font-bold text-foreground">
                    {formatBDT(s.ratePerUnit)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.step >= 5 ? "উচ্চতর ধাপ (সতর্কতা কাম্য)" : "সাধারণ আবাসিক রেট"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Home Appliances Power Consumption Guide */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h3 className="text-base font-bold">বাসার প্রধান যন্ত্রপাতির বিদ্যুৎ ব্যয়ের আনুমানিক চিত্র</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="rounded-2xl p-4 border shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Wind className="size-4" />
              </span>
              <Badge variant="outline" className="text-[10px]">১.৫ টন এসি</Badge>
            </div>
            <h4 className="text-xs font-bold">ইনভার্টার এসি</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              প্রতি রাতে ৮ ঘণ্টা (২৫°C) চালালে মাসে আনুমানিক ১৮০-২২০ ইউনিট খরচ হয় (~৳১,৬০০ - ৳২,০০০)।
            </p>
          </Card>

          <Card className="rounded-2xl p-4 border shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Flame className="size-4" />
              </span>
              <Badge variant="outline" className="text-[10px]">গিজার / হিটার</Badge>
            </div>
            <h4 className="text-xs font-bold">ওয়াটার হিটার</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              প্রতিদিন ১ ঘণ্টা চালালে মাসে প্রায় ৪৫-৬০ ইউনিট খরচ হয় (~৳৩৫০ - ৳৫০০)।
            </p>
          </Card>

          <Card className="rounded-2xl p-4 border shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
              </span>
              <Badge variant="outline" className="text-[10px]">রেফ্রিজারেটর</Badge>
            </div>
            <h4 className="text-xs font-bold">ফ্রিজ (২৫০ লিটার)</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              ২৪ ঘণ্টা সচল থাকলে ইনভার্টার প্রযুক্তিতে মাসে গড়ে ৩৫-৪৫ ইউনিট খরচ হয় (~৳২৮০ - ৳৩৬০)।
            </p>
          </Card>

          <Card className="rounded-2xl p-4 border shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Tv className="size-4" />
              </span>
              <Badge variant="outline" className="text-[10px]">টিভি ও ফ্যান</Badge>
            </div>
            <h4 className="text-xs font-bold">৩টি সিলিং ফ্যান ও টিভি</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              সারাদিন ব্যবহারে মাসে গড়ে ৬০-৮০ ইউনিট খরচ হতে পারে (~৳৪৫০ - ৳৬৫০)।
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
