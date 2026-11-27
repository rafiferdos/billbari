import * as React from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import { Ellipsis } from "lucide-react"
import { AccountActions } from "@/components/account-menu"
import { DOCK_ITEM_COUNT, NAV_ITEMS } from "@/components/nav-items"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useLanguage } from "@/features/i18n/language-context"
import { cn } from "@/lib/utils"

const DOCK = NAV_ITEMS.slice(0, DOCK_ITEM_COUNT)
const REST = NAV_ITEMS.slice(DOCK_ITEM_COUNT)

const CELL =
  "flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 border-t-2 border-transparent text-[0.7rem] font-medium"
const CELL_ACTIVE = "border-primary text-primary"

export function MobileDock() {
  const { t } = useLanguage()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [isMoreOpen, setIsMoreOpen] = React.useState(false)
  const isInMore = REST.some((item) => item.to === pathname)

  return (
    <nav
      aria-label={t.nav.menu}
      className="fixed inset-x-0 bottom-0 z-40 hidden border-t-(length:--bb-border-w) border-border pb-[env(safe-area-inset-bottom)] text-(--bb-header-fg) [background:var(--bb-header-bg)] [backdrop-filter:var(--bb-header-backdrop)] max-lg:nav-dock:flex"
    >
      {DOCK.map(({ to, labelKey, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          aria-current={pathname === to ? "page" : undefined}
          className={cn(CELL, pathname === to && CELL_ACTIVE)}
        >
          <Icon className="size-5" />
          <span className="truncate">{t.nav[labelKey]}</span>
        </Link>
      ))}
      <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              className={cn(CELL, "h-auto rounded-none border-x-0 border-b-0", isInMore && CELL_ACTIVE)}
            />
          }
        >
          <Ellipsis className="size-5" />
          <span>{t.nav.more}</span>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85dvh]">
          <SheetHeader>
            <SheetTitle>{t.nav.more}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {REST.map(({ to, labelKey, icon: Icon, pro }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setIsMoreOpen(false)}
                aria-current={pathname === to ? "page" : undefined}
                className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
              >
                <Icon />
                {t.nav[labelKey]}
                {pro && <Badge variant="secondary">{t.pro.badge}</Badge>}
              </Link>
            ))}
            <Separator />
            <AccountActions onDone={() => setIsMoreOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
