// Phase 1 freeze check: BillBari app code must use shadcn/ui components
// for interactive controls, never raw HTML controls.
//
// Scope: src/routes, src/features, src/components — excluding the
// shadcn primitives themselves in src/components/ui, which render the
// underlying HTML by design.
//
// Allowed tags are interactive controls only. Layout/semantic tags
// (div, span, main, h1, header, etc.) are out of scope for this check.
//
// Baseline (Phase 7, 2026-11-03): zero. All Phase 1 exceptions were
// removed in Phases 2-7. The check scans whole file contents and fails
// on any raw control in app code.

import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const SCAN_DIRS = ["src/routes", "src/features", "src/components"]
const EXCLUDED_DIR = path.join(ROOT, "src", "components", "ui")

const CONTROL_TAGS = [
  "form",
  "label",
  "button",
  "input",
  "select",
  "textarea",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",
]
const TAG_RE = new RegExp(`<(${CONTROL_TAGS.join("|")})(?=[\\s/>])`, "g")

// Phase 7 completed 2026-11-03: the baseline is now zero. Every
// Phase 1 exception has been removed, so the check fails on ANY raw
// control in app code and a regression cannot silently re-enter.
// (The check still excludes src/components/ui, where the shadcn
// primitives render the underlying HTML by design.)
const ALLOWED = new Map([])

function collectFiles(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (full === EXCLUDED_DIR || full.startsWith(EXCLUDED_DIR + path.sep)) continue
    if (entry.isDirectory()) out.push(...collectFiles(full))
    else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) out.push(full)
  }
  return out
}

const findings = [] // { file, line, tag }
const counts = new Map() // "file|tag" -> count

for (const dir of SCAN_DIRS) {
  const absDir = path.join(ROOT, dir)
  if (!fs.existsSync(absDir)) continue
  for (const file of collectFiles(absDir)) {
    const rel = path.relative(ROOT, file)
    // Scan whole file content, not line by line: a tag such as `<form`
    // or `<button` may be followed by attributes on the next line, and a
    // per-line scan misses it when the tag ends at the line break.
    const content = fs.readFileSync(file, "utf8")
    for (const match of content.matchAll(TAG_RE)) {
      const tag = match[1]
      const key = `${rel}|${tag}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
      const line = content.slice(0, match.index).split("\n").length
      findings.push({ file: rel, line, tag })
    }
  }
}

const failures = []
for (const [key, count] of counts) {
  const allowed = ALLOWED.get(key) ?? 0
  if (count > allowed) {
    failures.push({ key, count, allowed })
  }
}

if (failures.length > 0) {
  console.error("shadcn-only check FAILED: raw HTML controls found above the Phase 1 baseline.")
  console.error("")
  for (const { key, count, allowed } of failures) {
    console.error(`  ${key}: found ${count}, allowed ${allowed}`)
    for (const f of findings.filter((x) => `${x.file}|${x.tag}` === key)) {
      console.error(`    ${f.file}:${f.line} <${f.tag}>`)
    }
  }
  console.error("")
  console.error("Use a component from src/components/ui/* instead of a raw HTML control.")
  process.exit(1)
}

console.log("shadcn-only check passed.")
for (const [key, allowed] of ALLOWED) {
  const count = counts.get(key) ?? 0
  if (count < allowed) {
    console.log(`  note: baseline exception reduced: ${key} is now ${count} (was ${allowed})`)
  }
}
console.log(`  scanned ${findings.length} raw-control occurrences (baseline is zero).`)
