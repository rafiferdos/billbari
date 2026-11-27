import * as React from "react"
import { Lock, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useAuth } from "@/features/auth/auth-context"
import { useLanguage } from "@/features/i18n/language-context"
import { cn } from "@/lib/utils"
import { canUse, featureText, type FeatureId } from "./entitlements"

export function useEntitlement(feature: FeatureId): { allowed: boolean; reason: "ok" | "signin" | "upgrade" } {
  const { user, isPremium } = useAuth()
  const allowed = canUse(feature, { isPremium })
  return { allowed, reason: allowed ? "ok" : user ? "upgrade" : "signin" }
}

/** The only way UI locks a feature. Locked, it never renders `children`, so real values stay out of the page. */
export function ProGate({
  feature,
  children,
  variant = "card",
  className,
}: {
  feature: FeatureId
  children: React.ReactNode
  variant?: "card" | "inline" | "section"
  className?: string
}) {
  const { allowed, reason } = useEntitlement(feature)
  const { openAuthModal, openPricingModal } = useAuth()
  const { t, isBangla } = useLanguage()
  if (allowed) return <>{children}</>

  const { name, description } = featureText(feature, isBangla)
  const onClick = reason === "signin" ? () => openAuthModal("login") : openPricingModal
  const action = reason === "signin" ? t.pro.signIn : t.pro.upgrade

  if (variant === "inline") {
    return (
      <Button variant="outline" size="sm" onClick={onClick} className={className} title={action}>
        <Lock aria-hidden />
        <span>{name}</span>
        <span className="sr-only">{action}</span>
      </Button>
    )
  }

  if (variant === "section") {
    return (
      <Empty className={className}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Sparkles aria-hidden />
          </EmptyMedia>
          <EmptyTitle>{name}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onClick}>{action}</Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <Card className={cn(className)}>
      <CardContent className="flex h-full flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <Lock role="img" aria-label={t.pro.lockedTitle} className="size-4 text-muted-foreground" />
          <Badge variant="outline">{t.pro.badge}</Badge>
        </div>
        <div>
          <h3 className="text-sm font-semibold">{name}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button size="sm" onClick={onClick} className="mt-auto">
          {action}
        </Button>
      </CardContent>
    </Card>
  )
}
