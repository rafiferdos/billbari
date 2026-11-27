import type { LayoutMode } from "@/features/theme/themes"

export type RegionId =
  | "balance" | "lastRecharge" | "runway" | "thisMonth" | "quickActions"
  | "usageChart" | "recentRecharges" | "customerInfo" | "proInsights"

export interface RegionSpec {
  id: RegionId
  priority: number
  bento: { md: 1 | 2; lg: number }
  split: "aside" | "main"
}

const region = (priority: number, id: RegionId, md: 1 | 2, lg: number, split: RegionSpec["split"]): RegionSpec =>
  ({ id, priority, bento: { md, lg }, split })

/** Master plan 5.1. DOM order = priority order = mobile order. */
export const REGIONS: RegionSpec[] = [
  region(1, "balance", 2, 7, "aside"),
  region(2, "lastRecharge", 1, 5, "aside"),
  region(3, "runway", 1, 4, "main"),
  region(4, "thisMonth", 1, 4, "main"),
  region(5, "quickActions", 1, 4, "aside"),
  region(6, "usageChart", 2, 8, "main"),
  region(7, "recentRecharges", 2, 4, "main"),
  region(8, "customerInfo", 2, 6, "aside"),
  region(9, "proInsights", 2, 6, "main"),
]

export const BENTO_ROWS: RegionId[][] = [
  ["balance", "lastRecharge"],
  ["runway", "thisMonth", "quickActions"],
  ["usageChart", "recentRecharges"],
  ["customerInfo", "proInsights"],
]

export function regionSpan(id: RegionId, layout: LayoutMode, bp: "base" | "md" | "lg"): number {
  if (bp === "base" || layout === "stack") return 1
  const { bento } = REGIONS.find((r) => r.id === id)!
  if (bp === "md") return bento.md
  // split places its two columns itself
  return layout === "split" ? 1 : bento.lg
}
