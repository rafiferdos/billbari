import { Link } from "@tanstack/react-router"
import { Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { useAuth } from "@/features/auth/auth-context"
import { useLanguage } from "@/features/i18n/language-context"
import { FEATURES, type FeatureId } from "@/features/payments/entitlements"
import { useEntitlement } from "@/features/payments/pro-gate"
import { cn } from "@/lib/utils"
import type { DashboardData } from "../types"

const TEASERS: FeatureId[] = ["slabForecast", "seasonality", "costEfficiency"]

export function ProInsightsRegion(props: DashboardData) {
  const { allowed, reason } = useEntitlement("personalInsights")
  const { openAuthModal, openPricingModal } = useAuth()
  const { t, isBangla } = useLanguage()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.dashboard.proInsights}</CardTitle>
        <CardAction>
          <Badge variant="outline">{t.pro.badge}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-start gap-3">
        {allowed ? (
          <TopInsights {...props} />
        ) : (
          // names and descriptions only: a locked card never gets the viewer's values
          <>
            <ItemGroup>
              {TEASERS.map((id) => (
                <Item key={id} role="listitem" variant="muted" size="sm">
                  <ItemMedia variant="icon">
                    <Lock aria-hidden />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{isBangla ? FEATURES[id].nameBn : FEATURES[id].nameEn}</ItemTitle>
                    <ItemDescription>{isBangla ? FEATURES[id].descBn : FEATURES[id].descEn}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
            <Button
              size="sm"
              className="mt-auto"
              onClick={reason === "signin" ? () => openAuthModal("login") : openPricingModal}
            >
              {reason === "signin" ? t.pro.signIn : t.pro.upgrade}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function TopInsights({ analytics }: DashboardData) {
  const { t, isBangla } = useLanguage()

  return (
    <>
      <ItemGroup>
        {analytics.insights.slice(0, 3).map((insight) => (
          <Item key={insight.id} role="listitem" variant="muted" size="sm">
            <ItemContent>
              <ItemTitle>{isBangla ? insight.title : (insight.titleEnglish ?? insight.title)}</ItemTitle>
              {insight.metric && (
                <ItemDescription className="num">
                  {isBangla ? insight.metric : (insight.metricEnglish ?? insight.metric)}
                </ItemDescription>
              )}
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
      <Link to="/insights" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-auto")}>
        {t.dashboard.allInsights}
      </Link>
    </>
  )
}
