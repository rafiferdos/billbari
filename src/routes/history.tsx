import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { History, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ConsumptionChart } from "@/features/analytics/consumption-chart"
import { computeDeductionTotals } from "@/features/analytics/free-stats"
import { downloadCsv, toCsv, type CsvColumn } from "@/features/export/csv"
import { PrintableTable } from "@/features/export/printable-table"
import { MonthlyList, MonthlyTable, useMonthlyFormat } from "@/features/history/monthly-list"
import { RechargeList, RechargeTable, useRecordDate } from "@/features/history/recharge-list"
import { RecordActions } from "@/features/history/record-actions"
import { PERIODS, filterRecharges, monthlyValue, visibleMonthlyKeys, type Period } from "@/features/history/records"
import { useLanguage } from "@/features/i18n/language-context"
import { useMeter } from "@/features/meter/meter-context"
import { maskMeter } from "@/features/meter/meter-input"
import { MeterPage } from "@/features/meter/meter-page"
import type { MonthlyConsumptionRecord, NescoFetchResult, RechargeRecord } from "@/features/nesco/types"
import { ReceiptDialog } from "@/features/recharge/receipt-dialog"
import { splitTokens } from "@/features/recharge/token"
import { usePrint } from "@/hooks/use-print"
import { sortMonthlyDesc, sortRechargesDesc } from "@/lib/nesco-dates"

const PAGE_SIZE = 10

export const Route = createFileRoute("/history")({
  // optional, so a plain link to /history stays valid
  validateSearch: (search: Record<string, unknown>): { tab?: "monthly" } =>
    search.tab === "monthly" ? { tab: "monthly" } : {},
  component: HistoryPage,
})

function HistoryPage() {
  const { t } = useLanguage()

  return (
    <div className="section-stack">
      <h1 className="text-2xl">{t.history.title}</h1>
      <MeterPage icon={History} emptyTitle={t.history.noMeter}>
        {/* keyed so filters and pages start over for another meter */}
        {(data) => <Records key={data.customerInfo.meterNumber} data={data} />}
      </MeterPage>
    </div>
  )
}

function Records({ data }: { data: NescoFetchResult }) {
  const { t, formatNumber } = useLanguage()
  const { tab } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <Tabs
      value={tab ?? "recharges"}
      onValueChange={(value) =>
        void navigate({ search: value === "monthly" ? { tab: "monthly" } : {}, replace: true })
      }
      className="gap-(--bb-section-gap)"
    >
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="recharges">
          {t.history.recharges} ({formatNumber(data.rechargeHistory.length)})
        </TabsTrigger>
        <TabsTrigger value="monthly">
          {t.history.monthly} ({formatNumber(data.monthlyUsage.length)})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="recharges" className="section-stack">
        <Recharges data={data} />
      </TabsContent>
      <TabsContent value="monthly" className="section-stack">
        <Monthly data={data} />
      </TabsContent>
    </Tabs>
  )
}

function Recharges({ data }: { data: NescoFetchResult }) {
  const { t, formatBDT, formatNumber } = useLanguage()
  const { activeMeter } = useMeter()
  const recordDate = useRecordDate()
  const { printing, print } = usePrint()
  const [period, setPeriod] = React.useState<Period>("all")
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [receipt, setReceipt] = React.useState<RechargeRecord | null>(null)

  const all = data.rechargeHistory
  const rows = React.useMemo(() => filterRecharges(sortRechargesDesc(all), { period, query }), [all, period, query])
  const totals = computeDeductionTotals(rows)
  const totalList: [label: string, value: number][] = [
    [t.receipt.gross, totals.gross],
    [t.receipt.net, totals.net],
    [t.receipt.rent, totals.rent],
    [t.receipt.demand, totals.demandCharge],
    [t.receipt.vat, totals.vat],
    [t.receipt.pfc, totals.pfcCharge],
    [t.receipt.arrears, totals.arrears],
    [t.receipt.rebate, totals.subsidy],
  ]
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  // a refresh can shrink the list under the current page
  const current = Math.min(page, pages)
  const first = (current - 1) * PAGE_SIZE
  const visible = rows.slice(first, first + PAGE_SIZE)

  if (!all.length) return <NoRows title={t.dashboard.noRecharges} />

  const exportCsv = () => {
    const columns: CsvColumn<RechargeRecord>[] = [
      { header: t.history.date, value: (r) => r.date },
      { header: t.receipt.token, value: (r) => splitTokens(r.token).join(" ") },
      { header: t.receipt.gross, value: (r) => r.amountBdt },
      { header: t.receipt.net, value: (r) => r.netEnergyBdt },
      { header: t.receipt.energy, value: (r) => r.powerKwh },
      { header: t.receipt.rent, value: (r) => r.rent },
      { header: t.receipt.demand, value: (r) => r.demandCharge },
      { header: t.receipt.pfc, value: (r) => r.pfcCharge },
      { header: t.receipt.vat, value: (r) => r.vat },
      { header: t.receipt.arrears, value: (r) => r.arrears },
      { header: t.receipt.rebate, value: (r) => (r.subsidy === undefined ? null : Math.abs(r.subsidy)) },
      { header: t.receipt.channel, value: (r) => r.via },
    ]
    downloadCsv(`billbari-recharges-${activeMeter}.csv`, toCsv(rows, columns))
  }

  return (
    <>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <Select
          items={t.history.periods}
          value={period}
          onValueChange={(value) => {
            setPeriod(value as Period)
            setPage(1)
          }}
        >
          <SelectTrigger aria-label={t.history.period} className="w-full lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p} value={p}>
                {t.history.periods[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <InputGroup className="lg:max-w-xs">
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            aria-label={t.history.searchLabel}
            placeholder={t.history.searchPlaceholder}
          />
        </InputGroup>
        <div className="lg:ml-auto">
          <RecordActions
            pdfKind="recharge"
            isSample={data.dataSource === "sample_demo"}
            empty={!rows.length}
            onPrint={print}
            onCsv={exportCsv}
          />
        </div>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">{t.history.totals}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {totalList.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="num font-semibold break-words">{formatBDT(value)}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {rows.length !== all.length && (
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {t.history.showing
            .replace("{shown}", formatNumber(rows.length))
            .replace("{total}", formatNumber(all.length))}
        </p>
      )}

      {rows.length ? (
        <>
          <RechargeList records={visible} onReceipt={setReceipt} />
          <RechargeTable records={visible} onReceipt={setReceipt} firstNumber={first + 1} />
        </>
      ) : (
        <NoRows title={t.history.noMatch} />
      )}

      {pages > 1 && (
        <Pagination>
          <PaginationContent className="flex-wrap justify-center">
            <PaginationItem>
              <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
                {t.history.previous}
              </Button>
            </PaginationItem>
            <PaginationItem aria-current="page" className="num px-2 text-sm">
              {t.history.page.replace("{page}", formatNumber(current)).replace("{pages}", formatNumber(pages))}
            </PaginationItem>
            <PaginationItem>
              <Button variant="outline" size="sm" disabled={current === pages} onClick={() => setPage(current + 1)}>
                {t.history.next}
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <ReceiptDialog record={receipt} customer={data.customerInfo} onOpenChange={(open) => !open && setReceipt(null)} />

      {printing && (
        <PrintableTable
          title={t.history.rechargePrintTitle}
          subtitle={[
            data.customerInfo.name,
            formatNumber(maskMeter(data.customerInfo.meterNumber)),
            t.history.periods[period],
            query.trim(),
          ]
            .filter(Boolean)
            .join(" · ")}
          columns={[
            { header: t.history.date },
            { header: t.receipt.token },
            { header: t.history.amount, align: "right" },
            { header: t.history.energy, align: "right" },
            { header: "kWh", align: "right" },
            { header: t.receipt.channel },
          ]}
          rows={rows.map((r) => [
            recordDate(r.date),
            splitTokens(r.token).join(", "),
            formatBDT(r.amountBdt),
            r.netEnergyBdt === undefined ? "—" : formatBDT(r.netEnergyBdt),
            formatNumber(r.powerKwh),
            r.via,
          ])}
          footer={totalList.map(([label, value]) => `${label}: ${formatBDT(value)}`).join(" · ")}
        />
      )}
    </>
  )
}

function Monthly({ data }: { data: NescoFetchResult }) {
  const { t, formatNumber } = useLanguage()
  const { activeMeter } = useMeter()
  const format = useMonthlyFormat()
  const { printing, print } = usePrint()
  const [range, setRange] = React.useState<"recent" | "all">("recent")

  const sorted = React.useMemo(() => sortMonthlyDesc(data.monthlyUsage), [data.monthlyUsage])
  const rows = range === "recent" ? sorted.slice(0, 12) : sorted
  const columns = visibleMonthlyKeys(rows)
  const isSample = data.dataSource === "sample_demo"

  if (!sorted.length) return <NoRows title={t.dashboard.noMonths} />

  const exportCsv = () => {
    const csvColumns: CsvColumn<MonthlyConsumptionRecord>[] = [
      { header: t.history.year, value: (r) => r.year },
      { header: t.history.month, value: (r) => r.month },
      ...columns.map((key) => ({
        header: t.history.columns[key],
        value: (r: MonthlyConsumptionRecord) => monthlyValue(r, key),
      })),
    ]
    downloadCsv(`billbari-monthly-${activeMeter}.csv`, toCsv(rows, csvColumns))
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ToggleGroup
          variant="outline"
          spacing={0}
          aria-label={t.history.range}
          value={[range]}
          // pressing the active item would otherwise leave nothing selected
          onValueChange={([next]) => next && setRange(next as typeof range)}
        >
          <ToggleGroupItem value="recent">{t.history.recentMonths}</ToggleGroupItem>
          <ToggleGroupItem value="all">{t.history.allMonths}</ToggleGroupItem>
        </ToggleGroup>
        <RecordActions pdfKind="monthly" isSample={isSample} empty={false} onPrint={print} onCsv={exportCsv} />
      </div>

      <ConsumptionChart monthlyData={rows} isSampleData={isSample} />
      <MonthlyList rows={rows} columns={columns} />
      <MonthlyTable rows={rows} columns={columns} />

      {printing && (
        <PrintableTable
          title={t.history.monthly}
          subtitle={`${data.customerInfo.name} · ${formatNumber(maskMeter(data.customerInfo.meterNumber))} · ${
            range === "recent" ? t.history.recentMonths : t.history.allMonths
          }`}
          columns={[
            { header: t.history.year },
            { header: t.history.month },
            ...columns.map((key) => ({ header: t.history.columns[key], align: "right" as const })),
          ]}
          rows={rows.map((r) => [formatNumber(r.year), format.month(r), ...columns.map((key) => format.value(r, key))])}
        />
      )}
    </>
  )
}

function NoRows({ title }: { title: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle className="text-sm">{title}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  )
}
