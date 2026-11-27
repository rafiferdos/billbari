import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { NumberField } from "@/components/ui/number-field"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useLanguage } from "@/features/i18n/language-context"
import { useMeter } from "@/features/meter/meter-context"
import { ProGate } from "@/features/payments/pro-gate"
import { ApplianceSimulator } from "@/features/tariffs/appliance-simulator"
import { BillSavingSection } from "@/features/tariffs/bill-saving-section"
import { RechargePlannerCard } from "@/features/tools/recharge-planner-card"
import { sortMonthlyDesc } from "@/lib/nesco-dates"
import {
  DEFAULT_DEMAND_CHARGE_PER_KW,
  DEFAULT_METER_RENT,
  LIFELINE_RATE,
  NESCO_LTA_SLABS,
  PREPAID_REBATE_RATE,
  VAT_RATE,
  calculateNescoBill,
} from "@/lib/tariff-constants"

export const Route = createFileRoute("/tariffs")({
  component: ToolsPage,
})

const SECTIONS = ["calculator", "tariff", "planner", "simulator", "saving"] as const
const DEFAULT_UNITS = 240
const MAX_UNITS = 2000
const SLIDER_MAX = 800
const ANCHOR = "scroll-mt-[calc(var(--bb-header-h)+1rem)]"

function ToolsPage() {
  const { t } = useLanguage()
  const { activeMeterData: data } = useMeter()
  // undefined until the viewer touches the field, so a meter loaded later still prefills it
  const [typed, setTyped] = React.useState<number | null | undefined>(undefined)
  const latest = sortMonthlyDesc(data?.monthlyUsage ?? []).find((m) => m.usageKwh > 0)
  const prefill = latest ? Math.min(MAX_UNITS, Math.round(latest.usageKwh)) : DEFAULT_UNITS
  const units = typed === undefined ? prefill : typed

  return (
    <div className="section-stack">
      <h1 className="text-2xl">{t.tariffs.title}</h1>
      <ScrollArea>
        <nav aria-label={t.tariffs.sections} className="flex w-max gap-2 p-1">
          {SECTIONS.map((id) => (
            <a key={id} href={`#${id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              {t.tariffs.chips[id]}
            </a>
          ))}
        </nav>
      </ScrollArea>

      <section id="calculator" className={ANCHOR}>
        <Calculator units={units} onUnitsChange={setTyped} fromMeter={typed === undefined && Boolean(latest)} />
      </section>
      <section id="tariff" className={ANCHOR}>
        <TariffTable />
      </section>
      <section id="planner" className={ANCHOR}>
        <RechargePlannerCard />
      </section>
      <section id="simulator" className={ANCHOR}>
        <ProGate feature="applianceSimulator" variant="section">
          <ApplianceSimulator onApplyUnits={setTyped} currentUnits={units ?? 0} />
        </ProGate>
      </section>
      <section id="saving" className={ANCHOR}>
        <ProGate feature="savingPlan" variant="section">
          <BillSavingSection />
        </ProGate>
      </section>
    </div>
  )
}

function Calculator({
  units,
  onUnitsChange,
  fromMeter,
}: {
  units: number | null
  onUnitsChange: (units: number | null) => void
  fromMeter: boolean
}) {
  const { t, isBangla, formatBDT, formatNumber } = useLanguage()
  const [loadKw, setLoadKw] = React.useState<number | null>(2)
  const [phase, setPhase] = React.useState<"single" | "three">("single")
  const unitsId = React.useId()
  const loadId = React.useId()
  const bill = calculateNescoBill(units ?? 0, loadKw ?? 1, phase === "single")

  const totals: [label: string, value: string][] = [
    [t.tariffs.energyCharge, formatBDT(bill.energyCharge)],
    [t.receipt.demand, formatBDT(bill.demandCharge)],
    [t.receipt.rent, formatBDT(bill.meterRent)],
    [t.receipt.vat, formatBDT(bill.vatAmount)],
    [t.receipt.rebate, `−${formatBDT(bill.rebateAmount)}`],
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.tariffs.calculator}</CardTitle>
        <CardDescription>{t.tariffs.calculatorHint}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={unitsId}>{t.tariffs.units}</Label>
            <NumberField id={unitsId} value={units} onValueChange={onUnitsChange} min={0} max={MAX_UNITS} step={1} />
            <Slider
              min={0}
              max={SLIDER_MAX}
              step={5}
              value={Math.min(units ?? 0, SLIDER_MAX)}
              onValueChange={(value) => onUnitsChange(typeof value === "number" ? value : value[0])}
              aria-label={t.tariffs.units}
            />
            {fromMeter && <p className="text-xs text-muted-foreground">{t.tariffs.fromMeter}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={loadId}>{t.receipt.load}</Label>
            <NumberField id={loadId} value={loadKw} onValueChange={setLoadKw} min={1} max={20} step={0.5} />
          </div>
          <ToggleGroup
            variant="outline"
            spacing={0}
            aria-label={t.customer.phase}
            value={[phase]}
            onValueChange={([next]) => next && setPhase(next as typeof phase)}
          >
            <ToggleGroupItem value="single">{t.tariffs.singlePhase}</ToggleGroupItem>
            <ToggleGroupItem value="three">{t.tariffs.threePhase}</ToggleGroupItem>
          </ToggleGroup>
          <div aria-live="polite" className="rounded-(--bb-control-radius) bg-muted p-4 text-center">
            <p className="text-xs text-muted-foreground">{t.tariffs.total}</p>
            <p className="num text-3xl font-bold text-primary">{formatBDT(bill.totalBill)}</p>
            <p className="text-xs text-muted-foreground">
              {t.tariffs.effectiveRate}:{" "}
              <span className="num font-semibold">{formatBDT(bill.effectiveRatePerUnit)}</span>
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.tariffs.step}</TableHead>
                <TableHead className="text-right">kWh</TableHead>
                <TableHead className="text-right">{t.tariffs.rate}</TableHead>
                <TableHead className="text-right">{t.tariffs.amount}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bill.slabBreakdown.map((slab) => (
                <TableRow key={slab.step}>
                  <TableCell className="whitespace-normal">{isBangla ? slab.nameBangla : slab.nameEnglish}</TableCell>
                  <TableCell className="num text-right">{formatNumber(slab.unitsInSlab)}</TableCell>
                  <TableCell className="num text-right">{formatBDT(slab.rate)}</TableCell>
                  <TableCell className="num text-right">{formatBDT(slab.amount)}</TableCell>
                </TableRow>
              ))}
              {totals.map(([label, value]) => (
                <TableRow key={label} className="text-muted-foreground">
                  <TableCell colSpan={3} className="whitespace-normal">
                    {label}
                  </TableCell>
                  <TableCell className="num text-right">{value}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell colSpan={3}>{t.tariffs.total}</TableCell>
                <TableCell className="num text-right text-primary">{formatBDT(bill.totalBill)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function TariffTable() {
  const { t, formatBDT, formatNumber } = useLanguage()
  const step = (n: number) => t.tariffs.stepNumber.replace("{n}", formatNumber(n))
  const rows = [
    { name: t.tariffs.lifeline, range: `${formatNumber(0)}–${formatNumber(50)}`, rate: LIFELINE_RATE },
    ...NESCO_LTA_SLABS.map((s) => ({
      name: step(s.step),
      range: s.maxUnits ? `${formatNumber(s.minUnits)}–${formatNumber(s.maxUnits)}` : `${formatNumber(s.minUnits)}+`,
      rate: s.ratePerUnit,
    })),
  ]
  const fixed: [label: string, value: string][] = [
    [t.receipt.demand, `${formatBDT(DEFAULT_DEMAND_CHARGE_PER_KW)} ${t.tariffs.perKw}`],
    [t.receipt.rent, formatBDT(DEFAULT_METER_RENT)],
    [t.receipt.vat, `${formatNumber(VAT_RATE * 100)}%`],
    [t.tariffs.prepaidRebate, `${formatNumber(PREPAID_REBATE_RATE * 100)}%`],
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.tariffs.table}</CardTitle>
        <CardDescription>{t.tariffs.lifelineNote}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.tariffs.step}</TableHead>
                <TableHead>{t.tariffs.range}</TableHead>
                <TableHead className="text-right">{t.tariffs.rate}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell className="num">{row.range}</TableCell>
                  <TableCell className="num text-right font-semibold">{formatBDT(row.rate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t.tariffs.fixed}</h3>
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm">
            {fixed.map(([label, value]) => (
              <React.Fragment key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="num text-right font-semibold">{value}</dd>
              </React.Fragment>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground">{t.tariffs.source}</p>
        </div>
      </CardContent>
    </Card>
  )
}
