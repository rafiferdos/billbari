import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, it, expect } from "vitest"
import { LanguageProvider } from "../src/features/i18n/language-context"
import { Meter } from "../src/components/ui/meter"
import { NumberField } from "../src/components/ui/number-field"

const render = (node: React.ReactElement) =>
  renderToStaticMarkup(h(LanguageProvider, { children: node }))

describe("Meter", () => {
  it("exposes the value, label and tone", () => {
    const html = render(
      h(Meter, { value: 40, label: "Balance", tone: "warning" })
    )
    expect(html).toContain('role="meter"')
    expect(html).toContain('aria-valuenow="40"')
    expect(html).toContain("Balance")
    expect(html).toContain("bg-warning")
  })

  it("clamps a value outside the range", () => {
    expect(render(h(Meter, { value: 150, "aria-label": "x" }))).toContain(
      'aria-valuenow="100"'
    )
    expect(render(h(Meter, { value: -5, "aria-label": "x" }))).toContain(
      'aria-valuenow="0"'
    )
  })
})

describe("NumberField", () => {
  it("renders a labelled input between translated step buttons", () => {
    const html = render(
      h(NumberField, { defaultValue: 1500, "aria-label": "Units" })
    )
    expect(html).toContain('aria-label="Units"')
    // Latin digits: Base UI cannot parse Bengali digits back into a number.
    expect(html).toContain('value="1,500"')
    expect(html).toContain('aria-label="কমান"')
    expect(html).toContain('aria-label="বাড়ান"')
  })
})
