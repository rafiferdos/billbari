export interface CsvColumn<T> {
  header: string
  value: (row: T) => string | number | null | undefined
}

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ""
  // text starting like a formula would run in a spreadsheet; numbers (negative rebates) stay numbers
  const text = typeof value === "string" && /^[=+\-@\t\r]/.test(value) ? `'${value}` : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

/** RFC 4180 with a BOM, so Excel reads Bangla as UTF-8. */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [columns.map((c) => cell(c.header)), ...rows.map((row) => columns.map((c) => cell(c.value(row))))]
  return "﻿" + lines.map((line) => line.join(",")).join("\r\n")
}

export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
