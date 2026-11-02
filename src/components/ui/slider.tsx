"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "cn"

export interface SliderProps extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, "onValueChange" | "value" | "defaultValue"> {
  className?: string
  value?: number | number[]
  defaultValue?: number | number[]
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  onValueChange?: (value: number | number[]) => void
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value, defaultValue, min = 0, max = 100, step = 1, disabled, onValueChange, ...props }, ref) => {
    return (
      <SliderPrimitive.Root
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(val) => {
          if (onValueChange) {
            onValueChange(val as number | number[])
          }
        }}
        className={cn(
          "relative flex w-full touch-none select-none items-center py-2",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        <SliderPrimitive.Control className="relative flex w-full touch-none select-none items-center cursor-pointer">
          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
            <SliderPrimitive.Indicator className="absolute h-full bg-primary transition-all" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block size-5 rounded-full border-2 border-primary bg-background shadow-md transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none active:scale-95" />
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
    )
  }
)

Slider.displayName = "Slider"

export { Slider }
