// NESCO (Northern Electricity Supply Company) Tariff Structure
// Based on official BERC Low Tension LT-A (Domestic / Residential) tariff schedule

export interface TariffStep {
  step: number
  nameBangla: string
  minUnits: number
  maxUnits: number | null // null for unbounded
  ratePerUnit: number // BDT per kWh
}

export const NESCO_LTA_SLABS: TariffStep[] = [
  {
    step: 1,
    nameBangla: "ধাপ ১ (১ - ৭৫ ইউনিট)",
    minUnits: 1,
    maxUnits: 75,
    ratePerUnit: 5.26,
  },
  {
    step: 2,
    nameBangla: "ধাপ ২ (৭৬ - ২০০ ইউনিট)",
    minUnits: 76,
    maxUnits: 200,
    ratePerUnit: 7.2,
  },
  {
    step: 3,
    nameBangla: "ধাপ ৩ (২০১ - ৩০০ ইউনিট)",
    minUnits: 201,
    maxUnits: 300,
    ratePerUnit: 7.59,
  },
  {
    step: 4,
    nameBangla: "ধাপ ৪ (৩০১ - ৪০০ ইউনিট)",
    minUnits: 301,
    maxUnits: 400,
    ratePerUnit: 8.02,
  },
  {
    step: 5,
    nameBangla: "ধাপ ৫ (৪০১ - ৬০০ ইউনিট)",
    minUnits: 401,
    maxUnits: 600,
    ratePerUnit: 12.67,
  },
  {
    step: 6,
    nameBangla: "ধাপ ৬ (৬০১+ ইউনিট)",
    minUnits: 601,
    maxUnits: null,
    ratePerUnit: 14.61,
  },
]

// Lifeline tariff for vulnerable consumers consuming <= 50 units
export const LIFELINE_RATE = 4.63 // BDT/unit (0-50 units)

export const DEFAULT_DEMAND_CHARGE_PER_KW = 42.0 // BDT per kW per month
export const DEFAULT_METER_RENT = 40.0 // BDT per single phase meter per month
export const VAT_RATE = 0.05 // 5% government VAT
export const PREPAID_REBATE_RATE = 0.01 // 1% prepaid rebate discount

export interface BillBreakdown {
  units: number
  energyCharge: number
  demandCharge: number
  meterRent: number
  vatAmount: number
  rebateAmount: number
  totalBill: number
  effectiveRatePerUnit: number
  activeStep: TariffStep
  slabBreakdown: {
    step: number
    nameBangla: string
    unitsInSlab: number
    rate: number
    amount: number
  }[]
}

/**
 * Calculates official NESCO LT-A residential bill for a given kWh consumption
 */
export function calculateNescoBill(
  units: number,
  sanctionedLoadKw: number = 2,
  singlePhase: boolean = true
): BillBreakdown {
  const safeUnits = Math.max(0, units)

  let energyCharge = 0
  const slabBreakdown: BillBreakdown["slabBreakdown"] = []

  // Check if lifeline applies (strictly <= 50 units total for domestic)
  if (safeUnits > 0 && safeUnits <= 50) {
    const amount = safeUnits * LIFELINE_RATE
    energyCharge = amount
    slabBreakdown.push({
      step: 0,
      nameBangla: "লাইফলাইন (০ - ৫০ ইউনিট)",
      unitsInSlab: safeUnits,
      rate: LIFELINE_RATE,
      amount,
    })
  } else {
    let remaining = safeUnits

    for (const slab of NESCO_LTA_SLABS) {
      if (remaining <= 0) break

      const slabCapacity =
        slab.maxUnits !== null
          ? slab.maxUnits - slab.minUnits + 1
          : remaining

      const unitsInSlab = Math.min(remaining, slabCapacity)
      const amount = unitsInSlab * slab.ratePerUnit

      energyCharge += amount
      slabBreakdown.push({
        step: slab.step,
        nameBangla: slab.nameBangla,
        unitsInSlab,
        rate: slab.ratePerUnit,
        amount,
      })

      remaining -= unitsInSlab
    }
  }

  const demandCharge = Math.max(1, sanctionedLoadKw) * DEFAULT_DEMAND_CHARGE_PER_KW
  const meterRent = singlePhase ? DEFAULT_METER_RENT : DEFAULT_METER_RENT * 2.5
  const subtotalBeforeTax = energyCharge + demandCharge + meterRent
  const vatAmount = subtotalBeforeTax * VAT_RATE
  const rebateAmount = energyCharge * PREPAID_REBATE_RATE
  const totalBill = subtotalBeforeTax + vatAmount - rebateAmount

  // Active step
  let activeStep = NESCO_LTA_SLABS[0]
  for (const slab of NESCO_LTA_SLABS) {
    if (slab.maxUnits === null || safeUnits <= slab.maxUnits) {
      activeStep = slab
      break
    }
  }

  return {
    units: safeUnits,
    energyCharge: Math.round(energyCharge * 100) / 100,
    demandCharge,
    meterRent,
    vatAmount: Math.round(vatAmount * 100) / 100,
    rebateAmount: Math.round(rebateAmount * 100) / 100,
    totalBill: Math.round(totalBill * 100) / 100,
    effectiveRatePerUnit: safeUnits > 0 ? Math.round((totalBill / safeUnits) * 100) / 100 : 0,
    activeStep,
    slabBreakdown,
  }
}
