import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  subvalue?: string
  icon: React.ReactNode
  trend?: {
    value: string
    isPositive?: boolean // positive typically good, but for expense might be reverse
    label: string
  }
  isEstimate?: boolean
  highlight?: boolean
  className?: string
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
}: StatCardProps) {
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
                  গণনাকৃত অনুমান
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
