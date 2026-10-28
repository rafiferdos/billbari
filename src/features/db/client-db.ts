import {
  createCollection,
  DbClient,
  localStorageCollectionOptions,
} from "@tanstack/react-db"

export interface ClientSnapshot extends Record<string, unknown> {
  id: string
  meterNumber: string
  snapshotDate: string
  balance: number
  readingKwh: number
  dailyEstimatedCost: number
  monthlyEstimatedCost: number
  sourceType: "nesco_live" | "manual_reading" | "sample_demo"
  notes?: string
  createdAt: string
}

export interface ClientSavedMeter extends Record<string, unknown> {
  id: string
  meterNumber: string
  customerNumber?: string
  customerName?: string
  address?: string
  tariff?: string
  sanctionedLoad?: string
  alias?: string
  isFavorite?: boolean
  updatedAt: string
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

export const savedMetersCollection = createCollection(
  localStorageCollectionOptions<ClientSavedMeter>({
    storageKey: "billbari_saved_meters_v1",
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
 * Sync server snapshots into client TanStack DB collection
 */
export function syncSnapshotsToClient(snapshots: ClientSnapshot[]) {
  if (typeof window === "undefined") return
  try {
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
