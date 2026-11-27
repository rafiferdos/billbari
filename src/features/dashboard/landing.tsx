import * as React from "react"
import { useLiveQuery } from "@tanstack/react-db"
import { Check, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import { recentSearchesCollection } from "@/features/db/client-db"
import { useLanguage } from "@/features/i18n/language-context"
import { useMeter } from "@/features/meter/meter-context"
import { SavedMetersMenu } from "@/features/meter/saved-meters-menu"
import { featureText, featuresByTier, type FeatureTier } from "@/features/payments/entitlements"

const SAMPLE_METER = "12345678"

function RecentSearches() {
  const { t, formatNumber } = useLanguage()
  const { fetchMeter } = useMeter()
  const { data } = useLiveQuery(recentSearchesCollection)
  const recent = [...(data ?? [])].sort((a, b) => b.searchedAt.localeCompare(a.searchedAt)).slice(0, 5)
  if (!recent.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">{t.landing.recent}:</span>
      {recent.map((search) => (
        <Button
          key={search.meterNumber}
          variant="secondary"
          size="xs"
          title={search.label}
          className="num"
          onClick={() => void fetchMeter(search.meterNumber, { force: true })}
        >
          {formatNumber(search.meterNumber)}
        </Button>
      ))}
    </div>
  )
}

function TierCard({ tier }: { tier: FeatureTier }) {
  const { openPricingModal } = useAuth()
  const { t, isBangla } = useLanguage()
  const isPro = tier === "pro"
  const Icon = isPro ? Sparkles : Check

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isPro ? t.landing.proTitle : t.landing.freeTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="flex flex-col gap-2">
          {featuresByTier(tier)
            .slice(0, 8)
            .map((id) => {
              const { name, description } = featureText(id, isBangla)
              return (
                <li key={id} className="flex items-start gap-2">
                  <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>
                    <span className="font-medium">{name}</span>
                    <span className="block text-xs text-muted-foreground">{description}</span>
                  </span>
                </li>
              )
            })}
        </ul>
      </CardContent>
      {isPro && (
        <CardFooter>
          <Button className="w-full" onClick={openPricingModal}>
            {t.pro.upgrade}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

export function LandingHeading() {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col gap-2 text-center">
      <h1 className="text-2xl text-balance sm:text-4xl">{t.landing.title}</h1>
      <p className="text-sm text-muted-foreground">{t.landing.subtitle}</p>
    </div>
  )
}

/** Everything under the hero search (master plan 5.2). */
export function LandingBody() {
  const { user } = useAuth()
  const { fetchMeter } = useMeter()
  const { t } = useLanguage()
  // recent searches live in this browser, so the server render has none
  const [isMounted, setIsMounted] = React.useState(false)
  React.useEffect(() => setIsMounted(true), [])

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        {isMounted && <RecentSearches />}
        {user && <SavedMetersMenu />}
        <Button variant="link" onClick={() => void fetchMeter(SAMPLE_METER, { force: true })}>
          {t.landing.sample}
        </Button>
      </div>
      <div className="grid gap-(--bb-grid-gap) md:grid-cols-2">
        <TierCard tier="free" />
        <TierCard tier="pro" />
      </div>
      <p className="flex items-start justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck aria-hidden className="size-4 shrink-0 text-success" />
        {t.landing.trust}
      </p>
    </>
  )
}
