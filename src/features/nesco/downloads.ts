import { fromBanglaNumber } from "@/lib/bangla"

export type NescoDownloadKind = "certificate" | "recharge" | "monthly"
// All three returned application/pdf when captured (tests/fixtures/nesco/downloads.json).
export const NESCO_DOWNLOAD_KINDS: NescoDownloadKind[] = ["certificate", "recharge", "monthly"]

export function parseDownloadQuery(q: {
  kind?: string | null
  meter?: string | null
}): { ok: true; kind: NescoDownloadKind; meter: string } | { ok: false; error: string } {
  const kind = NESCO_DOWNLOAD_KINDS.find((k) => k === q.kind)
  if (!kind) return { ok: false, error: "এই ডাউনলোডটি পাওয়া যায় না।" }

  // digits only: the value goes into a response header and to the portal
  const meter = fromBanglaNumber(q.meter ?? "")
  if (!/^\d{8,11}$/.test(meter)) {
    return { ok: false, error: "অনুগ্রহ করে ৮ থেকে ১১ ডিজিটের সঠিক মিটার বা গ্রাহক নম্বর দিন।" }
  }
  return { ok: true, kind, meter }
}

export function isPdfContentType(ct: string | null): boolean {
  return ct?.trim().toLowerCase().startsWith("application/pdf") ?? false
}

export function buildDownloadFilename(kind: NescoDownloadKind, meter: string): string {
  return `billbari-${kind}-${meter}.pdf`
}

export function nescoDownloadHref(kind: NescoDownloadKind, meter: string): string {
  return `/api/nesco/download?${new URLSearchParams({ kind, meter })}`
}
