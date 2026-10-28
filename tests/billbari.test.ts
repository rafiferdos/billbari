import { describe, it, expect } from "vitest"
import { toBanglaNumber, fromBanglaNumber, formatBDT, formatUnits, formatMonthBangla } from "../src/lib/bangla"
import { calculateNescoBill, LIFELINE_RATE } from "../src/lib/tariff-constants"
import { generateAnalytics } from "../src/features/analytics/insights-generator"
import { getSampleMeterData } from "../src/features/nesco/sample-data"
import { getDatabase } from "../src/features/db/server-db"
import { PAYMENT_PLANS } from "../src/features/payments/types"
import { APPLIANCES, HOUSEHOLD_PRESETS, calculateMonthlyUnits } from "../src/features/tariffs/appliance-data"

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

  it("intelligently differentiates gross recharge from net electricity amount and deductions", () => {
    const sample = getSampleMeterData("12345678")
    // Simulate real NESCO voucher with deductions: 1000 recharge -> 748.92 net energy
    sample.rechargeHistory[0] = {
      ...sample.rechargeHistory[0],
      amountBdt: 1000,
      netEnergyBdt: 748.92,
      powerKwh: 120.4,
      rent: 40,
      demandCharge: 168,
      vat: 47.62,
      subsidy: -4.54,
    }
    const analytics = generateAnalytics(sample)

    expect(analytics.actual.lastRechargeAmount).toBe(1000)
    expect(analytics.actual.lastRechargeNetEnergyBdt).toBe(748.92)
    expect(analytics.actual.lastRechargeDeductionsBdt).toBe(251.08)
    expect(analytics.rechargeStats.lastRechargeAmount).toBe(1000)
    expect(analytics.rechargeStats.lastRechargeNetEnergyBdt).toBe(748.92)
    expect(analytics.rechargeStats.lastRechargeDeductionsBdt).toBe(251.08)

    // Deduction breakdown insight must be generated
    const deductionInsight = analytics.insights.find((i) => i.id === "latest-recharge-deductions")
    expect(deductionInsight).toBeDefined()
    expect(deductionInsight?.description).toContain("১,০০০")
    expect(deductionInsight?.description).toContain("৭৪৮.৯২")
  })

  it("calculates real-world recharge intelligence and ticket sizes", () => {
    const sample = getSampleMeterData("12345678")
    const analytics = generateAnalytics(sample)

    expect(analytics.rechargeStats.totalCount).toBe(sample.rechargeHistory.length)
    expect(analytics.rechargeStats.totalAmountBdt).toBeGreaterThan(0)
    expect(analytics.rechargeStats.averageAmountBdt).toBeGreaterThan(0)
    expect(analytics.rechargeStats.minAmountBdt).toBe(1000)
    expect(analytics.rechargeStats.maxAmountBdt).toBe(2000)
    expect(analytics.rechargeStats.favoriteVia).toBe("বিকাশ")
    expect(analytics.rechargeStats.favoriteViaPct).toBeGreaterThan(0)
    expect(analytics.rechargeStats.averageDaysBetweenRecharges).toBeGreaterThan(0)
  })

  it("calculates true cost efficiency, effective rate and 1% government rebate", () => {
    const sample = getSampleMeterData("12345678")
    const analytics = generateAnalytics(sample)

    expect(analytics.costEfficiency.effectiveCostPerKwh).toBeGreaterThan(5)
    expect(analytics.costEfficiency.totalGovernmentRebateBdt).toBeGreaterThan(0)
    expect(analytics.costEfficiency.estimatedUnitsRemaining).toBeGreaterThan(0)
    expect(analytics.costEfficiency.fixedOverheadPerMonthBdt).toBe(124) // 40 meter rent + 2 * 42 demand charge
  })

  it("calculates seasonality peak vs off-peak consumption", () => {
    const sample = getSampleMeterData("12345678")
    const analytics = generateAnalytics(sample)

    expect(analytics.seasonality.highestMonth).toBeDefined()
    expect(analytics.seasonality.highestMonth?.month).toBe("July")
    expect(analytics.seasonality.lowestMonth?.month).toBe("January")
    expect(analytics.seasonality.seasonalityGapPct).toBeGreaterThan(50)
  })

  it("calculates balance runway depletion date and eco carbon footprint", () => {
    const sample = getSampleMeterData("12345678")
    const analytics = generateAnalytics(sample)

    expect(analytics.runway.depletionDate).toContain("২০")
    expect(analytics.eco.carbonKg).toBeGreaterThan(0)
    expect(analytics.eco.treesNeeded).toBeGreaterThan(0)
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

describe("bKash Payment & Subscription Management", () => {
  it("provides valid pricing plans for Meter Plus (Monthly) and Premium Unlimited (Lifetime)", () => {
    expect(PAYMENT_PLANS).toHaveLength(2)

    const monthly = PAYMENT_PLANS.find((p) => p.id === "detective_monthly")
    expect(monthly).toBeDefined()
    expect(monthly?.nameBangla).toBe("মিটার প্লাস")
    expect(monthly?.priceBdt).toBe(20)

    const lifetime = PAYMENT_PLANS.find((p) => p.id === "lifetime")
    expect(lifetime).toBeDefined()
    expect(lifetime?.nameBangla).toBe("প্রিমিয়াম আনলিমিটেড")
    expect(lifetime?.priceBdt).toBe(100)
  })

  it("records payment and enforces TrxID uniqueness in database", async () => {
    const db = await getDatabase()
    const testUserId = `user_pay_${Date.now()}`
    const testEmail = `user_pay_${Date.now()}@test.com`
    const testTrxId = `TRX${Date.now().toString().slice(-7)}`

    // Create user
    await db.execute({
      sql: `INSERT INTO users (id, email, name, created_at, updated_at) VALUES (?, ?, 'Subscriber', ?, ?)`,
      args: [testUserId, testEmail, new Date().toISOString(), new Date().toISOString()],
    })

    // Record initial payment
    const paymentId = `pay_${Date.now()}`
    await db.execute({
      sql: `
        INSERT INTO payments (id, user_id, provider, plan_type, amount_bdt, sender_number, trx_id, status, verified_at, created_at)
        VALUES (?, ?, 'bkash', 'detective_monthly', 20, '01700000000', ?, 'completed', ?, ?)
      `,
      args: [paymentId, testUserId, testTrxId, new Date().toISOString(), new Date().toISOString()],
    })

    // Updating user subscription tier
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await db.execute({
      sql: `UPDATE users SET subscription_tier = 'detective_monthly', subscription_expires_at = ? WHERE id = ?`,
      args: [expiry, testUserId],
    })

    const userRes = await db.execute({
      sql: `SELECT subscription_tier, subscription_expires_at FROM users WHERE id = ?`,
      args: [testUserId],
    })
    const userRow = userRes.rows[0] as any
    expect(userRow.subscription_tier).toBe("detective_monthly")
    expect(new Date(userRow.subscription_expires_at).getTime()).toBeGreaterThan(Date.now())

    // Attempting duplicate TrxID insert must fail
    await expect(
      db.execute({
        sql: `
          INSERT INTO payments (id, user_id, provider, plan_type, amount_bdt, sender_number, trx_id, status, verified_at, created_at)
          VALUES (?, ?, 'bkash', 'detective_monthly', 20, '01700000000', ?, 'completed', ?, ?)
        `,
        args: [`pay2_${Date.now()}`, testUserId, testTrxId, new Date().toISOString(), new Date().toISOString()],
      })
    ).rejects.toThrow()
  })
})

describe("Appliance Simulator & Real-World Energy Estimation", () => {
  it("provides comprehensive and diverse list of real-world home appliances", () => {
    expect(APPLIANCES.length).toBeGreaterThanOrEqual(18)
    
    // Check key devices requested by users
    const ac = APPLIANCES.find((a) => a.id === "ac_inverter")
    const fridge = APPLIANCES.find((a) => a.id === "refrigerator")
    const pump = APPLIANCES.find((a) => a.id === "water_pump")
    const geyser = APPLIANCES.find((a) => a.id === "geyser")
    const cooker = APPLIANCES.find((a) => a.id === "induction")
    const fan = APPLIANCES.find((a) => a.id === "ceiling_fan")

    expect(ac).toBeDefined()
    expect(fridge).toBeDefined()
    expect(pump).toBeDefined()
    expect(geyser).toBeDefined()
    expect(cooker).toBeDefined()
    expect(fan).toBeDefined()

    expect(ac?.tipBangla).toBeTruthy()
    expect(fridge?.descriptionBangla).toBeTruthy()
  })

  it("calculates accurate monthly units for duty-cycled and standard appliances", () => {
    const fan = APPLIANCES.find((a) => a.id === "ceiling_fan")!
    // 75W * 14h * 1.0 duty * 30 days = 31.5 kWh
    const fanUnits = calculateMonthlyUnits(fan, 1)
    expect(fanUnits).toBeCloseTo(31.5, 0.5)

    // 3 fans = 94.5 kWh
    const threeFansUnits = calculateMonthlyUnits(fan, 3)
    expect(threeFansUnits).toBeCloseTo(94.5, 1)

    // Inverter AC: 1100W * 8h * 0.7 duty * 30 days = ~184.8 kWh
    const ac = APPLIANCES.find((a) => a.id === "ac_inverter")!
    const acUnits = calculateMonthlyUnits(ac, 1)
    expect(acUnits).toBeGreaterThan(160)
    expect(acUnits).toBeLessThan(230)
  })

  it("provides ready-made household presets for instant calculation", () => {
    expect(HOUSEHOLD_PRESETS.length).toBeGreaterThanOrEqual(4)
    const bachelor = HOUSEHOLD_PRESETS.find((p) => p.id === "bachelor")
    const standard = HOUSEHOLD_PRESETS.find((p) => p.id === "standard_family")

    expect(bachelor).toBeDefined()
    expect(standard).toBeDefined()
    expect(Object.keys(bachelor!.counts).length).toBeGreaterThan(0)
    expect(Object.keys(standard!.counts).length).toBeGreaterThan(0)
  })
})
