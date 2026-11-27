import { createElement as h, type ComponentType } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { generateAnalytics } from "../src/features/analytics/insights-generator"
import { computeFreeStats } from "../src/features/analytics/free-stats"
import { LastRechargeRegion } from "../src/features/dashboard/regions/last-recharge-region"
import { ProInsightsRegion } from "../src/features/dashboard/regions/pro-insights-region"
import { RecentRechargesRegion } from "../src/features/dashboard/regions/recent-recharges-region"
import { RunwayRegion } from "../src/features/dashboard/regions/runway-region"
import { ThisMonthRegion } from "../src/features/dashboard/regions/this-month-region"
import { UsageChartRegion } from "../src/features/dashboard/regions/usage-chart-region"
import type { DashboardData } from "../src/features/dashboard/types"
import { LanguageProvider } from "../src/features/i18n/language-context"
import { getSampleMeterData } from "../src/features/nesco/sample-data"
import type { NescoFetchResult } from "../src/features/nesco/types"
import { sortRechargesDesc } from "../src/lib/nesco-dates"

const auth = vi.hoisted(() => ({
  user: null as object | null,
  isPremium: false,
  openAuthModal: () => {},
  openPricingModal: () => {},
}))
vi.mock("../src/features/auth/auth-context", () => ({ useAuth: () => auth }))
vi.mock("@tanstack/react-router", () => ({ Link: (props: { children: unknown }) => h("a", null, props.children as string) }))

const dashboard = (data: NescoFetchResult): DashboardData => ({
  data,
  stats: computeFreeStats(data),
  analytics: generateAnalytics(data),
})
const render = (Region: ComponentType<DashboardData>, props: DashboardData) =>
  renderToStaticMarkup(h(LanguageProvider, { children: h(Region, props) }))

const sample = dashboard(getSampleMeterData("12345678"))
// values no label or description could contain by accident
const marked: DashboardData = {
  ...sample,
  analytics: {
    ...sample.analytics,
    hasEnoughData: true,
    runway: { ...sample.analytics.runway, estimatedDaysRemaining: 7391 },
    estimates: { ...sample.analytics.estimates, avgDailyCostBdt: 6173.25, avgDailyKwh: 5821.5 },
    insights: [
      { id: "x", title: "SECRET-TITLE", description: "SECRET-BODY", type: "info", metric: "SECRET-METRIC", isCalculatedEstimate: true },
    ],
  },
}
const SECRETS = ["৭৩৯১", "7391", "৬,১৭৩", "৫,৮২১", "SECRET"]

describe("Pro regions never leak values to free viewers", () => {
  it.each([null, {}])("runway and insights stay locked (user: %o)", (user) => {
    Object.assign(auth, { user, isPremium: false })
    for (const Region of [RunwayRegion, ProInsightsRegion]) {
      const html = render(Region, marked)
      for (const secret of SECRETS) expect(html).not.toContain(secret)
    }
  })

  it("shows them to premium viewers", () => {
    Object.assign(auth, { user: {}, isPremium: true })
    expect(render(RunwayRegion, marked)).toContain("৭৩৯১")
    expect(render(ProInsightsRegion, marked)).toContain("SECRET-TITLE")
  })

  it("shows no runway numbers without enough data", () => {
    Object.assign(auth, { user: {}, isPremium: true })
    const html = render(RunwayRegion, { ...marked, analytics: { ...marked.analytics, hasEnoughData: false } })
    expect(html).not.toContain("৭৩৯১")
    expect(html).toContain("হিসাবের জন্য যথেষ্ট তথ্য নেই")
  })
})

describe("a new meter with no history", () => {
  const data = getSampleMeterData("12345678")
  const empty = dashboard({ ...data, rechargeHistory: [], monthlyUsage: [] })

  it.each([LastRechargeRegion, ThisMonthRegion, UsageChartRegion, RecentRechargesRegion])(
    "renders an empty state in %o",
    (Region) => {
      const html = render(Region, empty)
      expect(html).toContain('data-slot="empty"')
      expect(html).not.toMatch(/NaN|Infinity|undefined/)
    }
  )
})

describe("sortRechargesDesc", () => {
  it("puts the newest first and unreadable dates last", () => {
    const rows = [{ date: "bad" }, { date: "12-OCT-2026 10:30 AM" }, { date: "25-OCT-2026 04:15 PM" }]
    expect(sortRechargesDesc(rows).map((r) => r.date)).toEqual(["25-OCT-2026 04:15 PM", "12-OCT-2026 10:30 AM", "bad"])
  })
})
