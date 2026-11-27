import { Copy } from "lucide-react"
import * as React from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/features/i18n/language-context"
import type { CustomerField } from "@/features/nesco/types"
import { copyText } from "@/features/recharge/token-display"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { DashboardData } from "../types"

export function CustomerInfoRegion({ data }: DashboardData) {
  const { customerInfo: info } = data
  const { t, formatNumber } = useLanguage()
  const isLg = useMediaQuery("(min-width: 1024px)")

  const numbers = [
    [t.customer.meterNo, info.meterNumber],
    [t.customer.customerNo, info.customerNumber],
  ] as const
  // sample data and results cached before Phase 2 may carry no field list
  const saved = info.fields as CustomerField[] | undefined
  const fields: CustomerField[] = saved?.length
    ? saved
    : [
        { label: t.dashboard.name, value: info.name },
        { label: t.customer.address, value: info.address },
        { label: t.dashboard.office, value: info.electricityOffice },
        { label: t.customer.feeder, value: info.feederName },
        { label: t.customer.tariff, value: info.tariff },
        { label: t.customer.sanctionedLoad, value: formatNumber(info.approvedLoadKw) },
      ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.customer.customerDetails}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* the key re-applies the default when the viewport crosses lg */}
        <Accordion key={String(isLg)} defaultValue={isLg ? ["details"] : []}>
          <AccordionItem value="details">
            <AccordionTrigger>{t.dashboard.allDetails}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-2 pb-3">
                {numbers.map(
                  ([label, value]) =>
                    value && (
                      <div key={label} className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="num ml-auto font-semibold">{value}</span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${t.common.copy}: ${label}`}
                          onClick={() => void copyText(value, t, t.common.copied)}
                        >
                          <Copy />
                        </Button>
                      </div>
                    )
                )}
              </div>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 border-t border-border pt-3">
                {fields.map((field, index) => (
                  <React.Fragment key={`${field.label}-${index}`}>
                    <dt className="max-w-40 text-muted-foreground">{field.label}</dt>
                    <dd className="min-w-0 break-words">{field.value || "—"}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
