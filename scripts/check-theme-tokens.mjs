// App code takes colors and shadows from theme tokens, never raw palette
// classes, hex colors or fixed shadows. Per-file counts may only go down.
//
//   node scripts/check-theme-tokens.mjs                    check
//   node scripts/check-theme-tokens.mjs --write-baseline   accept current counts

import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const BASELINE = path.join(ROOT, "scripts", "theme-token-baseline.json")
const SCAN_DIRS = ["src/routes", "src/features", "src/components"]
const EXCLUDED_DIR = path.join(ROOT, "src", "components", "ui")

const PATTERNS = [
  // palette classes
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|outline|decoration|divide|placeholder|caret|shadow|accent)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
  // fixed shadows
  /\bshadow-(?:2xs|xs|sm|md|lg|xl|2xl)\b/g,
  // quoted hex colors
  /["'`]#[0-9a-fA-F]{3,8}["'`]/g,
]

function collectFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (full === EXCLUDED_DIR) return []
    if (entry.isDirectory()) return collectFiles(full)
    return /\.tsx?$/.test(entry.name) ? [full] : []
  })
}

const counts = {}
for (const dir of SCAN_DIRS) {
  for (const file of collectFiles(path.join(ROOT, dir))) {
    const content = fs.readFileSync(file, "utf8")
    const count = PATTERNS.reduce(
      (sum, re) => sum + (content.match(re)?.length ?? 0),
      0
    )
    if (count > 0) {
      counts[path.relative(ROOT, file).split(path.sep).join("/")] = count
    }
  }
}

const total = (map) => Object.values(map).reduce((a, b) => a + b, 0)

if (process.argv.includes("--write-baseline")) {
  const sorted = Object.fromEntries(Object.entries(counts).sort())
  fs.writeFileSync(BASELINE, JSON.stringify(sorted, null, 2) + "\n")
  console.log(`theme-token baseline written: ${total(counts)} in total.`)
  process.exit(0)
}

const baseline = JSON.parse(fs.readFileSync(BASELINE, "utf8"))
let failed = false
for (const file of new Set([...Object.keys(baseline), ...Object.keys(counts)])) {
  const now = counts[file] ?? 0
  const allowed = baseline[file] ?? 0
  if (now > allowed) {
    failed = true
    console.error(`  ${file}: found ${now}, allowed ${allowed}`)
  } else if (now < allowed) {
    console.log(`  note: lower the baseline: ${file} is now ${now} (was ${allowed})`)
  }
}

if (failed) {
  console.error(
    "theme-token check FAILED: use theme tokens (text-primary, text-warning, bg-muted, shadow-card) instead."
  )
  process.exit(1)
}
console.log(`theme-token check passed (${total(counts)} remaining).`)
