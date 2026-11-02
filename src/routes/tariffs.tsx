import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { calculateNescoBill, NESCO_LTA_SLABS, LIFELINE_RATE } from "@/lib/tariff-constants"
import { Calculator, SlidersHorizontal, ArrowDown } from "lucide-react"
import { ApplianceSimulator } from "@/features/tariffs/appliance-simulator"
import { BillSavingSection } from "@/features/tariffs/bill-saving-section"
import { useLanguage } from "@/features/i18n/language-context"

export const Route = createFileRoute("/tariffs")({
  component: TariffsPage,
})

function TariffsPage() {
  const { t, isBangla, formatBDT, formatNumber } = useLanguage()
  const [unitsInput, setUnitsInput] = React.useState<number>(240)
  const [loadKw, setLoadKw] = React.useState<number>(2)
  const [isSinglePhase, setIsSinglePhase] = React.useState<boolean>(true)

  const breakdown = React.useMemo(() => {
    return calculateNescoBill(unitsInput, loadKw, isSinglePhase)
  }, [unitsInput, loadKw, isSinglePhase])

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-5xl">
      <div id="main-calculator-top" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Calculator className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t.tariffs.title}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t.tariffs.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const el = document.getElementById("appliance-simulator-section")
            if (el) el.scrollIntoView({ behavior: "smooth" })
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-xs font-semibold text-primary transition-colors cursor-pointer self-start sm:self-auto"
        >
          <SlidersHorizontal className="size-3.5" />
          <span>{isBangla ? "ঘরের যন্ত্রপাতি দিয়ে ইউনিট মাপুন" : "Simulate Home Appliances"}</span>
          <ArrowDown className="size-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Controls */}
        <Card className="rounded-2xl border shadow-xs h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">
              {isBangla ? "ব্যবহারের পরিমাণ দিন" : "Input Power Usage"}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {isBangla ? "মাসিক আনুমানিক বিদ্যুৎ ইউনিট ও সংযোগ তথ্য" : "Estimated monthly units & load details"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="units" className="text-xs font-medium">
                {isBangla ? "মাসিক বিদ্যুৎ খরচ (kWh ইউনিট)" : "Monthly Energy Usage (kWh)"}
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
                  {t.customer.sanctionedLoad} (kW)
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
                <Label className="text-xs font-medium">{t.customer.phase}</Label>
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
                {t.tariffs.summaryNetBill}
              </span>
              <div className="text-3xl font-extrabold text-primary">
                {formatBDT(breakdown.totalBill)}
              </div>
              <span className="text-[11px] text-muted-foreground block">
                {isBangla ? "গড় রেট:" : "Effective rate:"} <strong>{formatBDT(breakdown.effectiveRatePerUnit)}</strong> / kWh
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Bill Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border shadow-xs overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">
                  {isBangla ? "ধাপভিত্তিক ট্যারিফ বিল বিভাজন" : "Tier-by-Tier Bill Breakdown"}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {isBangla ? breakdown.activeStep.nameBangla : breakdown.activeStep.nameEnglish}
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                {isBangla
                  ? "কোন ধাপে কত ইউনিট এবং কত টাকা ধার্য হয়েছে"
                  : "Units and rate allocation applied across each stepped bracket"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>{isBangla ? "ট্যারিফ ধাপ" : "Tariff Slab"}</TableHead>
                    <TableHead>{isBangla ? "ব্যবহার ইউনিট" : "Units (kWh)"}</TableHead>
                    <TableHead>{isBangla ? "প্রতি ইউনিট রেট" : "Rate per kWh"}</TableHead>
                    <TableHead className="text-right">{isBangla ? "মোট অর্থ (৳)" : "Amount (৳)"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdown.slabBreakdown.map((item, idx) => (
                    <TableRow key={idx} className="text-xs">
                      <TableCell className="font-medium text-foreground">
                        {isBangla ? item.nameBangla : item.nameEnglish}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatNumber(item.unitsInSlab)} kWh
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
                      {t.tariffs.summaryEnergyCost}:
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatBDT(breakdown.energyCharge)}
                    </TableCell>
                  </TableRow>

                  <TableRow className="text-xs bg-muted/30">
                    <TableCell colSpan={3} className="text-muted-foreground">
                      {t.slab.demandCharge} ({formatNumber(loadKw)} kW × ৳42):
                    </TableCell>
                    <TableCell className="text-right">{formatBDT(breakdown.demandCharge)}</TableCell>
                  </TableRow>

                  <TableRow className="text-xs bg-muted/30">
                    <TableCell colSpan={3} className="text-muted-foreground">
                      {t.slab.meterRent} ({isSinglePhase ? (isBangla ? "সিঙ্গেল ফেজ" : "Single Phase") : (isBangla ? "থ্রি ফেজ" : "3-Phase")}):
                    </TableCell>
                    <TableCell className="text-right">{formatBDT(breakdown.meterRent)}</TableCell>
                  </TableRow>

                  <TableRow className="text-xs bg-muted/30">
                    <TableCell colSpan={3} className="text-muted-foreground">
                      {t.slab.vat}:
                    </TableCell>
                    <TableCell className="text-right">{formatBDT(breakdown.vatAmount)}</TableCell>
                  </TableRow>

                  <TableRow className="text-xs bg-muted/30 text-emerald-600 dark:text-emerald-400">
                    <TableCell colSpan={3} className="font-medium">
                      {t.slab.rebate}:
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      -{formatBDT(breakdown.rebateAmount)}
                    </TableCell>
                  </TableRow>

                  <TableRow className="text-sm bg-primary/5 font-extrabold border-t-2 border-primary/20">
                    <TableCell colSpan={3} className="text-foreground">
                      {t.tariffs.summaryNetBill}:
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
          <CardTitle className="text-base font-bold">
            {t.tariffs.officialRatesTitle}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {t.tariffs.officialRatesSubtitle}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>{isBangla ? "ধাপ ক্রম" : "#"}</TableHead>
                <TableHead>{isBangla ? "ইউনিট সীমা" : "Consumption Range"}</TableHead>
                <TableHead>{isBangla ? "প্রতি ইউনিট রেট (৳)" : "Rate / kWh"}</TableHead>
                <TableHead>{isBangla ? "মন্তব্য" : "Notes"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="text-xs">
                <TableCell className="font-semibold">{t.slab.lifelineTier}</TableCell>
                <TableCell>{isBangla ? "০ - ৫০ ইউনিট" : "0 - 50 kWh"}</TableCell>
                <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatBDT(LIFELINE_RATE)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {isBangla
                    ? "শুধুমাত্র মোট মাসিক ব্যবহার ৫০ ইউনিটের মধ্যে সীমাবদ্ধ থাকলে প্রযোজ্য"
                    : "Exclusive subsidized lifeline rate for low-consumption households"}
                </TableCell>
              </TableRow>
              {NESCO_LTA_SLABS.map((s) => (
                <TableRow key={s.step} className="text-xs">
                  <TableCell className="font-semibold">
                    {isBangla ? `ধাপ ${formatNumber(s.step)}` : `Tier ${formatNumber(s.step)}`}
                  </TableCell>
                  <TableCell>
                    {formatNumber(s.minUnits)} - {s.maxUnits ? `${formatNumber(s.maxUnits)} kWh` : (isBangla ? "ঊর্ধ্বে" : "above")}
                  </TableCell>
                  <TableCell className="font-bold text-foreground">
                    {formatBDT(s.ratePerUnit)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.step >= 5
                      ? isBangla ? "উচ্চতর ধাপ (সতর্কতা কাম্য)" : "High consumption bracket"
                      : isBangla ? "সাধারণ আবাসিক রেট" : "Standard residential bracket"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Interactive Room & Appliance Simulator & Comprehensive Appliances Guide */}
      <div id="appliance-simulator-section">
        <ApplianceSimulator
          onApplyUnits={(newUnits) => setUnitsInput(newUnits)}
          currentUnits={unitsInput}
        />
      </div>

      {/* 20+ Battle-Tested Real-World Bill Saving Strategies */}
      <div id="bill-saving-advice-section" className="pt-2">
        <BillSavingSection />
      </div>
    </div>
  )
}
