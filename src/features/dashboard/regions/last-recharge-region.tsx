import * as React from "react"
import { ReceiptText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/features/i18n/language-context"
import { ReceiptDialog } from "@/features/recharge/receipt-dialog"
import { TokenDisplay } from "@/features/recharge/token-display"
import { parseNescoDate, sortRechargesDesc } from "@/lib/nesco-dates"
import { EmptyRegion } from "../region-parts"
import type { DashboardData } from "../types"

export function LastRechargeRegion({ data }: DashboardData) {
  const { t, formatBDT, formatUnits, formatDateWithDay } = useLanguage()
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false)
  const record = sortRechargesDesc(data.rechargeHistory).at(0)

  if (!record) return <EmptyRegion title={t.dashboard.lastRecharge} message={t.dashboard.noRecharges} />

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.dashboard.lastRecharge}</CardTitle>
        <CardAction>
          <Button variant="outline" size="sm" onClick={() => setIsReceiptOpen(true)}>
            <ReceiptText />
            {t.receipt.open}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div>
          <p className="num text-3xl font-bold">{formatBDT(record.amountBdt)}</p>
          <p className="text-sm text-muted-foreground">
            {[
              record.netEnergyBdt ? `${t.dashboard.netEnergy}: ${formatBDT(record.netEnergyBdt)}` : null,
              record.powerKwh ? formatUnits(record.powerKwh) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDateWithDay(parseNescoDate(record.date) ?? record.date)} · {record.via}
          </p>
        </div>
        <div className="mt-auto rounded-(--bb-control-radius) bg-muted p-3">
          <TokenDisplay token={record.token} size="lg" />
        </div>
      </CardContent>
      <ReceiptDialog
        record={isReceiptOpen ? record : null}
        customer={data.customerInfo}
        onOpenChange={setIsReceiptOpen}
      />
    </Card>
  )
}
