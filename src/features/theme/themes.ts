// Themes are data. buildThemeCss() turns them into CSS custom properties.

export type ThemeId =
  | "bidyut"
  | "nishi"
  | "khata"
  | "dharalo"
  | "komol"
  | "console"
  | "sonar"
  | "aurora"
export type LayoutMode = "bento" | "stack" | "split"
export type NavMode = "top" | "dock"

export interface ModeTokens {
  background: string
  foreground: string
  card: string
  /** Required, and opaque, when `card` has alpha. */
  popover?: string
  primary: string
  primaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  border: string
  /** CSS `background` shorthand, or "none". */
  pageBg: string
  cardShadow: string
  controlShadow: string
  headerBg: string
  /** Defaults to `foreground`. */
  headerFg?: string
}

export interface ThemeDefinition {
  id: ThemeId
  nameBn: string
  nameEn: string
  taglineBn: string
  taglineEn: string
  layout: LayoutMode
  nav: NavMode
  light: ModeTokens
  dark: ModeTokens
  /** --chart-2..5; --chart-1 is the mode's primary. */
  charts: [string, string, string, string]
  shape: {
    radius: string
    borderW: string
    controlRadius: string
    cardBackdrop: string
    headerBackdrop: string
  }
  type: {
    fontSans: string
    fontHeading: string
    fontNum: string
    headingWeight: number
    headingTracking: string
  }
  space: {
    container: string
    pagePx: string
    sectionGap: string
    gridGap: string
    cardP: string
    controlH: string
    controlHSm: string
    controlHLg: string
    headerH: string
  }
  chart: {
    barRadius: number
    strokeWidth: number
    curve: "monotone" | "linear" | "step"
    gridDash: string
  }
}

const FONT = {
  inter: `"Inter Variable", "Noto Sans Bengali Variable", system-ui, sans-serif`,
  grotesk: `"Space Grotesk Variable", "Anek Bangla Variable", system-ui, sans-serif`,
  serif: `"Fraunces Variable", "Noto Serif Bengali Variable", Georgia, serif`,
  baloo: `"Baloo Da 2 Variable", system-ui, sans-serif`,
  anek: `"Anek Bangla Variable", "Inter Variable", system-ui, sans-serif`,
  mono: `"JetBrains Mono Variable", ui-monospace, monospace`,
}

const o = (v: string) => `oklch(${v})`

export const BASE_MODE_TOKENS: Record<
  "light" | "dark",
  { destructive: string; success: string; warning: string }
> = {
  light: {
    destructive: o("0.577 0.245 27.325"),
    success: o("0.52 0.13 150"),
    warning: o("0.56 0.13 65"),
  },
  dark: {
    destructive: o("0.704 0.191 22.216"),
    success: o("0.76 0.15 150"),
    warning: o("0.8 0.14 75"),
  },
}

// background | foreground | card | primary | primaryFg | muted | mutedFg | accent | accentFg | border
type Colors = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
]

type Deco = Pick<
  ModeTokens,
  "pageBg" | "cardShadow" | "controlShadow" | "headerBg" | "headerFg" | "popover"
>

function mode(colors: Colors, deco: Deco): ModeTokens {
  const [bg, fg, card, pri, priFg, mut, mutFg, acc, accFg, border] =
    colors.map(o)
  return {
    background: bg,
    foreground: fg,
    card,
    primary: pri,
    primaryForeground: priFg,
    muted: mut,
    mutedForeground: mutFg,
    accent: acc,
    accentForeground: accFg,
    border,
    ...deco,
  }
}

const auroraPageBg = (a: string, b: string, c: string) =>
  `radial-gradient(60rem 40rem at 10% -10%, ${o(a)}, transparent 70%), radial-gradient(50rem 40rem at 100% 0%, ${o(b)}, transparent 70%), radial-gradient(40rem 30rem at 50% 110%, ${o(c)}, transparent 70%)`

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  bidyut: {
    id: "bidyut",
    nameBn: "বিদ্যুৎ",
    nameEn: "Bidyut",
    taglineBn: "পরিষ্কার, সতেজ, প্রতিদিনের জন্য",
    taglineEn: "Clean and fresh, for every day",
    layout: "bento",
    nav: "dock",
    light: mode(
      ["0.985 0.004 165", "0.21 0.02 170", "1 0 0", "0.5 0.12 165", "0.99 0 0", "0.955 0.008 165", "0.48 0.02 170", "0.94 0.035 165", "0.3 0.06 165", "0.91 0.01 165"],
      {
        pageBg: "none",
        cardShadow: "0 1px 2px oklch(0 0 0 / 0.04), 0 6px 20px -8px oklch(0 0 0 / 0.08)",
        controlShadow: "none",
        headerBg: o("0.985 0.004 165 / 0.8"),
      }
    ),
    dark: mode(
      ["0.16 0.015 170", "0.97 0.005 165", "0.205 0.018 170", "0.76 0.14 165", "0.17 0.03 165", "0.25 0.018 170", "0.72 0.02 165", "0.29 0.045 165", "0.95 0.02 165", "1 0 0 / 9%"],
      {
        pageBg: "none",
        cardShadow: "inset 0 1px 0 oklch(1 0 0 / 0.04)",
        controlShadow: "none",
        headerBg: o("0.16 0.015 170 / 0.8"),
      }
    ),
    charts: [o("0.7 0.12 200"), o("0.65 0.15 145"), o("0.75 0.13 85"), o("0.6 0.14 260")],
    shape: { radius: "0.75rem", borderW: "1px", controlRadius: "0.625rem", cardBackdrop: "none", headerBackdrop: "blur(12px)" },
    type: { fontSans: FONT.inter, fontHeading: FONT.inter, fontNum: FONT.inter, headingWeight: 650, headingTracking: "-0.01em" },
    space: { container: "72rem", pagePx: "clamp(1rem, 3vw, 1.5rem)", sectionGap: "1.5rem", gridGap: "1rem", cardP: "1.25rem", controlH: "2.5rem", controlHSm: "2rem", controlHLg: "3rem", headerH: "3.5rem" },
    chart: { barRadius: 6, strokeWidth: 2, curve: "monotone", gridDash: "3 3" },
  },

  nishi: {
    id: "nishi",
    nameBn: "নিশি",
    nameEn: "Night Grid",
    taglineBn: "নিয়ন আলোয় রাতের ড্যাশবোর্ড",
    taglineEn: "A neon dashboard for the night",
    layout: "bento",
    nav: "dock",
    light: mode(
      ["0.97 0.012 250", "0.2 0.03 260", "1 0 0", "0.5 0.2 258", "0.99 0 0", "0.94 0.015 250", "0.47 0.03 255", "0.93 0.04 230", "0.3 0.08 240", "0.87 0.025 250"],
      {
        pageBg: "none",
        cardShadow: "0 0 0 1px oklch(0.5 0.2 258 / 0.08), 0 8px 24px -12px oklch(0.5 0.2 258 / 0.25)",
        controlShadow: "none",
        headerBg: o("0.97 0.012 250 / 0.75"),
      }
    ),
    dark: mode(
      ["0.13 0.03 265", "0.96 0.01 240", "0.18 0.035 265", "0.8 0.13 210", "0.15 0.03 250", "0.23 0.04 265", "0.73 0.03 240", "0.28 0.07 250", "0.95 0.02 230", "0.8 0.12 220 / 18%"],
      {
        pageBg: "radial-gradient(80rem 40rem at 50% -10%, oklch(0.45 0.15 250 / 0.35), transparent 70%)",
        cardShadow: "0 0 0 1px oklch(0.8 0.13 210 / 0.12), 0 0 24px -6px oklch(0.8 0.13 210 / 0.25)",
        controlShadow: "none",
        headerBg: o("0.13 0.03 265 / 0.7"),
      }
    ),
    charts: [o("0.72 0.15 300"), o("0.75 0.14 170"), o("0.8 0.13 90"), o("0.65 0.2 350")],
    shape: { radius: "1rem", borderW: "1px", controlRadius: "0.75rem", cardBackdrop: "none", headerBackdrop: "blur(16px)" },
    type: { fontSans: FONT.grotesk, fontHeading: FONT.grotesk, fontNum: FONT.mono, headingWeight: 600, headingTracking: "-0.02em" },
    space: { container: "80rem", pagePx: "clamp(1rem, 3vw, 2rem)", sectionGap: "1.75rem", gridGap: "1.25rem", cardP: "1.25rem", controlH: "2.5rem", controlHSm: "2rem", controlHLg: "3rem", headerH: "3.75rem" },
    chart: { barRadius: 4, strokeWidth: 2.5, curve: "monotone", gridDash: "2 6" },
  },

  khata: {
    id: "khata",
    nameBn: "খাতা",
    nameEn: "Ledger",
    taglineBn: "কাগজ-কালির হিসাবের খাতা",
    taglineEn: "Paper-and-ink account book",
    layout: "stack",
    nav: "top",
    light: mode(
      ["0.965 0.014 85", "0.23 0.02 60", "0.985 0.008 85", "0.45 0.13 28", "0.98 0.01 85", "0.93 0.016 85", "0.46 0.03 60", "0.92 0.03 85", "0.3 0.04 60", "0.83 0.02 80"],
      {
        pageBg: "repeating-linear-gradient(to bottom, transparent 0 31px, oklch(0.6 0.05 250 / 0.07) 31px 32px)",
        cardShadow: "none",
        controlShadow: "none",
        headerBg: o("0.965 0.014 85"),
      }
    ),
    dark: mode(
      ["0.2 0.012 70", "0.92 0.02 85", "0.235 0.014 70", "0.74 0.12 40", "0.18 0.02 60", "0.28 0.015 70", "0.71 0.025 80", "0.31 0.03 60", "0.92 0.02 85", "0.4 0.02 70"],
      {
        pageBg: "none",
        cardShadow: "none",
        controlShadow: "none",
        headerBg: o("0.2 0.012 70"),
      }
    ),
    charts: [o("0.55 0.06 60"), o("0.6 0.1 150"), o("0.62 0.1 250"), o("0.7 0.12 85")],
    shape: { radius: "0.25rem", borderW: "1px", controlRadius: "0.25rem", cardBackdrop: "none", headerBackdrop: "none" },
    type: { fontSans: FONT.inter, fontHeading: FONT.serif, fontNum: FONT.mono, headingWeight: 600, headingTracking: "0" },
    space: { container: "52rem", pagePx: "clamp(1rem, 4vw, 2rem)", sectionGap: "1.25rem", gridGap: "0.75rem", cardP: "1rem", controlH: "2.25rem", controlHSm: "1.875rem", controlHLg: "2.75rem", headerH: "3.25rem" },
    chart: { barRadius: 0, strokeWidth: 1.5, curve: "linear", gridDash: "2 4" },
  },

  dharalo: {
    id: "dharalo",
    nameBn: "ধারালো",
    nameEn: "Brutal",
    taglineBn: "মোটা দাগ, স্পষ্ট সংখ্যা",
    taglineEn: "Bold lines, loud numbers",
    layout: "bento",
    nav: "top",
    light: mode(
      ["0.97 0.025 95", "0.15 0 0", "1 0 0", "0.15 0 0", "0.87 0.17 95", "0.93 0.035 95", "0.38 0.01 90", "0.87 0.17 95", "0.15 0 0", "0.15 0 0"],
      {
        pageBg: "radial-gradient(oklch(0.15 0 0 / 0.08) 1px, transparent 1px) 0 0 / 16px 16px",
        cardShadow: "5px 5px 0 0 oklch(0.15 0 0)",
        controlShadow: "3px 3px 0 0 oklch(0.15 0 0)",
        headerBg: o("0.97 0.025 95"),
      }
    ),
    dark: mode(
      ["0.15 0 0", "0.97 0.025 95", "0.2 0 0", "0.87 0.17 95", "0.15 0 0", "0.26 0 0", "0.78 0.02 95", "0.3 0.04 95", "0.97 0.025 95", "0.97 0.025 95"],
      {
        pageBg: "radial-gradient(oklch(0.97 0.025 95 / 0.07) 1px, transparent 1px) 0 0 / 16px 16px",
        cardShadow: "5px 5px 0 0 oklch(0.87 0.17 95)",
        controlShadow: "3px 3px 0 0 oklch(0.87 0.17 95)",
        headerBg: o("0.15 0 0"),
      }
    ),
    charts: [o("0.62 0.2 25"), o("0.6 0.15 250"), o("0.62 0.15 150"), o("0.55 0.18 300")],
    shape: { radius: "0rem", borderW: "2px", controlRadius: "0rem", cardBackdrop: "none", headerBackdrop: "none" },
    type: { fontSans: FONT.grotesk, fontHeading: FONT.grotesk, fontNum: FONT.grotesk, headingWeight: 700, headingTracking: "-0.02em" },
    space: { container: "76rem", pagePx: "clamp(1rem, 3vw, 2rem)", sectionGap: "2rem", gridGap: "1.25rem", cardP: "1.25rem", controlH: "2.75rem", controlHSm: "2.25rem", controlHLg: "3.25rem", headerH: "4rem" },
    chart: { barRadius: 0, strokeWidth: 3, curve: "linear", gridDash: "4 4" },
  },

  komol: {
    id: "komol",
    nameBn: "কোমল",
    nameEn: "Soft",
    taglineBn: "নরম রং, বড় বোতাম",
    taglineEn: "Soft colors, big buttons",
    layout: "stack",
    nav: "dock",
    light: mode(
      ["0.975 0.014 330", "0.28 0.05 300", "1 0 0", "0.54 0.19 300", "0.99 0 0", "0.95 0.022 320", "0.5 0.05 300", "0.94 0.045 185", "0.32 0.06 190", "0.91 0.03 320"],
      {
        pageBg: "radial-gradient(40rem 30rem at 0% 0%, oklch(0.93 0.05 330 / 0.6), transparent 70%), radial-gradient(40rem 30rem at 100% 100%, oklch(0.93 0.05 190 / 0.5), transparent 70%)",
        cardShadow: "0 12px 32px -16px oklch(0.54 0.19 300 / 0.3)",
        controlShadow: "none",
        headerBg: o("0.975 0.014 330 / 0.8"),
      }
    ),
    dark: mode(
      ["0.2 0.04 300", "0.96 0.02 320", "0.25 0.05 300", "0.79 0.12 310", "0.2 0.05 300", "0.3 0.05 300", "0.76 0.04 310", "0.34 0.06 190", "0.94 0.03 190", "0.37 0.05 300"],
      {
        pageBg: "none",
        cardShadow: "0 12px 32px -16px oklch(0 0 0 / 0.6)",
        controlShadow: "none",
        headerBg: o("0.2 0.04 300 / 0.8"),
      }
    ),
    charts: [o("0.75 0.12 190"), o("0.78 0.12 350"), o("0.8 0.12 85"), o("0.68 0.14 260")],
    shape: { radius: "1.5rem", borderW: "1px", controlRadius: "9999px", cardBackdrop: "none", headerBackdrop: "blur(12px)" },
    type: { fontSans: FONT.baloo, fontHeading: FONT.baloo, fontNum: FONT.baloo, headingWeight: 700, headingTracking: "0" },
    space: { container: "46rem", pagePx: "clamp(1rem, 4vw, 1.5rem)", sectionGap: "2rem", gridGap: "1.25rem", cardP: "1.5rem", controlH: "3rem", controlHSm: "2.5rem", controlHLg: "3.5rem", headerH: "4rem" },
    chart: { barRadius: 12, strokeWidth: 3, curve: "monotone", gridDash: "1 6" },
  },

  console: {
    id: "console",
    nameBn: "কনসোল",
    nameEn: "Console",
    taglineBn: "বেশি তথ্য, কম জায়গায়",
    taglineEn: "More data, less space",
    layout: "split",
    nav: "top",
    light: mode(
      ["0.965 0.004 250", "0.2 0.012 250", "0.995 0 0", "0.53 0.14 55", "0.99 0 0", "0.93 0.006 250", "0.47 0.015 250", "0.92 0.01 250", "0.25 0.012 250", "0.88 0.008 250"],
      {
        pageBg: "none",
        cardShadow: "none",
        controlShadow: "none",
        headerBg: o("0.995 0 0"),
      }
    ),
    dark: mode(
      ["0.14 0.008 250", "0.93 0.005 250", "0.18 0.01 250", "0.8 0.16 75", "0.2 0.03 60", "0.23 0.01 250", "0.68 0.015 250", "0.26 0.012 250", "0.93 0.005 250", "1 0 0 / 9%"],
      {
        pageBg: "none",
        cardShadow: "none",
        controlShadow: "none",
        headerBg: o("0.18 0.01 250"),
      }
    ),
    charts: [o("0.65 0.13 250"), o("0.7 0.14 160"), o("0.65 0.18 20"), o("0.72 0.1 300")],
    shape: { radius: "0.375rem", borderW: "1px", controlRadius: "0.3rem", cardBackdrop: "none", headerBackdrop: "none" },
    type: { fontSans: FONT.inter, fontHeading: FONT.inter, fontNum: FONT.mono, headingWeight: 600, headingTracking: "0" },
    space: { container: "96rem", pagePx: "clamp(0.75rem, 2vw, 1.5rem)", sectionGap: "1rem", gridGap: "0.75rem", cardP: "0.875rem", controlH: "2rem", controlHSm: "1.75rem", controlHLg: "2.5rem", headerH: "3rem" },
    chart: { barRadius: 2, strokeWidth: 1.5, curve: "linear", gridDash: "2 2" },
  },

  sonar: {
    id: "sonar",
    nameBn: "সোনার বাংলা",
    nameEn: "Sonar Bangla",
    taglineBn: "লাল-সবুজের দেশি ছোঁয়া",
    taglineEn: "Red and green, made at home",
    layout: "split",
    nav: "dock",
    light: mode(
      ["0.98 0.008 150", "0.22 0.03 160", "1 0 0", "0.46 0.1 163", "0.99 0 0", "0.95 0.015 150", "0.47 0.03 160", "0.94 0.04 25", "0.45 0.16 25", "0.9 0.02 150"],
      {
        pageBg: "linear-gradient(180deg, oklch(0.95 0.04 160 / 0.6), transparent 22rem)",
        cardShadow: "0 2px 4px oklch(0.3 0.05 160 / 0.05), 0 12px 24px -12px oklch(0.3 0.05 160 / 0.15)",
        controlShadow: "none",
        headerBg: o("0.46 0.1 163"),
        headerFg: o("0.99 0 0"),
      }
    ),
    dark: mode(
      ["0.17 0.025 160", "0.96 0.01 150", "0.21 0.03 160", "0.74 0.13 160", "0.17 0.03 160", "0.26 0.03 160", "0.73 0.03 150", "0.3 0.08 25", "0.93 0.04 25", "1 0 0 / 10%"],
      {
        pageBg: "linear-gradient(180deg, oklch(0.3 0.06 160 / 0.5), transparent 22rem)",
        cardShadow: "0 12px 24px -12px oklch(0 0 0 / 0.5)",
        controlShadow: "none",
        headerBg: o("0.21 0.03 160"),
      }
    ),
    charts: [o("0.63 0.2 25"), o("0.78 0.14 85"), o("0.62 0.1 200"), o("0.55 0.08 140")],
    shape: { radius: "0.875rem", borderW: "1px", controlRadius: "0.625rem", cardBackdrop: "none", headerBackdrop: "none" },
    type: { fontSans: FONT.inter, fontHeading: FONT.anek, fontNum: FONT.inter, headingWeight: 650, headingTracking: "-0.01em" },
    space: { container: "72rem", pagePx: "clamp(1rem, 3vw, 1.75rem)", sectionGap: "1.5rem", gridGap: "1rem", cardP: "1.25rem", controlH: "2.5rem", controlHSm: "2.125rem", controlHLg: "3rem", headerH: "3.75rem" },
    chart: { barRadius: 8, strokeWidth: 2, curve: "monotone", gridDash: "3 3" },
  },

  aurora: {
    id: "aurora",
    nameBn: "অরোরা",
    nameEn: "Aurora",
    taglineBn: "কাঁচের কার্ড, রঙিন আকাশ",
    taglineEn: "Glass cards, colorful sky",
    layout: "bento",
    nav: "top",
    light: mode(
      ["0.97 0.02 300", "0.22 0.04 290", "1 0 0 / 0.62", "0.52 0.21 320", "0.99 0 0", "0.94 0.02 300", "0.46 0.04 290", "0.93 0.04 200", "0.32 0.07 220", "0.86 0.03 300"],
      {
        popover: o("1 0 0"),
        pageBg: auroraPageBg("0.85 0.12 320 / 0.55", "0.86 0.1 200 / 0.5", "0.9 0.1 85 / 0.45"),
        cardShadow: "0 8px 32px -12px oklch(0.3 0.1 300 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.6)",
        controlShadow: "none",
        headerBg: o("1 0 0 / 0.5"),
      }
    ),
    dark: mode(
      ["0.15 0.03 290", "0.96 0.01 300", "0.22 0.03 290 / 0.55", "0.77 0.15 330", "0.18 0.04 300", "0.27 0.03 290", "0.75 0.03 300", "0.3 0.05 220", "0.95 0.02 220", "1 0 0 / 12%"],
      {
        popover: o("0.22 0.03 290"),
        pageBg: auroraPageBg("0.45 0.18 320 / 0.35", "0.45 0.14 220 / 0.3", "0.5 0.12 85 / 0.18"),
        cardShadow: "0 8px 32px -12px oklch(0 0 0 / 0.6), inset 0 1px 0 oklch(1 0 0 / 0.08)",
        controlShadow: "none",
        headerBg: o("0.15 0.03 290 / 0.5"),
      }
    ),
    charts: [o("0.72 0.13 200"), o("0.8 0.13 85"), o("0.68 0.16 280"), o("0.72 0.15 150")],
    shape: { radius: "1.25rem", borderW: "1px", controlRadius: "0.875rem", cardBackdrop: "blur(18px) saturate(1.4)", headerBackdrop: "blur(18px) saturate(1.4)" },
    type: { fontSans: FONT.inter, fontHeading: FONT.grotesk, fontNum: FONT.inter, headingWeight: 600, headingTracking: "-0.02em" },
    space: { container: "76rem", pagePx: "clamp(1rem, 3vw, 2rem)", sectionGap: "1.75rem", gridGap: "1.25rem", cardP: "1.375rem", controlH: "2.625rem", controlHSm: "2.125rem", controlHLg: "3.125rem", headerH: "3.75rem" },
    chart: { barRadius: 10, strokeWidth: 2.5, curve: "monotone", gridDash: "3 6" },
  },
}

export const THEME_IDS: ThemeId[] = [
  "bidyut",
  "nishi",
  "khata",
  "dharalo",
  "komol",
  "console",
  "sonar",
  "aurora",
]

export const DEFAULT_THEME_ID: ThemeId = "bidyut"

export const THEME_META = Object.fromEntries(
  THEME_IDS.map((id) => [
    id,
    { layout: THEMES[id].layout, nav: THEMES[id].nav },
  ])
) as Record<ThemeId, { layout: LayoutMode; nav: NavMode }>

export function resolveThemeId(stored: unknown): ThemeId {
  return THEME_IDS.find((id) => id === stored) ?? DEFAULT_THEME_ID
}
