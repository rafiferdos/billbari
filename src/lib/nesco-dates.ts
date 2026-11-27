import { BANGLA_MONTHS, fromBanglaNumber } from "@/lib/bangla"

const SHORT = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
const normalize = (text: string) => fromBanglaNumber(text).trim().normalize("NFC").toLowerCase()

// English full and short names plus both Bangla spellings → 0–11
const MONTH_NAMES = new Map<string, number>(
  Object.entries(BANGLA_MONTHS).flatMap(([en, bn]) => {
    const short = en.slice(0, 3).toLowerCase()
    const index = SHORT.indexOf(short)
    return [en, short, bn].map((name) => [normalize(name), index] as [string, number])
  })
)

/** Parses date strings in common NESCO formats. */
export function parseNescoDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const direct = new Date(s)
  if (!isNaN(direct.getTime())) return direct

  // DD-MMM-YYYY or DD-MM-YYYY
  const [d, m, y] = s.trim().split(/[\s,]+/)[0].split(/[-/]/)
  if (!y) return null
  const named = SHORT.indexOf(m.toLowerCase())
  const date = new Date(parseInt(y, 10), named >= 0 ? named : parseInt(m, 10) - 1, parseInt(d, 10))
  return isNaN(date.getTime()) ? null : date
}

export function monthIndex(month: string | number): number | null {
  const text = normalize(String(month))
  if (/^\d{1,2}$/.test(text)) {
    const n = Number(text)
    return n >= 1 && n <= 12 ? n - 1 : null
  }
  return MONTH_NAMES.get(text) ?? null
}

export const yearNumber = (year: number | string) => Number(fromBanglaNumber(String(year)))

/** Newest first; rows with an unreadable month keep their order at the end. */
export function sortMonthlyDesc<T extends { year: number | string; month: string }>(rows: T[]): T[] {
  const key = (row: T) => {
    const m = monthIndex(row.month)
    return m === null ? -Infinity : yearNumber(row.year) * 12 + m
  }
  return [...rows].sort((a, b) => key(b) - key(a) || 0)
}

export function isSameCalendarMonth(row: { year: number | string; month: string }, now: Date): boolean {
  return yearNumber(row.year) === now.getFullYear() && monthIndex(row.month) === now.getMonth()
}

export function sortRechargesDesc<T extends { date: string }>(rows: T[]): T[] {
  const key = (row: T) => parseNescoDate(row.date)?.getTime() ?? -Infinity
  return [...rows].sort((a, b) => key(b) - key(a) || 0)
}

const SHORT_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const LONG_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

/** index 0-11 */
export function monthName(index: number, isBangla: boolean, style: "short" | "long" = "long"): string {
  const en = (style === "short" ? SHORT_EN : LONG_EN)[index]
  return isBangla ? BANGLA_MONTHS[en] : en
}
