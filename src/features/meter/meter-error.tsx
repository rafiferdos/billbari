import { AlertTriangle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/features/i18n/language-context"

const CODE = "rounded bg-muted px-1.5 py-0.5 font-mono font-bold text-primary"

export function MeterError({ error, onRetry }: { error: string; onRetry: () => void }) {
  const { t, isBangla } = useLanguage()
  const isBlocked = error.includes("403")
  // the Bangla text is NESCO-specific already; English swaps in a clearer explanation
  const message = !isBangla && isBlocked ? t.meterError.blocked : !isBangla && error.includes("502") ? t.meterError.gateway : error

  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>{t.meterError.title}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-2">
        <p>{message}</p>
        {isBlocked && (
          <div className="flex flex-col gap-1.5 border-t border-border pt-2 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">{t.meterError.howTo}</p>
            <p>
              • <strong>{t.meterError.locally}</strong> {t.meterError.locallyBefore}{" "}
              <code className={CODE}>pnpm dev</code> {t.meterError.locallyAfter}
            </p>
            <p>
              • <strong>{t.meterError.deployed}</strong> {t.meterError.deployedBefore}{" "}
              <code className={CODE}>pnpm bridge</code> {t.meterError.deployedAfter}
            </p>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          {t.meterError.retry}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
