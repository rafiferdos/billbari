import { Download, FileDown, Printer } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { useLanguage } from "@/features/i18n/language-context"
import { useMeter } from "@/features/meter/meter-context"
import { NESCO_DOWNLOAD_KINDS, nescoDownloadHref, type NescoDownloadKind } from "@/features/nesco/downloads"
import { ProGate } from "@/features/payments/pro-gate"

/** Print, the portal's own PDF, and CSV (Pro). */
export function RecordActions({
  pdfKind,
  isSample,
  empty,
  onPrint,
  onCsv,
}: {
  pdfKind: NescoDownloadKind
  isSample: boolean
  empty: boolean
  onPrint: () => void
  onCsv: () => void
}) {
  const { t } = useLanguage()
  const { activeMeter } = useMeter()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" disabled={empty} onClick={onPrint}>
        <Printer />
        {t.history.print}
      </Button>
      {/* the portal has no PDF for sample meters */}
      {!isSample && NESCO_DOWNLOAD_KINDS.includes(pdfKind) && (
        <a
          href={nescoDownloadHref(pdfKind, activeMeter)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <FileDown />
          {t.history.nescoPdf}
        </a>
      )}
      <ProGate feature="csvExport" variant="inline">
        <Button variant="outline" size="sm" disabled={empty} onClick={onCsv}>
          <Download />
          {t.history.csv}
        </Button>
      </ProGate>
    </div>
  )
}
