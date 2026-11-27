import { ChevronDown, Crown, LogOut, UserRound } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { useAuth } from "@/features/auth/auth-context"
import { useLanguage } from "@/features/i18n/language-context"

function usePlanLabel() {
  const { user, isPremium } = useAuth()
  const { t } = useLanguage()
  if (!isPremium) return t.nav.meterPlus
  return user?.subscriptionTier === "lifetime" ? t.nav.premiumUnlimited : t.nav.membershipStatus
}

/** Header account control: the avatar dropdown, or the sign-in button. */
export function AccountMenu() {
  const { user, isPremium, openAuthModal, openPricingModal, logout } = useAuth()
  const { t } = useLanguage()
  const planLabel = usePlanLabel()

  if (!user) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={openPricingModal}
          aria-label={t.nav.meterPlus}
          className="hidden xl:inline-flex"
        >
          <Crown className="text-warning" />
          <span>{t.nav.meterPlus}</span>
        </Button>
        <Button variant="outline" size="sm" onClick={() => openAuthModal("login")} aria-label={t.nav.login}>
          <UserRound className="sm:hidden" />
          <span className="hidden sm:inline">{t.nav.login}</span>
        </Button>
        <Button size="sm" onClick={() => openAuthModal("register")} className="hidden sm:inline-flex">
          {t.nav.register}
        </Button>
      </>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="gap-1 px-1" aria-label={t.nav.account} />}
      >
        <span className="hidden max-w-24 truncate pl-1 text-xs sm:inline">{user.name.split(" ")[0]}</span>
        <Avatar className="size-7">
          <AvatarImage src={user.avatarUrl || ""} alt="" />
          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        {isPremium ? <Crown className="text-warning" /> : <ChevronDown className="text-muted-foreground" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs font-bold text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={openPricingModal}>
          <Crown className="text-warning" />
          <span>{planLabel}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => logout()}>
          <LogOut />
          <span>{t.nav.logout}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The same account actions as a flat list, for the mobile "More" sheet. */
export function AccountActions({ onDone }: { onDone: () => void }) {
  const { user, openAuthModal, openPricingModal, logout } = useAuth()
  const { t } = useLanguage()
  const planLabel = usePlanLabel()
  const run = (action: () => void) => () => {
    onDone()
    action()
  }

  return (
    <div className="flex flex-col gap-2">
      {user && (
        <div className="text-xs">
          <p className="font-bold">{user.name}</p>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      )}
      <Button variant="outline" onClick={run(openPricingModal)}>
        <Crown className="text-warning" />
        <span>{planLabel}</span>
      </Button>
      {user ? (
        <Button variant="destructive" onClick={run(() => void logout())}>
          <LogOut />
          <span>{t.nav.logout}</span>
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={run(() => openAuthModal("login"))}>
            {t.nav.login}
          </Button>
          <Button onClick={run(() => openAuthModal("register"))}>{t.nav.register}</Button>
        </div>
      )}
    </div>
  )
}
