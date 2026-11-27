import { describe, expect, it } from "vitest"
import { BILLBARI_FAQ, NESCO_LINK_GROUPS } from "../src/features/help/faq"
import { NESCO_LINKS } from "../src/features/help/nesco-links"

describe("help page data", () => {
  it("puts every NESCO link in exactly one group, and groups only real links", () => {
    const grouped = NESCO_LINK_GROUPS.flatMap((g) => g.linkIds)
    expect([...grouped].sort()).toEqual(NESCO_LINKS.map((l) => l.id).sort())
  })

  it("answers all six questions in both languages, with one pointing at pricing", () => {
    expect(BILLBARI_FAQ).toHaveLength(6)
    for (const item of BILLBARI_FAQ) {
      for (const text of [item.qBn, item.qEn, item.aBn, item.aEn]) expect(text.trim()).not.toBe("")
    }
    expect(BILLBARI_FAQ.filter((q) => q.pricing)).toHaveLength(1)
  })
})
