import type * as React from "react"
import { AlertTriangle, CheckCircle2, Info, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ConsumptionInsight } from "@/features/analytics/insights-generator"
import { EstimateBadge } from "@/features/dashboard/region-parts"
import { useLanguage } from "@/features/i18n/language-context"
import type { SectionProps } from "./section-card"

const ICONS = {
  warning: <AlertTriangle aria-hidden className="size-4 shrink-0 text-warning" />,
  success: <CheckCircle2 aria-hidden className="size-4 shrink-0 text-success" />,
  info: <Info aria-hidden className="size-4 shrink-0 text-primary" />,
  tip: <Sparkles aria-hidden className="size-4 shrink-0 text-success" />,
} satisfies Record<ConsumptionInsight["type"], React.ReactNode>

export function InsightsListSection({ analytics }: SectionProps) {
  const { t, isBangla } = useLanguage()

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg">{t.insightsPage.listTitle}</h2>
      <div className="grid gap-(--bb-grid-gap) sm:grid-cols-2 lg:grid-cols-3">
        {analytics.insights.map((insight) => (
          <Card key={insight.id} size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                {ICONS[insight.type]}
                {isBangla ? insight.title : (insight.titleEnglish ?? insight.title)}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                {isBangla ? insight.description : (insight.descriptionEnglish ?? insight.description)}
              </p>
              <div className="mt-auto flex items-center justify-between gap-2">
                <span className="num text-xs font-semibold text-primary">
                  {isBangla ? insight.metric : (insight.metricEnglish ?? insight.metric)}
                </span>
                {insight.isCalculatedEstimate && <EstimateBadge />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
