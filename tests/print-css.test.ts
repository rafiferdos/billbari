import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { describe, expect, it } from "vitest"

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8")
const print = css.slice(css.indexOf("@media print"))

describe("print styles", () => {
  // `body:has([data-print-root]) *` is (0,1,1); a bare `[data-print-root] *` loses to it and prints a blank page
  it("show the print root with a selector at least as specific as the one hiding the page", () => {
    expect(print).toContain("body [data-print-root], body [data-print-root] *")
    expect(print.indexOf("visibility: hidden")).toBeLessThan(print.indexOf("body [data-print-root] *"))
  })

  // the production minifier folds `translate: none` into a neighbouring `transform: none` and drops it,
  // which left a printed receipt shifted half off the paper
  it("still uncentres the receipt dialog after minification", () => {
    const fromVite = createRequire(createRequire(import.meta.url).resolve("vite/package.json"))
    const { transform } = fromVite("lightningcss") as {
      transform: (options: { filename: string; code: Buffer; minify: boolean }) => { code: Uint8Array }
    }
    const built = transform({ filename: "print.css", code: Buffer.from(print), minify: true }).code.toString()
    const rules = built.match(/\[data-slot=dialog-content\]:has\(\[data-print-root\]\)\{[^}]*\}/g)
    expect(rules?.join("")).toContain("translate:none")
  })

  // with "background graphics" on, a dark theme would otherwise put black ink on a dark page
  it("prints a table as black on white in every theme", () => {
    const rule = print.slice(print.indexOf("body > [data-print-table]"))
    expect(rule.slice(0, rule.indexOf("}"))).toContain("background: #fff")
  })
})
