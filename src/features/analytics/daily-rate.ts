import type { MonthlyConsumptionRecord } from "@/features/nesco/types"
import { isSameCalendarMonth, monthIndex, sortMonthlyDesc, yearNumber } from "@/lib/nesco-dates"

// Fewer days than this and one heavy day would dominate the rate.
const MIN_DAYS_OF_CURRENT_MONTH = 5
const round2 = (n: number) => Math.round(n * 100) / 100

export function estimateDailyKwh(
  monthly: MonthlyConsumptionRecord[],
  now: Date
): { kwhPerDay: number; source: "current_month" | "last_complete_month" } | null {
  const rows = sortMonthlyDesc(monthly).filter((r) => monthIndex(r.month) !== null)
  const newest = rows.at(0)
  if (newest && isSameCalendarMonth(newest, now) && now.getDate() >= MIN_DAYS_OF_CURRENT_MONTH && newest.usageKwh > 0) {
    return { kwhPerDay: round2(newest.usageKwh / now.getDate()), source: "current_month" }
  }

  const complete = rows.find((r) => !isSameCalendarMonth(r, now) && r.usageKwh > 0)
  if (!complete) return null
  const days = new Date(yearNumber(complete.year), monthIndex(complete.month)! + 1, 0).getDate()
  return { kwhPerDay: round2(complete.usageKwh / days), source: "last_complete_month" }
}
