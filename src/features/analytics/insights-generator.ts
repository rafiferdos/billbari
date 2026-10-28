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
      title: "ব্যালেন্স কম আছে",
      description: `আপনার মিটারের ব্যালেন্স বর্তমানে ${formatBDT(currentBalance)}। বর্তমান খরচে আর প্রায় ${toBanglaNumber(estimatedDaysRemaining)} দিন চলতে পারে। সময়মতো রিচার্জ করে নিন।`,
      type: "warning",
      metric: `${toBanglaNumber(estimatedDaysRemaining)} দিন বাকি`,
      isCalculatedEstimate: true,
    })
  } else {
    insights.push({
      id: "balance-healthy",
      title: "ব্যালেন্স ভালো অবস্থায় আছে",
      description: `বর্তমান অবশিষ্ট ব্যালেন্স ${formatBDT(currentBalance)} দিয়ে আপনার আরও প্রায় ${toBanglaNumber(estimatedDaysRemaining)} দিন অনায়াসে চলবে।`,
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
      description: `গত ${formatMonthBangla(latestMonth?.month || "")} মাসে আপনার বিদ্যুৎ খরচ আগের মাসের চেয়ে ${toBanglaNumber(Math.abs(monthOverMonthUnitsPct))}% কমেছে। খুব ভালো সাশ্রয়ী উদ্যোগ!`,
      type: "success",
      metric: `-${toBanglaNumber(Math.abs(monthOverMonthUnitsPct))}% কম খরচ`,
      isCalculatedEstimate: false,
    })
  } else if (monthOverMonthUnitsPct > 10) {
    insights.push({
      id: "usage-increased",
      title: "বিদ্যুৎ খরচ কিছুটা বেড়েছে",
      description: `আগের মাসের চেয়ে গত মাসে বিদ্যুৎ ব্যবহার প্রায় ${toBanglaNumber(monthOverMonthUnitsPct)}% বেশি হয়েছে। প্রয়োজন ছাড়া ভারি যন্ত্রপাতি বন্ধ রাখুন।`,
      type: "warning",
      metric: `+${toBanglaNumber(monthOverMonthUnitsPct)}% বেশি`,
      isCalculatedEstimate: false,
    })
  }

  // 3. Tariff Slab Advice
  if (baseMonthlyUnits > 200 && baseMonthlyUnits <= 300) {
    insights.push({
      id: "slab-alert-300",
      title: "ট্যারিফ ধাপ ৩-এ আছেন",
      description: `আপনার ব্যবহার বর্তমানে ২০১-৩০০ ইউনিট ধাপে (প্রতি ইউনিট ৳৭.৫৯)। ব্যবহার ৩০০ ইউনিটের বেশি হলে পরের ধাপে ইউনিট প্রতি খরচ ৳৮.০২ হবে।`,
      type: "info",
      metric: `ধাপ ৩ (৳৭.৫৯/ইউনিট)`,
      isCalculatedEstimate: true,
    })
  } else if (baseMonthlyUnits > 300 && baseMonthlyUnits <= 400) {
    insights.push({
      id: "slab-alert-400",
      title: "ট্যারিফ ধাপ ৪-এ আছেন",
      description: `আপনার মাসিক ব্যবহার ৩০১-৪০০ ইউনিটের ধাপে রয়েছে। ৪০০ ইউনিটের বেশি পার হলে রেট বেড়ে একলাফে প্রতি ইউনিট ৳১২.৬৭ হয়ে যাবে। তাই একটু হিসেব করে ব্যবহার করুন।`,
      type: "warning",
      metric: `ধাপ ৪ (৳৮.০২/ইউনিট)`,
      isCalculatedEstimate: true,
    })
  }

  // 4. Energy Efficiency Tip
  insights.push({
    id: "tip-efficiency",
    title: "বিল কমানোর সহজ উপায়",
    description: `ইনভার্টার এসি ২৫-২৬ ডিগ্রিতে চালালে এবং অনলাইন রিচার্জে ১% সরকারি ছাড় নিলে প্রতি মাসে ভালো টাকা বাঁচে।`,
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
