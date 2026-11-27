import { calculateNescoBill } from "@/lib/tariff-constants"

export interface RechargePlanInput {
  balanceBdt: number
  dailyKwh: number
  monthUnitsSoFar: number
  today: Date
  targetDays: number
  sanctionedLoadKw: number
}

export interface RechargePlan {
  neededKwh: number
  estimatedCostBdt: number
  shortfallBdt: number
  recommendedRechargeBdt: number
  slabAfter: number
  crossesSlab: boolean
}

const RECHARGE_STEP_BDT = 50
const positive = (n: number) => (n > 0 ? n : 0)

export function planRecharge(input: RechargePlanInput): RechargePlan {
  const dailyKwh = positive(input.dailyKwh)
  // no usage to plan from; later months would otherwise charge fixed fees for nothing
  if (!dailyKwh) {
    return {
      neededKwh: 0,
      estimatedCostBdt: 0,
      shortfallBdt: 0,
      recommendedRechargeBdt: 0,
      slabAfter: 0,
      crossesSlab: false,
    }
  }

  const targetDays = Math.min(90, Math.max(1, Math.round(input.targetDays) || 1))
  const soFar = positive(input.monthUnitsSoFar)
  const month = (units: number) => calculateNescoBill(units, input.sanctionedLoadKw)

  // The tariff is progressive per calendar month, so this month costs the difference between two bills.
  const { today } = input
  const remaining = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1
  const firstDays = Math.min(targetDays, remaining)
  const before = month(soFar)
  const after = month(soFar + dailyKwh * firstDays)
  let cost = after.totalBill - before.totalBill
  // each later month starts at zero units and pays its own fixed charges
  for (let rest = targetDays - firstDays; rest > 0; rest -= 30) {
    cost += month(dailyKwh * Math.min(rest, 30)).totalBill
  }

  const estimatedCostBdt = Math.ceil(cost)
  const shortfallBdt = positive(estimatedCostBdt - positive(input.balanceBdt))

  return {
    neededKwh: Math.round(dailyKwh * targetDays * 10) / 10,
    estimatedCostBdt,
    shortfallBdt,
    recommendedRechargeBdt: Math.ceil(shortfallBdt / RECHARGE_STEP_BDT) * RECHARGE_STEP_BDT,
    slabAfter: after.activeStep.step,
    crossesSlab: after.activeStep.step > before.activeStep.step,
  }
}
