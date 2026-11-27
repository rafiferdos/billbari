import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { LanguageProvider } from "../src/features/i18n/language-context"
import { ProGate } from "../src/features/payments/pro-gate"
import type { FeatureId } from "../src/features/payments/entitlements"

const auth = vi.hoisted(() => ({
  user: null as object | null,
  isPremium: false,
  openAuthModal: () => {},
  openPricingModal: () => {},
}))
vi.mock("../src/features/auth/auth-context", () => ({ useAuth: () => auth }))

const render = (feature: FeatureId, variant?: "card" | "inline" | "section") =>
  renderToStaticMarkup(
    h(LanguageProvider, { children: h(ProGate, { feature, variant, children: h("b", null, "SECRET-1234") }) })
  )

describe.each(["card", "inline", "section"] as const)("locked ProGate (%s)", (variant) => {
  it("asks a signed-out viewer to sign in, without rendering the children", () => {
    Object.assign(auth, { user: null, isPremium: false })
    const html = render("runway", variant)
    expect(html).not.toContain("SECRET-1234")
    expect(html).toContain("কয়দিন চলবে")
    expect(html).toContain("লগইন করুন")
  })

  it("offers a signed-in free viewer the upgrade, without rendering the children", () => {
    Object.assign(auth, { user: {}, isPremium: false })
    const html = render("runway", variant)
    expect(html).not.toContain("SECRET-1234")
    expect(html).toContain("প্রো নিন")
  })
})

describe("open ProGate", () => {
  it("renders only the children for premium viewers", () => {
    Object.assign(auth, { user: {}, isPremium: true })
    expect(render("runway")).toBe("<b>SECRET-1234</b>")
  })

  it("never locks a free feature", () => {
    Object.assign(auth, { user: null, isPremium: false })
    expect(render("balance")).toBe("<b>SECRET-1234</b>")
  })
})
