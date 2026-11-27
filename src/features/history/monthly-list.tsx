import * as React from "react"
import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/features/i18n/language-context"
import type { MonthlyConsumptionRecord } from "@/features/nesco/types"
import { monthIndex, monthName } from "@/lib/nesco-dates"
import { monthlyValue, type MonthlyValueKey } from "./records"

interface RowsProps {
  rows: MonthlyConsumptionRecord[]
  columns: MonthlyValueKey[]
}

export function useMonthlyFormat() {
  const { isBangla, formatBDT, formatNumber } = useLanguage()
  return {
    month: (row: MonthlyConsumptionRecord) => {
      const index = monthIndex(row.month)
      // a month NESCO spells unexpectedly is still shown, as written
      return index === null ? row.month : monthName(index, isBangla)
    },
    value: (row: MonthlyConsumptionRecord, key: MonthlyValueKey) => {
      const value = monthlyValue(row, key)
      if (value === null) return "—"
      return key === "usageKwh" ? formatNumber(value) : formatBDT(value)
    },
  }
}

/** Phones. */
export function MonthlyList({ rows, columns }: RowsProps) {
  const { t, formatNumber } = useLanguage()
  const format = useMonthlyFormat()

  return (
    <ItemGroup className="md:hidden">
      {rows.map((row, i) => (
        <Item key={i} role="listitem" variant="outline" size="sm">
          <ItemContent>
            <ItemTitle>
              {format.month(row)} {formatNumber(row.year)}
            </ItemTitle>
            <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-xs">
              {columns.map((key) => (
                <React.Fragment key={key}>
                  <dt className="text-muted-foreground">{t.history.columns[key]}</dt>
                  <dd className="num text-right">{format.value(row, key)}</dd>
                </React.Fragment>
              ))}
            </dl>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  )
}

/** Tablets and up. */
export function MonthlyTable({ rows, columns }: RowsProps) {
  const { t, formatNumber } = useLanguage()
  const format = useMonthlyFormat()

  return (
    <div className="surface-card hidden overflow-hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.history.year}</TableHead>
            <TableHead>{t.history.month}</TableHead>
            {columns.map((key) => (
              <TableHead key={key} className="text-right">
                {t.history.columns[key]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell className="num">{formatNumber(row.year)}</TableCell>
              <TableCell>{format.month(row)}</TableCell>
              {columns.map((key) => (
                <TableCell key={key} className="num text-right">
                  {format.value(row, key)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
