import { describe, expect, it } from "vitest"
import { filterRecharges, monthlyValue, visibleMonthlyKeys } from "../src/features/history/records"
import type { MonthlyConsumptionRecord, RechargeRecord } from "../src/features/nesco/types"

const recharge = (id: string, date: string, extra: Partial<RechargeRecord> = {}): RechargeRecord => ({
  id,
  date,
  token: "1111-2222-3333-4444-5555",
  powerKwh: 100,
  amountBdt: 1000,
  via: "bKash",
  status: "Success",
  ...extra,
})
const now = new Date(2026, 10, 27)
const records = [
  recharge("new", "20-Nov-2026"),
  recharge("old", "01-Jan-2025", { amountBdt: 750, via: "Rocket", token: "99998888777766665555" }),
  recharge("bad", "not a date", { amountBdt: 300 }),
]
const ids = (period: "all" | "30" | "365", query = "") =>
  filterRecharges(records, { period, query }, now).map((r) => r.id)

describe("filterRecharges", () => {
  it("filters by period but never hides a record whose date cannot be read", () => {
    expect(ids("all")).toEqual(["new", "old", "bad"])
    expect(ids("30")).toEqual(["new", "bad"])
    expect(ids("365")).toEqual(["new", "bad"])
  })

  it("searches channel, amount and date", () => {
    expect(ids("all", "rocket")).toEqual(["old"])
    expect(ids("all", "750")).toEqual(["old"])
    expect(ids("all", "Jan-2025")).toEqual(["old"])
  })

  it("finds a token however it is grouped, typed in Latin or Bangla digits", () => {
    expect(ids("all", "9999 8888")).toEqual(["old"])
    expect(ids("all", "4444-5555")).toEqual(["new", "bad"])
    expect(ids("all", "৯৯৯৯৮৮৮৮")).toEqual(["old"])
    // nothing left once the separators are gone: must not match everything
    expect(ids("all", "- -")).toEqual([])
  })
})

describe("monthly columns", () => {
  const month = (extra: Partial<MonthlyConsumptionRecord> = {}): MonthlyConsumptionRecord => ({
    year: 2026,
    month: "Oct",
    rechargeBdt: 1000,
    discountBdt: -10,
    usageKwh: 120,
    ...extra,
  })

  it("skips a column that is zero or missing in every row", () => {
    expect(visibleMonthlyKeys([month({ vat: 0 }), month({ meterRent: 40 })])).toEqual([
      "usageKwh",
      "rechargeBdt",
      "discountBdt",
      "meterRent",
    ])
    expect(visibleMonthlyKeys([])).toEqual([])
  })

  it("shows the rebate as a positive amount and leaves a missing value empty", () => {
    expect(monthlyValue(month(), "discountBdt")).toBe(10)
    expect(monthlyValue(month(), "vat")).toBeNull()
    expect(monthlyValue(month({ monthEndBalance: -5 }), "monthEndBalance")).toBe(-5)
  })
})
