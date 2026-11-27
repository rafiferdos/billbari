import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useAuth } from "@/features/auth/auth-context"
import { useLanguage } from "@/features/i18n/language-context"
import { featureText, type FeatureId } from "@/features/payments/entitlements"
import { useEntitlement } from "@/features/payments/pro-gate"

const PAGE_FEATURES: FeatureId[] = [
  "runway",
  "dailyBurn",
  "slabForecast",
  "personalInsights",
  "costEfficiency",
  "rechargeBehaviour",
  "seasonality",
  "advancedCharts",
]

/** Takes no meter data on purpose: a locked page cannot show what it never receives. */
export function InsightsLocked() {
  const { reason } = useEntitlement("personalInsights")
  const { openAuthModal, openPricingModal } = useAuth()
  const { t, isBangla } = useLanguage()

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Sparkles aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t.dashboard.proInsights}</EmptyTitle>
      </EmptyHeader>
      <EmptyContent className="max-w-2xl">
        <ul className="grid w-full gap-3 text-left sm:grid-cols-2">
          {PAGE_FEATURES.map((id) => {
            const { name, description } = featureText(id, isBangla)
            return (
              <li key={id}>
                <p className="text-sm font-semibold">{name}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </li>
            )
          })}
        </ul>
        <Button onClick={reason === "signin" ? () => openAuthModal("login") : openPricingModal}>
          {reason === "signin" ? t.pro.signIn : t.pro.upgrade}
        </Button>
      </EmptyContent>
    </Empty>
  )
}
