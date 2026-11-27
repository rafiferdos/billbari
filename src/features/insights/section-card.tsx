import type * as React from "react"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { EnergyAnalytics } from "@/features/analytics/insights-generator"
import { EstimateBadge } from "@/features/dashboard/region-parts"
import type { NescoFetchResult } from "@/features/nesco/types"

export interface SectionProps {
  analytics: EnergyAnalytics
  data: NescoFetchResult
}

export function SectionCard({
  title,
  estimate,
  children,
}: {
  title: string
  /** Set when the numbers are BillBari's own calculation. */
  estimate?: boolean
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        {estimate && (
          <CardAction>
            <EstimateBadge />
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{children}</CardContent>
    </Card>
  )
}

/** A dash instead of a zero that only means "no data". */
export const orDash = (value: number | null, format: (value: number) => string) =>
  value !== null && value > 0 ? format(value) : "—"
