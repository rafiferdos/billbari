import * as React from "react"
import { Link } from "@tanstack/react-router"
import { Calculator, Camera, FileDown, History, LifeBuoy } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/features/i18n/language-context"
import { useMeter } from "@/features/meter/meter-context"
import { NESCO_DOWNLOAD_KINDS, nescoDownloadHref } from "@/features/nesco/downloads"
import { ProGate } from "@/features/payments/pro-gate"
import { SnapshotDialog } from "@/features/snapshots/snapshot-dialog"
import { cn } from "@/lib/utils"
import type { DashboardData } from "../types"

// long Bangla labels wrap instead of overflowing the two columns
const TILE = "h-auto min-h-(--bb-control-h-lg) w-full flex-col gap-1 px-2 py-2 text-center whitespace-normal"

export function QuickActionsRegion({ data, analytics }: DashboardData) {
  const { t } = useLanguage()
  const { activeMeter } = useMeter()
  const [isSnapshotOpen, setIsSnapshotOpen] = React.useState(false)
  const tile = cn(buttonVariants({ variant: "outline" }), TILE)
  const isSample = data.dataSource === "sample_demo"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.dashboard.quickActions}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 content-start gap-2">
        {/* the portal has no PDF for sample meters */}
        {!isSample && NESCO_DOWNLOAD_KINDS.includes("certificate") && (
          <a href={nescoDownloadHref("certificate", activeMeter)} target="_blank" rel="noopener noreferrer" className={tile}>
            <FileDown />
            {t.dashboard.certificate}
          </a>
        )}
        <Link to="/history" className={tile}>
          <History />
          {t.dashboard.allRecharges}
        </Link>
        <Link to="/tariffs" className={tile}>
          <Calculator />
          {t.dashboard.calculator}
        </Link>
        <Link to="/help" className={tile}>
          <LifeBuoy />
          {t.dashboard.services}
        </Link>
        <ProGate feature="snapshots" variant="inline" className={TILE}>
          <Button variant="outline" className={TILE} onClick={() => setIsSnapshotOpen(true)}>
            <Camera />
            {t.dashboard.snapshot}
          </Button>
          <SnapshotDialog
            open={isSnapshotOpen}
            onOpenChange={setIsSnapshotOpen}
            meterNumber={data.customerInfo.meterNumber}
            currentBalance={data.customerInfo.balance}
            dailyEstimatedCost={analytics.estimates.avgDailyCostBdt}
            monthlyEstimatedCost={analytics.estimates.projectedMonthlyCostBdt}
            sourceType={isSample ? "sample_demo" : "nesco_live"}
          />
        </ProGate>
      </CardContent>
    </Card>
  )
}
