import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field"
import { cn } from "cn"
import { MinusIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/features/i18n/language-context"

const stepButton = (
  <Button variant="ghost" size="icon" className="h-full rounded-none" />
)

function NumberField({
  className,
  // shortcut: Base UI cannot parse Bengali digits, so the field stays on Latin
  // digits in both languages. Revisit if Base UI adds the Bengali numeral range.
  locale = "en-US",
  "aria-label": ariaLabel,
  ...props
}: {
  id?: string
  value?: number | null
  defaultValue?: number
  onValueChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  format?: Intl.NumberFormatOptions
  locale?: string
  disabled?: boolean
  "aria-label"?: string
  className?: string
}) {
  const { t } = useLanguage()

  return (
    <NumberFieldPrimitive.Root
      data-slot="number-field"
      locale={locale}
      className={cn("w-full", className)}
      {...props}
    >
      <NumberFieldPrimitive.Group
        data-slot="number-field-group"
        className="flex h-(--bb-control-h) w-full items-center overflow-hidden rounded-(--bb-control-radius) border-(length:--bb-border-w) border-input bg-background transition-[color,box-shadow] duration-200 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30 data-disabled:opacity-50"
      >
        <NumberFieldPrimitive.Decrement
          aria-label={t.common.decrease}
          render={stepButton}
        >
          <MinusIcon />
        </NumberFieldPrimitive.Decrement>
        <NumberFieldPrimitive.Input
          aria-label={ariaLabel}
          className="num h-full w-full min-w-0 flex-1 bg-transparent text-center text-base outline-none md:text-sm"
        />
        <NumberFieldPrimitive.Increment
          aria-label={t.common.increase}
          render={stepButton}
        >
          <PlusIcon />
        </NumberFieldPrimitive.Increment>
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  )
}

export { NumberField }
