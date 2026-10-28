import type { NescoFetchResult } from "../nesco/types"
import { calculateNescoBill } from "@/lib/tariff-constants"
import { toBanglaNumber, formatBDT, formatMonthBangla } from "@/lib/bangla"

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

  // Total recorded
  const totalRecordedKwh = monthlyUsage.reduce((acc, m) => acc + m.usageKwh, 0)
  const totalRecordedExpenseBdt = monthlyUsage.reduce((acc, m) => acc + m.rechargeBdt, 0)

  // Calculated estimates
  const baseMonthlyUnits = latestMonthUnits > 0 ? latestMonthUnits : 250
  const avgDailyKwh = Math.round((baseMonthlyUnits / 30) * 100) / 100

  const billCalc = calculateNescoBill(
    baseMonthlyUnits,
    typeof customerInfo.approvedLoadKw === "number"
      ? customerInfo.approvedLoadKw
      : parseFloat(String(customerInfo.approvedLoadKw)) || 2
  )

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

  // Projected monthly units
  const projectedMonthlyUnits = Math.round(avgDailyKwh * 30)
  const projectedMonthlyCostBdt = billCalc.totalBill

  // Current Slab
  const activeSlab = billCalc.activeStep

  // Generate Bangla Insights
  const insights: ConsumptionInsight[] = []

  // 1. Balance Remaining Insight
  if (currentBalance < 300) {
    insights.push({
      id: "balance-low",
      title: "ব্যালেন্স সতর্কবার্তা",
      description: `আপনার মিটারের ব্যালেন্স বর্তমানে ${formatBDT(currentBalance)}। বর্তমান গড় খরচে আনুমানিক আর ${toBanglaNumber(estimatedDaysRemaining)} দিন চলবে। এখনই রিচার্জ করার পরামর্শ দেওয়া হচ্ছে।`,
      type: "warning",
      metric: `${toBanglaNumber(estimatedDaysRemaining)} দিন বাকি`,
      isCalculatedEstimate: true,
    })
  } else {
    insights.push({
      id: "balance-healthy",
      title: "ব্যালেন্স স্থিতি সন্তোষজনক",
      description: `বর্তমান অবশিষ্ট ব্যালেন্স ${formatBDT(currentBalance)} দিয়ে আপনার আনুমানিক ${toBanglaNumber(estimatedDaysRemaining)} দিন স্বাচ্ছন্দ্যে চলবে।`,
      type: "success",
      metric: `~${toBanglaNumber(estimatedDaysRemaining)} দিন চলবে`,
      isCalculatedEstimate: true,
    })
  }

  // 2. Month-over-month Usage Trend
  if (monthOverMonthUnitsPct < 0) {
    insights.push({
      id: "usage-reduced",
      title: "বিদ্যুৎ ব্যবহারে সাশ্রয় হয়েছে!",
      description: `গত ${formatMonthBangla(latestMonth?.month || "")} মাসে আপনার বিদ্যুৎ ব্যবহার পূর্ববর্তী মাসের তুলনায় ${toBanglaNumber(Math.abs(monthOverMonthUnitsPct))}% হ্রাস পেয়েছে। চমৎকার সাশ্রয়ী প্রচেষ্টা!`,
      type: "success",
      metric: `-${toBanglaNumber(Math.abs(monthOverMonthUnitsPct))}% ব্যবহার`,
      isCalculatedEstimate: false,
    })
  } else if (monthOverMonthUnitsPct > 10) {
    insights.push({
      id: "usage-increased",
      title: "বিদ্যুৎ ব্যবহার বৃদ্ধি পেয়েছে",
      description: `পূর্ববর্তী মাসের চেয়ে গত মাসে বিদ্যুৎ ব্যবহার প্রায় ${toBanglaNumber(monthOverMonthUnitsPct)}% বেশি হয়েছে। পিক-আওয়ারে ভারি যন্ত্রপাতি ব্যবহারে সচেতন হোন।`,
      type: "warning",
      metric: `+${toBanglaNumber(monthOverMonthUnitsPct)}% বৃদ্ধি`,
      isCalculatedEstimate: false,
    })
  }

  // 3. Tariff Slab Advice
  if (baseMonthlyUnits > 200 && baseMonthlyUnits <= 300) {
    insights.push({
      id: "slab-alert-300",
      title: "ট্যারিফ ধাপ ৩-এ অবস্থান",
      description: `আপনার ব্যবহার বর্তমানে ২০১-৩০০ ইউনিট ধাপে (প্রতি ইউনিট ৳৭.৫৯)। ব্যবহার ৩০০ ইউনিট অতিক্রম করলে পরবর্তী ধাপে খরচ বেড়ে প্রতি ইউনিট ৳৮.০২ হবে।`,
      type: "info",
      metric: `ধাপ ৩ (৳৭.৫৯/ইউনিট)`,
      isCalculatedEstimate: true,
    })
  } else if (baseMonthlyUnits > 300 && baseMonthlyUnits <= 400) {
    insights.push({
      id: "slab-alert-400",
      title: "উচ্চতর ট্যারিফ ধাপ ৪-এ অবস্থান",
      description: `আপনার মাসিক ব্যবহার ৩০১-৪০০ ইউনিটের ধাপে রয়েছে। ৪০০ ইউনিটের বেশি গেলে ট্যারিফ একলাফে প্রতি ইউনিট ৳১২.৬৭ হবে! ব্যবহার ৪০০ ইউনিটের নিচে রাখার চেষ্টা করুন।`,
      type: "warning",
      metric: `ধাপ ৪ (৳৮.০২/ইউনিট)`,
      isCalculatedEstimate: true,
    })
  }

  // 4. Energy Efficiency Tip
  insights.push({
    id: "tip-efficiency",
    title: "বিল কমানোর টিপস",
    description: `ইনভার্টার এসি ২৫-২৬° সেলসিয়াসে চালানো এবং প্রি-পেইড ডিজিটাল রিচার্জে ১% সরকারি রিবেট পাওয়ার সুবিধা নিয়ে বছরে শত শত টাকা সাশ্রয় সম্ভব।`,
    type: "tip",
    isCalculatedEstimate: false,
  })

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
  }
}
