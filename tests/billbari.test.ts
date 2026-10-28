import { describe, it, expect } from "vitest"
import { toBanglaNumber, fromBanglaNumber, formatBDT, formatUnits, formatMonthBangla } from "../src/lib/bangla"
import { calculateNescoBill, LIFELINE_RATE } from "../src/lib/tariff-constants"
import { generateAnalytics } from "../src/features/analytics/insights-generator"
import { getSampleMeterData } from "../src/features/nesco/sample-data"
import { getDatabase } from "../src/features/db/server-db"

describe("Bangla & Currency Formatting Utilities", () => {
  it("converts english numerals to natural Bangla numerals", () => {
    expect(toBanglaNumber(12345678)).toBe("১২৩৪৫৬৭৮")
    expect(toBanglaNumber("01928374")).toBe("০১৯২৮৩৭৪")
    expect(toBanglaNumber(0)).toBe("০")
  })

  it("converts Bangla numerals back to English", () => {
    expect(fromBanglaNumber("১২৩৪৫৬৭৮")).toBe("12345678")
  })

  it("formats currency in BDT with Taka symbol (৳)", () => {
    const formatted = formatBDT(1500.5, { inBangla: true })
    expect(formatted).toContain("৳")
    expect(formatted).toContain("১,৫০০.৫০")

    const engFormatted = formatBDT(1500.5, { inBangla: false })
    expect(engFormatted).toBe("৳1,500.50")
  })

  it("formats energy units in kWh", () => {
    expect(formatUnits(245.3)).toBe("২৪৫.৩ kWh")
  })

  it("translates months into natural Bengali", () => {
    expect(formatMonthBangla("January")).toBe("জানুয়ারি")
    expect(formatMonthBangla("October")).toBe("অক্টোবর")
  })
})

describe("NESCO Official LT-A Tariff Calculator", () => {
  it("calculates lifeline rate for consumption under 50 units", () => {
    const bill = calculateNescoBill(40, 2, true)
    expect(bill.energyCharge).toBe(Math.round(40 * LIFELINE_RATE * 100) / 100)
    expect(bill.slabBreakdown[0].nameBangla).toContain("লাইফলাইন")
  })

  it("calculates tiered multi-slab rates for residential usage", () => {
    const bill = calculateNescoBill(250, 2, true)
    // First 75 units @ 5.26
    // Next 125 units @ 7.20 (76-200)
    // Remaining 50 units @ 7.59 (201-300)
    const expectedEnergy = 75 * 5.26 + 125 * 7.20 + 50 * 7.59
    expect(bill.energyCharge).toBe(expectedEnergy)
    expect(bill.activeStep.step).toBe(3)
  })

  it("includes demand charge, meter rent, 5% VAT and 1% prepaid rebate", () => {
    const bill = calculateNescoBill(200, 2, true)
    expect(bill.demandCharge).toBe(2 * 42.0)
    expect(bill.meterRent).toBe(40.0)
    expect(bill.vatAmount).toBeGreaterThan(0)
    expect(bill.rebateAmount).toBeGreaterThan(0)
    expect(bill.totalBill).toBeGreaterThan(bill.energyCharge)
  })
})

describe("Bangla Smart Analytics & Insights", () => {
  it("separates actual NESCO metrics from calculated estimates", () => {
    const sample = getSampleMeterData("12345678")
    const analytics = generateAnalytics(sample)

    // Actual metrics
    expect(analytics.actual.currentBalance).toBe(987.43)
    expect(analytics.actual.lastRechargeAmount).toBe(1000)
    expect(analytics.actual.lastRechargeVia).toBe("bKash")

    // Calculated estimates
    expect(analytics.estimates.avgDailyKwh).toBeGreaterThan(0)
    expect(analytics.estimates.avgDailyCostBdt).toBeGreaterThan(0)
    expect(analytics.estimates.estimatedDaysRemaining).toBeGreaterThan(0)

    // Insights generated
    expect(analytics.insights.length).toBeGreaterThan(0)
    const estimateInsight = analytics.insights.find((i) => i.isCalculatedEstimate)
    expect(estimateInsight).toBeDefined()
  })
})

describe("Server-side Database Persistence (Turso / libSQL)", () => {
  it("initializes tables and supports CRUD operations", async () => {
    const db = await getDatabase()
    const testId = `user_${Date.now()}`
    const testEmail = `test_${Date.now()}@billbari.com`

    await db.execute({
      sql: `
        INSERT INTO users (id, email, name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [testId, testEmail, "Test User", new Date().toISOString(), new Date().toISOString()],
    })

    const res = await db.execute({
      sql: `SELECT * FROM users WHERE id = ?`,
      args: [testId],
    })
    const row = res.rows[0] as any
    expect(row).toBeDefined()
    expect(row.email).toBe(testEmail)
    expect(row.name).toBe("Test User")

    // Insert snapshot
    const snapId = `snap_${Date.now()}`
    await db.execute({
      sql: `
        INSERT INTO snapshots (
          id, user_id, meter_number, snapshot_date, balance, reading_kwh,
          daily_estimated_cost, monthly_estimated_cost, source_type, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [snapId, testId, "12345678", "2026-10-29", 987.43, 2450.5, 85.0, 2550.0, "manual_reading", new Date().toISOString()],
    })

    const snapRes = await db.execute({
      sql: `SELECT * FROM snapshots WHERE id = ?`,
      args: [snapId],
    })
    const snapRow = snapRes.rows[0] as any
    expect(snapRow).toBeDefined()
    expect(snapRow.meter_number).toBe("12345678")
    expect(Number(snapRow.balance)).toBeCloseTo(987.43)
  })
})
