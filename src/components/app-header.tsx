import * as React from "react"
import { Link } from "@tanstack/react-router"
import { Menu, Zap } from "lucide-react"
import { AccountMenu } from "@/components/account-menu"
import { LanguageToggle } from "@/components/language-toggle"
import { NAV_ITEMS } from "@/components/nav-items"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useLanguage } from "@/features/i18n/language-context"
import { useMeter } from "@/features/meter/meter-context"
import { maskMeter } from "@/features/meter/meter-input"
import { SavedMetersMenu } from "@/features/meter/saved-meters-menu"
import { useSaveMeter } from "@/features/meter/use-save-meter"
import { AppearanceSheet } from "@/features/theme/appearance-sheet"
import { cn } from "@/lib/utils"

function MeterChip() {
  const { activeMeter, activeMeterData } = useMeter()
  const { t, formatNumber } = useLanguage()
  const { saveMeter, canSave } = useSaveMeter()
  if (!activeMeter || !activeMeterData) return null

  return (
    <SavedMetersMenu
      onSaveCurrentMeter={saveMeter}
      hasCurrentMeter={canSave}
      trigger={
        <Button variant="outline" size="sm" title={t.nav.activeMeterTitle} className="num gap-1 px-2">
          <Zap className="hidden text-primary sm:block" />
          <span className="sr-only">{t.nav.meterBadge}</span>
          <span>{formatNumber(maskMeter(activeMeter))}</span>
        </Button>
      }
    />
  )
}

export function AppHeader() {
  const { t } = useLanguage()
  const { activeMeterData } = useMeter()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-40 h-(--bb-header-h) border-b-(length:--bb-border-w) border-border text-(--bb-header-fg) [background:var(--bb-header-bg)] [backdrop-filter:var(--bb-header-backdrop)]">
      <div className="page-shell flex h-full items-center gap-2">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-(--bb-control-radius) bg-primary text-primary-foreground">
            <Zap className="size-4 fill-current" />
          </span>
          {/* the meter chip needs this room on the narrowest screens */}
          <span className={cn("font-heading text-lg font-extrabold", activeMeterData && "max-sm:sr-only")}>
            {t.brand.name}
          </span>
        </Link>

        <nav aria-label={t.nav.menu} className="mx-auto hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ "data-active": "true" }}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
              )}
            >
              {t.nav[item.labelKey]}
              {item.pro && <Badge variant="secondary">{t.pro.badge}</Badge>}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <MeterChip />
          <LanguageToggle />
          <AppearanceSheet />
          <AccountMenu />
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t.nav.menu}
                  className="hidden max-lg:nav-top:inline-flex"
                />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>{t.nav.menu}</SheetTitle>
              </SheetHeader>
              <nav aria-label={t.nav.menu} className="flex flex-col gap-1 overflow-y-auto px-4 pb-6">
                {NAV_ITEMS.map(({ to, labelKey, icon: Icon, pro }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setIsMenuOpen(false)}
                    activeProps={{ "data-active": "true" }}
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "justify-start data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                    )}
                  >
                    <Icon />
                    {t.nav[labelKey]}
                    {pro && <Badge variant="secondary">{t.pro.badge}</Badge>}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
