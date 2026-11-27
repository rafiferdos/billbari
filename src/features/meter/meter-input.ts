import { fromBanglaNumber } from "@/lib/bangla"

export type MeterInputError = "empty" | "too_short" | "too_long"

export function normalizeMeterInput(raw: string): { digits: string; error: MeterInputError | null } {
  const digits = fromBanglaNumber(raw).replace(/[^0-9]/g, "")
  const error = !digits ? "empty" : digits.length < 8 ? "too_short" : digits.length > 11 ? "too_long" : null
  return { digits, error }
}

export function maskMeter(meter: string): string {
  return `••••${meter.slice(-4)}`
}
