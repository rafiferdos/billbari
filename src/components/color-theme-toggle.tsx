import * as React from "react"
import { useColorTheme, COLOR_THEMES, type ColorTheme } from "@/features/theme/color-theme-context"
import { useLanguage } from "@/features/i18n/language-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Palette, Check } from "lucide-react"

export function ColorThemeToggle() {
  const { colorTheme, setColorTheme, activeThemeOption } = useColorTheme()
  const { isBangla } = useLanguage()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-8 rounded-xl text-muted-foreground">
        <Palette className="size-4" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <div
          className="size-8 rounded-xl border border-border/80 flex items-center justify-center hover:bg-muted/70 transition-colors text-foreground cursor-pointer relative group"
          title={isBangla ? "কালার থিম পরিবর্তন করুন" : "Change Color Theme"}
        >
          <Palette className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span
            className="absolute bottom-1 right-1 size-2 rounded-full ring-1 ring-background shadow-2xs"
            style={{ backgroundColor: activeThemeOption.colorHex }}
          />
          <span className="sr-only">
            {isBangla ? "কালার থিম নির্বাচন" : "Select Color Theme"}
          </span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52 p-1.5">
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-bold text-foreground">
          {isBangla ? "ওয়েবসাইট কালার থিম" : "Website Color Theme"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />

        <div className="space-y-0.5">
          {COLOR_THEMES.map((theme) => {
            const isSelected = colorTheme === theme.id
            return (
              <DropdownMenuItem
                key={theme.id}
                onClick={() => setColorTheme(theme.id as ColorTheme)}
                className="flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-3.5 rounded-full border border-black/10 dark:border-white/20 shrink-0 shadow-2xs"
                    style={{ backgroundColor: theme.colorHex }}
                  />
                  <span className={isSelected ? "font-bold text-foreground" : "text-muted-foreground"}>
                    {isBangla ? theme.nameBangla : theme.nameEnglish}
                  </span>
                </div>
                {isSelected && (
                  <Check className="size-3.5 text-primary shrink-0 stroke-[2.5]" />
                )}
              </DropdownMenuItem>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
