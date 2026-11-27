// App code takes colors and shadows from theme tokens, never raw palette
// classes, hex colors or fixed shadows. Any occurrence fails.
//
//   node scripts/check-theme-tokens.mjs

import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const SCAN_DIRS = ["src/routes", "src/features", "src/components"]
const EXCLUDED_DIR = path.join(ROOT, "src", "components", "ui")

const PATTERNS = [
  // palette classes
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|outline|decoration|divide|placeholder|caret|shadow|accent)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
  // fixed shadows
  /\bshadow-(?:2xs|xs|sm|md|lg|xl|2xl)\b/g,
  // hex colors, quoted or as arbitrary Tailwind values
  /(?:["'`]|\[)#[0-9a-fA-F]{3,8}(?:["'`]|\])/g,
]

function collectFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (full === EXCLUDED_DIR) return []
    if (entry.isDirectory()) return collectFiles(full)
    return /\.tsx?$/.test(entry.name) ? [full] : []
  })
}

let total = 0
for (const dir of SCAN_DIRS) {
  for (const file of collectFiles(path.join(ROOT, dir))) {
    const content = fs.readFileSync(file, "utf8")
    const found = PATTERNS.flatMap((re) => content.match(re) ?? [])
    if (found.length === 0) continue
    total += found.length
    const name = path.relative(ROOT, file).split(path.sep).join("/")
    console.error(`  ${name}: ${[...new Set(found)].join(" ")}`)
  }
}

if (total > 0) {
  console.error(
    `theme-token check FAILED (${total}): use theme tokens (text-primary, text-warning, bg-muted, shadow-card) instead.`
  )
  process.exit(1)
}
console.log("theme-token check passed.")
