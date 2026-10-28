import type { NescoFetchResult } from "../nesco/types"
import { calculateNescoBill } from "@/lib/tariff-constants"
import {
  toBanglaNumber,
  formatBDT,
  formatMonthBangla,
  formatDateWithDayBangla,
  translateViaBangla,
} from "@/lib/bangla"

export interface ConsumptionInsight {
  id: string
  title: string
  description: string
  type: "success" | "warning" | "info" | "tip"
  metric?: string
  isCalculatedEstimate: boolean
}

export interface CalculatedEstimates {
  avgDailyKwh: number
  avgDailyCostBdt: number
  estimatedDaysRemaining: number
  projectedMonthlyUnits: number
  projectedMonthlyCostBdt: number
  activeSlabStep: number
  activeSlabName: string
  ratePerUnit: number
  monthOverMonthUnitsPct: number // % change in usage
  monthOverMonthExpensePct: number // % change in recharge
}

export interface ExtendedRechargeStats {
  totalCount: number
  totalAmountBdt: number
  totalKwh: number
  averageAmountBdt: number // গড় রিচার্জের পরিমাণ (টিকিট সাইজ)
  minAmountBdt: number // সর্বনিম্ন রিচার্জ
  maxAmountBdt: number // সর্বোচ্চ রিচার্জ
  favoriteVia: string // সর্বাধিক ব্যবহৃত চ্যানেল (বিকাশ / নগদ ইত্যাদি)
  favoriteViaCount: number
  favoriteViaPct: number // চ্যানেলের শতকরা হার
  averageDaysBetweenRecharges: number | null // রিচার্জের মধ্যবর্তী গড় ব্যবধান (দিন)
  daysSinceLastRecharge: number | null // সর্বশেষ রিচার্জ কত দিন আগে হয়েছে
}

export interface ExtendedCostEfficiencyStats {
  effectiveCostPerKwh: number // প্রকৃত গড় ইউনিট দর (মিটার ভাড়া, ডিমান্ড চার্জ ও ভ্যাট সহ)
  totalGovernmentRebateBdt: number // সরকারি ১% প্রিপেইড রিবেটের মোট সাশ্রয়
  estimatedUnitsRemaining: number // অবশিষ্ট ব্যালেন্সে আনুমানিক কত ইউনিট বিদ্যুৎ মিলবে
  netCostWithoutOverheadPerKwh: number // শুধুমাত্র বিদ্যুৎ শক্তির গড় দর
  fixedOverheadPerMonthBdt: number // মাসিক ফিক্সড চার্জ (মিটার ভাড়া + ডিমান্ড চার্জ)
}

export interface ExtendedSeasonalityStats {
  highestMonth: {
    month: string
    year: string | number
    usageKwh: number
    rechargeBdt: number
    labelBangla: string
  } | null
  lowestMonth: {
    month: string
    year: string | number
    usageKwh: number
    rechargeBdt: number
    labelBangla: string
  } | null
  seasonalityGapPct: number // পিক বনাম অফ-পিক খরচের হ্রাস/বৃদ্ধি
  averageMonthlyKwh: number // প্রতি মাসের গড় ইউনিট
  averageMonthlyExpenseBdt: number // প্রতি মাসের গড় রিচার্জ খরচ
}

export interface ExtendedRunwayStats {
  estimatedDaysRemaining: number
  depletionDate: string // e.g. "১৫ নভেম্বর ২০২৬ (রবিবার)"
  urgencyLevel: "critical" | "warning" | "healthy"
  unitsRemaining: number
}

export interface ExtendedEcoStats {
  carbonKg: number // মোট উৎপাদিত CO2 নির্গমন (কেজি)
  treesNeeded: number // বার্ষিক সমতা রক্ষায় প্রয়োজনীয় গাছের সংখ্যা
}

export interface ExtendedSlabStats {
  activeSlabStep: number
  activeSlabName: string
  ratePerUnit: number
  unitsRemainingInSlab: number | null // পরের ধাপে যাওয়ার আগে অবশিষ্ট ইউনিট
  nextSlabStep: number | null
  nextSlabRate: number | null
  slabJumpCostDelta: number | null // পরবর্তী ধাপে রেট কত টাকা বাড়বে (+৳০.৪৩ বা +৳৪.৬৫)
}

export interface EnergyAnalytics {
  actual: {
    currentBalance: number
    lastRechargeAmount: number
    lastRechargeDate: string
    lastRechargeVia: string
    latestMonthName: string
    latestMonthUnits: number
    latestMonthExpense: number
    previousMonthUnits: number
    previousMonthExpense: number
    totalRecordedKwh: number
    totalRecordedExpenseBdt: number
  }
  estimates: CalculatedEstimates
  insights: ConsumptionInsight[]
  billBreakdown: ReturnType<typeof calculateNescoBill>
  // Advanced real-world analytics
  rechargeStats: ExtendedRechargeStats
  costEfficiency: ExtendedCostEfficiencyStats
  seasonality: ExtendedSeasonalityStats
  runway: ExtendedRunwayStats
  eco: ExtendedEcoStats
  slabStats: ExtendedSlabStats
}

/**
 * Parses date string in common NESCO formats into JavaScript Date
 */
function parseRechargeDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null
  const direct = new Date(dateStr)
  if (!isNaN(direct.getTime())) return direct

  // Format DD-MMM-YYYY or DD-MM-YYYY
  const parts = dateStr.trim().split(/[\s,]+/)
  const datePart = parts[0]
  if (datePart) {
    const sub = datePart.split(/[-/]/)
    if (sub.length === 3) {
      const [d, m, y] = sub
      const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
      const mIdx = monthNames.indexOf(m.toLowerCase())
      if (mIdx >= 0) {
        return new Date(parseInt(y, 10), mIdx, parseInt(d, 10))
      }
      const numM = parseInt(m, 10)
      if (!isNaN(numM)) {
        return new Date(parseInt(y, 10), numM - 1, parseInt(d, 10))
      }
    }
  }
  return null
}

export function generateAnalytics(nescoData: NescoFetchResult): EnergyAnalytics {
  const { customerInfo, rechargeHistory, monthlyUsage } = nescoData

  const currentBalance = customerInfo.balance || 0
  const latestRecharge = rechargeHistory[0] || null

  const latestMonth = monthlyUsage[0] || null
  const prevMonth = monthlyUsage[1] || null

  const latestMonthUnits = latestMonth ? latestMonth.usageKwh : 0
  const latestMonthExpense = latestMonth ? latestMonth.rechargeBdt : 0
  const prevMonthUnits = prevMonth ? prevMonth.usageKwh : 0
  const prevMonthExpense = prevMonth ? prevMonth.rechargeBdt : 0

  // Total recorded metrics from monthly history
  const totalRecordedKwh = monthlyUsage.reduce((acc, m) => acc + m.usageKwh, 0)
  const totalRecordedExpenseBdt = monthlyUsage.reduce((acc, m) => acc + m.rechargeBdt, 0)

  // Base monthly units for forward projection
  const baseMonthlyUnits = latestMonthUnits > 0 ? latestMonthUnits : 250
  const avgDailyKwh = Math.round((baseMonthlyUnits / 30) * 100) / 100

  const approvedLoad =
    typeof customerInfo.approvedLoadKw === "number"
      ? customerInfo.approvedLoadKw
      : parseFloat(String(customerInfo.approvedLoadKw)) || 2

  const billCalc = calculateNescoBill(baseMonthlyUnits, approvedLoad)

  const avgDailyCostBdt = Math.round((billCalc.totalBill / 30) * 100) / 100
  const estimatedDaysRemaining =
    avgDailyCostBdt > 0 ? Math.max(0, Math.round(currentBalance / avgDailyCostBdt)) : 0

  // Month-over-month calculation
  let monthOverMonthUnitsPct = 0
  if (prevMonthUnits > 0 && latestMonthUnits > 0) {
    monthOverMonthUnitsPct = Math.round(((latestMonthUnits - prevMonthUnits) / prevMonthUnits) * 100)
  }

  let monthOverMonthExpensePct = 0
  if (prevMonthExpense > 0 && latestMonthExpense > 0) {
    monthOverMonthExpensePct = Math.round(((latestMonthExpense - prevMonthExpense) / prevMonthExpense) * 100)
  }

  const projectedMonthlyUnits = Math.round(avgDailyKwh * 30)
  const projectedMonthlyCostBdt = billCalc.totalBill
  const activeSlab = billCalc.activeStep

  // ==========================================
  // 1. RECHARGE INTELLIGENCE & STATS
  // ==========================================
  const totalRechargeCount = rechargeHistory.length
  const totalRechargeAmount = rechargeHistory.reduce((acc, r) => acc + (r.amountBdt || 0), 0)
  const totalRechargeKwh = rechargeHistory.reduce((acc, r) => acc + (r.powerKwh || 0), 0)

  const averageAmountBdt =
    totalRechargeCount > 0 ? Math.round(totalRechargeAmount / totalRechargeCount) : 0

  const rechargeAmounts = rechargeHistory.map((r) => r.amountBdt).filter((a) => a > 0)
  const minAmountBdt = rechargeAmounts.length > 0 ? Math.min(...rechargeAmounts) : 0
  const maxAmountBdt = rechargeAmounts.length > 0 ? Math.max(...rechargeAmounts) : 0

  // Channel (bKash / Nagad / POS / Bank) Breakdown
  const viaCountMap: Record<string, number> = {}
  for (const r of rechargeHistory) {
    const v = r.via?.trim() || "Online"
    viaCountMap[v] = (viaCountMap[v] || 0) + 1
  }

  let favoriteViaRaw = "Online"
  let favoriteViaCount = 0
  for (const [v, count] of Object.entries(viaCountMap)) {
    if (count > favoriteViaCount) {
      favoriteViaCount = count
      favoriteViaRaw = v
    }
  }

  const favoriteVia = translateViaBangla(favoriteViaRaw)
  const favoriteViaPct =
    totalRechargeCount > 0 ? Math.round((favoriteViaCount / totalRechargeCount) * 100) : 0

  // Average days between recharges
  const parsedDates = rechargeHistory
    .map((r) => parseRechargeDate(r.date))
    .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())

  const intervalsInDays: number[] = []
  for (let i = 0; i < parsedDates.length - 1; i++) {
    const diffDays = Math.round((parsedDates[i].getTime() - parsedDates[i + 1].getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > 0) {
      intervalsInDays.push(diffDays)
    }
  }

  const averageDaysBetweenRecharges =
    intervalsInDays.length > 0
      ? Math.round((intervalsInDays.reduce((a, b) => a + b, 0) / intervalsInDays.length) * 10) / 10
      : null

  const daysSinceLastRecharge =
    parsedDates.length > 0
      ? Math.max(0, Math.floor((Date.now() - parsedDates[0].getTime()) / (1000 * 60 * 60 * 24)))
      : null

  const rechargeStats: ExtendedRechargeStats = {
    totalCount: totalRechargeCount,
    totalAmountBdt: totalRechargeAmount,
    totalKwh: Math.round(totalRechargeKwh * 100) / 100,
    averageAmountBdt,
    minAmountBdt,
    maxAmountBdt,
    favoriteVia,
    favoriteViaCount,
    favoriteViaPct,
    averageDaysBetweenRecharges,
    daysSinceLastRecharge,
  }

  // ==========================================
  // 2. TRUE COST & FINANCIAL EFFICIENCY
  // ==========================================
  const effectiveCostPerKwh =
    totalRecordedKwh > 0 && totalRecordedExpenseBdt > 0
      ? Math.round((totalRecordedExpenseBdt / totalRecordedKwh) * 100) / 100
      : billCalc.effectiveRatePerUnit

  const totalGovernmentRebateBdt = Math.round(
    monthlyUsage.reduce((acc, m) => acc + Math.abs(m.discountBdt || 0), 0) * 100
  ) / 100

  const estimatedUnitsRemaining =
    effectiveCostPerKwh > 0
      ? Math.round((currentBalance / effectiveCostPerKwh) * 10) / 10
      : 0

  const netCostWithoutOverheadPerKwh =
    billCalc.units > 0
      ? Math.round((billCalc.energyCharge / billCalc.units) * 100) / 100
      : 0

  const fixedOverheadPerMonthBdt = billCalc.demandCharge + billCalc.meterRent

  const costEfficiency: ExtendedCostEfficiencyStats = {
    effectiveCostPerKwh,
    totalGovernmentRebateBdt,
    estimatedUnitsRemaining,
    netCostWithoutOverheadPerKwh,
    fixedOverheadPerMonthBdt,
  }

  // ==========================================
  // 3. SEASONALITY & CONSUMPTION EXTREMES
  // ==========================================
  let highestMonth: ExtendedSeasonalityStats["highestMonth"] = null
  let lowestMonth: ExtendedSeasonalityStats["lowestMonth"] = null
  let seasonalityGapPct = 0

  if (monthlyUsage.length > 0) {
    const sortedByUsage = [...monthlyUsage].sort((a, b) => b.usageKwh - a.usageKwh)
    const high = sortedByUsage[0]
    const low = sortedByUsage[sortedByUsage.length - 1]

    highestMonth = {
      month: high.month,
      year: high.year,
      usageKwh: high.usageKwh,
      rechargeBdt: high.rechargeBdt,
      labelBangla: `${formatMonthBangla(high.month)} ${toBanglaNumber(high.year)}`,
    }

    lowestMonth = {
      month: low.month,
      year: low.year,
      usageKwh: low.usageKwh,
      rechargeBdt: low.rechargeBdt,
      labelBangla: `${formatMonthBangla(low.month)} ${toBanglaNumber(low.year)}`,
    }

    if (high.usageKwh > 0) {
      seasonalityGapPct = Math.round(((high.usageKwh - low.usageKwh) / high.usageKwh) * 100)
    }
  }

  const averageMonthlyKwh =
    monthlyUsage.length > 0 ? Math.round(totalRecordedKwh / monthlyUsage.length) : baseMonthlyUnits
  const averageMonthlyExpenseBdt =
    monthlyUsage.length > 0 ? Math.round(totalRecordedExpenseBdt / monthlyUsage.length) : billCalc.totalBill

  const seasonality: ExtendedSeasonalityStats = {
    highestMonth,
    lowestMonth,
    seasonalityGapPct,
    averageMonthlyKwh,
    averageMonthlyExpenseBdt,
  }

  // ==========================================
  // 4. RUNWAY & DEPLETION DATE
  // ==========================================
  const depletionDateObj = new Date(Date.now() + estimatedDaysRemaining * 86400000)
  const depletionDate = formatDateWithDayBangla(depletionDateObj)
  const urgencyLevel: ExtendedRunwayStats["urgencyLevel"] =
    estimatedDaysRemaining <= 5 ? "critical" : estimatedDaysRemaining <= 10 ? "warning" : "healthy"

  const runway: ExtendedRunwayStats = {
    estimatedDaysRemaining,
    depletionDate,
    urgencyLevel,
    unitsRemaining: estimatedUnitsRemaining,
  }

  // ==========================================
  // 5. ENVIRONMENTAL / CO2 FOOTPRINT
  // ==========================================
  // Bangladesh national grid factor: ~0.67 kg CO2 / kWh
  const carbonKg = Math.round(totalRecordedKwh * 0.67 * 10) / 10
  const annualizedKwh = (latestMonthUnits || averageMonthlyKwh) * 12
  const treesNeeded = Math.max(1, Math.ceil((annualizedKwh * 0.67) / 22))

  const eco: ExtendedEcoStats = {
    carbonKg,
    treesNeeded,
  }

  // ==========================================
  // 6. SLAB STEP INTELLIGENCE & JUMP DELTAS
  // ==========================================
  let unitsRemainingInSlab: number | null = null
  let nextSlabStep: number | null = null
  let nextSlabRate: number | null = null
  let slabJumpCostDelta: number | null = null

  if (activeSlab.maxUnits !== null) {
    unitsRemainingInSlab = Math.max(0, Math.round(activeSlab.maxUnits - baseMonthlyUnits))
    nextSlabStep = activeSlab.step + 1

    // Step rates
    const slabRates: Record<number, number> = {
      1: 5.26,
      2: 7.2,
      3: 7.59,
      4: 8.02,
      5: 12.67,
      6: 14.61,
    }

    if (slabRates[nextSlabStep]) {
      nextSlabRate = slabRates[nextSlabStep]
      slabJumpCostDelta = Math.round((nextSlabRate - activeSlab.ratePerUnit) * 100) / 100
    }
  }

  const slabStats: ExtendedSlabStats = {
    activeSlabStep: activeSlab.step,
    activeSlabName: activeSlab.nameBangla,
    ratePerUnit: activeSlab.ratePerUnit,
    unitsRemainingInSlab,
    nextSlabStep,
    nextSlabRate,
    slabJumpCostDelta,
  }

  // ==========================================
  // 7. GENERATE BANGLA ACTIONABLE INSIGHTS
  // ==========================================
  const insights: ConsumptionInsight[] = []

  // 1. Balance Runway & Depletion Date Insight
  if (estimatedDaysRemaining <= 5) {
    insights.push({
      id: "balance-critical",
      title: "জরুরি রিচার্জ প্রয়োজন!",
      description: `বর্তমান অবশিষ্ট ব্যালেন্স ${formatBDT(currentBalance)} দিয়ে আর মাত্র প্রায় ${toBanglaNumber(estimatedDaysRemaining)} দিন চলবে (${depletionDate} এর মধ্যে শূন্য হতে পারে)। দ্রুত রিচার্জ করুন।`,
      type: "warning",
      metric: `${toBanglaNumber(estimatedDaysRemaining)} দিন বাকি`,
      isCalculatedEstimate: true,
    })
  } else if (estimatedDaysRemaining <= 10) {
    insights.push({
      id: "balance-low",
      title: "ব্যালেন্স কমে আসছে",
      description: `আপনার মিটারে আর প্রায় ${toBanglaNumber(estimatedDaysRemaining)} দিনের ব্যালেন্স অবশিষ্ট আছে। আনুমানিক ${depletionDate} নাগাদ শেষ হতে পারে।`,
      type: "warning",
      metric: `${toBanglaNumber(estimatedDaysRemaining)} দিন বাকি`,
      isCalculatedEstimate: true,
    })
  } else {
    insights.push({
      id: "balance-healthy",
      title: "ব্যালেন্স ভালো অবস্থায় আছে",
      description: `বর্তমান ব্যালেন্স দিয়ে অনায়াসে প্রায় ${toBanglaNumber(estimatedDaysRemaining)} দিন চলবে (${depletionDate} পর্যন্ত)। আনুমানিক আরও ${toBanglaNumber(estimatedUnitsRemaining)} ইউনিট বিদ্যুৎ মিলবে।`,
      type: "success",
      metric: `~${toBanglaNumber(estimatedDaysRemaining)} দিন চলবে`,
      isCalculatedEstimate: true,
    })
  }

  // 2. Recharge Pattern Insight
  if (averageDaysBetweenRecharges && averageDaysBetweenRecharges > 0) {
    insights.push({
      id: "recharge-habit",
      title: "রিচার্জের অভ্যাসের চিত্র",
      description: `আপনি গড়ে প্রতি ${toBanglaNumber(averageDaysBetweenRecharges)} দিনে একবার রিচার্জ করেন। গড় রিচার্জের আকার ${formatBDT(averageAmountBdt)} এবং পছন্দের মাধ্যম "${favoriteVia}" (${toBanglaNumber(favoriteViaPct)}% লেনদেন)।`,
      type: "info",
      metric: `প্রতি ${toBanglaNumber(averageDaysBetweenRecharges)} দিনে`,
      isCalculatedEstimate: true,
    })
  }

  // 3. True Cost Efficiency Insight
  insights.push({
    id: "effective-rate",
    title: "প্রকৃত গড় ইউনিট দর",
    description: `মিটার ভাড়া (৳৪০), ডিমান্ড চার্জ (৳${toBanglaNumber(billCalc.demandCharge)}) ও ৫% ভ্যাট অন্তর্ভুক্ত করার পর আপনার প্রতি ইউনিটের প্রকৃত মোট ব্যয় পড়ছে প্রায় ${formatBDT(effectiveCostPerKwh)}।`,
    type: "info",
    metric: `${formatBDT(effectiveCostPerKwh)} / kWh`,
    isCalculatedEstimate: true,
  })

  // 4. Tariff Slab Step Jump Warning
  if (unitsRemainingInSlab !== null && unitsRemainingInSlab <= 40 && nextSlabRate) {
    insights.push({
      id: "slab-jump-warning",
      title: "পরবর্তী উচ্চ ট্যারিফ ধাপ সন্নিকটে!",
      description: `আর মাত্র ${toBanglaNumber(unitsRemainingInSlab)} ইউনিট ব্যবহার করলেই পরবর্তী ধাপ ${toBanglaNumber(nextSlabStep)}-এ পৌঁছে যাবেন, যেখানে রেট বেড়ে প্রতি ইউনিটে ${formatBDT(nextSlabRate)} হবে (ইউনিটে +৳${toBanglaNumber(slabJumpCostDelta)} বৃদ্ধি)।`,
      type: "warning",
      metric: `${toBanglaNumber(unitsRemainingInSlab)} ইউনিট বাকি`,
      isCalculatedEstimate: true,
    })
  } else if (activeSlab.step === 4) {
    insights.push({
      id: "slab-jump-4-to-5",
      title: "ট্যারিফ ধাপ ৪-এ সর্বোচ্চ সতর্কতা",
      description: `মাসিক ব্যবহার ৪০০ ইউনিট অতিক্রম করলেই রেট একলাফে ৳৮.০২ থেকে বেড়ে ৳১২.৬৭ (+৳৪.৬৫) হয়ে যাবে! এই মাসে খরচ ৪০০ ইউনিটের মধ্যে রাখার চেষ্টা করুন।`,
      type: "warning",
      metric: `ধাপ ৪ (৳৮.০২/ইউনিট)`,
      isCalculatedEstimate: true,
    })
  }

  // 5. Month-over-month Trend
  if (monthOverMonthUnitsPct < 0) {
    insights.push({
      id: "usage-reduced",
      title: "বিদ্যুৎ ব্যবহারে সাশ্রয় হয়েছে!",
      description: `গত ${formatMonthBangla(latestMonth?.month || "")} মাসে আপনার বিদ্যুৎ ব্যবহার আগের মাসের চেয়ে ${toBanglaNumber(Math.abs(monthOverMonthUnitsPct))}% কমেছে।`,
      type: "success",
      metric: `-${toBanglaNumber(Math.abs(monthOverMonthUnitsPct))}% কম খরচ`,
      isCalculatedEstimate: false,
    })
  } else if (monthOverMonthUnitsPct > 10) {
    insights.push({
      id: "usage-increased",
      title: "বিদ্যুৎ ব্যবহার বৃদ্ধি পেয়েছে",
      description: `আগের মাসের চেয়ে গত মাসে বিদ্যুৎ ব্যবহার প্রায় ${toBanglaNumber(monthOverMonthUnitsPct)}% বেড়েছে। অপচয় রোধে সতর্ক হোন।`,
      type: "warning",
      metric: `+${toBanglaNumber(monthOverMonthUnitsPct)}% বৃদ্ধি`,
      isCalculatedEstimate: false,
    })
  }

  // 6. Government Rebate Accumulated
  if (totalGovernmentRebateBdt > 0) {
    insights.push({
      id: "govt-rebate",
      title: "১% সরকারি রিবেট সাশ্রয়",
      description: `প্রিপেইড মিটারে প্রতি রিচার্জে ১% সরকারি রিবেট সুবিধা থাকায় এ পর্যন্ত আপনার হিসেবে মোট ${formatBDT(totalGovernmentRebateBdt)} ক্যাশব্যাক সাশ্রয় হয়েছে।`,
      type: "success",
      metric: `${formatBDT(totalGovernmentRebateBdt)} রিবেট`,
      isCalculatedEstimate: false,
    })
  }

  // 7. Seasonality Comparison
  if (highestMonth && lowestMonth && seasonalityGapPct > 20) {
    insights.push({
      id: "seasonality-gap",
      title: "মৌসুমী খরচের তারতম্য",
      description: `আপনার সর্বোচ্চ বিদ্যুৎ ব্যবহার ছিল ${highestMonth.labelBangla} মাসে (${toBanglaNumber(highestMonth.usageKwh)} kWh), আর সর্বনিম্ন ছিল ${lowestMonth.labelBangla} মাসে (${toBanglaNumber(lowestMonth.usageKwh)} kWh)। শীতের চেয়ে গরমে প্রায় ${toBanglaNumber(seasonalityGapPct)}% বেশি বিদ্যুৎ প্রয়োজন হয়।`,
      type: "info",
      metric: `${toBanglaNumber(seasonalityGapPct)}% মৌসুমী পার্থক্য`,
      isCalculatedEstimate: true,
    })
  }

  return {
    actual: {
      currentBalance,
      lastRechargeAmount: latestRecharge?.amountBdt || 0,
      lastRechargeDate: latestRecharge?.date || "-",
      lastRechargeVia: latestRecharge?.via || "-",
      latestMonthName: latestMonth?.month || "-",
      latestMonthUnits,
      latestMonthExpense,
      previousMonthUnits: prevMonthUnits,
      previousMonthExpense: prevMonthExpense,
      totalRecordedKwh,
      totalRecordedExpenseBdt,
    },
    estimates: {
      avgDailyKwh,
      avgDailyCostBdt,
      estimatedDaysRemaining,
      projectedMonthlyUnits,
      projectedMonthlyCostBdt,
      activeSlabStep: activeSlab.step,
      activeSlabName: activeSlab.nameBangla,
      ratePerUnit: activeSlab.ratePerUnit,
      monthOverMonthUnitsPct,
      monthOverMonthExpensePct,
    },
    insights,
    billBreakdown: billCalc,
    rechargeStats,
    costEfficiency,
    seasonality,
    runway,
    eco,
    slabStats,
  }
}
