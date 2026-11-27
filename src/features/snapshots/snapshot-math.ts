import { generateAnalytics } from "@/features/analytics/insights-generator"
import type { NescoFetchResult } from "@/features/nesco/types"
import type { SnapshotRecord } from "./snapshot-server"

type Dated = Pick<SnapshotRecord, "snapshotDate" | "createdAt">

/** By calendar day (manual entries store a bare date, syncs a timestamp), then by entry time. */
export function newestFirst<T extends Dated>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      b.snapshotDate.slice(0, 10).localeCompare(a.snapshotDate.slice(0, 10)) || b.createdAt.localeCompare(a.createdAt)
  )
}

/** One meter's balance, oldest first. */
export function balanceSeries(rows: SnapshotRecord[], meterNumber: string) {
  return newestFirst(rows.filter((s) => s.meterNumber === meterNumber))
    .reverse()
    .map((s) => ({ date: s.snapshotDate, balance: s.balance }))
}

/** Null when the balance did not fall: a recharge in between hides the real spend. */
export function burnBetween(latest: SnapshotRecord, previous: SnapshotRecord): { days: number; perDay: number } | null {
  const drop = previous.balance - latest.balance
  if (drop <= 0) return null
  const gap = new Date(latest.snapshotDate).getTime() - new Date(previous.snapshotDate).getTime()
  const days = Math.max(1, Math.round(Math.abs(gap) / 86_400_000))
  return { days, perDay: Math.round((drop / days) * 100) / 100 }
}

/** Prefill for a manual entry, from this meter only. Zero means unknown. */
export function snapshotDefaults(meterNumber: string, data: NescoFetchResult | null, rows: SnapshotRecord[]) {
  if (data && data.customerInfo.meterNumber === meterNumber) {
    const { estimates } = generateAnalytics(data)
    return {
      balance: data.customerInfo.balance,
      daily: estimates.avgDailyCostBdt,
      monthly: estimates.projectedMonthlyCostBdt,
    }
  }
  const latest = newestFirst(rows.filter((s) => s.meterNumber === meterNumber)).at(0)
  return {
    balance: latest?.balance ?? 0,
    daily: latest?.dailyEstimatedCost ?? 0,
    monthly: latest?.monthlyEstimatedCost ?? 0,
  }
}

/** Cached ids the server no longer returns: deleted elsewhere, or another account's. */
export function staleIds(cachedIds: string[], records: { id: string }[]): string[] {
  const live = new Set(records.map((r) => r.id))
  return cachedIds.filter((id) => !live.has(id))
}
