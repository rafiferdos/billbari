import type { NescoFetchResult, RechargeRecord } from "@/features/nesco/types"
import { toNum } from "@/features/nesco/parse-utils"
import { isSameCalendarMonth, monthIndex, parseNescoDate, sortMonthlyDesc, yearNumber } from "@/lib/nesco-dates"
import { LIFELINE_RATE, calculateNescoBill } from "@/lib/tariff-constants"

export interface FreeStats {
  latestMonth: { year: number; monthIndex: number; usageKwh: number; rechargeBdt: number; isCurrentMonth: boolean } | null
  /** Between the two most recent complete months. */
  monthOverMonthKwhPct: number | null
  avgMonthlyKwh: number | null
  avgMonthlyRechargeBdt: number | null
  currentSlab: { step: number; nameBn: string; nameEn: string; ratePerUnit: number; minUnits: number; maxUnits: number | null } | null
  balanceUnitsEstimate: number | null
  last12MonthsRechargeBdt: number
  totalRebateBdt: number
  daysSinceLastRecharge: number | null
}

export interface DeductionTotals {
  gross: number
  net: number
  rent: number
  demandCharge: number
  pfcCharge: number
  vat: number
  arrears: number
  subsidy: number
}

const sum = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100
const mean = (values: number[]) => (values.length ? sum(values) / values.length : null)

function slabFor(units: number, loadKw: number): FreeStats["currentSlab"] {
  if (units <= 0) return null
  // calculateNescoBill reports step 1 here but bills the lifeline rate.
  if (units <= 50) {
    return { step: 0, nameBn: "লাইফলাইন", nameEn: "Lifeline", ratePerUnit: LIFELINE_RATE, minUnits: 0, maxUnits: 50 }
  }
  const { step, nameBangla, nameEnglish, ratePerUnit, minUnits, maxUnits } = calculateNescoBill(units, loadKw).activeStep
  return { step, nameBn: nameBangla, nameEn: nameEnglish, ratePerUnit, minUnits, maxUnits }
}

export function computeFreeStats(data: NescoFetchResult, now: Date = new Date()): FreeStats {
  const load = toNum(String(data.customerInfo.approvedLoadKw))
  const loadKw = load > 0 ? load : 2

  const months = sortMonthlyDesc(data.monthlyUsage).filter((r) => monthIndex(r.month) !== null)
  const complete = months.filter((r) => !isSameCalendarMonth(r, now))
  const latest = months.at(0)
  const [last, before] = [complete.at(0), complete.at(1)]

  const avgKwh = mean(complete.map((m) => m.usageKwh).filter((v) => v > 0).slice(0, 12))
  const avgRecharge = mean(complete.map((m) => m.rechargeBdt).filter((v) => v > 0).slice(0, 12))
  const avgMonthlyKwh = avgKwh === null ? null : Math.round(avgKwh * 10) / 10
  const rate = avgMonthlyKwh === null ? 0 : calculateNescoBill(avgMonthlyKwh, loadKw).effectiveRatePerUnit

  const rechargeTimes = data.rechargeHistory.map((r) => parseNescoDate(r.date)?.getTime()).filter((t) => t !== undefined)

  return {
    latestMonth: latest
      ? {
          year: yearNumber(latest.year),
          monthIndex: monthIndex(latest.month)!,
          usageKwh: latest.usageKwh,
          rechargeBdt: latest.rechargeBdt,
          isCurrentMonth: isSameCalendarMonth(latest, now),
        }
      : null,
    // `|| 0` turns Math.round's -0 into 0
    monthOverMonthKwhPct:
      last && before && before.usageKwh > 0
        ? Math.round(((last.usageKwh - before.usageKwh) / before.usageKwh) * 100) || 0
        : null,
    avgMonthlyKwh,
    avgMonthlyRechargeBdt: avgRecharge === null ? null : Math.round(avgRecharge),
    currentSlab: latest ? slabFor(latest.usageKwh, loadKw) : null,
    balanceUnitsEstimate: rate > 0 ? Math.max(0, Math.floor(data.customerInfo.balance / rate)) : null,
    last12MonthsRechargeBdt: sum(months.slice(0, 12).map((m) => m.rechargeBdt)),
    // NESCO reports rebates as negative numbers
    totalRebateBdt: sum(data.monthlyUsage.map((m) => Math.abs(m.discountBdt))),
    daysSinceLastRecharge: rechargeTimes.length
      ? Math.max(0, Math.floor((now.getTime() - Math.max(...rechargeTimes)) / 86_400_000))
      : null,
  }
}

export function computeDeductionTotals(records: RechargeRecord[]): DeductionTotals {
  const total = (pick: (r: RechargeRecord) => number | undefined) => sum(records.map((r) => pick(r) ?? 0))
  return {
    gross: total((r) => r.amountBdt),
    net: total((r) => r.netEnergyBdt ?? r.amountBdt),
    rent: total((r) => r.rent),
    demandCharge: total((r) => r.demandCharge),
    pfcCharge: total((r) => r.pfcCharge),
    vat: total((r) => r.vat),
    arrears: total((r) => r.arrears),
    subsidy: total((r) => Math.abs(r.subsidy ?? 0)),
  }
}
