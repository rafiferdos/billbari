import { Link, useNavigate } from "@tanstack/react-router"
import { useAuth } from "@/features/auth/auth-context"
import { useMeter } from "@/features/meter/meter-context"
import { toBanglaNumber } from "@/lib/bangla"
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
import { Zap, LogOut, Camera, History, Calculator, LayoutDashboard, ChevronDown, Crown } from "lucide-react"

export function Navbar() {
  const { user, isPremium, openAuthModal, logout, openPricingModal } = useAuth()
  const { activeMeter } = useMeter()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand - Strictly Bengali */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <Zap className="size-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-foreground">
                বিলবাড়ি
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground block -mt-1 font-medium">
              নেসকো প্রিপেইড মিটারের হিসাব
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
              <span>ড্যাশবোর্ড</span>
            </span>
          </Link>
          <Link
            to="/history"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors [&.active]:text-foreground [&.active]:bg-muted [&.active]:font-semibold"
          >
            <span className="flex items-center gap-1.5">
              <History className="size-4" />
              <span>রিচার্জ হিস্ট্রি</span>
            </span>
          </Link>
          <Link
            to="/snapshots"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors [&.active]:text-foreground [&.active]:bg-muted [&.active]:font-semibold"
          >
            <span className="flex items-center gap-1.5">
              <Camera className="size-4" />
              <span>দৈনিক খরচ</span>
            </span>
          </Link>
          <Link
            to="/tariffs"
            className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors [&.active]:text-foreground [&.active]:bg-muted [&.active]:font-semibold"
          >
            <span className="flex items-center gap-1.5">
              <Calculator className="size-4" />
              <span>ট্যারিফ ও বিল হিসাব</span>
            </span>
          </Link>
        </nav>

        {/* User Account, Theme Toggle & Auth Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {activeMeter && (
            <Link
              to="/"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 hover:bg-primary/15 border border-primary/20 text-xs text-primary font-mono font-medium transition-colors"
              title="সক্রিয় মিটার: ড্যাশবোর্ডে যান"
            >
              <Zap className="size-3 text-primary shrink-0" />
              <span>মিটার: {toBanglaNumber(activeMeter)}</span>
            </Link>
          )}
          {isPremium ? (
            <Badge
              variant="outline"
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1"
            >
              <Crown className="size-3 fill-amber-500 text-amber-500" />
              <span>{user?.subscriptionTier === "lifetime" ? "প্রিমিয়াম আনলিমিটেড" : "মিটার প্লাস"}</span>
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={openPricingModal}
              className="h-8 text-xs font-semibold gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10"
            >
              <Crown className="size-3.5 fill-amber-500 text-amber-500" />
              <span className="hidden sm:inline">মিটার প্লাস (৳২০)</span>
              <span className="sm:hidden">প্লাস</span>
            </Button>
          )}

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
                    <span>সংরক্ষিত দৈনিক হিসাব</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/history" })}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <History className="size-3.5" />
                    <span>রিচার্জ ও টোকেন</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={openPricingModal}
                    className="flex items-center gap-2 cursor-pointer text-amber-600 dark:text-amber-400 font-medium"
                  >
                    <Crown className="size-3.5 fill-amber-500 text-amber-500" />
                    <span>{isPremium ? "সদস্যপদ স্ট্যাটাস" : "মিটার প্লাস (৳২০)"}</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="size-3.5" />
                  <span>লগআউট</span>
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
                লগইন
              </Button>
              <Button
                size="sm"
                onClick={() => openAuthModal("register")}
                className="h-8 text-xs font-semibold"
              >
                নিবন্ধন
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
          <span>ড্যাশবোর্ড</span>
        </Link>
        <Link
          to="/history"
          className="flex flex-col items-center gap-1 px-3 py-1 [&.active]:text-primary [&.active]:font-bold"
        >
          <History className="size-4" />
          <span>রিচার্জ</span>
        </Link>
        <Link
          to="/snapshots"
          className="flex flex-col items-center gap-1 px-3 py-1 [&.active]:text-primary [&.active]:font-bold"
        >
          <Camera className="size-4" />
          <span>দৈনিক খরচ</span>
        </Link>
        <Link
          to="/tariffs"
          className="flex flex-col items-center gap-1 px-3 py-1 [&.active]:text-primary [&.active]:font-bold"
        >
          <Calculator className="size-4" />
          <span>ট্যারিফ হিসাব</span>
        </Link>
      </div>
    </header>
  )
}
