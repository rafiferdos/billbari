import { createElement as h, type ComponentType } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { generateAnalytics } from "../src/features/analytics/insights-generator"
import { LanguageProvider } from "../src/features/i18n/language-context"
import { getSampleMeterData } from "../src/features/nesco/sample-data"
import { BalanceTrendChart } from "../src/features/snapshots/balance-trend-chart"
import { SnapshotHistory } from "../src/features/snapshots/snapshot-history"
import { balanceSeries, burnBetween, newestFirst, snapshotDefaults, staleIds } from "../src/features/snapshots/snapshot-math"
import type { SnapshotRecord } from "../src/features/snapshots/snapshot-server"
import { AppThemeProvider } from "../src/features/theme/app-theme-context"
import { Route } from "../src/routes/snapshots"

const auth = vi.hoisted(() => ({
  user: null as object | null,
  isPremium: false,
  isLoading: false,
  openAuthModal: () => {},
  openPricingModal: () => {},
}))
vi.mock("../src/features/auth/auth-context", () => ({ useAuth: () => auth }))
vi.mock("../src/features/meter/meter-context", () => ({
  useMeter: () => ({ activeMeter: "", activeMeterData: null, fetchMeter: async () => {} }),
}))
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: object) => ({ options }) }))

const Page = (Route as unknown as { options: { component: ComponentType } }).options.component
const wrap = (node: React.ReactNode) =>
  renderToStaticMarkup(h(AppThemeProvider, { children: h(LanguageProvider, { children: node }) }))

const snap = (id: string, day: number, balance: number, extra: Partial<SnapshotRecord> = {}): SnapshotRecord => ({
  id,
  userId: "u",
  meterNumber: "11111111",
  snapshotDate: `2026-11-${String(day).padStart(2, "0")}`,
  balance,
  readingKwh: 0,
  dailyEstimatedCost: 40,
  monthlyEstimatedCost: 1200,
  sourceType: "manual_reading",
  createdAt: `2026-11-${String(day).padStart(2, "0")}T10:00:00.000Z`,
  ...extra,
})
const rows = [snap("a", 1, 900), snap("c", 5, 700), snap("b", 3, 800), snap("x", 4, 5, { meterNumber: "22222222" })]

describe("snapshot ordering and series", () => {
  it("orders by snapshot date, newest first, then by creation time", () => {
    const later = snap("d", 5, 600, { createdAt: "2026-11-05T18:00:00.000Z" })
    expect(newestFirst([...rows, later]).map((s) => s.id)).toEqual(["d", "c", "x", "b", "a"])
  })

  it("charts one meter, oldest first", () => {
    expect(balanceSeries(rows, "11111111").map((p) => p.balance)).toEqual([900, 800, 700])
    expect(balanceSeries(rows, "")).toEqual([])
  })
})

describe("burnBetween", () => {
  it("divides the balance drop by the days between", () => {
    expect(burnBetween(snap("c", 5, 700), snap("b", 3, 800))).toEqual({ days: 2, perDay: 50 })
  })

  it("says nothing when a recharge raised the balance, instead of claiming zero spend", () => {
    expect(burnBetween(snap("c", 5, 1500), snap("b", 3, 800))).toBeNull()
    expect(burnBetween(snap("c", 5, 800), snap("b", 3, 800))).toBeNull()
  })
})

describe("snapshotDefaults", () => {
  const data = getSampleMeterData("12345678")

  it("uses the open meter's balance and estimates", () => {
    const { estimates } = generateAnalytics(data)
    expect(snapshotDefaults("12345678", data, rows)).toEqual({
      balance: 987.43,
      daily: estimates.avgDailyCostBdt,
      monthly: estimates.projectedMonthlyCostBdt,
    })
  })

  it("falls back to that meter's latest snapshot, never another meter's", () => {
    expect(snapshotDefaults("11111111", data, rows)).toEqual({ balance: 700, daily: 40, monthly: 1200 })
  })

  it("invents no estimate", () => {
    expect(snapshotDefaults("33333333", null, rows)).toEqual({ balance: 0, daily: 0, monthly: 0 })
  })
})

describe("staleIds", () => {
  it("names cached rows the server no longer returns", () => {
    expect(staleIds(["a", "other-account"], [{ id: "a" }])).toEqual(["other-account"])
  })
})

describe("tracking page", () => {
  beforeEach(() => Object.assign(auth, { user: null, isPremium: false, isLoading: false }))

  it.each([null, {}])("locks free viewers out and offers the sample (user: %o)", (user) => {
    auth.user = user
    const html = wrap(h(Page))
    expect(html).toContain("ট্র্যাকিং")
    expect(html).toContain("ব্যালেন্স স্ন্যাপশট")
    expect(html).toContain("নমুনা দেখুন")
    expect(html).not.toContain("স্ন্যাপশট নিন")
    // the only money allowed is the price inside the upgrade button
    expect(html.replace(/<button.*?<\/button>/gs, "")).not.toContain("৳")
  })

  it("waits for the account to load before showing the lock", () => {
    auth.isLoading = true
    const html = wrap(h(Page))
    expect(html).toContain('data-slot="skeleton"')
    expect(html).not.toContain("<button")
  })

  it("gives Pro viewers the actions", () => {
    Object.assign(auth, { user: {}, isPremium: true })
    const html = wrap(h(Page))
    expect(html).toContain("স্ন্যাপশট নিন")
    expect(html).toContain("আজকের হিসাব সিঙ্ক করুন")
    expect(html).not.toContain("নমুনা দেখুন")
  })
})

describe("sample values carry the sample badge", () => {
  const badge = />নমুনা<\/span>/g

  it("on the history cards", () => {
    const html = wrap(h(SnapshotHistory, { snapshots: rows, meterNumber: "11111111", sample: true }))
    // trajectory card and table card
    expect(html.match(badge)?.length).toBe(2)
  })

  it("on the chart, and nowhere for real data", () => {
    const chart = (sample: boolean) => wrap(h(BalanceTrendChart, { snapshots: rows, meterNumber: "11111111", sample }))
    expect(chart(true).match(badge)?.length).toBe(1)
    expect(chart(false).match(badge)).toBeNull()
  })

  it("names the delete buttons", () => {
    const html = wrap(h(SnapshotHistory, { snapshots: rows, meterNumber: "11111111" }))
    expect(html.match(/aria-label="স্ন্যাপশট মুছুন"/g)?.length).toBe(3)
  })
})
