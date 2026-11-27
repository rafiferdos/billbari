import { ReceiptText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Item, ItemActions, ItemContent, ItemFooter, ItemGroup } from "@/components/ui/item"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/features/i18n/language-context"
import type { RechargeRecord } from "@/features/nesco/types"
import { TokenDisplay } from "@/features/recharge/token-display"
import { parseNescoDate } from "@/lib/nesco-dates"

interface RowsProps {
  records: RechargeRecord[]
  onReceipt: (record: RechargeRecord) => void
}

export function useRecordDate() {
  const { formatDate } = useLanguage()
  return (raw: string) => {
    const parsed = parseNescoDate(raw)
    return parsed ? formatDate(parsed.toISOString()) : raw
  }
}

function ReceiptButton({ record, onReceipt }: { record: RechargeRecord; onReceipt: RowsProps["onReceipt"] }) {
  const { t } = useLanguage()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t.receipt.open}
      title={t.receipt.open}
      onClick={() => onReceipt(record)}
    >
      <ReceiptText />
    </Button>
  )
}

/** Phones. */
export function RechargeList({ records, onReceipt }: RowsProps) {
  const { formatBDT, formatNumber } = useLanguage()
  const date = useRecordDate()

  return (
    <ItemGroup className="md:hidden">
      {records.map((record) => (
        <Item key={record.id} role="listitem" variant="outline" size="sm">
          <ItemContent>
            {/* a button, not a clickable row, so the copy button below is not nested inside it */}
            <Button
              variant="ghost"
              className="h-auto w-full flex-col items-start gap-0.5 p-0 text-left whitespace-normal"
              onClick={() => onReceipt(record)}
            >
              <span className="num text-base font-semibold">{formatBDT(record.amountBdt)}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {date(record.date)} · {record.via} · {formatNumber(record.powerKwh)} kWh
              </span>
            </Button>
          </ItemContent>
          <ItemActions>
            <ReceiptButton record={record} onReceipt={onReceipt} />
          </ItemActions>
          <ItemFooter className="block">
            <TokenDisplay token={record.token} />
          </ItemFooter>
        </Item>
      ))}
    </ItemGroup>
  )
}

/** Tablets and up. */
export function RechargeTable({ records, onReceipt, firstNumber }: RowsProps & { firstNumber: number }) {
  const { t, formatBDT, formatNumber } = useLanguage()
  const date = useRecordDate()

  return (
    <div className="surface-card hidden overflow-hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>{t.history.date}</TableHead>
            <TableHead>{t.receipt.token}</TableHead>
            <TableHead className="text-right">{t.history.amount}</TableHead>
            <TableHead className="text-right">{t.history.energy}</TableHead>
            <TableHead className="text-right">kWh</TableHead>
            <TableHead>{t.receipt.channel}</TableHead>
            <TableHead className="text-right">{t.receipt.open}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, i) => (
            <TableRow key={record.id}>
              <TableCell className="num text-muted-foreground">{formatNumber(firstNumber + i)}</TableCell>
              <TableCell>{date(record.date)}</TableCell>
              <TableCell>
                <TokenDisplay token={record.token} />
              </TableCell>
              <TableCell className="num text-right font-semibold">{formatBDT(record.amountBdt)}</TableCell>
              <TableCell className="num text-right">
                {record.netEnergyBdt === undefined ? "—" : formatBDT(record.netEnergyBdt)}
              </TableCell>
              <TableCell className="num text-right">{formatNumber(record.powerKwh)}</TableCell>
              <TableCell>{record.via}</TableCell>
              <TableCell className="text-right">
                <ReceiptButton record={record} onReceipt={onReceipt} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
