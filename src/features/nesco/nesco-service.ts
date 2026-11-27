import * as cheerio from "cheerio"
import type { CustomerField, CustomerInfo, MonthlyConsumptionRecord, RechargeReceiptData, RechargeRecord, NescoFetchResult } from "./types"
import { NESCO_SUBMIT, openNescoSession, postNescoForm } from "./nesco-session"
import { toNum } from "./parse-utils"
import { SAMPLE_METERS, getSampleMeterData } from "./sample-data"

type CustomerKey = Exclude<keyof CustomerInfo, "fields" | "arrearNotice">

// NESCO and editors encode letters like য় differently; compare in one form.
const nfc = (text: string) => text.normalize("NFC").toLowerCase()

// First matching rule wins, so the balance rule comes before anything else.
const CUSTOMER_LABELS: [CustomerKey, string[]][] = [
  ["balance", ["ব্যালেন্স", "balance"]],
  ["name", ["গ্রাহকের নাম", "customer name"]],
  ["address", ["ঠিকানা", "address"]],
  ["electricityOffice", ["অফিস", "office"]],
  ["feederName", ["ফিডার", "feeder"]],
  ["meterNumber", ["মিটার নম্বর", "meter no", "meter number"]],
  ["customerNumber", ["গ্রাহক নম্বর", "কনজ্যুমার নম্বর", "customer no", "consumer no"]],
  ["approvedLoadKw", ["লোড", "load"]],
  ["tariff", ["ট্যারিফ", "tariff"]],
]
const TIME_WORDS = ["সময়", "তারিখ", "time", "date", "update"]

const clean = (text: string) => text.replace(/\s+/g, " ").trim()
const includesAny = (text: string, words: string[]) => words.some((w) => text.includes(nfc(w)))
// "(সময়ঃ 27 November 2026 12:00:00 AM )" inside the balance label
const LABEL_TIME = new RegExp(`(?:${"সময়".normalize("NFC")}|time)\\s*[ঃ:]\\s*([^)]+?)\\s*\\)`, "i")

export function parseCustomerInfo($: cheerio.CheerioAPI, custNo: string): CustomerInfo {
  const fields: CustomerField[] = []
  const found: Partial<Record<CustomerKey, string>> = {}

  $($("#con_info_div").length ? "#con_info_div label" : "label").each((_, elem) => {
    const label = clean($(elem).text())
    if (!label) return
    // The live portal wraps each input in the label's next sibling, several pairs per row.
    const next = $(elem).next()
    let input = next.is("input") ? next : next.find("input").first()
    if (!input.length && !$(elem).siblings("label").length) input = $(elem).parent().find("input").first()
    const id = $(elem).attr("for")
    if (!input.length && id) input = $("input").filter((__, el) => el.attribs.id === id)
    if (!input.length) return

    const value = clean(String(input.val() ?? ""))
    fields.push({ label, value })

    const text = nfc(label)
    let key = CUSTOMER_LABELS.find(([, words]) => includesAny(text, words))?.[0]
    if (key === "balance") {
      const time = label.normalize("NFC").match(LABEL_TIME)?.[1]
      if (time) found.balanceUpdatedAt ??= time
      else if (includesAny(text, TIME_WORDS)) key = "balanceUpdatedAt"
    }
    if (key) found[key] ??= value
  })

  // Positional fallback for markup without usable labels.
  const inputs = $("input.form-control")
    .map((_, elem) => String($(elem).val() || "").trim())
    .get()

  const notice = $("#arrear_notice_div")
  const hidden = /display\s*:\s*none/i.test(notice.attr("style") ?? "")

  return {
    name: found.name || inputs[1] || "NESCO Customer",
    address: found.address || inputs[3] || "Rajshahi / Rangpur",
    electricityOffice: found.electricityOffice || inputs[5] || "NESCO Office",
    feederName: found.feederName || inputs[6] || "Local Feeder",
    meterNumber: found.meterNumber || inputs[8] || custNo,
    customerNumber: found.customerNumber || custNo,
    approvedLoadKw: toNum(found.approvedLoadKw) || toNum(inputs[9]) || 2,
    balance: toNum(found.balance ?? inputs.at(-1)),
    tariff: found.tariff || "LT-A (Domestic)",
    fields,
    arrearNotice: hidden ? null : clean(notice.text()) || null,
    balanceUpdatedAt: found.balanceUpdatedAt || null,
  }
}

const RECEIPT_ATTRS: Record<keyof RechargeReceiptData, string> = {
  orderNo: "data-order",
  seq: "data-seq",
  purchaseAmount: "data-purchaseamount",
  totalAmount: "data-totalamount",
  debtAmount: "data-debtamount",
  paidAmount: "data-paidamount",
  saleName: "data-salename",
  purchaseDate: "data-purchasedate",
  purchaseEnergy: "data-purchaseenergy",
}

export function parseRechargeTable($: cheerio.CheerioAPI): RechargeRecord[] {
  const records: RechargeRecord[] = []
  const table = $("table.bfont_post").first()
  if (!table.length) return records

  // 1. Detect column mapping dynamically from table headers
  const headers: string[] = []
  table.find("thead tr th, tr").first().find("th, td").each((_, el) => {
    headers.push($(el).text().trim())
  })

  const colMap: Record<string, number> = {}
  headers.forEach((h, idx) => {
    const text = h.toLowerCase()
    if (text.includes("টোকেন") || text.includes("token")) colMap.token = idx
    else if (text.includes("মিটার রেন্ট") || text.includes("meter rent")) colMap.rent = idx
    else if (text.includes("ডিমান্ড") || text.includes("demand")) colMap.demandCharge = idx
    else if (text.includes("পিএফসি") || text.includes("pfc")) colMap.pfcCharge = idx
    else if (text.includes("ভ্যাট") || text.includes("vat")) colMap.vat = idx
    else if (text.includes("বকেয়া") || text.includes("জরিমানা") || text.includes("arrear")) colMap.arrears = idx
    else if (text.includes("রেয়াত") || text.includes("rebate") || text.includes("discount")) colMap.rebate = idx
    else if (text.includes("বিদ্যুৎ (টাকা)") || text.includes("energy")) colMap.netEnergyBdt = idx
    else if (text.includes("রিচার্জের পরিমাণ") || (text.includes("রিচার্জ") && text.includes("টাকা"))) colMap.grossAmount = idx
    else if (text.includes("কি.ও.আ") || text.includes("kwh") || text.includes("বিদ্যুৎ এর পরিমাণ")) colMap.powerKwh = idx
    else if (text.includes("মাধ্যম") || text.includes("via") || text.includes("channel")) colMap.via = idx
    else if (text.includes("তারিখ") || text.includes("date") || text.includes("time")) colMap.date = idx
    else if (text.includes("স্ট্যাটাস") || text.includes("status")) colMap.status = idx
  })

  // Safe defaults if headers couldn't be parsed
  const tokenIdx = colMap.token ?? 1
  const rentIdx = colMap.rent ?? 2
  const demandIdx = colMap.demandCharge ?? 3
  const pfcIdx = colMap.pfcCharge ?? 4
  const vatIdx = colMap.vat ?? 5
  const arrearsIdx = colMap.arrears ?? 6
  const rebateIdx = colMap.rebate ?? 7
  const netEnergyIdx = colMap.netEnergyBdt ?? 8
  const grossAmountIdx = colMap.grossAmount ?? 9
  const powerKwhIdx = colMap.powerKwh ?? 10
  const viaIdx = colMap.via ?? 11
  const dateIdx = colMap.date ?? 12
  const statusIdx = colMap.status ?? 13

  table.find("tbody tr").each((i, row) => {
    const cols = $(row).find("td").map((__, td) => $(td).text().trim()).get()
    if (cols.length >= 7) {
      const id = cols[0] || String(i + 1)
      const link = $(row).find("a.consumerRechargeData").first()
      const receipt: RechargeReceiptData = Object.fromEntries(
        Object.entries(RECEIPT_ATTRS)
          .map(([key, attr]) => [key, link.attr(attr)?.trim()])
          .filter(([, value]) => value)
      )
      let token = link.attr("data-token")?.trim() || cols[tokenIdx] || ""

      // Failsafe: if token column was empty or didn't contain digits, scan cols for token pattern
      if (!token || !token.replace(/[^0-9]/g, "").length) {
        const found = cols.find((c) => {
          const digits = c.replace(/[^0-9]/g, "")
          return digits.length >= 16 && (c.includes("-") || digits.length >= 20)
        })
        if (found) {
          token = found
        }
      }

      // Intelligently parse Gross Recharge (amount paid by customer at bKash/Nagad)
      // vs Net Energy (amount added directly to meter electricity balance after deductions)
      let grossAmount = toNum(cols[grossAmountIdx])
      const netEnergyBdt = toNum(cols[netEnergyIdx])

      // If gross amount wasn't in cols[10] (e.g. older 6-column layout), fallback to net or amount column
      if (grossAmount === 0 && netEnergyBdt > 0) {
        grossAmount = netEnergyBdt
      }

      // Parse power in kWh (must be non-negative)
      let powerKwh = toNum(cols[powerKwhIdx])
      if (powerKwh < 0) powerKwh = 0

      const rent = toNum(cols[rentIdx])
      const demandCharge = toNum(cols[demandIdx])
      const pfcCharge = toNum(cols[pfcIdx])
      const vat = toNum(cols[vatIdx])
      const arrears = toNum(cols[arrearsIdx])
      const subsidy = toNum(cols[rebateIdx])

      const via = cols[viaIdx] || "Online"
      const date = cols[dateIdx] || ""
      const status = cols[statusIdx] || "Success"

      // One vend can carry several tokens, which NESCO joins with commas and a literal "<br>".
      token = token.replace(/<br\s*\/?>/gi, ",").split(",").map((t) => t.trim()).filter(Boolean).join(", ")

      if (token || grossAmount > 0) {
        records.push({
          id,
          token,
          powerKwh,
          amountBdt: grossAmount,
          netEnergyBdt: netEnergyBdt > 0 ? netEnergyBdt : grossAmount,
          via,
          date,
          status,
          rent,
          demandCharge,
          pfcCharge,
          vat,
          arrears,
          subsidy,
          ...(Object.keys(receipt).length > 0 && { receipt }),
        })
      }
    }
  })

  return records
}

export function parseConsumptionTable($: cheerio.CheerioAPI): MonthlyConsumptionRecord[] {
  const records: MonthlyConsumptionRecord[] = []
  const table = $("table.bfont_post").first()
  if (!table.length) return records

  // Detect column mapping dynamically from table headers
  const headers: string[] = []
  table.find("thead tr th, tr").first().find("th, td").each((_, el) => {
    headers.push($(el).text().trim())
  })

  const colMap: Record<string, number> = {}
  headers.forEach((h, idx) => {
    const text = h.toLowerCase()
    if (text.includes("বছর") || text.includes("year")) colMap.year = idx
    else if (text.includes("মাস") && !text.includes("শেষে")) colMap.month = idx
    else if (text.includes("সর্বমোট রিচার্জ") || text.includes("recharge")) colMap.rechargeBdt = idx
    else if (text.includes("রেয়াত") || text.includes("rebate") || text.includes("discount")) colMap.discountBdt = idx
    else if (text.includes("ব্যবহৃত বিদ্যুৎ (টাকা)") || text.includes("energy charge")) colMap.energyBdt = idx
    else if (text.includes("মিটার রেন্ট") || text.includes("meter rent")) colMap.meterRent = idx
    else if (text.includes("ডিমান্ড") || text.includes("demand")) colMap.demandCharge = idx
    else if (text.includes("ভ্যাট") || text.includes("vat")) colMap.vat = idx
    else if (text.includes("সর্বমোট ব্যবহার") || text.includes("total deduction")) colMap.totalBillBdt = idx
    else if (text.includes("মাস শেষে মিটার ব্যালেন্স") || text.includes("month end")) colMap.monthEndBalance = idx
    else if (text.includes("কি.ও.আ") || text.includes("kwh") || text.includes("ব্যবহৃত বিদ্যুৎ")) colMap.usageKwh = idx
  })

  const yearIdx = colMap.year ?? 0
  const monthIdx = colMap.month ?? 1
  const rechargeIdx = colMap.rechargeBdt ?? 2
  const discountIdx = colMap.discountBdt ?? 3
  const energyBdtIdx = colMap.energyBdt ?? 4
  const rentIdx = colMap.meterRent ?? 5
  const demandIdx = colMap.demandCharge ?? 6
  const vatIdx = colMap.vat ?? 9
  const totalBillIdx = colMap.totalBillBdt ?? 10
  const balanceIdx = colMap.monthEndBalance ?? 11
  const usageKwhIdx = colMap.usageKwh ?? 12

  table.find("tbody tr").each((_, row) => {
    const cols = $(row).find("td").map((__, td) => $(td).text().trim()).get()
    if (cols.length >= 5) {
      const year = cols[yearIdx]
      const month = cols[monthIdx]
      const rechargeBdt = toNum(cols[rechargeIdx])
      const discountBdt = toNum(cols[discountIdx])
      const energyBdt = toNum(cols[energyBdtIdx])
      const meterRent = toNum(cols[rentIdx])
      const demandCharge = toNum(cols[demandIdx])
      const vat = toNum(cols[vatIdx])
      const totalBillBdt = toNum(cols[totalBillIdx])
      const monthEndBalance = toNum(cols[balanceIdx])

      // Usage in kWh (make sure we grab kWh, not BDT!)
      let usageKwh = toNum(cols[usageKwhIdx])
      if (usageKwh === 0 && cols.length === 5) {
        // In legacy 5-column table, index 4 was usage
        usageKwh = toNum(cols[4])
      }

      if (year && month) {
        records.push({
          year,
          month,
          rechargeBdt,
          discountBdt,
          usageKwh,
          energyBdt,
          meterRent,
          demandCharge,
          vat,
          totalBillBdt,
          monthEndBalance,
        })
      }
    }
  })

  return records
}

export async function fetchNescoData(custNo: string, forceSample = false): Promise<NescoFetchResult> {
  const cleanCustNo = custNo.replace(/[^0-9]/g, "").trim()
  if (!cleanCustNo || cleanCustNo.length < 8) {
    throw new Error("অনুগ্রহ করে ৮ থেকে ১১ ডিজিটের সঠিক মিটার বা গ্রাহক নম্বর দিন।")
  }

  // Built-in sample numbers never reach the portal: they may belong to a real customer.
  if (forceSample || cleanCustNo in SAMPLE_METERS) {
    return getSampleMeterData(cleanCustNo)
  }

  try {
    const session = await openNescoSession()
    const [rechargeRes, usageRes] = await Promise.all([
      postNescoForm(session, cleanCustNo, NESCO_SUBMIT.recharge),
      postNescoForm(session, cleanCustNo, NESCO_SUBMIT.monthly),
    ])

    if (!rechargeRes.ok) {
      if (rechargeRes.status === 403) {
        throw new Error("নেসকো পোর্টাল এক্সেস আটকে দিয়েছে (HTTP 403 Forbidden)।")
      }
      throw new Error(`নেসকো রিচার্জ রিকোয়েস্ট ব্যর্থ (স্ট্যাটাস ${rechargeRes.status})`)
    }

    const [rechargeHtml, usageHtml] = await Promise.all([
      rechargeRes.text(),
      usageRes.text(),
    ])

    const $recharge = cheerio.load(rechargeHtml)
    const hasRechargeTable = rechargeHtml.includes("bfont_post")

    if (!hasRechargeTable) {
      throw new Error("নেসকো সার্ভারে এই মিটার বা গ্রাহক নম্বরের কোনো রেকর্ড পাওয়া যায়নি। অনুগ্রহ করে সঠিক নম্বর দিন।")
    }

    const $usage = cheerio.load(usageHtml)

    const customerInfo = parseCustomerInfo($recharge, cleanCustNo)
    const rechargeHistory = parseRechargeTable($recharge)
    const monthlyUsage = parseConsumptionTable($usage)

    const result: NescoFetchResult = {
      success: true,
      dataSource: "nesco_live",
      customerInfo,
      rechargeHistory,
      monthlyUsage,
      statusMessage: "সরকারি নেসকো লাইভ পোর্টাল থেকে সংগৃহীত।",
      fetchedAt: new Date().toISOString(),
    }

    return result
  } catch (err: unknown) {
    let errorMsg = err instanceof Error ? err.message : String(err)
    if (errorMsg.toLowerCase().includes("timeout") || errorMsg.toLowerCase().includes("aborted")) {
      errorMsg = "নেসকো সরকারি সার্ভার সাড়া দিতে অতিরিক্ত সময় নিয়েছে (Timeout)। অনুগ্রহ করে কয়েক সেকেন্ড পর পুনরায় সার্চ বাটনে চাপুন।"
    }
    console.warn(`[NESCO Live Fetch Warning for ${cleanCustNo}]:`, errorMsg)
    throw new Error(errorMsg)
  }
}
