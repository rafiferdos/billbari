const OKLCH =
  /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)(%)?)?\s*\)$/

export function parseOklch(value: string) {
  const m = OKLCH.exec(value.trim())
  if (!m) return null
  const [, l, c, h, a, percent] = m
  const alpha = a === undefined ? 1 : Number(a) / (percent ? 100 : 1)
  return { l: Number(l), c: Number(c), h: Number(h), alpha }
}

/** WCAG luminance of an OKLCH color, composited over `under` when translucent. */
export function relativeLuminance(value: string, under?: string): number {
  const color = parseOklch(value)
  if (!color) throw new Error(`Not an oklch() color: ${value}`)

  const { l: L, c, h, alpha } = color
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3

  // Linear sRGB, clamped to the gamut.
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  const R = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
  const G = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
  const B = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)

  const Y = 0.2126 * R + 0.7152 * G + 0.0722 * B
  if (alpha < 1 && under) {
    return alpha * Y + (1 - alpha) * relativeLuminance(under)
  }
  return Y
}

export function contrastRatio(fg: string, bg: string, under?: string): number {
  const a = relativeLuminance(fg, under)
  const b = relativeLuminance(bg, under)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}
