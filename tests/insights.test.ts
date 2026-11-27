import { createElement as h, type ComponentType } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { generateAnalytics } from "../src/features/analytics/insights-generator"
import { LanguageProvider } from "../src/features/i18n/language-context"
import { getSampleMeterData } from "../src/features/nesco/sample-data"
import type { MonthlyConsumptionRecord, NescoFetchResult } from "../src/features/nesco/types"
import { AppThemeProvider } from "../src/features/theme/app-theme-context"
import { Route } from "../src/routes/insights"

const auth = vi.hoisted(() => ({
  user: null as object | null,
  isPremium: false,
  isLoading: false,
  openAuthModal: () => {},
  openPricingModal: () => {},
}))
const meter = vi.hoisted(() => ({
  activeMeterData: null as object | null,
  activeMeter: "",
  failedMeter: "",
  error: null as string | null,
  isLoading: false,
  fetchMeter: async () => {},
  clearActiveMeter: () => {},
}))
vi.mock("../src/features/auth/auth-context", () => ({ useAuth: () => auth }))
vi.mock("../src/features/meter/meter-context", () => ({ useMeter: () => meter }))
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: object) => ({ options }),
  Link: (props: { children: unknown }) => h("a", null, props.children as string),
}))

const Page = (Route as unknown as { options: { component: ComponentType } }).options.component
const render = () =>
  renderToStaticMarkup(h(AppThemeProvider, { children: h(LanguageProvider, { children: h(Page) }) }))

const month = (name: string, usageKwh: number, rechargeBdt = usageKwh * 8): MonthlyConsumptionRecord => ({
  year: 2026,
  month: name,
  rechargeBdt,
  discountBdt: 0,
  usageKwh,
})
const sample = getSampleMeterData("12345678")
const withMonths = (monthlyUsage: MonthlyConsumptionRecord[]): NescoFetchResult => ({ ...sample, monthlyUsage })

const SECTIONS = [
  "কয়দিন চলবে",
  "ধাপ পূর্বাভাস",
  "খরচের গুরুত্বপূর্ণ তথ্য ও পরামর্শ",
  "প্রকৃত ইউনিট দর",
  "রিচার্জ অভ্যাস",
  "মৌসুমি প্রভাব",
  "পরিবেশগত প্রভাব",
]
const headings = (html: string) => [...html.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((m) => m[1])

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 3, 12))
  Object.assign(auth, { user: {}, isPremium: true, isLoading: false })
  Object.assign(meter, { activeMeterData: sample, activeMeter: "12345678" })
})
afterEach(() => vi.useRealTimers())

describe("insights page, locked", () => {
  it.each([null, {}])("lists the Pro features with one action and no meter values (user: %o)", (user) => {
    Object.assign(auth, { user, isPremium: false })
    const html = render()
    for (const name of ["কয়দিন চলবে", "দৈনিক খরচ", "ধাপ পূর্বাভাস", "ব্যক্তিগত পরামর্শ", "প্রকৃত ইউনিট দর", "রিচার্জ অভ্যাস", "মৌসুমি প্রভাব", "বিস্তারিত চার্ট"]) {
      expect(html).toContain(name)
    }
    expect(html.match(/<button/g)).toHaveLength(1)
    expect(html).toContain(user ? "প্রো নিন" : "লগইন করুন")
    expect(html).not.toContain("<input")
    expect(html).not.toContain("RAHIM")
    // the only money allowed is the price inside the button
    expect(html.replace(/<button.*?<\/button>/gs, "")).not.toContain("৳")
    expect(html).not.toMatch(/৯৮৭|987/)
  })

  it("waits for the account to load before showing the lock", () => {
    Object.assign(auth, { user: null, isPremium: false, isLoading: true })
    const html = render()
    expect(html).toContain('data-slot="skeleton"')
    expect(html).not.toContain("<button")
  })
})

describe("insights page, Pro", () => {
  it("shows every section in order", () => {
    const html = render()
    expect(headings(html)).toEqual(SECTIONS)
    expect(html).not.toMatch(/NaN|Infinity|undefined|-০|>-0/)
  })

  it("asks for a meter when none is open", () => {
    Object.assign(meter, { activeMeterData: null, activeMeter: "" })
    const html = render()
    expect(html).toContain('data-slot="empty"')
    expect(html).toContain("<input")
    expect(headings(html)).toEqual([])
  })

  it("replaces only the daily-rate sections when there is not enough data", () => {
    meter.activeMeterData = { ...sample, rechargeHistory: [], monthlyUsage: [] }
    const html = render()
    expect(html).toContain("হিসাবের জন্য যথেষ্ট তথ্য নেই")
    expect(headings(html)).toEqual(SECTIONS.slice(2))
    expect(html).not.toMatch(/NaN|Infinity|undefined|-০|>-0/)
  })

  it("warns when the month is heading into tier 5, with the jump computed from the tariff", () => {
    meter.activeMeterData = withMonths([month("October", 450)])
    const html = render()
    expect(html).toContain("১২.৬৭")
    expect(html).toContain("৫৮%")
  })

  it("has no tier 5 warning below tier 5", () => {
    meter.activeMeterData = withMonths([month("October", 300)])
    expect(render()).not.toContain("৫৮%")
  })

  it("names the lifeline rate for very low usage", () => {
    meter.activeMeterData = withMonths([month("October", 40)])
    const html = render()
    expect(html).toContain("লাইফলাইন")
    expect(html).toContain("৪.৬৩")
  })
})

describe("analytics on the running month", () => {
  const data = withMonths([month("November", 5), month("October", 300), month("September", 200)])

  it("leaves it out of the seasonal extremes and averages", () => {
    const { seasonality } = generateAnalytics(data)
    expect(seasonality.highestMonth?.month).toBe("October")
    expect(seasonality.lowestMonth?.month).toBe("September")
    expect(seasonality.averageMonthlyKwh).toBe(250)
  })

  it("compares the last two complete months", () => {
    const analytics = generateAnalytics(data)
    expect(analytics.estimates.monthOverMonthUnitsPct).toBe(50)
    expect(analytics.insights.map((i) => i.id)).not.toContain("usage-reduced")
  })

  it("has no seasonal extremes with only the running month", () => {
    const { seasonality } = generateAnalytics(withMonths([month("November", 5)]))
    expect(seasonality.highestMonth).toBeNull()
    expect(seasonality.averageMonthlyKwh).toBe(0)
  })
})

describe("English insight text", () => {
  // ৳ (U+09F3) is the currency sign, not Bangla text
  const BANGLA = /[ঀ-৲৴-৿]/

  it.each([sample, withMonths([month("October", 390), month("September", 200)])])("contains no Bangla", (data) => {
    const analytics = generateAnalytics(data)
    for (const i of analytics.insights) {
      expect(`${i.titleEnglish} ${i.descriptionEnglish} ${i.metricEnglish ?? ""}`).not.toMatch(BANGLA)
    }
  })

  it("keeps the channel name NESCO sent", () => {
    expect(generateAnalytics(sample).rechargeStats.favoriteViaRaw).toBe("bKash")
  })
})
