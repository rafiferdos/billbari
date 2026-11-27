import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { toCsv, type CsvColumn } from "../src/features/export/csv"
import { PrintableTable } from "../src/features/export/printable-table"
import { LanguageProvider } from "../src/features/i18n/language-context"

type Row = { a: string | number | null | undefined; b?: string }
const columns: CsvColumn<Row>[] = [
  { header: "a", value: (r) => r.a },
  { header: "b,c", value: (r) => r.b },
]
const body = (rows: Row[]) => toCsv(rows, columns).split("\r\n").slice(1)

describe("toCsv", () => {
  it("starts with a BOM so Excel reads Bangla, and joins lines with CRLF", () => {
    expect(toCsv([{ a: 1, b: "x" }], columns)).toBe('﻿a,"b,c"\r\n1,x')
  })

  it("quotes commas, quotes and line breaks", () => {
    expect(body([{ a: "a,b", b: 'he said "hi"' }])).toEqual(['"a,b","he said ""hi"""'])
    expect(body([{ a: "one\ntwo" }])).toEqual(['"one\ntwo",'])
  })

  it("writes empty fields for null and undefined, and numbers as they are", () => {
    expect(body([{ a: null }, { a: -7.5, b: "" }])).toEqual([",", "-7.5,"])
  })

  // a spreadsheet would run these as formulas
  it("defuses text that starts like a formula", () => {
    expect(body([{ a: "=1+1", b: "@cmd" }])).toEqual(["'=1+1,'@cmd"])
  })
})

describe("PrintableTable", () => {
  it("renders the print root with every row and the footer, hidden on screen", () => {
    const html = renderToStaticMarkup(
      h(LanguageProvider, {
        children: h(PrintableTable, {
          title: "TITLE",
          subtitle: "SUB",
          columns: [{ header: "H1" }, { header: "H2", align: "right" }],
          rows: [["r1", 10], ["r2", 20]],
          footer: "FOOT",
        }),
      })
    )
    expect(html).toContain("data-print-root")
    expect(html).toContain("hidden print:block")
    for (const text of ["TITLE", "SUB", "H1", "H2", "r1", "r2", "20", "FOOT"]) expect(html).toContain(text)
  })
})
