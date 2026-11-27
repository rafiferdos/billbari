import * as React from "react"
import { ArrowRight, Check, Copy, Crown, ShieldCheck, Smartphone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { useAuth } from "@/features/auth/auth-context"
import { useLanguage } from "@/features/i18n/language-context"
import { cn } from "@/lib/utils"
import { getPaymentConfigFn, verifyBkashTrxFn, type PaymentConfig } from "./bkash-server"
import { PlanFeatures } from "./plan-features"
import { PAYMENT_PLANS } from "./types"

export function PricingDialog() {
  const { user, isPricingModalOpen, closePricingModal, openAuthModal, refreshUser } = useAuth()
  const { t, isBangla, formatBDT, formatNumber } = useLanguage()

  const [config, setConfig] = React.useState<PaymentConfig | null>(null)
  const [selectedPlan, setSelectedPlan] = React.useState<"detective_monthly" | "lifetime">("detective_monthly")
  const [trxId, setTrxId] = React.useState("")
  const [senderNumber, setSenderNumber] = React.useState("")
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [copiedNumber, setCopiedNumber] = React.useState(false)

  React.useEffect(() => {
    if (isPricingModalOpen) {
      getPaymentConfigFn().then(setConfig).catch(console.error)
    }
  }, [isPricingModalOpen])

  const bkashNumber = config?.bkashNumber || "01784912345"
  const amountToPay = selectedPlan === "lifetime" ? 100 : 20
  const planName = selectedPlan === "lifetime" ? t.pricing.planLifetimeName : t.pricing.planMonthlyName

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(bkashNumber)
    setCopiedNumber(true)
    toast.success(t.pricing.numberCopied)
    setTimeout(() => setCopiedNumber(false), 2000)
  }

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      closePricingModal()
      openAuthModal("login")
      toast.info(t.pricing.signInFirst)
      return
    }

    const cleanTrx = trxId.trim().toUpperCase()
    if (!cleanTrx || cleanTrx.length < 8) {
      toast.error(t.pricing.badTrx)
      return
    }

    setIsVerifying(true)
    try {
      const res = await verifyBkashTrxFn({
        data: {
          planType: selectedPlan,
          trxId: cleanTrx,
          senderNumber: senderNumber.trim(),
        },
      })

      if (res.success) {
        toast.success(res.message)
        await refreshUser()
        closePricingModal()
        setTrxId("")
        setSenderNumber("")
      } else {
        toast.error(res.error || t.pricing.verifyFailed)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.pricing.verifyFailed)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Dialog open={isPricingModalOpen} onOpenChange={(open) => !open && closePricingModal()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-5 sm:max-w-xl sm:p-6">
        <DialogHeader className="border-b border-border pr-10 pb-2 text-left">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown aria-hidden className="size-5 text-warning" />
            {t.pricing.modalTitle}
          </DialogTitle>
          <DialogDescription>{t.pricing.modalSubtitle}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {PAYMENT_PLANS.map((plan) => {
            const isLifetime = plan.id === "lifetime"
            const isSelected = selectedPlan === plan.id
            return (
              <Button
                key={plan.id}
                type="button"
                variant="outline"
                aria-pressed={isSelected}
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  "h-auto flex-col items-stretch justify-start gap-2 p-4 text-left whitespace-normal",
                  isSelected && "border-primary ring-2 ring-primary"
                )}
              >
                <span className="flex items-center justify-between gap-1">
                  <span className="text-sm font-bold">
                    {isLifetime ? t.pricing.planLifetimeName : t.pricing.planMonthlyName}
                  </span>
                  <Badge variant={isLifetime ? "default" : "secondary"}>
                    {isLifetime ? t.pricing.planLifetimeTag : t.pricing.planMonthlyTag}
                  </Badge>
                </span>
                <span className="flex items-baseline gap-1">
                  <span className="num text-2xl font-bold">
                    {isLifetime ? t.pricing.planLifetimePrice : t.pricing.planMonthlyPrice}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isLifetime ? t.pricing.planLifetimePeriod : t.pricing.planMonthlyPeriod}
                  </span>
                </span>
                {(isBangla ? plan.features : plan.featuresEnglish).map((line) => (
                  <span key={line} className="flex items-start gap-1.5 text-xs font-normal text-muted-foreground">
                    <Check aria-hidden className="mt-0.5 text-primary" />
                    {line}
                  </span>
                ))}
              </Button>
            )
          })}
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-3.5">
          <PlanFeatures />
        </div>

        {/* bKash Payment Instructions */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Smartphone aria-hidden className="size-4 text-primary" />
              <span>{t.pricing.bkashHeader}</span>
            </div>
            <Badge variant="outline" className="shrink-0 border-primary text-primary">
              Send Money: {formatBDT(amountToPay)}
            </Badge>
          </div>

          <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-primary/5 p-3.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="block text-muted-foreground">{t.pricing.bkashNumberLabel}</span>
                <span className="num text-base font-bold tracking-wider">{bkashNumber}</span>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleCopyNumber}>
                {copiedNumber ? <Check /> : <Copy />}
                <span>{copiedNumber ? t.common.copied : t.pricing.copyNumber}</span>
              </Button>
            </div>

            <ol className="list-inside list-decimal space-y-1 border-t border-border pt-2 text-muted-foreground">
              <li>{t.pricing.stepOpen}</li>
              <li>{t.pricing.stepSend.replace("{amount}", formatBDT(amountToPay))}</li>
              <li>{t.pricing.stepPaste}</li>
            </ol>
          </div>

          {/* Verification Form */}
          {!user ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted p-4 text-center">
              <p className="text-xs text-muted-foreground">{t.pricing.signInToVerify}</p>
              <Button
                size="sm"
                onClick={() => {
                  closePricingModal()
                  openAuthModal("login")
                }}
              >
                <span>{t.nav.login}</span>
                <ArrowRight />
              </Button>
            </div>
          ) : (
            <Form onSubmit={handleVerifyPayment} className="flex flex-col gap-3">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="bkash-trx">{t.pricing.trxLabel}</Label>
                  <Input
                    id="bkash-trx"
                    type="text"
                    required
                    placeholder={t.pricing.trxInputPlaceholder}
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="num tracking-wider uppercase"
                    maxLength={14}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="bkash-sender">{t.pricing.senderLabel}</Label>
                  <Input
                    id="bkash-sender"
                    type="tel"
                    placeholder={formatNumber("01XXXXXXXXX")}
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    className="num"
                    maxLength={14}
                  />
                </div>
              </div>

              <Button type="submit" size="lg" disabled={isVerifying || !trxId.trim()} className="w-full whitespace-normal">
                {isVerifying ? (
                  <span>{t.pricing.verifyingBtn}</span>
                ) : (
                  <>
                    <ShieldCheck />
                    <span>{t.pricing.activate.replace("{plan}", planName)}</span>
                  </>
                )}
              </Button>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
