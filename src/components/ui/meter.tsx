import { Meter as MeterPrimitive } from "@base-ui/react/meter"
import { cn } from "cn"

import { useLanguage } from "@/features/i18n/language-context"

const TONES = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
}

function Meter({
  value,
  min = 0,
  max = 100,
  label,
  showValue = false,
  tone = "default",
  className,
  "aria-label": ariaLabel,
}: {
  value: number
  min?: number
  max?: number
  label?: React.ReactNode
  showValue?: boolean
  tone?: keyof typeof TONES
  className?: string
  /** Names the meter when there is no visible `label`. */
  "aria-label"?: string
}) {
  const { isBangla } = useLanguage()

  return (
    <MeterPrimitive.Root
      data-slot="meter"
      aria-label={ariaLabel}
      value={Math.min(max, Math.max(min, value))}
      min={min}
      max={max}
      locale={isBangla ? "bn-BD" : "en-US"}
      className={cn("flex w-full flex-col gap-1.5", className)}
    >
      {(label || showValue) && (
        <div
          data-slot="meter-header"
          className="flex items-baseline justify-between gap-2 text-sm"
        >
          {label && (
            <MeterPrimitive.Label data-slot="meter-label">
              {label}
            </MeterPrimitive.Label>
          )}
          {showValue && (
            <MeterPrimitive.Value
              data-slot="meter-value"
              className="num ml-auto text-muted-foreground"
            />
          )}
        </div>
      )}
      <MeterPrimitive.Track
        data-slot="meter-track"
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <MeterPrimitive.Indicator
          data-slot="meter-indicator"
          className={cn("rounded-full transition-all", TONES[tone])}
        />
      </MeterPrimitive.Track>
    </MeterPrimitive.Root>
  )
}

export { Meter }
