import { describe, expect, it } from "vitest"
import { DOCK_ITEM_COUNT, NAV_ITEMS } from "../src/components/nav-items"
import { EKPAY_RECHARGE_URL, NESCO_LINKS } from "../src/features/help/nesco-links"
import { translations } from "../src/features/i18n/translations"

describe("nav items", () => {
  it("are ordered home, history, insights, tools, tracking, help", () => {
    expect(NAV_ITEMS.map((i) => i.to)).toEqual(["/", "/history", "/insights", "/tariffs", "/snapshots", "/help"])
    expect(NAV_ITEMS.filter((i) => i.pro).map((i) => i.to)).toEqual(["/insights", "/snapshots"])
    expect(DOCK_ITEM_COUNT).toBe(4)
  })

  it("have a label in both languages", () => {
    for (const { labelKey } of NAV_ITEMS) {
      expect(translations.bn.nav[labelKey]).toBeTruthy()
      expect(translations.en.nav[labelKey]).toBeTruthy()
    }
  })
})

describe("NESCO links", () => {
  it("lists the 14 services over https with unique ids and both languages", () => {
    expect(NESCO_LINKS).toHaveLength(14)
    expect(new Set(NESCO_LINKS.map((l) => l.id)).size).toBe(14)
    for (const link of NESCO_LINKS) {
      expect(link.href).toMatch(/^https:\/\//)
      expect(link.nameBn && link.nameEn && link.descBn && link.descEn).toBeTruthy()
    }
    expect(NESCO_LINKS[0]).toMatchObject({ id: "recharge", href: EKPAY_RECHARGE_URL })
  })
})
