import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lock, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const isLocked = requiresAuth || requiresPremium

  return (
    <Card
      className={cn(
        "rounded-2xl border transition-all duration-200 overflow-hidden relative shadow-xs",
        highlight ? "border-primary/40 bg-primary/5" : "hover:border-border/80",
        className
      )}
    >
      {/* Blurred lock overlay if authentication or premium is required */}
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-background/85 backdrop-blur-xs text-center z-10 border border-amber-500/30">
          <div className="p-1.5 rounded-full bg-amber-500/10 text-amber-500 mb-1">
            {requiresPremium && !requiresAuth ? (
              <Crown className="size-3.5 fill-amber-500" />
            ) : (
              <Lock className="size-3.5 text-primary" />
            )}
          </div>
          <span className="text-xs font-bold text-foreground leading-tight">
            {requiresPremium && !requiresAuth ? "বিদ্যুৎ গোয়েন্দা ফিচার" : "দিনভিত্তিক হিসাব দেখতে"}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            {requiresPremium && !requiresAuth ? "সাবস্ক্রিপশন প্রয়োজন" : "লগইন করা প্রয়োজন"}
          </span>
          {requiresPremium && !requiresAuth && onUpgradeClick ? (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="mt-2 px-3 py-1 text-[11px] font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Crown className="size-3 fill-current" />
              <span>আনলক করুন (৳২০)</span>
            </button>
          ) : onLoginClick ? (
            <button
              type="button"
              onClick={onLoginClick}
              className="mt-2 px-3 py-1 text-[11px] font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
            >
              লগইন করুন
            </button>
          ) : null}
        </div>
      )}

      <CardContent
        className={cn(
          "p-4 sm:p-5 flex flex-col justify-between h-full",
          isLocked && "filter blur-sm select-none opacity-30 pointer-events-none"
        )}
      >
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
                  আনুমানিক হিসাব
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="mt-1">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
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
