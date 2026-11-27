import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8")
const print = css.slice(css.indexOf("@media print"))

describe("print styles", () => {
  // `body:has([data-print-root]) *` is (0,1,1); a bare `[data-print-root] *` loses to it and prints a blank page
  it("show the print root with a selector at least as specific as the one hiding the page", () => {
    expect(print).toContain("body [data-print-root], body [data-print-root] *")
    expect(print.indexOf("visibility: hidden")).toBeLessThan(print.indexOf("body [data-print-root] *"))
  })
})
