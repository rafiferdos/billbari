import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { LanguageProvider } from "../src/features/i18n/language-context"
import { FEATURES, featuresByTier } from "../src/features/payments/entitlements"
import { PlanFeatures } from "../src/features/payments/plan-features"
import { PAYMENT_PLANS } from "../src/features/payments/types"

describe("payment plan bullets", () => {
  it("say only what differs between the plans", () => {
    const [monthly, lifetime] = PAYMENT_PLANS
    expect(monthly.features).toEqual(["৩০ দিনের জন্য সব প্রো ফিচার", "যেকোনো সময় আবার নবায়ন"])
    expect(lifetime.features).toEqual(["এককালীন পেমেন্ট, আজীবন সব প্রো ফিচার", "ভবিষ্যতের নতুন প্রো ফিচারও পাবেন"])
  })

  it("have an English line for every Bangla one", () => {
    for (const plan of PAYMENT_PLANS) expect(plan.featuresEnglish).toHaveLength(plan.features.length)
  })
})

describe("PlanFeatures", () => {
  const html = renderToStaticMarkup(h(LanguageProvider, { children: h(PlanFeatures) }))

  it("lists exactly the matrix: every Pro and free feature with its description", () => {
    for (const id of [...featuresByTier("pro"), ...featuresByTier("free")]) {
      expect(html).toContain(FEATURES[id].nameBn)
      expect(html).toContain(FEATURES[id].descBn)
    }
    expect(html.match(/<li/g)).toHaveLength(Object.keys(FEATURES).length)
  })

  it("puts the free list behind a collapsed trigger, after the Pro list", () => {
    expect(html).toContain('aria-expanded="false"')
    expect(html.indexOf(FEATURES.runway.nameBn)).toBeLessThan(html.indexOf("ফ্রিতে যা থাকছে"))
    expect(html.indexOf("ফ্রিতে যা থাকছে")).toBeLessThan(html.indexOf(FEATURES.balance.descBn))
  })
})
