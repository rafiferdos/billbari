import { createPortal } from "react-dom"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/features/i18n/language-context"
import { cn } from "@/lib/utils"

/** Print-only: invisible on screen, and the only thing on paper. */
export function PrintableTable({
  title,
  subtitle,
  columns,
  rows,
  footer,
}: {
  title: string
  subtitle: string
  columns: { header: string; align?: "left" | "right" }[]
  rows: (string | number)[][]
  footer?: string
}) {
  const { t, formatDate } = useLanguage()
  const align = (i: number) => cn("h-auto px-1 py-0.5 whitespace-normal", columns[i].align === "right" && "text-right")

  const view = (
    <div data-print-root data-print-table className="hidden print:block text-xs">
      <h1 className="text-base font-bold">{title}</h1>
      <p>{subtitle}</p>
      <p className="mb-2 text-muted-foreground">
        {t.history.printedOn} {formatDate(new Date().toISOString())}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c, i) => (
              <TableHead key={c.header} className={align(i)}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, r) => (
            <TableRow key={r}>
              {row.map((value, i) => (
                <TableCell key={i} className={cn("num", align(i))}>
                  {value}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {footer && <p className="mt-2 font-semibold">{footer}</p>}
    </div>
  )

  // a direct child of body, so print CSS can drop the page behind it instead of printing blank pages
  return typeof document === "undefined" ? view : createPortal(view, document.body)
}
