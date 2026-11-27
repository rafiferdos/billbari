import type { MonthlyConsumptionRecord, RechargeRecord } from "@/features/nesco/types"
import { fromBanglaNumber } from "@/lib/bangla"
import { parseNescoDate } from "@/lib/nesco-dates"

export const PERIODS = ["all", "30", "90", "365"] as const
export type Period = (typeof PERIODS)[number]

const squash = (text: string) => text.replace(/[\s-]/g, "")

/** By period, then by search. A date that cannot be parsed is kept, never silently hidden. */
export function filterRecharges(
  records: RechargeRecord[],
  { period, query }: { period: Period; query: string },
  now: Date = new Date()
): RechargeRecord[] {
  const cutoff = period === "all" ? -Infinity : now.getTime() - Number(period) * 86_400_000
  const q = fromBanglaNumber(query).trim().toLowerCase()
  const digits = squash(q)

  return records.filter((r) => {
    if ((parseNescoDate(r.date)?.getTime() ?? Infinity) < cutoff) return false
    if (!q) return true
    return (
      [r.token, r.via, r.date, String(r.amountBdt)].some((value) => value.toLowerCase().includes(q)) ||
      (digits !== "" && squash(r.token.toLowerCase()).includes(digits))
    )
  })
}

export const MONTHLY_VALUE_KEYS = [
  "usageKwh",
  "rechargeBdt",
  "discountBdt",
  "energyBdt",
  "meterRent",
  "demandCharge",
  "vat",
  "totalBillBdt",
  "monthEndBalance",
] as const
export type MonthlyValueKey = (typeof MONTHLY_VALUE_KEYS)[number]

/** NESCO's older tables lack whole columns; a column that is zero everywhere says nothing. */
export function visibleMonthlyKeys(rows: MonthlyConsumptionRecord[]): MonthlyValueKey[] {
  return MONTHLY_VALUE_KEYS.filter((key) => rows.some((row) => row[key]))
}

export function monthlyValue(row: MonthlyConsumptionRecord, key: MonthlyValueKey): number | null {
  const value = row[key]
  if (value === undefined) return null
  // NESCO reports rebates as negative numbers
  return key === "discountBdt" ? Math.abs(value) : value
}
