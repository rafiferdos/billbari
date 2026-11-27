import * as React from "react"
import { Copy, Printer, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "@/features/i18n/language-context"
import { maskMeter } from "@/features/meter/meter-input"
import type { CustomerInfo, RechargeRecord } from "@/features/nesco/types"
import { parseNescoDate } from "@/lib/nesco-dates"
import { copyText, TokenDisplay } from "./token-display"
import { splitTokens } from "./token"

export function ReceiptDialog({
  record,
  customer,
  onOpenChange,
}: {
  record: RechargeRecord | null
  customer: CustomerInfo
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={record !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        {record && <Receipt record={record} customer={customer} />}
      </DialogContent>
    </Dialog>
  )
}

function Receipt({ record, customer }: { record: RechargeRecord; customer: CustomerInfo }) {
  const { t, formatBDT, formatNumber, formatDateWithDay } = useLanguage()
  const date = formatDateWithDay(parseNescoDate(record.date) ?? record.date)
  const tokens = splitTokens(record.token).join("\n")
  const meter = formatNumber(maskMeter(customer.meterNumber))
  const money = (value: number | undefined) => (value ? formatBDT(Math.abs(value)) : null)

  const rows: [label: string, value: React.ReactNode][] = [
    [t.receipt.meter, meter],
    [t.receipt.customerNo, customer.customerNumber && formatNumber(customer.customerNumber)],
    [t.receipt.name, customer.name],
    [t.receipt.tariff, customer.tariff],
    [t.receipt.load, Number(customer.approvedLoadKw) ? formatNumber(customer.approvedLoadKw) : null],
    [t.receipt.date, date],
    [t.receipt.channel, record.receipt?.saleName ?? record.via],
    [t.receipt.orderNo, record.receipt?.orderNo],
    [t.receipt.seq, record.receipt?.seq],
    [t.receipt.token, tokens && <TokenDisplay token={record.token} size="lg" />],
    [t.receipt.energy, record.powerKwh ? formatNumber(record.powerKwh) : null],
    [t.receipt.gross, formatBDT(record.amountBdt)],
    [t.receipt.net, money(record.netEnergyBdt)],
    [t.receipt.rent, money(record.rent)],
    [t.receipt.demand, money(record.demandCharge)],
    [t.receipt.pfc, money(record.pfcCharge)],
    [t.receipt.vat, money(record.vat)],
    [t.receipt.arrears, money(record.arrears)],
    [t.receipt.rebate, money(record.subsidy)],
  ]

  const share = () => {
    const text = [
      `${t.brand.name} · ${t.receipt.title}`,
      `${t.receipt.meter}: ${meter}`,
      `${t.receipt.token}: ${tokens}`,
      `${t.receipt.gross}: ${formatBDT(record.amountBdt)}`,
      `${t.receipt.date}: ${date}`,
    ].join("\n")
    // rejects when the viewer closes the share sheet
    navigator.share({ text }).catch(() => {})
  }

  return (
    <>
      <div data-print-root className="flex flex-col gap-4">
        <DialogHeader className="pr-10">
          <DialogTitle>{t.receipt.title}</DialogTitle>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
          {rows.map(([label, value]) =>
            !value ? null : label === t.receipt.token ? (
              <div key={label} className="col-span-2 rounded-(--bb-control-radius) bg-muted p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1">{value}</dd>
              </div>
            ) : (
              <React.Fragment key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="num min-w-0 text-right break-words">{value}</dd>
              </React.Fragment>
            )
          )}
        </dl>
      </div>
      <DialogFooter>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button variant="outline" onClick={share}>
            <Share2 />
            {t.receipt.share}
          </Button>
        )}
        <Button variant="outline" onClick={() => window.print()}>
          <Printer />
          {t.receipt.print}
        </Button>
        {tokens && (
          <Button onClick={() => void copyText(tokens, t)}>
            <Copy />
            {t.token.copy}
          </Button>
        )}
      </DialogFooter>
    </>
  )
}
