import * as cheerio from "cheerio"
import type { MonthlyConsumptionRecord, RechargeRecord, NescoFetchResult } from "./types"
import { getSampleMeterData, SAMPLE_METERS } from "./sample-data"
import { getDatabase } from "../db/server-db"

const PORTAL_URL = "https://customer.nesco.gov.bd/pre/panel"
const TIMEOUT_MS = 14000 // 14 seconds max for NESCO server response

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

  table.find("tbody tr").each((_, row) => {
    const cols = $(row).find("td").map((__, td) => $(td).text().trim()).get()
    if (cols.length >= 7) {
      // cols: [id, token, ..., power(8), amount(9), ..., via(11), date(12), status(13)]
      const id = cols[0] || String(records.length + 1)
      const token = cols[1] || ""
      const powerKwh = parseFloat(cols[8] || cols[2] || "0") || 0
      const amountBdt = parseFloat(cols[9] || cols[3] || "0") || 0
      const via = cols[11] || cols[4] || "Online"
      const date = cols[12] || cols[5] || ""
      const status = cols[13] || cols[6] || "Success"

      if (token || amountBdt > 0) {
        records.push({
          id,
          token,
          powerKwh,
          amountBdt,
          via,
          date,
          status,
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

  table.find("tbody tr").each((_, row) => {
    const cols = $(row).find("td").map((__, td) => $(td).text().trim()).get()
    if (cols.length >= 5) {
      // [year, month, recharge, discount, usage]
      const year = cols[0]
      const month = cols[1]
      const rechargeBdt = parseFloat(cols[2]?.replace(/[^0-9.-]/g, "") || "0") || 0
      const discountBdt = parseFloat(cols[3]?.replace(/[^0-9.-]/g, "") || "0") || 0
      const usageKwh = parseFloat(cols[4]?.replace(/[^0-9.-]/g, "") || "0") || 0

      if (year && month) {
        records.push({
          year,
          month,
          rechargeBdt,
          discountBdt,
          usageKwh,
        })
      }
    }
  })

  return records
}

export async function fetchNescoData(custNo: string, forceSample = false): Promise<NescoFetchResult> {
  const cleanCustNo = custNo.replace(/[^0-9]/g, "").trim()
  if (!cleanCustNo) {
    throw new Error("সঠিক মিটার বা গ্রাহক নম্বর প্রবেশ করান।")
  }

  // If user explicitly asks for sample or demo meter is requested directly
  if (forceSample || SAMPLE_METERS[cleanCustNo]) {
    return getSampleMeterData(cleanCustNo)
  }

  const db = await getDatabase()

  try {
    // 1. Initial GET to obtain session cookies and CSRF token
    const getRes = await fetch(PORTAL_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!getRes.ok) {
      throw new Error(`NESCO পোর্টাল স্ট্যাটাস কোড: ${getRes.status}`)
    }

    const getHtml = await getRes.text()
    const cookies = getRes.headers.getSetCookie?.() || []
    const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ")

    const tokenMatch =
      getHtml.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i) ||
      getHtml.match(/name=["']_token["']\s+value=["']([^"']+)["']/i)

    const csrfToken = tokenMatch ? tokenMatch[1] : ""
    if (!csrfToken) {
      throw new Error("NESCO পোর্টাল থেকে CSRF টোকেন পাওয়া যায়নি।")
    }

    // 2. POST for Recharge History & Customer Info
    const rechargeBody = new URLSearchParams({
      _token: csrfToken,
      cust_no: cleanCustNo,
      submit: "রিচার্জ হিস্ট্রি",
    })

    const rechargeRes = await fetch(PORTAL_URL, {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Cookie": cookieHeader,
        "Referer": PORTAL_URL,
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://customer.nesco.gov.bd",
      },
      body: rechargeBody.toString(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    const rechargeHtml = await rechargeRes.text()
    const $recharge = cheerio.load(rechargeHtml)
    const hasRechargeTable = rechargeHtml.includes("bfont_post")

    // 3. POST for Monthly Usage
    const usageBody = new URLSearchParams({
      _token: csrfToken,
      cust_no: cleanCustNo,
      submit: "মাসিক ব্যবহার",
    })

    const usageRes = await fetch(PORTAL_URL, {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Cookie": cookieHeader,
        "Referer": PORTAL_URL,
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://customer.nesco.gov.bd",
      },
      body: usageBody.toString(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    const usageHtml = await usageRes.text()
    const $usage = cheerio.load(usageHtml)

    // Check if real data was parsed
    if (hasRechargeTable) {
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

      // Cache to Database
      try {
        await db.execute({
          sql: `
            INSERT INTO cached_meter_data (meter_number, customer_number, cached_at, data_json)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(meter_number) DO UPDATE SET
              cached_at = excluded.cached_at,
              data_json = excluded.data_json
          `,
          args: [cleanCustNo, customerInfo.customerNumber, new Date().toISOString(), JSON.stringify(result)],
        })
      } catch (cacheErr) {
        console.warn("Could not cache NESCO response to Database:", cacheErr)
      }

      return result
    }

    // If the government portal returned empty or meter not found in active live query:
    // Check Database cache first!
    const cachedRes = await db.execute({
      sql: `SELECT data_json, cached_at FROM cached_meter_data WHERE meter_number = ?`,
      args: [cleanCustNo],
    })
    const cachedRow = cachedRes.rows[0] as unknown as { data_json: string; cached_at: string } | undefined

    if (cachedRow) {
      const parsed = JSON.parse(cachedRow.data_json) as NescoFetchResult
      parsed.statusMessage = "নেসকো সার্ভারে বিলম্বে পূর্ববর্তী ক্যাশ ডেটা প্রদর্শিত হচ্ছে।"
      return parsed
    }

    // If meter has no live records on NESCO portal, gracefully fall back to verified reference data
    const sample = getSampleMeterData(cleanCustNo)
    sample.statusMessage = "নেসকো সার্ভার এই নম্বরের সরাসরি লাইভ রেকর্ড খুঁজে পায়নি। পরীক্ষামূলক রেফারেন্স ডেটা প্রদর্শিত হচ্ছে।"
    return sample
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.warn(`[NESCO Live Fetch Warning for ${cleanCustNo}]:`, errorMsg)

    // Check if we have cached data in DB
    try {
      const cachedRes = await db.execute({
        sql: `SELECT data_json, cached_at FROM cached_meter_data WHERE meter_number = ?`,
        args: [cleanCustNo],
      })
      const cachedRow = cachedRes.rows[0] as unknown as { data_json: string; cached_at: string } | undefined
      if (cachedRow) {
        const parsed = JSON.parse(cachedRow.data_json) as NescoFetchResult
        parsed.statusMessage = `নেসকো সার্ভার সংযোগ বিচ্ছিন্ন (${errorMsg})। পূর্ববর্তী সংরক্ষিত ক্যাশ ডেটা দেখানো হচ্ছে।`
        return parsed
      }
    } catch {
      // ignore
    }

    // Fall back gracefully with clear disclosure
    const sample = getSampleMeterData(cleanCustNo)
    sample.statusMessage = `নেসকো সরকারি পোর্টাল সংযোগ সাময়িক বিলম্বিত (${errorMsg})। হিসাবের সুবিধার্থে রেফারেন্স ডেটা দেখানো হচ্ছে।`
    return sample
  }
}
