import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { useAuth } from "@/features/auth/auth-context"
import { verifyBkashTrxFn, getPaymentConfigFn, type PaymentConfig } from "./bkash-server"
import { formatBDT } from "@/lib/bangla"
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Crown,
  Sparkles,
  ArrowRight,
  Smartphone,
} from "lucide-react"

export function PricingDialog() {
  const { user, isPremium, isPricingModalOpen, closePricingModal, openAuthModal, refreshUser } = useAuth()
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
    toast.success("বিকাশ নম্বরটি কপি হয়েছে!")
    setTimeout(() => setCopiedNumber(false), 2000)
  }

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      closePricingModal()
      openAuthModal("login")
      toast.info("সাবস্ক্রিপশন চালু করতে প্রথমে লগইন করুন।")
      return
    }

    const cleanTrx = trxId.trim().toUpperCase()
    if (!cleanTrx || cleanTrx.length < 8) {
      toast.error("অনুগ্রহ করে বিকাশের সঠিক ৮-১২ সংখ্যার Transaction ID (TrxID) দিন।")
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
        toast.error(res.error || "পেমেন্ট যাচাই করা সম্ভব হয়নি।")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "পেমেন্ট যাচাই ব্যর্থ হয়েছে।"
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
            <span>বিলবাড়ি প্রিমিয়াম সদস্যপদ</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-extrabold tracking-tight">
            মিটার প্লাস — সহজ ও গভীর হিসাব
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            প্রতিদিনের নিখুঁত বিদ্যুৎ খরচের হিসাব, ব্যালেন্স শেষ হওয়ার নির্ভুল ভবিষ্যৎবাণী এবং ক্লাউড মিটার ডাটাবেস সেভ।
          </DialogDescription>
        </DialogHeader>

        {/* If user is already active premium */}
        {isPremium && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold block text-sm">
                  আপনি বর্তমানে প্রিমিয়াম সদস্য ({user?.tierNameBangla})
                </span>
                <span className="text-[11px] opacity-80">
                  {user?.subscriptionExpiresAt
                    ? `মেয়াদ শেষ হবে: ${new Date(user.subscriptionExpiresAt).toLocaleDateString("bn-BD")}`
                    : "আপনার একাউন্টে আজীবন সদস্যপদ সক্রিয় রয়েছে!"}
                </span>
              </div>
            </div>
            <Badge className="bg-emerald-600 text-white font-semibold">সক্রিয়</Badge>
          </div>
        )}

        {/* Pricing Plan Selector */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            পরিকল্পনা নির্বাচন করুন:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Monthly Plan */}
            <Card
              onClick={() => setSelectedPlan("detective_monthly")}
              className={`p-4 rounded-2xl cursor-pointer transition-all border-2 relative ${
                selectedPlan === "detective_monthly"
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-border/70 hover:border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="secondary" className="text-[10px] font-semibold text-primary mb-1">
                    জনপ্রিয় মাসিক প্ল্যান
                  </Badge>
                  <h4 className="font-extrabold text-base text-foreground">মিটার প্লাস</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    দৈনন্দিন খরচ ও মিটারের গভীর হিসাব
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-foreground font-mono">৳২০</div>
                  <span className="text-[10px] text-muted-foreground">/ ৩০ দিন</span>
                </div>
              </div>
            </Card>

            {/* Lifetime Plan */}
            <Card
              onClick={() => setSelectedPlan("lifetime")}
              className={`p-4 rounded-2xl cursor-pointer transition-all border-2 relative ${
                selectedPlan === "lifetime"
                  ? "border-amber-500 bg-amber-500/5 shadow-xs"
                  : "border-border/70 hover:border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold mb-1">
                    সেরা সাশ্রয়ী অফার
                  </Badge>
                  <h4 className="font-extrabold text-base text-foreground">প্রিমিয়াম আনলিমিটেড</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    এককালীন মেম্বারশিপ, চিরদিনের এক্সেস
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-foreground font-mono">৳১০০</div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">এককালীন আজীবন</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Features included */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-2">
          <span className="font-bold text-foreground text-xs block flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <span>এই সাবস্ক্রিপশনে যা যা অন্তর্ভুক্ত:</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Check className="size-3 text-emerald-600 shrink-0" />
              <span>প্রতিদিনের গড় খরচ ও ব্যালেন্স রানওয়ে</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-3 text-emerald-600 shrink-0" />
              <span>ব্যালেন্স শেষ হওয়ার সুনির্দিষ্ট দিন ও বার</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-3 text-emerald-600 shrink-0" />
              <span>আনলিমিটেড মিটার ক্লাউড ডাটাবেস সেভ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-3 text-emerald-600 shrink-0" />
              <span>ট্যারিফ ধাপ ৪-থেকে-৫ জাম্প সতর্কতা শিল্ড</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-3 text-emerald-600 shrink-0" />
              <span>রিচার্জে কাটা চার্জ ও ১% সরকারি রিবেট রসিদ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-3 text-emerald-600 shrink-0" />
              <span>প্রতিদিনের মিটার স্ন্যাপশট ও ফটো হিস্ট্রি</span>
            </div>
          </div>
        </div>

        {/* bKash Payment Instructions */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Smartphone className="size-4 text-[#D12053]" />
              <span>বিকাশ (bKash) সেন্ড মানি নির্দেশিকা:</span>
            </div>
            <Badge variant="outline" className="border-[#D12053]/40 text-[#D12053] text-[11px] font-bold">
              Send Money: {formatBDT(amountToPay)}
            </Badge>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#D12053]/5 border border-[#D12053]/20 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-muted-foreground block">বিলবাড়ি বিকাশ পার্সোনাল নম্বর:</span>
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
                <span>{copiedNumber ? "কপি হয়েছে" : "নম্বর কপি"}</span>
              </Button>
            </div>

            <ol className="list-decimal list-inside space-y-1 text-[11px] text-muted-foreground border-t border-[#D12053]/15 pt-2">
              <li>বিকাশ অ্যাপ ওপেন করে <strong>Send Money</strong> অপশনে যান।</li>
              <li>উপরের নম্বরে ঠিক <strong>{formatBDT(amountToPay)}</strong> টাকা পাঠিয়ে দিন।</li>
              <li>লেনদেন সফল হলে প্রাপ্ত <strong>Transaction ID (TrxID)</strong> নিচে লিখে যাচাই করুন।</li>
            </ol>
          </div>

          {/* Verification Form */}
          {!user ? (
            <div className="p-4 rounded-2xl bg-muted/60 border text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                পেমেন্ট যাচাই ও সাবস্ক্রিপশন চালু করতে প্রথমে আপনার বিলবাড়ি একাউন্টে লগইন করুন।
              </p>
              <Button
                size="sm"
                onClick={() => {
                  closePricingModal()
                  openAuthModal("login")
                }}
                className="gap-1.5 text-xs font-semibold"
              >
                <span>লগইন করুন</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleVerifyPayment} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    বিকাশ Transaction ID (TrxID) *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="উদা: BL57A1X9K2"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="h-10 text-xs font-mono uppercase tracking-wider bg-background"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    প্রেরক বিকাশ মোবাইল নম্বর (ঐচ্ছিক)
                  </label>
                  <Input
                    type="tel"
                    placeholder="উদা: ০১৭১২৩৪৫৬৭৮"
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
                className="w-full h-11 rounded-xl text-xs sm:text-sm font-bold bg-[#D12053] hover:bg-[#b01944] text-white gap-2 shadow-xs"
              >
                {isVerifying ? (
                  <span>যাচাই ও সক্রিয় করা হচ্ছে...</span>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    <span>যাচাই করুন ও {selectedPlan === "lifetime" ? "প্রিমিয়াম আনলিমিটেড" : "মিটার প্লাস"} চালু করুন</span>
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
