import * as React from "react"
import { Link } from "@tanstack/react-router"
import { ReceiptText } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemTitle } from "@/components/ui/item"
import { useLanguage } from "@/features/i18n/language-context"
import type { RechargeRecord } from "@/features/nesco/types"
import { ReceiptDialog } from "@/features/recharge/receipt-dialog"
import { TokenDisplay } from "@/features/recharge/token-display"
import { parseNescoDate, sortRechargesDesc } from "@/lib/nesco-dates"
import { cn } from "@/lib/utils"
import { EmptyRegion } from "../region-parts"
import type { DashboardData } from "../types"

export function RecentRechargesRegion({ data }: DashboardData) {
  const { t, formatBDT, formatDate } = useLanguage()
  const [receipt, setReceipt] = React.useState<RechargeRecord | null>(null)
  const records = sortRechargesDesc(data.rechargeHistory).slice(0, 3)

  if (!records.length) return <EmptyRegion title={t.dashboard.recent} message={t.dashboard.noRecharges} />

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.dashboard.recent}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ItemGroup>
          {records.map((record) => {
            const date = parseNescoDate(record.date)?.toISOString()
            return (
              <Item key={record.id} role="listitem" variant="outline" size="sm">
                <ItemContent>
                  <ItemTitle className="num">{formatBDT(record.amountBdt)}</ItemTitle>
                  <ItemDescription>
                    {date ? formatDate(date) : record.date} · {record.via}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t.receipt.open}
                    title={t.receipt.open}
                    onClick={() => setReceipt(record)}
                  >
                    <ReceiptText />
                  </Button>
                </ItemActions>
                <ItemFooter className="block">
                  <TokenDisplay token={record.token} />
                </ItemFooter>
              </Item>
            )
          })}
        </ItemGroup>
      </CardContent>
      <CardFooter>
        <Link to="/history" className={cn(buttonVariants({ variant: "link", size: "sm" }), "px-0")}>
          {t.dashboard.seeAll}
        </Link>
      </CardFooter>
      <ReceiptDialog record={receipt} customer={data.customerInfo} onOpenChange={(open) => !open && setReceipt(null)} />
    </Card>
  )
}
