import { AlertTriangle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/features/i18n/language-context"

export function MeterError({ error, onRetry }: { error: string; onRetry: () => void }) {
  const { t, isBangla } = useLanguage()
  // the Bangla text is NESCO-specific already; English swaps in a clearer explanation
  const message =
    !isBangla && error.includes("403") ? t.meterError.blocked : !isBangla && error.includes("502") ? t.meterError.gateway : error

  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>{t.meterError.title}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-2">
        <p>{message}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          {t.meterError.retry}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
