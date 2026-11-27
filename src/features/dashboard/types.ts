import type { FreeStats } from "@/features/analytics/free-stats"
import type { EnergyAnalytics } from "@/features/analytics/insights-generator"
import type { NescoFetchResult } from "@/features/nesco/types"

export interface DashboardData {
  data: NescoFetchResult
  stats: FreeStats
  analytics: EnergyAnalytics
}
