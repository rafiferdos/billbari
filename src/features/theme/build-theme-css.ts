import {
  BASE_MODE_TOKENS,
  DEFAULT_THEME_ID,
  THEMES,
  THEME_IDS,
} from "./themes"
import type { ModeTokens, ThemeDefinition } from "./themes"

const block = (selector: string, vars: Record<string, string | number>) =>
  `${selector} {\n${Object.entries(vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n")}\n}`

// Tailwind composes box-shadow as a comma list, where a `none` item is invalid
// and would take the focus ring down with it.
const shadow = (value: string) => (value === "none" ? "0 0 #0000" : value)

function modeVars(theme: ThemeDefinition, mode: "light" | "dark") {
  const t: ModeTokens = theme[mode]
  const base = BASE_MODE_TOKENS[mode]
  const [chart2, chart3, chart4, chart5] = theme.charts
  return {
    "--background": t.background,
    "--foreground": t.foreground,
    "--card": t.card,
    "--card-foreground": t.foreground,
    "--popover": t.popover ?? t.card,
    "--popover-foreground": t.foreground,
    "--primary": t.primary,
    "--primary-foreground": t.primaryForeground,
    "--secondary": t.muted,
    "--secondary-foreground": t.foreground,
    "--muted": t.muted,
    "--muted-foreground": t.mutedForeground,
    "--accent": t.accent,
    "--accent-foreground": t.accentForeground,
    "--destructive": base.destructive,
    "--success": base.success,
    "--warning": base.warning,
    "--border": t.border,
    "--input": t.border,
    "--ring": t.primary,
    "--chart-1": t.primary,
    "--chart-2": chart2,
    "--chart-3": chart3,
    "--chart-4": chart4,
    "--chart-5": chart5,
    "--bb-page-bg": t.pageBg,
    "--bb-card-shadow": shadow(t.cardShadow),
    "--bb-control-shadow": shadow(t.controlShadow),
    "--bb-header-bg": t.headerBg,
    "--bb-header-fg": t.headerFg ?? t.foreground,
  }
}

function themeCss(theme: ThemeDefinition) {
  const { id, shape, type, space } = theme
  const isDefault = id === DEFAULT_THEME_ID
  const self = `[data-theme="${id}"]`
  const light = isDefault ? `${self}, :root:not([data-theme])` : self
  const darkSelectors = `.dark${self}, .dark ${self}`
  const dark = isDefault
    ? `${darkSelectors}, :root.dark:not([data-theme])`
    : darkSelectors

  return [
    block(light, {
      "color-scheme": "light",
      "--radius": shape.radius,
      "--bb-border-w": shape.borderW,
      "--bb-control-radius": shape.controlRadius,
      "--bb-card-backdrop": shape.cardBackdrop,
      "--bb-header-backdrop": shape.headerBackdrop,
      "--bb-font-sans": type.fontSans,
      "--bb-font-heading": type.fontHeading,
      "--bb-font-num": type.fontNum,
      "--bb-heading-weight": type.headingWeight,
      "--bb-heading-tracking": type.headingTracking,
      "--bb-container": space.container,
      "--bb-page-px": space.pagePx,
      "--bb-section-gap": space.sectionGap,
      "--bb-grid-gap": space.gridGap,
      "--bb-card-p": space.cardP,
      "--bb-control-h": space.controlH,
      "--bb-control-h-sm": space.controlHSm,
      "--bb-control-h-lg": space.controlHLg,
      "--bb-header-h": space.headerH,
      ...modeVars(theme, "light"),
    }),
    block(dark, { "color-scheme": "dark", ...modeVars(theme, "dark") }),
    // Touch targets never shrink below a comfortable size.
    `@media (pointer: coarse) {\n${block(self, {
      "--bb-control-h": `max(2.5rem, ${space.controlH})`,
      "--bb-control-h-sm": `max(2.25rem, ${space.controlHSm})`,
      "--bb-control-h-lg": `max(2.75rem, ${space.controlHLg})`,
    })}\n}`,
  ].join("\n")
}

export function buildThemeCss(themes: ThemeDefinition[]): string {
  return themes.map(themeCss).join("\n")
}

export const THEME_CSS = buildThemeCss(THEME_IDS.map((id) => THEMES[id]))
