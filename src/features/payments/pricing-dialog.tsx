import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { useAuth } from "@/features/auth/auth-context"
import { useLanguage } from "@/features/i18n/language-context"
import { verifyBkashTrxFn, getPaymentConfigFn, type PaymentConfig } from "./bkash-server"
import {
  ShieldCheck,
  Copy,
  Check,
  Crown,
  Sparkles,
  ArrowRight,
  Smartphone,
} from "lucide-react"

export function PricingDialog() {
  const { user, isPricingModalOpen, closePricingModal, openAuthModal, refreshUser } = useAuth()
  const { t, isBangla, formatBDT } = useLanguage()

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

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(bkashNumber)
    setCopiedNumber(true)
    toast.success(isBangla ? "বিকাশ নম্বরটি কপি হয়েছে!" : "bKash number copied to clipboard!")
    setTimeout(() => setCopiedNumber(false), 2000)
  }

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      closePricingModal()
      openAuthModal("login")
      toast.info(isBangla ? "সাবস্ক্রিপশন চালু করতে প্রথমে লগইন করুন।" : "Please sign in to upgrade your subscription.")
      return
    }

    const cleanTrx = trxId.trim().toUpperCase()
    if (!cleanTrx || cleanTrx.length < 8) {
      toast.error(
        isBangla
          ? "অনুগ্রহ করে বিকাশের সঠিক ৮-১২ সংখ্যার Transaction ID (TrxID) দিন।"
          : "Please enter a valid 8-12 character bKash Transaction ID (TrxID)."
      )
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
        toast.error(res.error || (isBangla ? "পেমেন্ট যাচাই করা সম্ভব হয়নি।" : "Could not verify payment."))
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isBangla ? "পেমেন্ট যাচাই ব্যর্থ হয়েছে।" : "Verification failed.")
      toast.error(msg)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Dialog open={isPricingModalOpen} onOpenChange={(open) => !open && closePricingModal()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl">
        <DialogHeader className="text-left space-y-1.5 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Crown className="size-4 text-amber-500 fill-amber-500" />
            <span>{isBangla ? "বিলবাড়ি মেম্বারশিপ" : "BillBari Membership"}</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {t.pricing.modalTitle}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            {t.pricing.modalSubtitle}
          </DialogDescription>
        </DialogHeader>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Plan 1: Meter Plus */}
          <Card
            onClick={() => setSelectedPlan("detective_monthly")}
            className={`p-4 rounded-2xl cursor-pointer transition-all border-2 relative ${
              selectedPlan === "detective_monthly"
                ? "border-amber-500 bg-amber-500/5 shadow-xs"
                : "border-border hover:border-border/80"
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="font-bold text-sm text-foreground">{t.pricing.planMonthlyName}</span>
              <Badge variant="secondary" className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10">
                {t.pricing.planMonthlyTag}
              </Badge>
            </div>
            <div className="flex items-baseline gap-1 my-2">
              <span className="text-2xl font-black text-foreground">{t.pricing.planMonthlyPrice}</span>
              <span className="text-xs text-muted-foreground">{t.pricing.planMonthlyPeriod}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t.pricing.planMonthlyDesc}
            </p>
          </Card>

          {/* Plan 2: Lifetime */}
          <Card
            onClick={() => setSelectedPlan("lifetime")}
            className={`p-4 rounded-2xl cursor-pointer transition-all border-2 relative ${
              selectedPlan === "lifetime"
                ? "border-primary bg-primary/5 shadow-xs"
                : "border-border hover:border-border/80"
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="font-bold text-sm text-foreground">{t.pricing.planLifetimeName}</span>
              <Badge className="text-[10px] font-bold bg-primary text-primary-foreground">
                {t.pricing.planLifetimeTag}
              </Badge>
            </div>
            <div className="flex items-baseline gap-1 my-2">
              <span className="text-2xl font-black text-foreground">{t.pricing.planLifetimePrice}</span>
              <span className="text-xs text-muted-foreground">{t.pricing.planLifetimePeriod}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t.pricing.planLifetimeDesc}
            </p>
          </Card>
        </div>

        {/* Feature List */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-2 text-xs">
          <span className="font-bold text-[11px] text-foreground flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <span>{isBangla ? "প্রিমিয়াম ফিচারে যা যা পাচ্ছেন:" : "What's included in Premium:"}</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-muted-foreground text-[11px]">
            <div className="flex items-center gap-1.5">
              <Check className="size-3 text-emerald-600 shrink-0" />
              <span>{t.pricing.feature1}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-3 text-emerald-600 shrink-0" />
              <span>{t.pricing.feature2}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-3 text-emerald-600 shrink-0" />
              <span>{t.pricing.feature3}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-3 text-emerald-600 shrink-0" />
              <span>{t.pricing.feature4}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-3 text-emerald-600 shrink-0" />
              <span>{t.pricing.feature5}</span>
            </div>
          </div>
        </div>

        {/* bKash Payment Instructions */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Smartphone className="size-4 text-[#D12053]" />
              <span>{t.pricing.bkashHeader}</span>
            </div>
            <Badge variant="outline" className="border-[#D12053]/40 text-[#D12053] text-[11px] font-bold">
              Send Money: {formatBDT(amountToPay)}
            </Badge>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#D12053]/5 border border-[#D12053]/20 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-muted-foreground block">{t.pricing.bkashNumberLabel}</span>
                <span className="text-base font-extrabold text-foreground font-mono tracking-wider">
                  {bkashNumber}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyNumber}
                className="h-8 text-xs gap-1 border-[#D12053]/30 text-[#D12053] hover:bg-[#D12053]/10"
              >
                {copiedNumber ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                <span>{copiedNumber ? (isBangla ? "কপি হয়েছে" : "Copied") : (isBangla ? "নম্বর কপি" : "Copy")}</span>
              </Button>
            </div>

            <ol className="list-decimal list-inside space-y-1 text-[11px] text-muted-foreground border-t border-[#D12053]/15 pt-2">
              <li>{isBangla ? "বিকাশ অ্যাপ ওপেন করে Send Money অপশনে যান।" : "Open your bKash app and tap Send Money."}</li>
              <li>
                {isBangla
                  ? `উপরের নম্বরে ঠিক ${formatBDT(amountToPay)} টাকা পাঠিয়ে দিন।`
                  : `Send exact ${formatBDT(amountToPay)} to the number above.`}
              </li>
              <li>
                {isBangla
                  ? "লেনদেন সফল হলে প্রাপ্ত Transaction ID (TrxID) নিচে লিখে যাচাই করুন।"
                  : "Copy the Transaction ID (TrxID) received via SMS and paste below to activate."}
              </li>
            </ol>
          </div>

          {/* Verification Form */}
          {!user ? (
            <div className="p-4 rounded-2xl bg-muted/60 border text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                {isBangla
                  ? "পেমেন্ট যাচাই ও সাবস্ক্রিপশন চালু করতে প্রথমে আপনার বিলবাড়ি একাউন্টে লগইন করুন।"
                  : "Please sign in to your BillBari account before verifying payment."}
              </p>
              <Button
                size="sm"
                onClick={() => {
                  closePricingModal()
                  openAuthModal("login")
                }}
                className="gap-1.5 text-xs font-semibold"
              >
                <span>{t.nav.login}</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          ) : (
            <Form onSubmit={handleVerifyPayment} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    {isBangla ? "বিকাশ Transaction ID (TrxID) *" : "bKash Transaction ID (TrxID) *"}
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder={t.pricing.trxInputPlaceholder}
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="h-10 text-xs font-mono uppercase tracking-wider bg-background"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">
                    {isBangla ? "প্রেরক বিকাশ মোবাইল নম্বর (ঐচ্ছিক)" : "Sender bKash Number (Optional)"}
                  </Label>
                  <Input
                    type="tel"
                    placeholder="01712345678"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    className="h-10 text-xs font-mono bg-background"
                    maxLength={14}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isVerifying || !trxId.trim()}
                className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold bg-[#D12053] hover:bg-[#b01944] text-white gap-2 shadow-xs cursor-pointer"
              >
                {isVerifying ? (
                  <span>{t.pricing.verifyingBtn}</span>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    <span>
                      {isBangla
                        ? `যাচাই করুন ও ${selectedPlan === "lifetime" ? t.pricing.planLifetimeName : t.pricing.planMonthlyName} চালু করুন`
                        : `Verify & Activate ${selectedPlan === "lifetime" ? t.pricing.planLifetimeName : t.pricing.planMonthlyName}`}
                    </span>
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
