import { describe, expect, it } from "vitest"
import { planRecharge, type RechargePlanInput } from "../src/features/tools/recharge-planner"
import { calculateNescoBill } from "../src/lib/tariff-constants"

const plan = (input: Partial<RechargePlanInput>) =>
  planRecharge({
    balanceBdt: 0,
    dailyKwh: 5,
    monthUnitsSoFar: 0,
    today: new Date(2026, 10, 10),
    targetDays: 10,
    sanctionedLoadKw: 2,
    ...input,
  })
const bill = (units: number) => calculateNescoBill(units, 2).totalBill

describe("planRecharge", () => {
  it("plans nothing when there is no usage to plan from", () => {
    expect(plan({ dailyKwh: 0, targetDays: 60 })).toEqual({
      neededKwh: 0,
      estimatedCostBdt: 0,
      shortfallBdt: 0,
      recommendedRechargeBdt: 0,
      slabAfter: 0,
      crossesSlab: false,
    })
  })

  it("recommends nothing when the balance covers the period", () => {
    const result = plan({ balanceBdt: 10000, monthUnitsSoFar: 45 })
    expect(result).toMatchObject({ neededKwh: 50, shortfallBdt: 0, recommendedRechargeBdt: 0 })
  })

  it("prices the rest of this month as the difference between the two bills", () => {
    const result = plan({ monthUnitsSoFar: 100, dailyKwh: 5, targetDays: 10 })
    expect(result.estimatedCostBdt).toBe(Math.ceil(bill(150) - bill(100)))
  })

  it("warns when the period pushes the month into a higher slab", () => {
    expect(plan({ monthUnitsSoFar: 190, dailyKwh: 10, targetDays: 5 })).toMatchObject({
      slabAfter: 3,
      crossesSlab: true,
    })
    expect(plan({ monthUnitsSoFar: 100, dailyKwh: 1, targetDays: 5 }).crossesSlab).toBe(false)
  })

  it("rounds the recharge up to the next 50 taka", () => {
    const { recommendedRechargeBdt, shortfallBdt } = plan({ dailyKwh: 8, targetDays: 30 })
    expect(shortfallBdt).toBeGreaterThan(0)
    expect(recommendedRechargeBdt % 50).toBe(0)
    expect(recommendedRechargeBdt).toBeGreaterThanOrEqual(shortfallBdt)
    expect(recommendedRechargeBdt - shortfallBdt).toBeLessThan(50)
  })

  it("starts each later month at zero units with its own fixed charges", () => {
    // 25 November: 6 days left in the month, 24 days in the next
    const today = new Date(2026, 10, 25)
    const long = plan({ today, dailyKwh: 5, targetDays: 30 })
    expect(long.estimatedCostBdt).toBe(Math.ceil(bill(30) - bill(0) + bill(120)))
    expect(long.estimatedCostBdt).toBeGreaterThan(plan({ today, dailyKwh: 5, targetDays: 6 }).estimatedCostBdt)
  })

  it("clamps the period to 1–90 days and ignores impossible inputs", () => {
    expect(plan({ targetDays: 500 }).neededKwh).toBe(450)
    expect(plan({ targetDays: 0 }).neededKwh).toBe(5)
    expect(plan({ targetDays: Number.NaN }).neededKwh).toBe(5)
    expect(plan({ dailyKwh: Number.NaN }).estimatedCostBdt).toBe(0)
    expect(plan({ balanceBdt: -100, monthUnitsSoFar: Number.NaN })).toEqual(plan({}))
  })
})
