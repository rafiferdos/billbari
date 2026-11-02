import { useLanguage } from "@/features/i18n/language-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface LanguageToggleProps {
  className?: string
}

// Navbar space fix (Phase 8 correction): the two-pill toggle is about
// 100px wide, which is what pushed the mobile top row over 360px.
// On small screens it becomes a single 32px globe icon that opens a
// menu; the full pill toggle returns at sm and up, where it fits.
// Nothing is lost: both languages stay one tap away in either form.
export function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none sm:hidden">
          <div className="size-8 rounded-full border border-border/80 bg-muted/60 flex items-center justify-center hover:bg-muted/70 transition-colors text-foreground cursor-pointer">
            <Globe className="size-4" />
            <span className="sr-only">Language selection</span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => setLanguage("bn")} className="flex items-center justify-between cursor-pointer text-xs">
            <span>বাংলা</span>
            {language === "bn" && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLanguage("en")} className="flex items-center justify-between cursor-pointer text-xs">
            <span>English</span>
            {language === "en" && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div
        role="group"
        aria-label="Language selection"
        className={cn(
          "relative hidden sm:inline-flex items-center p-0.5 rounded-full bg-muted/60 dark:bg-muted/40 border border-border/60 backdrop-blur-md transition-all select-none shadow-xs",
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
    </>
  )
}
