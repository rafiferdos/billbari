import { describe, it, expect } from "vitest"
import { contrastRatio, parseOklch } from "../src/features/theme/contrast"
import {
  BASE_MODE_TOKENS,
  THEMES,
  THEME_IDS,
  resolveThemeId,
} from "../src/features/theme/themes"
import { buildThemeCss } from "../src/features/theme/build-theme-css"
import { getThemeInitScript } from "../src/features/theme/app-theme-context"

const MODES = ["light", "dark"] as const
const cases = THEME_IDS.flatMap((id) => MODES.map((mode) => [id, mode] as const))

describe("contrast math", () => {
  it("black on white is ~21:1", () =>
    expect(contrastRatio("oklch(0 0 0)", "oklch(1 0 0)")).toBeCloseTo(21, 0))
  it("parses alpha forms", () => {
    expect(parseOklch("oklch(1 0 0 / 9%)")?.alpha).toBeCloseTo(0.09)
    expect(parseOklch("oklch(0.5 0.1 120 / 0.6)")?.alpha).toBeCloseTo(0.6)
    expect(parseOklch("oklch(0.5 0.1 120)")?.alpha).toBe(1)
    expect(parseOklch("red")).toBeNull()
  })
  it("throws on a token it cannot parse", () =>
    expect(() => contrastRatio("red", "oklch(1 0 0)")).toThrow())
})

describe("theme registry", () => {
  it("has 8 unique themes in picker order", () =>
    expect(THEME_IDS).toEqual([
      "bidyut",
      "nishi",
      "khata",
      "dharalo",
      "komol",
      "console",
      "sonar",
      "aurora",
    ]))

  it.each(THEME_IDS)("%s has a Bangla family in every font stack", (id) => {
    const { fontSans, fontHeading, fontNum } = THEMES[id].type
    for (const stack of [fontSans, fontHeading, fontNum]) {
      expect(stack).toMatch(/Bengali|Bangla|Baloo Da 2/)
    }
  })

  it("resolves stored ids", () => {
    expect(resolveThemeId("komol")).toBe("komol")
    expect(resolveThemeId("garbage")).toBe("bidyut")
    expect(resolveThemeId("toString")).toBe("bidyut")
    expect(resolveThemeId(null)).toBe("bidyut")
  })

  it.each(cases)("%s %s gives translucent cards an opaque popover", (id, mode) => {
    const t = THEMES[id][mode]
    if (parseOklch(t.card)!.alpha < 1) {
      expect(t.popover).toBeDefined()
      expect(parseOklch(t.popover!)!.alpha).toBe(1)
    }
  })

  it.each(cases)("%s %s meets contrast", (id, mode) => {
    const t = THEMES[id][mode]
    const base = BASE_MODE_TOKENS[mode]
    const bg = t.background
    const headerFg = t.headerFg ?? t.foreground
    // [label, minimum, foreground, background, layer under a translucent background]
    const pairs: [string, number, string, string, string?][] = [
      ["foreground/bg", 4.5, t.foreground, bg],
      ["foreground/card", 4.5, t.foreground, t.card, bg],
      ["mutedForeground/bg", 4.5, t.mutedForeground, bg],
      ["mutedForeground/card", 4.5, t.mutedForeground, t.card, bg],
      ["mutedForeground/muted", 4.5, t.mutedForeground, t.muted, bg],
      ["primaryForeground/primary", 4.5, t.primaryForeground, t.primary],
      ["accentForeground/accent", 4.5, t.accentForeground, t.accent],
      ["headerFg/headerBg", 4.5, headerFg, t.headerBg, bg],
      ["primary/bg", 3, t.primary, bg],
      ["destructive/bg", 3, base.destructive, bg],
      ["success/bg", 3, base.success, bg],
      ["warning/bg", 3, base.warning, bg],
    ]
    const failures = pairs
      .map(([label, min, fg, back, under]) => ({
        label,
        min,
        got: Number(contrastRatio(fg, back, under).toFixed(2)),
      }))
      .filter((p) => p.got < p.min)
    expect(failures).toEqual([])
  })
})

describe("buildThemeCss", () => {
  const css = buildThemeCss(THEME_IDS.map((id) => THEMES[id]))

  it("emits every theme, its dark variant, and the default fallback", () => {
    for (const id of THEME_IDS) {
      expect(css).toContain(`[data-theme="${id}"]`)
      expect(css).toContain(`.dark[data-theme="${id}"]`)
    }
    expect(css).toContain(":root:not([data-theme])")
    expect(css).toContain(":root.dark:not([data-theme])")
    expect(css).toContain("--bb-control-h:")
    expect(css).toContain("@media (pointer: coarse)")
  })

  // A "none" inside Tailwind's composed box-shadow list would erase focus rings.
  it("never emits a bare none shadow", () => {
    expect(css).not.toMatch(/--bb-(card|control)-shadow: none;/)
    expect(css).toContain("--bb-control-shadow: 0 0 #0000;")
  })

  it("derives popover, ring and chart-1 from the mode tokens", () => {
    expect(css).toContain(`--ring: ${THEMES.bidyut.light.primary};`)
    expect(css).toContain(`--chart-1: ${THEMES.bidyut.dark.primary};`)
    expect(css).toContain(`--popover: ${THEMES.aurora.dark.popover};`)
    expect(css).toContain(`--popover: ${THEMES.bidyut.light.card};`)
  })
})

describe("theme init script", () => {
  function runInit(stored: string | null) {
    const dataset: Record<string, string> = {}
    const doc = { documentElement: { dataset } }
    const ls = {
      getItem: () => {
        if (stored === "THROW") throw new Error("blocked")
        return stored
      },
    }
    new Function("document", "localStorage", getThemeInitScript())(doc, ls)
    return dataset
  }

  it("applies a stored theme", () =>
    expect(runInit("komol")).toEqual({
      theme: "komol",
      layout: "stack",
      nav: "dock",
    }))
  it("falls back on unknown ids", () =>
    expect(runInit("emerald").theme).toBe("bidyut"))
  it("falls back on inherited object keys", () =>
    expect(runInit("toString").theme).toBe("bidyut"))
  it("applies the default with nothing stored", () =>
    expect(runInit(null).theme).toBe("bidyut"))
  it("survives blocked storage", () =>
    expect(runInit("THROW")).toEqual({
      theme: "bidyut",
      layout: "bento",
      nav: "dock",
    }))
})
