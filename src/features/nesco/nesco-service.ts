import * as cheerio from "cheerio"
import type { MonthlyConsumptionRecord, RechargeRecord, NescoFetchResult } from "./types"
import { getSampleMeterData } from "./sample-data"

const DEFAULT_PORTAL_URL = "https://customer.nesco.gov.bd/pre/panel"
const TIMEOUT_MS = 25000 // 25 seconds headroom for NESCO and tunnel response
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

function getPortalUrl(): string {
  const custom = process.env.NESCO_PROXY_URL || process.env.NESCO_PORTAL_URL
  return custom?.trim() || DEFAULT_PORTAL_URL
}

interface NescoScrapedCustomerInfo {
  name: string
  address: string
  electricityOffice: string
  feederName: string
  meterNumber: string
  customerNumber: string
  approvedLoadKw: number
  balance: number
  tariff: string
}

function parseCustomerInfo($: cheerio.CheerioAPI, custNo: string): NescoScrapedCustomerInfo {
  const labelValues: Record<string, string> = {}

  $("label").each((_, elem) => {
    const text = $(elem).text().replace(/\s+/g, " ").trim()
    const inputVal = $(elem).next("input").val() || $(elem).parent().find("input").val() || ""
    if (text) {
      labelValues[text] = String(inputVal).trim()
    }
  })

  // Alternatively collect all inputs in customer-info card
  const inputList: string[] = []
  $("input.form-control").each((_, elem) => {
    inputList.push(String($(elem).val() || "").trim())
  })

  // Try to parse values
  const name = inputList[1] || labelValues["গ্রাহকের নাম"] || labelValues["Customer Name"] || "NESCO Customer"
  const address = inputList[3] || labelValues["ঠিকানা"] || labelValues["Address"] || "Rajshahi / Rangpur"
  const office = inputList[5] || labelValues["বিদ্যুৎ অফিস"] || labelValues["Electricity Office"] || "NESCO Office"
  const feeder = inputList[6] || labelValues["ফিডার"] || labelValues["Feeder Name"] || "Local Feeder"
  const meterNum = inputList[8] || custNo
  const load = parseFloat(inputList[9] || "2.0") || 2.0
  const balanceRaw = inputList[inputList.length - 1] || "0.0"
  const balance = parseFloat(balanceRaw.replace(/[^0-9.]/g, "")) || 0

  return {
    name,
    address,
    electricityOffice: office,
    feederName: feeder,
    meterNumber: meterNum,
    customerNumber: custNo,
    approvedLoadKw: load,
    balance,
    tariff: "LT-A (Domestic)",
  }
}

function parseRechargeTable($: cheerio.CheerioAPI): RechargeRecord[] {
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
      let token = cols[tokenIdx] || ""

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
      let grossAmount = parseFloat(cols[grossAmountIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0
      const netEnergyBdt = parseFloat(cols[netEnergyIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0

      // If gross amount wasn't in cols[10] (e.g. older 6-column layout), fallback to net or amount column
      if (grossAmount === 0 && netEnergyBdt > 0) {
        grossAmount = netEnergyBdt
      }

      // Parse power in kWh (must be non-negative)
      let powerKwh = parseFloat(cols[powerKwhIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0
      if (powerKwh < 0) powerKwh = 0

      const rent = parseFloat(cols[rentIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0
      const demandCharge = parseFloat(cols[demandIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0
      const pfcCharge = parseFloat(cols[pfcIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0
      const vat = parseFloat(cols[vatIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0
      const arrears = parseFloat(cols[arrearsIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0
      const subsidy = parseFloat(cols[rebateIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0

      const via = cols[viaIdx] || "Online"
      const date = cols[dateIdx] || ""
      const status = cols[statusIdx] || "Success"

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
        })
      }
    }
  })

  return records
}

function parseConsumptionTable($: cheerio.CheerioAPI): MonthlyConsumptionRecord[] {
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
      const rechargeBdt = parseFloat(cols[rechargeIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0
      const discountBdt = parseFloat(cols[discountIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0
      const energyBdt = parseFloat(cols[energyBdtIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0
      const meterRent = parseFloat(cols[rentIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0
      const demandCharge = parseFloat(cols[demandIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0
      const vat = parseFloat(cols[vatIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0
      const totalBillBdt = parseFloat(cols[totalBillIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0
      const monthEndBalance = parseFloat(cols[balanceIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0

      // Usage in kWh (make sure we grab kWh, not BDT!)
      let usageKwh = parseFloat(cols[usageKwhIdx]?.replace(/[^0-9.-]/g, "") || "0") || 0
      if (usageKwh === 0 && cols.length === 5) {
        // In legacy 5-column table, index 4 was usage
        usageKwh = parseFloat(cols[4]?.replace(/[^0-9.-]/g, "") || "0") || 0
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

  // Only return sample data if explicitly requested in unit tests / explicit demo mode
  if (forceSample) {
    return getSampleMeterData(cleanCustNo)
  }

  const portalUrl = getPortalUrl()

  try {
    // 1. Initial GET to obtain session cookies and CSRF token
    const getRes = await fetch(portalUrl, {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Ch-Ua": '"Not-A.Brand";v="99", "Chromium";v="124", "Google Chrome";v="124"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!getRes.ok) {
      if (getRes.status === 403) {
        throw new Error(
          "নেসকো পোর্টাল এক্সেস আটকে দিয়েছে (HTTP 403 Forbidden)। নেসকো সরকারি পোর্টাল শুধুমাত্র বাংলাদেশ থেকে সরাসরি এক্সেসযোগ্য। বিদেশি ক্লাউড সার্ভার (যেমন Vercel) থেকে জিও-ব্লকিং (Geo-blocking) থাকায় সরাসরি সংযোগ ব্লক হচ্ছে।"
        )
      }
      throw new Error(`নেসকো সরকারি পোর্টাল স্ট্যাটাস কোড: ${getRes.status}`)
    }

    const getHtml = await getRes.text()
    const cookies = getRes.headers.getSetCookie?.() || []
    const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ")

    const tokenMatch =
      getHtml.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i) ||
      getHtml.match(/name=["']_token["']\s+value=["']([^"']+)["']/i)

    const csrfToken = tokenMatch ? tokenMatch[1] : ""
    if (!csrfToken) {
      throw new Error("নেসকো পোর্টাল থেকে CSRF টোকেন পাওয়া যায়নি।")
    }

    // 2. Fetch Recharge History & Monthly Usage in parallel for maximum speed
    const rechargeBody = new URLSearchParams({
      _token: csrfToken,
      cust_no: cleanCustNo,
      submit: "রিচার্জ হিস্ট্রি",
    })

    const usageBody = new URLSearchParams({
      _token: csrfToken,
      cust_no: cleanCustNo,
      submit: "মাসিক ব্যবহার",
    })

    const postHeaders = {
      "User-Agent": BROWSER_USER_AGENT,
      "Cookie": cookieHeader,
      "Referer": portalUrl,
      "Content-Type": "application/x-www-form-urlencoded",
      "Origin": "https://customer.nesco.gov.bd",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7",
      "Sec-Ch-Ua": '"Not-A.Brand";v="99", "Chromium";v="124", "Google Chrome";v="124"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    }

    const [rechargeRes, usageRes] = await Promise.all([
      fetch(portalUrl, {
        method: "POST",
        headers: postHeaders,
        body: rechargeBody.toString(),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }),
      fetch(portalUrl, {
        method: "POST",
        headers: postHeaders,
        body: usageBody.toString(),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }),
    ])

    if (!rechargeRes.ok) {
      if (rechargeRes.status === 403) {
        throw new Error("নেসকো পোর্টাল এক্সেস আটকে দিয়েছে (HTTP 403 Forbidden)।")
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
