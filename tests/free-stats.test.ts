import { describe, expect, it } from "vitest"
import { isSameCalendarMonth, monthIndex, parseNescoDate, sortMonthlyDesc } from "../src/lib/nesco-dates"
import { estimateDailyKwh } from "../src/features/analytics/daily-rate"
import { computeDeductionTotals, computeFreeStats } from "../src/features/analytics/free-stats"
import { generateAnalytics } from "../src/features/analytics/insights-generator"
import { LIFELINE_RATE } from "../src/lib/tariff-constants"
import { getSampleMeterData } from "../src/features/nesco/sample-data"
import type { MonthlyConsumptionRecord, RechargeRecord } from "../src/features/nesco/types"

const now = new Date(2026, 10, 27) // 27 Nov 2026
const month = (name: string, usageKwh: number, rechargeBdt: number, discountBdt: number): MonthlyConsumptionRecord => ({
  year: 2026, month: name, usageKwh, rechargeBdt, discountBdt,
})
// newest last on purpose, to prove sorting
const rows = [month("September", 250, 2000, 20), month("October", 300, 2500, 25), month("November", 120, 1000, 10)]
const data = { ...getSampleMeterData("12345678"), monthlyUsage: rows }

describe("nesco dates", () => {
  it("reads month names in English, Bangla and digits", () => {
    for (const m of ["November", "nov", "নভেম্বর", "নভে", "১১", "11", 11]) expect(monthIndex(m)).toBe(10)
    expect(monthIndex("01")).toBe(0)
    for (const m of ["xyz", "13", "0", ""]) expect(monthIndex(m)).toBeNull()
  })

  it("sorts newest first and keeps unreadable months at the end in input order", () => {
    const odd = [month("??", 1, 0, 0), month("January", 2, 0, 0), month("!!", 3, 0, 0), { ...month("December", 4, 0, 0), year: "২০২৫" }]
    expect(sortMonthlyDesc(odd).map((r) => r.usageKwh)).toEqual([2, 4, 1, 3])
  })

  it("matches the current month and parses recharge dates", () => {
    expect(isSameCalendarMonth({ year: "2026", month: "November" }, now)).toBe(true)
    expect(isSameCalendarMonth({ year: "2025", month: "November" }, now)).toBe(false)
    expect(parseNescoDate("15-NOV-2026 2:15 PM")?.getDate()).toBe(15)
    expect(parseNescoDate("05-11-2026")?.getFullYear()).toBe(2026)
    expect(parseNescoDate("")).toBeNull()
    expect(parseNescoDate("soon")).toBeNull()
  })
})

describe("estimateDailyKwh", () => {
  it("uses the current month once five days have passed", () => {
    expect(estimateDailyKwh(rows, new Date(2026, 10, 10))).toEqual({ kwhPerDay: 12, source: "current_month" })
  })

  it("falls back to the last complete month early in the month", () => {
    expect(estimateDailyKwh(rows, new Date(2026, 10, 3))).toEqual({ kwhPerDay: 9.68, source: "last_complete_month" })
  })

  it("does not call an empty current month a rate", () => {
    const empty = [month("October", 310, 0, 0), month("November", 0, 0, 0)]
    expect(estimateDailyKwh(empty, now)).toEqual({ kwhPerDay: 10, source: "last_complete_month" })
  })

  it("returns null without data", () => {
    expect(estimateDailyKwh([], now)).toBeNull()
    expect(estimateDailyKwh([month("November", 40, 0, 0)], new Date(2026, 10, 2))).toBeNull()
  })
})

describe("computeFreeStats", () => {
  it("computes from complete months", () => {
    const s = computeFreeStats(data, now)
    expect(s.latestMonth).toMatchObject({ year: 2026, monthIndex: 10, usageKwh: 120, isCurrentMonth: true })
    expect(s.monthOverMonthKwhPct).toBe(20) // Oct 300 vs Sep 250
    expect(s.avgMonthlyKwh).toBe(275)
    expect(s.avgMonthlyRechargeBdt).toBe(2250)
    expect(s.currentSlab).toMatchObject({ step: 2, ratePerUnit: 7.2, minUnits: 76, maxUnits: 200 })
    expect(s.balanceUnitsEstimate).toBeGreaterThan(0)
    expect(s.last12MonthsRechargeBdt).toBe(5500)
    expect(s.totalRebateBdt).toBe(55)
    expect(s.daysSinceLastRecharge).toBe(32) // 25 Oct → 27 Nov, partial day floored
  })

  it("counts NESCO's negative rebates as savings", () => {
    const negative = rows.map((r) => ({ ...r, discountBdt: -r.discountBdt }))
    expect(computeFreeStats({ ...data, monthlyUsage: negative }, now).totalRebateBdt).toBe(55)
  })

  it("reports the lifeline tier at 50 units and below", () => {
    const s = computeFreeStats({ ...data, monthlyUsage: [month("November", 40, 0, 0)] }, now)
    expect(s.currentSlab).toMatchObject({ step: 0, nameEn: "Lifeline", ratePerUnit: LIFELINE_RATE, maxUnits: 50 })
  })

  it("returns nulls, not NaN, for an empty meter", () => {
    const e = computeFreeStats({ ...data, monthlyUsage: [], rechargeHistory: [] }, now)
    expect(e).toMatchObject({
      latestMonth: null, monthOverMonthKwhPct: null, avgMonthlyKwh: null, avgMonthlyRechargeBdt: null, currentSlab: null,
      balanceUnitsEstimate: null, last12MonthsRechargeBdt: 0, totalRebateBdt: 0, daysSinceLastRecharge: null,
    })
    expect(JSON.stringify(e)).not.toMatch(/NaN|Infinity/)
  })

  it("never produces -0", () => {
    const flat = [month("September", 1000, 0, 0), month("October", 999, 0, 0)]
    const s = computeFreeStats({ ...data, customerInfo: { ...data.customerInfo, balance: -5 }, monthlyUsage: flat }, now)
    expect(Object.is(s.monthOverMonthKwhPct, 0)).toBe(true)
    expect(Object.is(s.balanceUnitsEstimate, 0)).toBe(true)
  })
})

describe("computeDeductionTotals", () => {
  it("sums every deduction", () => {
    const record = { amountBdt: 1000, netEnergyBdt: 900, rent: 40, demandCharge: 84, vat: 45, subsidy: -4.5 } as RechargeRecord
    expect(computeDeductionTotals([record, record])).toEqual({
      gross: 2000, net: 1800, rent: 80, demandCharge: 168, pfcCharge: 0, vat: 90, arrears: 0, subsidy: 9,
    })
  })
})

describe("generateAnalytics honesty", () => {
  const empty = generateAnalytics({ ...data, monthlyUsage: [], rechargeHistory: [] })

  it("invents nothing without usage data", () => {
    expect(empty.hasEnoughData).toBe(false)
    expect(empty.estimates).toMatchObject({
      avgDailyKwh: 0, avgDailyCostBdt: 0, estimatedDaysRemaining: 0, projectedMonthlyUnits: 0,
      projectedMonthlyCostBdt: 0, dailyKwhSource: null,
    })
    expect(empty.runway).toMatchObject({ estimatedDaysRemaining: 0, unitsRemaining: 0, urgencyLevel: "healthy" })
    expect(empty.slabStats.unitsRemainingInSlab).toBeNull()
    expect(empty.insights.map((i) => i.id).filter((id) => /^(balance|slab|effective)/.test(id))).toEqual([])
    expect(JSON.stringify(empty)).not.toMatch(/NaN|Infinity/)
  })

  it("does not trust NESCO's row order", () => {
    const a = generateAnalytics({ ...data, monthlyUsage: rows })
    expect(a.actual.latestMonthName).toBe("November")
    expect(a.actual.previousMonthUnits).toBe(300)
  })
})
