import { useLanguage } from "@/features/i18n/language-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LanguageToggleProps {
  className?: string
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage()

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={cn(
        "relative inline-flex items-center p-0.5 rounded-full bg-muted/60 dark:bg-muted/40 border border-border/60 backdrop-blur-md transition-all select-none shadow-xs",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={() => setLanguage("bn")}
        className={cn(
          "relative z-10 h-auto px-2.5 py-1 text-[11px] font-bold rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center",
          language === "bn"
            ? "bg-background text-foreground shadow-xs shadow-black/5 dark:shadow-white/5 font-extrabold"
            : "text-muted-foreground hover:text-foreground font-medium"
        )}
        aria-pressed={language === "bn"}
        title="বাংলা ভাষা নির্বাচন করুন"
      >
        <span>বাংলা</span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={() => setLanguage("en")}
        className={cn(
          "relative z-10 h-auto px-2.5 py-1 text-[11px] tracking-tight font-bold rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center",
          language === "en"
            ? "bg-background text-foreground shadow-xs shadow-black/5 dark:shadow-white/5 font-extrabold"
            : "text-muted-foreground hover:text-foreground font-medium"
        )}
        aria-pressed={language === "en"}
        title="Switch to English"
      >
        <span>EN</span>
      </Button>
    </div>
  )
}
