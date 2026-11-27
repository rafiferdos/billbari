import { Link } from "@tanstack/react-router"
import { Button, buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { useLanguage } from "@/features/i18n/language-context"
import { cn } from "@/lib/utils"

const LINK = cn(buttonVariants({ variant: "link", size: "sm" }), "px-0")

export function Footer() {
  const { openPricingModal } = useAuth()
  const { t, formatNumber } = useLanguage()

  return (
    // the extra bottom padding keeps the dock from covering the last lines
    <footer className="mt-(--bb-section-gap) border-t-(length:--bb-border-w) border-border py-6 text-xs text-muted-foreground max-lg:nav-dock:pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <div className="page-shell flex flex-col gap-3">
        <p className="max-w-prose leading-relaxed">{t.footer.disclaimer}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link to="/help" className={LINK}>
            {t.nav.help}
          </Link>
          <Button variant="link" size="sm" className="px-0" onClick={openPricingModal}>
            {t.footer.pricing}
          </Button>
          <a href="tel:16603" className={LINK}>
            {t.footer.helpline}
          </a>
          <a href="https://customer.nesco.gov.bd/pre/panel" target="_blank" rel="noopener noreferrer" className={LINK}>
            {t.footer.portal}
          </a>
          <span className="ml-auto">
            © {formatNumber(2026)} {t.brand.name}. {t.footer.copyright}
          </span>
        </div>
      </div>
    </footer>
  )
}
