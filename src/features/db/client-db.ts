import {
  createCollection,
  DbClient,
  localStorageCollectionOptions,
} from "@tanstack/react-db"
import { staleIds } from "@/features/snapshots/snapshot-math"

export interface ClientSnapshot extends Record<string, unknown> {
  id: string
  meterNumber: string
  snapshotDate: string
  balance: number
  readingKwh: number
  dailyEstimatedCost: number
  monthlyEstimatedCost: number
  sourceType: "nesco_live" | "manual_reading" | "sample_demo" | "automated_daily_cron"
  notes?: string
  createdAt: string
}

export interface RecentSearch extends Record<string, unknown> {
  meterNumber: string
  customerNumber?: string
  searchedAt: string
  label?: string
}

// Client-side DbClient singleton
export const dbClient = new DbClient()

// Client-side collections
export const snapshotsCollection = createCollection(
  localStorageCollectionOptions<ClientSnapshot>({
    storageKey: "billbari_snapshots_v1",
    getKey: (item) => item.id,
  })
)

export const recentSearchesCollection = createCollection(
  localStorageCollectionOptions<RecentSearch>({
    storageKey: "billbari_recent_searches_v1",
    getKey: (item) => item.meterNumber,
  })
)

/**
 * Mirror the server's snapshots into the client collection. Rows the server no
 * longer returns are dropped, so one account never sees another's cache.
 */
export function syncSnapshotsToClient(snapshots: ClientSnapshot[]) {
  if (typeof window === "undefined") return
  try {
    for (const id of staleIds([...snapshotsCollection.keys()].map(String), snapshots)) {
      snapshotsCollection.delete(id)
    }
    for (const snap of snapshots) {
      if (!snapshotsCollection.has(snap.id)) {
        snapshotsCollection.insert(snap)
      } else {
        snapshotsCollection.update(snap.id, () => snap)
      }
    }
  } catch (err) {
    console.error("Failed to sync snapshots to TanStack DB:", err)
  }
}

/**
 * Add or update recent search
 */
export function recordRecentSearch(search: RecentSearch) {
  if (typeof window === "undefined") return
  try {
    if (recentSearchesCollection.has(search.meterNumber)) {
      recentSearchesCollection.update(search.meterNumber, () => search)
    } else {
      recentSearchesCollection.insert(search)
    }
  } catch (err) {
    console.error("Failed to record recent search:", err)
  }
}
