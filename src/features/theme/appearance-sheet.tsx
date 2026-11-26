import { useTheme } from "next-themes"
import { Monitor, Moon, Palette, Sun } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useLanguage } from "@/features/i18n/language-context"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useAppTheme } from "./app-theme-context"
import { ThemePreviewTile } from "./theme-preview-tile"
import { THEMES, THEME_IDS, resolveThemeId } from "./themes"

const MODES = [
  { value: "light", Icon: Sun },
  { value: "dark", Icon: Moon },
  { value: "system", Icon: Monitor },
] as const

export function AppearanceSheet() {
  const { t, isBangla } = useLanguage()
  const { theme: mode = "system", setTheme: setMode } = useTheme()
  const { themeId, setThemeId } = useAppTheme()
  const isWide = useMediaQuery("(min-width: 768px)")

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={t.appearance.open} />
        }
      >
        <Palette />
      </SheetTrigger>
      <SheetContent
        side={isWide ? "right" : "bottom"}
        className="data-[side=bottom]:max-h-[85dvh]"
      >
        <SheetHeader>
          <SheetTitle>{t.appearance.title}</SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-col gap-6 overflow-y-auto px-6 pb-6">
          <section className="flex flex-col gap-2">
            <h3 className="text-sm">{t.appearance.mode}</h3>
            <ToggleGroup
              aria-label={t.appearance.mode}
              variant="outline"
              className="w-full"
              value={[mode]}
              onValueChange={([next]) => next && setMode(String(next))}
            >
              {MODES.map(({ value, Icon }) => (
                <ToggleGroupItem
                  key={value}
                  value={value}
                  className="flex-1 aria-pressed:border-primary"
                >
                  <Icon />
                  {t.appearance[value]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm">{t.appearance.theme}</h3>
            <ToggleGroup
              aria-label={t.appearance.theme}
              className="grid w-full grid-cols-2 gap-3"
              value={[themeId]}
              onValueChange={([next]) =>
                next && setThemeId(resolveThemeId(next))
              }
            >
              {THEME_IDS.map((id) => {
                const theme = THEMES[id]
                return (
                  <ToggleGroupItem
                    key={id}
                    value={id}
                    className="h-auto min-w-0 flex-col items-stretch justify-start gap-0 overflow-hidden rounded-xl border-2 border-border p-0 text-left whitespace-normal aria-pressed:border-primary"
                  >
                    <ThemePreviewTile theme={theme} />
                    <span className="flex flex-col gap-1 p-2">
                      <span className="text-sm font-semibold">
                        {isBangla ? theme.nameBn : theme.nameEn}
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {isBangla ? theme.taglineBn : theme.taglineEn}
                      </span>
                      <span className="flex flex-wrap gap-1">
                        <Badge variant="secondary">
                          {t.appearance.layout[theme.layout]}
                        </Badge>
                        <Badge variant="outline">
                          {t.appearance.nav[theme.nav]}
                        </Badge>
                      </span>
                    </span>
                  </ToggleGroupItem>
                )
              })}
            </ToggleGroup>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
