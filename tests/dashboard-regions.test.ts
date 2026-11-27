import { describe, expect, it } from "vitest"
import { BENTO_ROWS, REGIONS, regionSpan } from "../src/features/dashboard/regions"

const IDS = [
  "balance", "lastRecharge", "runway", "thisMonth", "quickActions",
  "usageChart", "recentRecharges", "customerInfo", "proInsights",
]

describe("dashboard regions", () => {
  it("are listed in priority order", () => {
    expect(REGIONS.map((r) => r.id)).toEqual(IDS)
    expect(REGIONS.every((r, i) => i === 0 || r.priority > REGIONS[i - 1].priority)).toBe(true)
  })

  it("fill bento rows of 12 columns, in the same order", () => {
    expect(BENTO_ROWS.flat()).toEqual(IDS)
    for (const row of BENTO_ROWS) {
      expect(row.reduce((sum, id) => sum + regionSpan(id, "bento", "lg"), 0)).toBe(12)
    }
  })

  it("use at most two columns at md and both split columns", () => {
    expect(REGIONS.every((r) => r.bento.md === 1 || r.bento.md === 2)).toBe(true)
    expect(new Set(REGIONS.map((r) => r.split))).toEqual(new Set(["aside", "main"]))
  })

  it("span by layout and breakpoint", () => {
    expect(regionSpan("balance", "bento", "lg")).toBe(7)
    expect(regionSpan("balance", "stack", "lg")).toBe(1)
    expect(regionSpan("balance", "bento", "md")).toBe(2)
    expect(regionSpan("usageChart", "split", "md")).toBe(2)
    expect(regionSpan("usageChart", "split", "lg")).toBe(1)
    expect(regionSpan("runway", "bento", "base")).toBe(1)
  })
})
