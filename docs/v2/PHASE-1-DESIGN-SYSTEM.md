# Phase 1 — Design System: theme engine, 8 themes, tokenized components

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Read
> `docs/v2/MASTER-PLAN.md` first (sections 6 and 7 apply to every step here).

**Goal:** Every visual property (palette, radius, borders, shadows, fonts, widths,
heights, spacing, layout mode, nav mode) comes from one of 8 themes chosen in an
Appearance panel, with no flash on load. Base UI components are used wherever they exist.

**Architecture:** Themes are typed data (`themes.ts`). `buildThemeCss()` turns them
into CSS custom properties, injected once in `<head>`. A tiny inline script sets
`data-theme`, `data-layout`, `data-nav` on `<html>` before paint. shadcn primitives
read `--bb-*` tokens, so every page restyles without page edits.

**Out of scope:** page redesigns (Phases 3–5). Existing pages must keep working
and pick up the tokens through the primitives.

---

## Task 1: Install dependencies and add components

**Files:** `package.json`, `pnpm-lock.yaml`, new files in `src/components/ui/`

- [x] **Step 1:** If `node_modules` is missing, run `pnpm install`. Then run `pnpm test` and `pnpm typecheck` to record the baseline (note failures that already exist in `PROGRESS.md`; do not fix unrelated ones).
- [x] **Step 2:** Add fonts:
  `pnpm add @fontsource-variable/noto-sans-bengali @fontsource-variable/noto-serif-bengali @fontsource-variable/anek-bangla @fontsource-variable/baloo-da-2 @fontsource-variable/space-grotesk @fontsource-variable/jetbrains-mono @fontsource-variable/fraunces`
  If a package does not exist, use the static `@fontsource/<name>` package instead and record the family-name difference.
- [x] **Step 3:** Confirm the exact family names: `grep -h "font-family" node_modules/@fontsource-variable/*/index.css | sort -u`. Expected names: `Noto Sans Bengali Variable`, `Noto Serif Bengali Variable`, `Anek Bangla Variable`, `Baloo Da 2 Variable`, `Space Grotesk Variable`, `JetBrains Mono Variable`, `Fraunces Variable`, `Inter Variable`. If any differ, use the real name in Task 2.
- [x] **Step 4:** Add shadcn components (style `base-rhea` → Base UI versions):
  `pnpm exec shadcn add accordion alert-dialog collapsible empty field input-group item kbd pagination scroll-area sheet spinner toggle toggle-group --yes --overwrite`
- [x] **Step 5:** Restore our customized existing primitives and stylesheet (the CLI may have overwritten them): `git checkout -- src/components/ui src/styles.css`. New untracked component files stay.
- [x] **Step 6:** Check `package.json`: no `@radix-ui/*` and no `vaul`. If one was added, `pnpm remove` it, delete the component that needed it, and wrap the Base UI primitive yourself (master plan 6.3 rule 2).
- [x] **Step 7:** `pnpm typecheck`. Expected: PASS (new components compile against our existing button/label/separator). Fix import mismatches in the new files only.
- [x] **Step 8:** Commit: `git add -A && git commit -m "chore(v2-p1): fonts and Base UI-backed shadcn components"`

---

## Task 2: Theme registry, contrast math, CSS builder

**Files:**
- Create: `src/features/theme/themes.ts`
- Create: `src/features/theme/contrast.ts`
- Create: `src/features/theme/build-theme-css.ts`
- Test: `tests/theme.test.ts`

**Interfaces (Produces):**

```ts
// themes.ts
export type ThemeId = "bidyut" | "nishi" | "khata" | "dharalo" | "komol" | "console" | "sonar" | "aurora"
export type LayoutMode = "bento" | "stack" | "split"
export type NavMode = "top" | "dock"
export interface ModeTokens {
  background: string; foreground: string
  card: string; popover?: string          // popover required (and opaque) when card has alpha
  primary: string; primaryForeground: string
  muted: string; mutedForeground: string
  accent: string; accentForeground: string
  border: string
  pageBg: string        // CSS `background` shorthand or "none"
  cardShadow: string; controlShadow: string
  headerBg: string; headerFg?: string     // headerFg defaults to foreground
}
export interface ThemeDefinition {
  id: ThemeId; nameBn: string; nameEn: string; taglineBn: string; taglineEn: string
  layout: LayoutMode; nav: NavMode
  light: ModeTokens; dark: ModeTokens
  charts: [string, string, string, string]  // --chart-2..5; --chart-1 = mode primary
  shape: { radius: string; borderW: string; controlRadius: string; cardBackdrop: string; headerBackdrop: string }
  type: { fontSans: string; fontHeading: string; fontNum: string; headingWeight: number; headingTracking: string }
  space: { container: string; pagePx: string; sectionGap: string; gridGap: string; cardP: string
           controlH: string; controlHSm: string; controlHLg: string; headerH: string }
  chart: { barRadius: number; strokeWidth: number; curve: "monotone" | "linear" | "step"; gridDash: string }
}
export const BASE_MODE_TOKENS: Record<"light" | "dark", { destructive: string; success: string; warning: string }>
export const THEMES: Record<ThemeId, ThemeDefinition>
export const THEME_IDS: ThemeId[]          // in the order below; picker order
export const DEFAULT_THEME_ID: ThemeId    // "bidyut"
export const THEME_META: Record<ThemeId, { layout: LayoutMode; nav: NavMode }>
export function resolveThemeId(stored: unknown): ThemeId   // valid id → it, else DEFAULT_THEME_ID

// contrast.ts
export function parseOklch(value: string): { l: number; c: number; h: number; alpha: number } | null
export function relativeLuminance(value: string, under?: string): number  // alpha-composited over `under`
export function contrastRatio(fg: string, bg: string, under?: string): number

// build-theme-css.ts
export function buildThemeCss(themes: ThemeDefinition[]): string
export const THEME_CSS: string   // buildThemeCss(THEME_IDS.map(id => THEMES[id])), computed once
```

### Theme values (exact; these are design decisions, copy them)

```ts
const FONT = {
  inter:   `"Inter Variable", "Noto Sans Bengali Variable", system-ui, sans-serif`,
  grotesk: `"Space Grotesk Variable", "Anek Bangla Variable", system-ui, sans-serif`,
  serif:   `"Fraunces Variable", "Noto Serif Bengali Variable", Georgia, serif`,
  baloo:   `"Baloo Da 2 Variable", system-ui, sans-serif`,
  anek:    `"Anek Bangla Variable", "Inter Variable", system-ui, sans-serif`,
  mono:    `"JetBrains Mono Variable", ui-monospace, monospace`,
}
const o = (v: string) => `oklch(${v})`   // shorthand used below

BASE_MODE_TOKENS = {
  light: { destructive: o("0.577 0.245 27.325"), success: o("0.52 0.13 150"), warning: o("0.56 0.13 65") },
  dark:  { destructive: o("0.704 0.191 22.216"), success: o("0.76 0.15 150"), warning: o("0.8 0.14 75") },
}
```

Color tokens per theme (`bg fg card pop | pri priFg | mut mutFg | acc accFg | border`), all `oklch(...)`:

| Theme | Mode | background | foreground | card | popover | primary | primaryFg | muted | mutedFg | accent | accentFg | border |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| bidyut | light | 0.985 0.004 165 | 0.21 0.02 170 | 1 0 0 | — | 0.5 0.12 165 | 0.99 0 0 | 0.955 0.008 165 | 0.48 0.02 170 | 0.94 0.035 165 | 0.3 0.06 165 | 0.91 0.01 165 |
| bidyut | dark | 0.16 0.015 170 | 0.97 0.005 165 | 0.205 0.018 170 | — | 0.76 0.14 165 | 0.17 0.03 165 | 0.25 0.018 170 | 0.72 0.02 165 | 0.29 0.045 165 | 0.95 0.02 165 | 1 0 0 / 9% |
| nishi | light | 0.97 0.012 250 | 0.2 0.03 260 | 1 0 0 | — | 0.5 0.2 258 | 0.99 0 0 | 0.94 0.015 250 | 0.47 0.03 255 | 0.93 0.04 230 | 0.3 0.08 240 | 0.87 0.025 250 |
| nishi | dark | 0.13 0.03 265 | 0.96 0.01 240 | 0.18 0.035 265 | — | 0.8 0.13 210 | 0.15 0.03 250 | 0.23 0.04 265 | 0.73 0.03 240 | 0.28 0.07 250 | 0.95 0.02 230 | 0.8 0.12 220 / 18% |
| khata | light | 0.965 0.014 85 | 0.23 0.02 60 | 0.985 0.008 85 | — | 0.45 0.13 28 | 0.98 0.01 85 | 0.93 0.016 85 | 0.46 0.03 60 | 0.92 0.03 85 | 0.3 0.04 60 | 0.83 0.02 80 |
| khata | dark | 0.2 0.012 70 | 0.92 0.02 85 | 0.235 0.014 70 | — | 0.74 0.12 40 | 0.18 0.02 60 | 0.28 0.015 70 | 0.71 0.025 80 | 0.31 0.03 60 | 0.92 0.02 85 | 0.4 0.02 70 |
| dharalo | light | 0.97 0.025 95 | 0.15 0 0 | 1 0 0 | — | 0.15 0 0 | 0.87 0.17 95 | 0.93 0.035 95 | 0.38 0.01 90 | 0.87 0.17 95 | 0.15 0 0 | 0.15 0 0 |
| dharalo | dark | 0.15 0 0 | 0.97 0.025 95 | 0.2 0 0 | — | 0.87 0.17 95 | 0.15 0 0 | 0.26 0 0 | 0.78 0.02 95 | 0.3 0.04 95 | 0.97 0.025 95 | 0.97 0.025 95 |
| komol | light | 0.975 0.014 330 | 0.28 0.05 300 | 1 0 0 | — | 0.54 0.19 300 | 0.99 0 0 | 0.95 0.022 320 | 0.5 0.05 300 | 0.94 0.045 185 | 0.32 0.06 190 | 0.91 0.03 320 |
| komol | dark | 0.2 0.04 300 | 0.96 0.02 320 | 0.25 0.05 300 | — | 0.79 0.12 310 | 0.2 0.05 300 | 0.3 0.05 300 | 0.76 0.04 310 | 0.34 0.06 190 | 0.94 0.03 190 | 0.37 0.05 300 |
| console | light | 0.965 0.004 250 | 0.2 0.012 250 | 0.995 0 0 | — | 0.53 0.14 55 | 0.99 0 0 | 0.93 0.006 250 | 0.47 0.015 250 | 0.92 0.01 250 | 0.25 0.012 250 | 0.88 0.008 250 |
| console | dark | 0.14 0.008 250 | 0.93 0.005 250 | 0.18 0.01 250 | — | 0.8 0.16 75 | 0.2 0.03 60 | 0.23 0.01 250 | 0.68 0.015 250 | 0.26 0.012 250 | 0.93 0.005 250 | 1 0 0 / 9% |
| sonar | light | 0.98 0.008 150 | 0.22 0.03 160 | 1 0 0 | — | 0.46 0.1 163 | 0.99 0 0 | 0.95 0.015 150 | 0.47 0.03 160 | 0.94 0.04 25 | 0.45 0.16 25 | 0.9 0.02 150 |
| sonar | dark | 0.17 0.025 160 | 0.96 0.01 150 | 0.21 0.03 160 | — | 0.74 0.13 160 | 0.17 0.03 160 | 0.26 0.03 160 | 0.73 0.03 150 | 0.3 0.08 25 | 0.93 0.04 25 | 1 0 0 / 10% |
| aurora | light | 0.97 0.02 300 | 0.22 0.04 290 | 1 0 0 / 0.62 | 1 0 0 | 0.52 0.21 320 | 0.99 0 0 | 0.94 0.02 300 | 0.46 0.04 290 | 0.93 0.04 200 | 0.32 0.07 220 | 0.86 0.03 300 |
| aurora | dark | 0.15 0.03 290 | 0.96 0.01 300 | 0.22 0.03 290 / 0.55 | 0.22 0.03 290 | 0.77 0.15 330 | 0.18 0.04 300 | 0.27 0.03 290 | 0.75 0.03 300 | 0.3 0.05 220 | 0.95 0.02 220 | 1 0 0 / 12% |

Decoration and depth per theme (light / dark):

| Theme | pageBg | cardShadow | controlShadow | headerBg | headerFg |
| --- | --- | --- | --- | --- | --- |
| bidyut | `none` / `none` | `0 1px 2px oklch(0 0 0 / 0.04), 0 6px 20px -8px oklch(0 0 0 / 0.08)` / `inset 0 1px 0 oklch(1 0 0 / 0.04)` | `none` / `none` | `oklch(0.985 0.004 165 / 0.8)` / `oklch(0.16 0.015 170 / 0.8)` | default |
| nishi | `none` / `radial-gradient(80rem 40rem at 50% -10%, oklch(0.45 0.15 250 / 0.35), transparent 70%)` | `0 0 0 1px oklch(0.5 0.2 258 / 0.08), 0 8px 24px -12px oklch(0.5 0.2 258 / 0.25)` / `0 0 0 1px oklch(0.8 0.13 210 / 0.12), 0 0 24px -6px oklch(0.8 0.13 210 / 0.25)` | `none` / `none` | `oklch(0.97 0.012 250 / 0.75)` / `oklch(0.13 0.03 265 / 0.7)` | default |
| khata | `repeating-linear-gradient(to bottom, transparent 0 31px, oklch(0.6 0.05 250 / 0.07) 31px 32px)` / `none` | `none` / `none` | `none` / `none` | `oklch(0.965 0.014 85)` / `oklch(0.2 0.012 70)` | default |
| dharalo | `radial-gradient(oklch(0.15 0 0 / 0.08) 1px, transparent 1px) 0 0 / 16px 16px` / `radial-gradient(oklch(0.97 0.025 95 / 0.07) 1px, transparent 1px) 0 0 / 16px 16px` | `5px 5px 0 0 oklch(0.15 0 0)` / `5px 5px 0 0 oklch(0.87 0.17 95)` | `3px 3px 0 0 oklch(0.15 0 0)` / `3px 3px 0 0 oklch(0.87 0.17 95)` | `oklch(0.97 0.025 95)` / `oklch(0.15 0 0)` | default |
| komol | `radial-gradient(40rem 30rem at 0% 0%, oklch(0.93 0.05 330 / 0.6), transparent 70%), radial-gradient(40rem 30rem at 100% 100%, oklch(0.93 0.05 190 / 0.5), transparent 70%)` / `none` | `0 12px 32px -16px oklch(0.54 0.19 300 / 0.3)` / `0 12px 32px -16px oklch(0 0 0 / 0.6)` | `none` / `none` | `oklch(0.975 0.014 330 / 0.8)` / `oklch(0.2 0.04 300 / 0.8)` | default |
| console | `none` / `none` | `none` / `none` | `none` / `none` | `oklch(0.995 0 0)` / `oklch(0.18 0.01 250)` | default |
| sonar | `linear-gradient(180deg, oklch(0.95 0.04 160 / 0.6), transparent 22rem)` / `linear-gradient(180deg, oklch(0.3 0.06 160 / 0.5), transparent 22rem)` | `0 2px 4px oklch(0.3 0.05 160 / 0.05), 0 12px 24px -12px oklch(0.3 0.05 160 / 0.15)` / `0 12px 24px -12px oklch(0 0 0 / 0.5)` | `none` / `none` | `oklch(0.46 0.1 163)` / `oklch(0.21 0.03 160)` | `oklch(0.99 0 0)` / default |
| aurora | `radial-gradient(60rem 40rem at 10% -10%, oklch(0.85 0.12 320 / 0.55), transparent 70%), radial-gradient(50rem 40rem at 100% 0%, oklch(0.86 0.1 200 / 0.5), transparent 70%), radial-gradient(40rem 30rem at 50% 110%, oklch(0.9 0.1 85 / 0.45), transparent 70%)` / same three gradients with `oklch(0.45 0.18 320 / 0.35)`, `oklch(0.45 0.14 220 / 0.3)`, `oklch(0.5 0.12 85 / 0.18)` | `0 8px 32px -12px oklch(0.3 0.1 300 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.6)` / `0 8px 32px -12px oklch(0 0 0 / 0.6), inset 0 1px 0 oklch(1 0 0 / 0.08)` | `none` / `none` | `oklch(1 0 0 / 0.5)` / `oklch(0.15 0.03 290 / 0.5)` | default |

Charts (`--chart-2..5`, both modes), shape, type, space, chart config, names:

| Theme | charts 2–5 (oklch) | radius / borderW / controlRadius | cardBackdrop / headerBackdrop | fontSans / fontHeading / fontNum, weight, tracking | container / pagePx / sectionGap / gridGap / cardP | controlH / Sm / Lg / headerH | layout / nav | chart: barRadius, strokeWidth, curve, gridDash |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| bidyut | 0.7 0.12 200 · 0.65 0.15 145 · 0.75 0.13 85 · 0.6 0.14 260 | 0.75rem / 1px / 0.625rem | none / blur(12px) | inter / inter / inter, 650, -0.01em | 72rem / clamp(1rem, 3vw, 1.5rem) / 1.5rem / 1rem / 1.25rem | 2.5rem / 2rem / 3rem / 3.5rem | bento / dock | 6, 2, monotone, "3 3" |
| nishi | 0.72 0.15 300 · 0.75 0.14 170 · 0.8 0.13 90 · 0.65 0.2 350 | 1rem / 1px / 0.75rem | none / blur(16px) | grotesk / grotesk / mono, 600, -0.02em | 80rem / clamp(1rem, 3vw, 2rem) / 1.75rem / 1.25rem / 1.25rem | 2.5rem / 2rem / 3rem / 3.75rem | bento / dock | 4, 2.5, monotone, "2 6" |
| khata | 0.55 0.06 60 · 0.6 0.1 150 · 0.62 0.1 250 · 0.7 0.12 85 | 0.25rem / 1px / 0.25rem | none / none | inter / serif / mono, 600, 0 | 52rem / clamp(1rem, 4vw, 2rem) / 1.25rem / 0.75rem / 1rem | 2.25rem / 1.875rem / 2.75rem / 3.25rem | stack / top | 0, 1.5, linear, "2 4" |
| dharalo | 0.62 0.2 25 · 0.6 0.15 250 · 0.62 0.15 150 · 0.55 0.18 300 | 0rem / 2px / 0rem | none / none | grotesk / grotesk / grotesk, 700, -0.02em | 76rem / clamp(1rem, 3vw, 2rem) / 2rem / 1.25rem / 1.25rem | 2.75rem / 2.25rem / 3.25rem / 4rem | bento / top | 0, 3, linear, "4 4" |
| komol | 0.75 0.12 190 · 0.78 0.12 350 · 0.8 0.12 85 · 0.68 0.14 260 | 1.5rem / 1px / 9999px | none / blur(12px) | baloo / baloo / baloo, 700, 0 | 46rem / clamp(1rem, 4vw, 1.5rem) / 2rem / 1.25rem / 1.5rem | 3rem / 2.5rem / 3.5rem / 4rem | stack / dock | 12, 3, monotone, "1 6" |
| console | 0.65 0.13 250 · 0.7 0.14 160 · 0.65 0.18 20 · 0.72 0.1 300 | 0.375rem / 1px / 0.3rem | none / none | inter / inter / mono, 600, 0 | 96rem / clamp(0.75rem, 2vw, 1.5rem) / 1rem / 0.75rem / 0.875rem | 2rem / 1.75rem / 2.5rem / 3rem | split / top | 2, 1.5, linear, "2 2" |
| sonar | 0.63 0.2 25 · 0.78 0.14 85 · 0.62 0.1 200 · 0.55 0.08 140 | 0.875rem / 1px / 0.625rem | none / none | inter / anek / inter, 650, -0.01em | 72rem / clamp(1rem, 3vw, 1.75rem) / 1.5rem / 1rem / 1.25rem | 2.5rem / 2.125rem / 3rem / 3.75rem | split / dock | 8, 2, monotone, "3 3" |
| aurora | 0.72 0.13 200 · 0.8 0.13 85 · 0.68 0.16 280 · 0.72 0.15 150 | 1.25rem / 1px / 0.875rem | blur(18px) saturate(1.4) / blur(18px) saturate(1.4) | inter / grotesk / inter, 600, -0.02em | 76rem / clamp(1rem, 3vw, 2rem) / 1.75rem / 1.25rem / 1.375rem | 2.625rem / 2.125rem / 3.125rem / 3.75rem | bento / top | 10, 2.5, monotone, "3 6" |

Names and taglines:

| id | nameBn | nameEn | taglineBn | taglineEn |
| --- | --- | --- | --- | --- |
| bidyut | বিদ্যুৎ | Bidyut | পরিষ্কার, সতেজ, প্রতিদিনের জন্য | Clean and fresh, for every day |
| nishi | নিশি | Night Grid | নিয়ন আলোয় রাতের ড্যাশবোর্ড | A neon dashboard for the night |
| khata | খাতা | Ledger | কাগজ-কালির হিসাবের খাতা | Paper-and-ink account book |
| dharalo | ধারালো | Brutal | মোটা দাগ, স্পষ্ট সংখ্যা | Bold lines, loud numbers |
| komol | কোমল | Soft | নরম রং, বড় বোতাম | Soft colors, big buttons |
| console | কনসোল | Console | বেশি তথ্য, কম জায়গায় | More data, less space |
| sonar | সোনার বাংলা | Sonar Bangla | লাল-সবুজের দেশি ছোঁয়া | Red and green, made at home |
| aurora | অরোরা | Aurora | কাঁচের কার্ড, রঙিন আকাশ | Glass cards, colorful sky |

### Steps

- [x] **Step 1: Write failing tests** in `tests/theme.test.ts`:

```ts
describe("contrast math", () => {
  it("black on white is ~21:1", () => expect(contrastRatio("oklch(0 0 0)", "oklch(1 0 0)")).toBeCloseTo(21, 0))
  it("parses alpha forms", () => {
    expect(parseOklch("oklch(1 0 0 / 9%)")?.alpha).toBeCloseTo(0.09)
    expect(parseOklch("oklch(0.5 0.1 120 / 0.6)")?.alpha).toBeCloseTo(0.6)
    expect(parseOklch("oklch(0.5 0.1 120)")?.alpha).toBe(1)
    expect(parseOklch("red")).toBeNull()
  })
})
describe("theme registry", () => {
  it("has 8 unique themes in picker order", () => expect(THEME_IDS).toEqual(["bidyut","nishi","khata","dharalo","komol","console","sonar","aurora"]))
  it("resolves stored ids", () => {
    expect(resolveThemeId("komol")).toBe("komol")
    expect(resolveThemeId("garbage")).toBe("bidyut")
    expect(resolveThemeId(null)).toBe("bidyut")
  })
  it("gives translucent cards an opaque popover", () => { /* for each theme/mode: if parseOklch(card).alpha < 1 then popover defined and alpha === 1 */ })
  // it.each over THEME_IDS × ["light","dark"]:
  it.each(cases)("%s %s meets contrast", (id, mode) => {
    // let bg = t.background, card = t.card (composited over bg via `under`)
    // ≥ 4.5: foreground/bg, foreground/card, mutedForeground/bg, mutedForeground/card,
    //        mutedForeground/muted, primaryForeground/primary, accentForeground/accent,
    //        (headerFg ?? foreground)/headerBg (under bg)
    // ≥ 3:   primary/bg, destructive/bg, success/bg, warning/bg (BASE_MODE_TOKENS)
  })
})
describe("buildThemeCss", () => {
  it("emits every theme, its dark variant, and the default fallback", () => {
    const css = buildThemeCss(THEME_IDS.map((id) => THEMES[id]))
    for (const id of THEME_IDS) {
      expect(css).toContain(`[data-theme="${id}"]`)
      expect(css).toContain(`.dark[data-theme="${id}"]`)
    }
    expect(css).toContain(":root:not([data-theme])")
    expect(css).toContain("--bb-control-h:")
    expect(css).toContain("@media (pointer: coarse)")
  })
})
```

- [x] **Step 2:** `pnpm test tests/theme.test.ts` → FAIL (modules missing).
- [x] **Step 3: Implement `contrast.ts`.** Algorithm (OKLCH → linear sRGB → WCAG luminance), not determined by the signature:

```
a = c·cos(h°), b = c·sin(h°)
l_ = L + 0.3963377774a + 0.2158037573b ; m_ = L − 0.1055613458a − 0.0638541728b ; s_ = L − 0.0894841775a − 1.2914855480b
l = l_³, m = m_³, s = s_³
R =  4.0767416621l − 3.3077115913m + 0.2309699292s
G = −1.2684380046l + 2.6097574011m − 0.3413193965s
B = −0.0041960863l − 0.7034186147m + 1.7076147010s     (clamp each to [0,1]; already linear)
Y = 0.2126R + 0.7152G + 0.0722B
alpha < 1 with `under`: Y = alpha·Y + (1 − alpha)·relativeLuminance(under)
contrast = (max(Y1,Y2) + 0.05) / (min(Y1,Y2) + 0.05)
```
  `parseOklch` accepts `oklch(L C H)` and `oklch(L C H / A)` where A is a number or a percentage. Anything else returns `null`; `relativeLuminance` throws on `null` (a typo in a token must fail the test).
- [x] **Step 4: Implement `themes.ts`** with the values above (store full `oklch(...)` strings). `THEME_META` is derived from `THEMES`.
- [x] **Step 5: Implement `build-theme-css.ts`.** For each theme emit:
  - `[data-theme="id"]` (default theme also `:root:not([data-theme])`): `color-scheme: light`, `--radius`, `--bb-border-w`, `--bb-control-radius`, `--bb-card-backdrop`, `--bb-header-backdrop`, `--bb-font-sans`, `--bb-font-heading`, `--bb-font-num`, `--bb-heading-weight`, `--bb-heading-tracking`, `--bb-container`, `--bb-page-px`, `--bb-section-gap`, `--bb-grid-gap`, `--bb-card-p`, `--bb-control-h`, `--bb-control-h-sm`, `--bb-control-h-lg`, `--bb-header-h`, then light mode color tokens.
  - `.dark[data-theme="id"], .dark [data-theme="id"]` (default theme also `:root.dark:not([data-theme])`): `color-scheme: dark` + dark mode color tokens.
  - `@media (pointer: coarse) { [data-theme="id"] { --bb-control-h: max(2.5rem, <controlH>); --bb-control-h-sm: max(2.25rem, <controlHSm>); --bb-control-h-lg: max(2.75rem, <controlHLg>) } }`
  - Mode color tokens emitted: `--background --foreground --card --card-foreground(=foreground) --popover(=popover ?? card) --popover-foreground(=foreground) --primary --primary-foreground --secondary(=muted) --secondary-foreground(=foreground) --muted --muted-foreground --accent --accent-foreground --destructive --success --warning (BASE_MODE_TOKENS) --border --input(=border) --ring(=primary) --chart-1(=primary) --chart-2..5(=charts) --bb-page-bg --bb-card-shadow --bb-control-shadow --bb-header-bg --bb-header-fg(=headerFg ?? foreground)`.
- [x] **Step 6:** `pnpm test tests/theme.test.ts` → PASS. If a contrast case fails, adjust only the failing token's lightness (L) by the smallest step that passes, and record the change in `PROGRESS.md`.
- [x] **Step 7:** Commit: `feat(v2-p1): theme registry, contrast checks, css builder`

---

## Task 3: Stylesheet — token mapping, utilities, variants

**Files:** Modify `src/styles.css`

- [ ] **Step 1:** `grep -rn "sidebar" src --include=*.tsx` — if no app usage, delete all `--sidebar*` lines.
- [ ] **Step 2:** Rewrite `src/styles.css`:
  - Keep imports; add one `@import "@fontsource-variable/<pkg>";` per font package from Task 1.
  - Keep `@custom-variant dark`. Add:
    `@custom-variant layout-bento (&:where([data-layout="bento"], [data-layout="bento"] *));` and the same for `layout-stack`, `layout-split` (attribute `data-layout`), `nav-dock`, `nav-top` (attribute `data-nav`).
  - `@theme inline`: keep the color and radius mappings; add `--color-success: var(--success); --color-warning: var(--warning); --font-sans: var(--bb-font-sans); --font-heading: var(--bb-font-heading); --font-num: var(--bb-font-num); --shadow-card: var(--bb-card-shadow); --shadow-control: var(--bb-control-shadow);`
  - Delete the old `:root { … }` and `.dark { … }` color blocks and every `html[data-color-theme=…]` block (the generated CSS replaces them).
  - Utilities:
    ```css
    @utility page-shell { width: 100%; max-width: var(--bb-container); margin-inline: auto; padding-inline: var(--bb-page-px); }
    @utility surface-card { background-color: var(--card); color: var(--card-foreground); border: var(--bb-border-w) solid var(--border); border-radius: min(calc(var(--radius) * 1.4), 2rem); box-shadow: var(--bb-card-shadow); backdrop-filter: var(--bb-card-backdrop); -webkit-backdrop-filter: var(--bb-card-backdrop); }
    @utility section-stack { display: flex; flex-direction: column; gap: var(--bb-section-gap); }
    @utility num { font-family: var(--bb-font-num); font-variant-numeric: tabular-nums; }
    ```
  - `@layer base`: keep existing rules; `body` gets `background-color: var(--background)`; add
    `body::before { content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none; background: var(--bb-page-bg); }`
    `h1, h2, h3, h4, [data-slot="card-title"], [data-slot="dialog-title"], [data-slot="sheet-title"] { font-family: var(--bb-font-heading); font-weight: var(--bb-heading-weight); letter-spacing: var(--bb-heading-tracking); }`
    `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; } }`
    Print (used from Phase 3): `@media print { body::before { display: none } body:has([data-print-root]) * { visibility: hidden } [data-print-root], [data-print-root] * { visibility: visible } [data-print-root] { position: absolute; inset: 0 auto auto 0; width: 100% } }`
- [ ] **Step 3:** `pnpm build` → PASS (Tailwind accepts the variants and utilities).
- [ ] **Step 4:** Commit: `feat(v2-p1): token-driven stylesheet`

---

## Task 4: Theme provider, no-flash init script, root wiring

**Files:**
- Create: `src/features/theme/app-theme-context.tsx`
- Modify: `src/routes/__root.tsx`
- Delete (after Task 7 removes its last user): `src/features/theme/color-theme-context.tsx`
- Test: `tests/theme.test.ts` (append)

**Interfaces (Produces):**
```ts
export const THEME_STORAGE_KEY = "billbari_theme"
export function getThemeInitScript(): string        // IIFE source; embeds JSON of THEME_META + DEFAULT_THEME_ID
export function AppThemeProvider(props: { children: React.ReactNode }): React.JSX.Element
export function useAppTheme(): { themeId: ThemeId; theme: ThemeDefinition; setThemeId: (id: ThemeId) => void }
```

- [ ] **Step 1: Failing tests** (run the script against fakes):

```ts
function runInit(stored: string | null | "THROW") {
  const dataset: Record<string, string> = {}
  const doc = { documentElement: { dataset } }
  const ls = { getItem: () => { if (stored === "THROW") throw new Error("blocked"); return stored } }
  new Function("document", "localStorage", getThemeInitScript())(doc, ls)
  return dataset
}
it("init script applies a stored theme", () => expect(runInit("komol")).toEqual({ theme: "komol", layout: "stack", nav: "dock" }))
it("init script falls back on unknown ids", () => expect(runInit("emerald").theme).toBe("bidyut"))
it("init script survives blocked storage", () => expect(runInit("THROW")).toEqual({ theme: "bidyut", layout: "bento", nav: "dock" }))
```
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. The script only reads `localStorage.getItem(THEME_STORAGE_KEY)` and writes `document.documentElement.dataset.{theme,layout,nav}`; everything inside `try/catch`, the catch applies the default.
  `AppThemeProvider`: state starts at `DEFAULT_THEME_ID`; on mount read `document.documentElement.dataset.theme` through `resolveThemeId`. `setThemeId` updates state, writes the three dataset values, and writes storage in `try/catch`.
- [ ] **Step 4:** In `__root.tsx`:
  - Replace `ColorThemeProvider` with `AppThemeProvider` (same position in the tree).
  - In `<head>`, before `<HeadContent />`: `<script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />` and `<style id="bb-themes" dangerouslySetInnerHTML={{ __html: THEME_CSS }} />`.
  - `<html>` gets SSR defaults `data-theme="bidyut" data-layout="bento" data-nav="dock"` (keep `suppressHydrationWarning`).
  - Remove `bg-background` from the full-page wrapper `div`, because it would hide the `body::before` decoration layer.
- [ ] **Step 5:** `pnpm test && pnpm typecheck` → PASS. Commit: `feat(v2-p1): app theme provider with pre-paint init`

---

## Task 5: Tokenize the primitives

**Files:** Modify `src/components/ui/{button,input,select,tabs,card,dialog,badge,sheet,toggle,toggle-group,input-group}.tsx`

Rules (Tailwind v4 syntax shown). Radius classes like `rounded-lg/xl/2xl` already scale with `--radius`. Leave them unless listed.

- [ ] **button.tsx:** base `rounded-2xl` → `rounded-(--bb-control-radius)`; `border` → `border-(length:--bb-border-w)`; add `shadow-control` to `default`, `outline`, `secondary`, `destructive` variants only. Sizes: `default` → `h-(--bb-control-h)`, `xs` → `h-[calc(var(--bb-control-h-sm)*0.8)]`, `sm` → `h-(--bb-control-h-sm)`, `lg` → `h-(--bb-control-h-lg)`, `icon` → `size-(--bb-control-h)`, `icon-xs` → `size-[calc(var(--bb-control-h-sm)*0.8)]`, `icon-sm` → `size-(--bb-control-h-sm)`, `icon-lg` → `size-(--bb-control-h-lg)`. Keep paddings and gaps.
- [ ] **input.tsx, select.tsx (`SelectTrigger`), input-group.tsx, toggle.tsx:** fixed `h-*` → `h-(--bb-control-h)` (their `sm` size → `h-(--bb-control-h-sm)`); radius → `rounded-(--bb-control-radius)`; border width → `border-(length:--bb-border-w)`.
- [ ] **tabs.tsx:** `TabsList` height → `h-(--bb-control-h)`, radius → `rounded-(--bb-control-radius)`; `TabsTrigger` radius → `rounded-[calc(var(--bb-control-radius)*0.8)]`.
- [ ] **card.tsx (`Card` only):** replace `rounded-[min(var(--radius-4xl),24px)] bg-card … shadow-sm ring-1 ring-foreground/5 … dark:ring-foreground/10 [--card-spacing:--spacing(5)] data-[size=sm]:[--card-spacing:--spacing(4)]` with `surface-card [--card-spacing:var(--bb-card-p)] data-[size=sm]:[--card-spacing:calc(var(--bb-card-p)*0.75)]`. Keep every other class (gap, padding via `--card-spacing`, image rules; image corner radius → `min(calc(var(--radius)*1.4),2rem)`). In `CardHeader`, the corner radius follows the same value.
- [ ] **dialog.tsx, sheet.tsx (content):** add `border-(length:--bb-border-w) shadow-card`, replacing any fixed `shadow-*`/`ring-*` on the content element.
- [ ] **badge.tsx:** radius → `rounded-(--bb-control-radius)`.
- [ ] `pnpm typecheck && pnpm build` → PASS. Commit: `feat(v2-p1): primitives read theme tokens`

---

## Task 6: Base UI wrappers — Meter, NumberField, Toast (replaces sonner)

**Files:**
- Create: `src/components/ui/meter.tsx`, `src/components/ui/number-field.tsx`, `src/components/ui/toast.tsx`
- Modify: every file importing `sonner` (today: `src/features/auth/auth-context.tsx`, `src/features/meter/{alert-threshold-dialog,meter-context,saved-meters-menu}.tsx`, `src/features/payments/pricing-dialog.tsx`, `src/features/snapshots/{snapshot-dialog,snapshot-history}.tsx`, `src/routes/{history,index,snapshots}.tsx`, `src/routes/__root.tsx`)
- Delete: `src/components/ui/sonner.tsx`; `pnpm remove sonner`

Read the type definitions in `node_modules/@base-ui/react/{meter,number-field,toast}` before writing. Part names below are what we expect. If they differ, follow the real API.

**Interfaces (Produces):**
```ts
// meter.tsx — Base UI Meter (Root, Label, Track, Indicator, Value)
export function Meter(props: { value: number; min?: number; max?: number; label?: React.ReactNode; showValue?: boolean;
  tone?: "default" | "success" | "warning" | "destructive"; className?: string }): React.JSX.Element
// number-field.tsx — Base UI NumberField (Root, Group, Decrement, Input, Increment)
export function NumberField(props: { id?: string; value?: number | null; defaultValue?: number; onValueChange?: (v: number | null) => void;
  min?: number; max?: number; step?: number; format?: Intl.NumberFormatOptions; locale?: string; disabled?: boolean;
  "aria-label"?: string; className?: string }): React.JSX.Element
// toast.tsx — Base UI Toast with a module-level manager (callable outside React, like sonner)
export type ToastOptions = { description?: string; duration?: number }
export const toast: { success(t: string, o?: ToastOptions): string; error(...): string; info(...): string; warning(...): string; message(...): string }
export function Toaster(): React.JSX.Element
```

- [ ] **Step 1:** `grep -rn "toast\.\w\+(" src` and list every method and option in use. The wrapper must support all of them. If `toast.promise` or `toast.loading` is used, implement them with the manager's equivalent (`promise`, or `add` + `update`).
- [ ] **Step 2:** Implement `meter.tsx`. Track `h-2 rounded-full bg-muted`. Indicator color per tone: `bg-primary`, `bg-success`, `bg-warning`, `bg-destructive`. Optional label row with `num` value.
- [ ] **Step 3:** Implement `number-field.tsx`. The Group has the same height/radius/border tokens as `input.tsx`. Decrement/Increment are icon buttons (`Minus`/`Plus` from lucide) sized `size-(--bb-control-h)`. The Input is centered with the `num` class.
- [ ] **Step 4:** Implement `toast.tsx`. Use `Toast.createToastManager()` at module scope. `Toaster` = `Toast.Provider` + `Toast.Portal` + `Toast.Viewport` + list from `Toast.useToastManager()`. Each toast is a `surface-card` with icon by type (CheckCircle2/XCircle/Info/AlertTriangle), title, description, and a close button. Viewport position: bottom-center on mobile with `bottom: calc(5rem + env(safe-area-inset-bottom))` under `nav-dock`, `1rem` otherwise; bottom-right on `md+`. Default timeout 4000 ms.
- [ ] **Step 5:** Swap imports `from "sonner"` → `from "@/components/ui/toast"`. Replace the sonner `<Toaster />` in `__root.tsx` with ours. Delete `sonner.tsx` and `pnpm remove sonner`.
- [ ] **Step 6:** `pnpm typecheck && pnpm lint && pnpm build` → PASS. Manual: run the app and trigger one success and one error toast (for example, an invalid meter number search). Commit: `feat(v2-p1): Base UI meter, number field and toast`

---

## Task 7: Appearance panel (theme + mode picker)

**Files:**
- Create: `src/hooks/use-media-query.ts`, `src/features/theme/appearance-sheet.tsx`, `src/features/theme/theme-preview-tile.tsx`
- Modify: `src/components/navbar.tsx`, `src/features/i18n/translations.ts`
- Delete: `src/components/color-theme-toggle.tsx`, `src/components/theme-toggle.tsx` (if no other user), `src/features/theme/color-theme-context.tsx`

**Interfaces (Produces):**
```ts
export function useMediaQuery(query: string): boolean   // useSyncExternalStore + matchMedia; server snapshot false
export function AppearanceSheet(): React.JSX.Element      // trigger button + Sheet
export function ThemePreviewTile(props: { theme: ThemeDefinition }): React.JSX.Element  // visual only, no interactivity
```

- [ ] **Step 1:** Translations (`bn`/`en`) under a new `appearance` key: `title` (চেহারা / Appearance), `open` (চেহারা ও থিম বদলান / Change appearance), `mode` (মোড / Mode), `light` (লাইট / Light), `dark` (ডার্ক / Dark), `system` (সিস্টেম / System), `theme` (থিম / Theme), `layout` labels `bento` (বেন্টো গ্রিড / Bento grid), `stack` (এক কলাম / Single column), `split` (দুই প্যানেল / Two panels), `nav` labels `dock` (নিচে ডক / Bottom dock), `top` (উপরে মেনু / Top menu).
- [ ] **Step 2:** `ThemePreviewTile`: root `<div data-theme={theme.id} className="bg-background text-foreground font-sans pointer-events-none …">`. It must set `font-sans`/colors itself, because custom properties resolve per element. Inside: a header strip (`background: var(--bb-header-bg)`), one `surface-card` with "৳১,২৪০" in `num font-bold`, a primary pill using `rounded-(--bb-control-radius) bg-primary text-primary-foreground shadow-control`, and a muted line. Height ~7rem. The dark class on `<html>` applies automatically through the `.dark [data-theme]` selector.
- [ ] **Step 3:** `AppearanceSheet`: trigger `Button variant="ghost" size="icon"` with `Palette` icon and `aria-label={t.appearance.open}`. `Sheet` side = `useMediaQuery("(min-width: 768px)") ? "right" : "bottom"`, bottom sheet `max-h-[85dvh] overflow-y-auto`.
  Content:
  - Mode: `ToggleGroup` single-select bound to `next-themes` `useTheme()` (`light`/`dark`/`system`, icons Sun/Moon/Monitor).
  - Theme: `ToggleGroup` single-select, `grid grid-cols-2 gap-3`, value = `themeId`. Each `ToggleGroupItem` is `h-auto p-0 flex-col items-stretch` and contains `ThemePreviewTile`, then the name (`nameBn`/`nameEn` by language), the tagline, and two small `Badge`s for layout and nav.
  - Selecting calls `setThemeId` immediately (no Apply button).
- [ ] **Step 4:** In `navbar.tsx`, replace `<ColorThemeToggle />` and the dark-mode `<ThemeToggle />` with `<AppearanceSheet />`. Delete the old files and `color-theme-context.tsx`. `grep -rn "color-theme\|ColorTheme\|data-color-theme" src` → no results.
- [ ] **Step 5:** `pnpm typecheck && pnpm lint && pnpm build` → PASS. Commit: `feat(v2-p1): appearance sheet with 8 themes`

---

## Task 8: Theme-token lint (shrinking baseline)

**Files:** Create `scripts/check-theme-tokens.mjs`, `scripts/theme-token-baseline.json`; modify `package.json`

- [ ] **Step 1:** The script scans `src/routes`, `src/features`, `src/components` (excluding `src/components/ui`), files `.ts`/`.tsx`, and counts per file:
  - palette classes: `/\b(?:bg|text|border|ring|from|to|via|fill|stroke|outline|decoration|divide|placeholder|caret|shadow|accent)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g`
  - fixed shadows: `/\bshadow-(?:2xs|xs|sm|md|lg|xl|2xl)\b/g`
  - quoted hex colors: `/["'`]#[0-9a-fA-F]{3,8}["'`]/g`
  With `--write-baseline` it writes `{ "<posix relpath>": count }` (only counts > 0). Without it, it fails (exit 1) when a file's count exceeds its baseline (missing = 0), and prints a line per file whose count dropped ("lower the baseline").
- [ ] **Step 2:** `package.json` scripts: `"check:tokens": "node scripts/check-theme-tokens.mjs"`, and `lint` becomes `eslint && node scripts/check-shadcn-controls.mjs && node scripts/check-theme-tokens.mjs`.
- [ ] **Step 3:** `node scripts/check-theme-tokens.mjs --write-baseline`, then `pnpm lint` → PASS. Write the total count in `PROGRESS.md` (Phases 3–5 drive it to 0).
- [ ] **Step 4:** Commit: `chore(v2-p1): theme-token lint with baseline`

---

## Task 9: Visual verification and handoff

- [ ] **Step 1:** If `.claude/launch.json` is missing, create it with one configuration `{ "name": "billbari-dev", "runtimeExecutable": "pnpm", "runtimeArgs": ["dev"], "port": 3000 }`. Start it with the browser preview tool.
- [ ] **Step 2:** For each of the 8 themes × light/dark (switch via the Appearance sheet), load `/` and `/tariffs` at 360px and 1280px widths. Check: no flash of the default theme on reload; cards, buttons, and inputs follow radius/border/shadow/height; fonts change (Bangla text renders in the Bangla family); `khata` shows ruled lines, `dharalo` shows hard shadows, `aurora` shows glass cards over the gradient; no console errors or hydration warnings.
- [ ] **Step 3:** Fix what is broken in primitives only. Page-level hardcoded styles are expected to look off until Phases 3–5; list the worst offenders in `PROGRESS.md`.
- [ ] **Step 4:** `pnpm typecheck && pnpm test && pnpm lint && pnpm build` → all PASS.
- [ ] **Step 5:** Update `docs/v2/PROGRESS.md` (Phase 1 → done, deviations, token-lint baseline total, anything Phase 2 must know). Commit: `docs(v2-p1): progress`.

## Exit criteria

- 8 themes selectable; choice persists; no flash; contrast test green for all 16 theme-modes.
- `sonner` removed; toasts work through Base UI.
- No `@radix-ui/*` or `vaul` in `package.json`.
- `pnpm typecheck && pnpm test && pnpm lint && pnpm build` green.
