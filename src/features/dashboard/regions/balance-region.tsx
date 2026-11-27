import * as React from "react"
import { Bell, Bookmark, ExternalLink, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Meter } from "@/components/ui/meter"
import { useLanguage } from "@/features/i18n/language-context"
import { EKPAY_RECHARGE_URL } from "@/features/help/nesco-links"
import { AlertThresholdDialog, getAlertThreshold } from "@/features/meter/alert-threshold-dialog"
import { useMeter } from "@/features/meter/meter-context"
import { useSaveMeter } from "@/features/meter/use-save-meter"
import { formatFetchedAt, SourceBadge } from "@/features/nesco/source-badge"
import { ProGate, useEntitlement } from "@/features/payments/pro-gate"
import { cn } from "@/lib/utils"
import type { DashboardData } from "../types"

export function BalanceRegion({ data, stats }: DashboardData) {
  const { customerInfo: info, dataSource, fetchedAt } = data
  const { t, isBangla, formatBDT, formatNumber } = useLanguage()
  const { fetchMeter } = useMeter()
  const { saveMeter, isSaving } = useSaveMeter()
  const { allowed: canAlert } = useEntitlement("lowBalanceAlert")
  const [threshold, setThreshold] = React.useState<number | null>(null)
  const [isAlertOpen, setIsAlertOpen] = React.useState(false)

  // read after mount: the threshold lives in this device's storage
  React.useEffect(() => setThreshold(getAlertThreshold(info.meterNumber)), [info.meterNumber])

  const max = stats.avgMonthlyRechargeBdt
  const tone = info.balance < 100 ? "destructive" : max && info.balance < max * 0.25 ? "warning" : "success"
  const isBelowAlert = canAlert && threshold !== null && info.balance < threshold

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.stats.currentBalance}</CardTitle>
        <CardAction>
          <SourceBadge dataSource={dataSource} fetchedAt={fetchedAt} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div>
          <p className="num text-4xl font-bold break-words sm:text-5xl">{formatBDT(info.balance)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.dashboard.updated}:{" "}
            {info.balanceUpdatedAt
              ? formatNumber(info.balanceUpdatedAt)
              : formatFetchedAt(fetchedAt, isBangla)}
          </p>
        </div>

        {max !== null && <Meter value={info.balance} max={max} tone={tone} label={t.dashboard.vsAverage} />}

        {isBelowAlert && (
          <Alert className="border-warning bg-warning/10">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2 text-foreground">
              <span>{t.dashboard.belowAlert.replace("{n}", formatBDT(threshold))}</span>
              <Button size="sm" variant="outline" onClick={() => setIsAlertOpen(true)}>
                {t.dashboard.changeLimit}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-auto flex flex-wrap gap-2">
          <a href={EKPAY_RECHARGE_URL} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: "sm" }))}>
            <ExternalLink />
            {t.dashboard.recharge}
          </a>
          <Button variant="outline" size="sm" onClick={() => void fetchMeter(undefined, { force: true })}>
            <RefreshCw />
            {t.dashboard.refresh}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void saveMeter()} disabled={isSaving}>
            <Bookmark />
            {isSaving ? t.common.loading : t.customer.saveMeter}
          </Button>
          <ProGate feature="lowBalanceAlert" variant="inline">
            <Button variant="outline" size="sm" onClick={() => setIsAlertOpen(true)}>
              <Bell />
              {t.dashboard.alert}
            </Button>
            <AlertThresholdDialog
              open={isAlertOpen}
              onOpenChange={setIsAlertOpen}
              meterNumber={info.meterNumber}
              currentBalance={info.balance}
              onSaved={setThreshold}
            />
          </ProGate>
        </div>
      </CardContent>
    </Card>
  )
}
