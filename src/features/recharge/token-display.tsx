import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { useLanguage } from "@/features/i18n/language-context"
import type { Translations } from "@/features/i18n/translations"
import { cn } from "@/lib/utils"
import { splitTokens } from "./token"

export async function copyText(text: string, t: Translations, copiedMessage: string = t.token.copied) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(copiedMessage)
  } catch {
    toast.error(t.token.copyFailed)
  }
}

export function TokenDisplay({ token, size = "sm" }: { token: string; size?: "sm" | "lg" }) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-1">
      {splitTokens(token).map((value) => (
        <div key={value} className="flex items-center gap-2">
          {/* digits stay Latin: they are typed into the meter's keypad */}
          <span
            translate="no"
            className={cn(
              "num min-w-0 select-all",
              size === "lg" ? "text-xl font-bold tracking-wider sm:text-2xl" : "text-sm"
            )}
          >
            {value}
          </span>
          <Button
            variant="outline"
            size={size === "lg" ? "icon" : "icon-sm"}
            aria-label={t.token.copy}
            title={t.token.copy}
            className="ml-auto print:hidden"
            onClick={() => void copyText(value, t)}
          >
            <Copy />
          </Button>
        </div>
      ))}
    </div>
  )
}
