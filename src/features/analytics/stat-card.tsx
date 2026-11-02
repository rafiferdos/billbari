import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Lock, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/features/i18n/language-context"

interface StatCardProps {
  title: string
  value: string
  subvalue?: string
  icon: React.ReactNode
  trend?: {
    value: string
    isPositive?: boolean
    label: string
  }
  isEstimate?: boolean
  highlight?: boolean
  className?: string
  requiresAuth?: boolean
  requiresPremium?: boolean
  onLoginClick?: () => void
  onUpgradeClick?: () => void
}

export function StatCard({
  title,
  value,
  subvalue,
  icon,
  trend,
  isEstimate = false,
  highlight = false,
  className,
  requiresAuth = false,
  requiresPremium = false,
  onLoginClick,
  onUpgradeClick,
}: StatCardProps) {
  const { isBangla } = useLanguage()
  const isLocked = requiresAuth || requiresPremium

  // Phase 3: a locked card shows no value, subvalue, or trend at all.
  // The old design rendered the real numbers underneath a blurred overlay,
  // which still exposed them in the page. A locked card now shows only the
  // title, what is locked, and the action that unlocks it.
  if (isLocked) {
    const isPremiumOnly = requiresPremium && !requiresAuth
    return (
      <Card
        className={cn(
          "rounded-2xl border border-amber-500/30 shadow-xs overflow-hidden",
          className
        )}
      >
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl flex items-center justify-center shrink-0 bg-muted text-foreground">
              {icon}
            </span>
            <div>
              <span className="text-xs font-medium text-muted-foreground block">{title}</span>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                {isBangla ? "লক করা" : "Locked"}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isPremiumOnly
              ? isBangla
                ? "দিনভিত্তিক হিসাব ও রানওয়ে দেখতে মিটার প্লাস প্রয়োজন।"
                : "Meter Plus unlocks daily intelligence and runway for this stat."
              : isBangla
              ? "দিনভিত্তিক হিসাব দেখতে লগইন করুন।"
              : "Sign in to see daily intelligence for this stat."}
          </p>
          {isPremiumOnly && onUpgradeClick ? (
            <Button size="sm" onClick={onUpgradeClick} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
              <Crown className="size-3.5 fill-current" />
              <span>{isBangla ? "আনলক করুন (৳২০)" : "Unlock (৳20)"}</span>
            </Button>
          ) : onLoginClick ? (
            <Button size="sm" onClick={onLoginClick} className="w-full">
              <Lock className="size-3.5" />
              <span>{isBangla ? "লগইন করুন" : "Sign In"}</span>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "rounded-2xl border transition-all duration-200 overflow-hidden relative shadow-xs",
        highlight ? "border-primary/40 bg-primary/5" : "hover:border-border/80",
        className
      )}
    >
      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "p-2 rounded-xl flex items-center justify-center shrink-0",
                highlight ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              )}
            >
              {icon}
            </span>
            <div>
              <span className="text-xs font-medium text-muted-foreground block">{title}</span>
              {isEstimate && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 px-1.5 font-normal text-muted-foreground border-dashed"
                >
                  {isBangla ? "আনুমানিক হিসাব" : "Estimated"}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="mt-1">
          <div className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground break-all">
            {value}
          </div>

          {subvalue && (
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">{subvalue}</p>
          )}

          {trend && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium">
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-md font-semibold",
                  trend.isPositive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}
              >
                {trend.value}
              </span>
              <span className="text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
