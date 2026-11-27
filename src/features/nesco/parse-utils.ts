import { fromBanglaNumber } from "@/lib/bangla"

/** Number from NESCO text ("৳ ১,২৩৪.৫০"); anything unreadable is 0. */
export function toNum(raw: string | null | undefined): number {
  return parseFloat(fromBanglaNumber(raw ?? "").replace(/[^0-9.-]/g, "")) || 0
}
