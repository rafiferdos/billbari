// Bangla & BDT formatting utilities for BillBari

export const BANGLA_DIGITS: Record<string, string> = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
  ".": ".",
}

export const ENGLISH_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
}

export const BANGLA_MONTHS: Record<string, string> = {
  January: "জানুয়ারি",
  February: "ফেব্রুয়ারি",
  March: "মার্চ",
  April: "এপ্রিল",
  May: "মে",
  June: "জুন",
  July: "জুলাই",
  August: "আগস্ট",
  September: "সেপ্টেম্বর",
  October: "অক্টোবর",
  November: "নভেম্বর",
  December: "ডিসেম্বর",
  Jan: "জানু",
  Feb: "ফেব্রু",
  Mar: "মার্চ",
  Apr: "এপ্রিল",
  Jun: "জুন",
  Jul: "জুলাই",
  Aug: "আগস্ট",
  Sep: "সেপ্টে",
  Oct: "অক্টো",
  Nov: "নভে",
  Dec: "ডিসে",
}

/**
 * Converts any number or numeric string to Bangla numerals
 */
export function toBanglaNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "০"
  const str = String(value)
  return str.replace(/[0-9]/g, (digit) => BANGLA_DIGITS[digit] || digit)
}

/**
 * Converts Bangla numerals to standard English numbers
 */
export function fromBanglaNumber(value: string): string {
  if (!value) return ""
  return value.replace(/[০-৯]/g, (digit) => ENGLISH_DIGITS[digit] || digit)
}

/**
 * Formats a number in Bangladeshi Taka with currency symbol (৳)
 */
export function formatBDT(amount: number | string | null | undefined, options?: { inBangla?: boolean; includeSymbol?: boolean; decimals?: number }): string {
  const { inBangla = true, includeSymbol = true, decimals = 2 } = options || {}
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return includeSymbol ? (inBangla ? "৳০.০০" : "৳0.00") : inBangla ? "০.০০" : "0.00"
  }

  const num = typeof amount === "string" ? parseFloat(amount) : amount
  const parts = num.toFixed(decimals).split(".")
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  const formatted = decimals > 0 ? `${intPart}.${parts[1]}` : intPart

  const finalStr = inBangla ? toBanglaNumber(formatted) : formatted
  return includeSymbol ? `৳${finalStr}` : finalStr
}

/**
 * Formats energy units (kWh)
 */
export function formatUnits(units: number | string | null | undefined, inBangla = true): string {
  if (units === null || units === undefined || isNaN(Number(units))) {
    return inBangla ? "০ kWh" : "0 kWh"
  }
  const num = typeof units === "string" ? parseFloat(units) : units
  const formatted = num.toLocaleString("en-US", { maximumFractionDigits: 2 })
  return `${inBangla ? toBanglaNumber(formatted) : formatted} kWh`
}

/**
 * Formats month name to natural Bangla
 */
export function formatMonthBangla(monthNameOrNum: string | number): string {
  if (typeof monthNameOrNum === "number") {
    const months = Object.values(BANGLA_MONTHS)
    return months[monthNameOrNum - 1] || String(monthNameOrNum)
  }
  return BANGLA_MONTHS[monthNameOrNum] || monthNameOrNum
}

/**
 * Parses date string (e.g., "01-JAN-2025 11:00 AM" or ISO) into readable Bangla
 */
export function formatDateBangla(dateStr: string | null | undefined): string {
  if (!dateStr) return "-"
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      // Manual parse for "DD-MMM-YYYY"
      const match = dateStr.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})/i)
      if (match) {
        const [, day, mon, yr] = match
        const bMonth = formatMonthBangla(mon)
        return `${toBanglaNumber(day)} ${bMonth} ${toBanglaNumber(yr)}`
      }
      return dateStr
    }
    const day = toBanglaNumber(date.getDate())
    const month = Object.values(BANGLA_MONTHS)[date.getMonth()]
    const year = toBanglaNumber(date.getFullYear())
    return `${day} ${month} ${year}`
  } catch {
    return dateStr
  }
}

export const BANGLA_DAYS = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"]

/**
 * Translates payment channels to natural Bangla
 */
export function translateViaBangla(via: string | null | undefined): string {
  if (!via) return "-"
  const v = via.trim().toLowerCase()
  if (v.includes("bkash")) return "বিকাশ"
  if (v.includes("nagad")) return "নগদ"
  if (v.includes("rocket")) return "রকেট"
  if (v.includes("upay")) return "উপায়"
  if (v.includes("pos")) return "পিওএস ভেন্ডিং"
  if (v.includes("bank")) return "ব্যাংক"
  if (v.includes("online")) return "অনলাইন"
  return via
}

/**
 * Formats date with day of the week in natural Bangla
 * e.g., "১৫ নভেম্বর ২০২৬ (রবিবার)"
 */
export function formatDateWithDayBangla(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return "-"
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
    if (isNaN(date.getTime())) return String(dateInput)
    const dayName = BANGLA_DAYS[date.getDay()]
    const day = toBanglaNumber(date.getDate())
    const month = Object.values(BANGLA_MONTHS)[date.getMonth()]
    const year = toBanglaNumber(date.getFullYear())
    return `${day} ${month} ${year} (${dayName})`
  } catch {
    return String(dateInput)
  }
}
