import { Link, useNavigate } from "@tanstack/react-router"
import { useAuth } from "@/features/auth/auth-context"
import { useMeter } from "@/features/meter/meter-context"
import { useLanguage } from "@/features/i18n/language-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "./theme-toggle"
import { LanguageToggle } from "./language-toggle"
import { ColorThemeToggle } from "./color-theme-toggle"
import { Zap, LogOut, Camera, History, Calculator, LayoutDashboard, ChevronDown, Crown } from "lucide-react"

export function Navbar() {
  const { user, isPremium, openAuthModal, logout, openPricingModal } = useAuth()
  const { activeMeter } = useMeter()
  const { t, formatNumber } = useLanguage()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="size-8 sm:size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 shrink-0">
            <Zap className="size-4 sm:size-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-foreground">
                {t.brand.name}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground hidden sm:block -mt-1 font-medium">
              {t.brand.tagline}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            to="/"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors [&.active]:text-foreground [&.active]:bg-muted [&.active]:font-semibold"
          >
            <span className="flex items-center gap-1.5">
              <LayoutDashboard className="size-4" />
              <span>{t.nav.dashboard}</span>
            </span>
          </Link>
          <Link
            to="/history"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors [&.active]:text-foreground [&.active]:bg-muted [&.active]:font-semibold"
          >
            <span className="flex items-center gap-1.5">
              <History className="size-4" />
              <span>{t.nav.history}</span>
            </span>
          </Link>
          <Link
            to="/snapshots"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors [&.active]:text-foreground [&.active]:bg-muted [&.active]:font-semibold"
          >
            <span className="flex items-center gap-1.5">
              <Camera className="size-4" />
              <span>{t.nav.snapshots}</span>
            </span>
          </Link>
          <Link
            to="/tariffs"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors [&.active]:text-foreground [&.active]:bg-muted [&.active]:font-semibold"
          >
            <span className="flex items-center gap-1.5">
              <Calculator className="size-4" />
              <span>{t.nav.tariffs}</span>
            </span>
          </Link>
        </nav>

        {/* User Account, Language Switcher, Theme Toggle & Auth Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {activeMeter && (
            <Link
              to="/"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 hover:bg-primary/15 border border-primary/20 text-xs text-primary font-mono font-medium transition-colors"
              title={t.nav.activeMeterTitle}
            >
              <Zap className="size-3 text-primary shrink-0" />
              <span>{t.nav.meterBadge}: {formatNumber(activeMeter)}</span>
            </Link>
          )}
          {isPremium ? (
            <Badge
              variant="outline"
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1"
            >
              <Crown className="size-3 fill-amber-500 text-amber-500" />
              <span>{user?.subscriptionTier === "lifetime" ? t.nav.premiumUnlimited : t.nav.meterPlus}</span>
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={openPricingModal}
              className="h-8 text-xs font-semibold gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10"
            >
              <Crown className="size-3.5 fill-amber-500 text-amber-500" />
              <span className="hidden sm:inline">{t.nav.meterPlus}</span>
              <span className="sm:hidden">{t.nav.plusShort}</span>
            </Button>
          )}

          {/* Apple-style Language Toggle */}
          <LanguageToggle />

          {/* Shadcn Color Theme Switcher */}
          <ColorThemeToggle />

          {/* Dark / Light Mode Toggle */}
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <div className="flex items-center gap-2 p-1 pl-2 rounded-full border border-border hover:bg-muted/60 transition-colors">
                  <span className="text-xs font-semibold max-w-[100px] truncate hidden sm:inline-block">
                    {user.name.split(" ")[0]}
                  </span>
                  <Avatar className="size-7">
                    <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="size-3 text-muted-foreground mr-1" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-bold leading-none text-foreground">{user.name}</p>
                      <p className="text-[11px] leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/snapshots" })}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="size-3.5" />
                    <span>{t.nav.savedSnapshots}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/history" })}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <History className="size-3.5" />
                    <span>{t.nav.rechargeAndTokens}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={openPricingModal}
                    className="flex items-center gap-2 cursor-pointer text-amber-600 dark:text-amber-400 font-medium"
                  >
                    <Crown className="size-3.5 fill-amber-500 text-amber-500" />
                    <span>{isPremium ? t.nav.membershipStatus : t.nav.meterPlus}</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="size-3.5" />
                  <span>{t.nav.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAuthModal("login")}
                className="h-8 text-xs font-medium"
              >
                {t.nav.login}
              </Button>
              <Button
                size="sm"
                onClick={() => openAuthModal("register")}
                className="h-8 text-xs font-semibold"
              >
                {t.nav.register}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Subnavigation Bar */}
      <div className="flex md:hidden items-center justify-around border-t border-border/60 py-2 bg-background/95 text-xs text-muted-foreground">
        <Link
          to="/"
          className="flex flex-col items-center gap-1 px-3 py-1 [&.active]:text-primary [&.active]:font-bold"
        >
          <LayoutDashboard className="size-4" />
          <span>{t.nav.dashboard}</span>
        </Link>
        <Link
          to="/history"
          className="flex flex-col items-center gap-1 px-3 py-1 [&.active]:text-primary [&.active]:font-bold"
        >
          <History className="size-4" />
          <span>{t.nav.history}</span>
        </Link>
        <Link
          to="/snapshots"
          className="flex flex-col items-center gap-1 px-3 py-1 [&.active]:text-primary [&.active]:font-bold"
        >
          <Camera className="size-4" />
          <span>{t.nav.snapshots}</span>
        </Link>
        <Link
          to="/tariffs"
          className="flex flex-col items-center gap-1 px-3 py-1 [&.active]:text-primary [&.active]:font-bold"
        >
          <Calculator className="size-4" />
          <span>{t.nav.tariffs}</span>
        </Link>
      </div>
    </header>
  )
}
