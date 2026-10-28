import { PhoneCall, ShieldCheck, ExternalLink, Zap } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t border-border/80 bg-muted/30 py-8 text-xs text-muted-foreground mt-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border/60">
          <div className="space-y-1.5 max-w-md">
            <div className="flex items-center gap-2 text-foreground font-bold">
              <Zap className="size-4 text-primary fill-current" />
              <span>BillBari (বিলবাড়ি)</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              নেসকো প্রিপেইড গ্রাহকদের জন্য আধুনিক বিদ্যুৎ ব্যয় ট্র্যাকিং, স্ল্যাব বিশ্লেষণ এবং দৈনিক খরচের স্মার্ট প্ল্যাটফর্ম।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-background border border-border">
              <PhoneCall className="size-4 text-primary shrink-0" />
              <div>
                <span className="text-[10px] text-muted-foreground block">নেসকো জাতীয় হটলাইন</span>
                <span className="font-bold text-foreground">১৬৬০৩ (16603)</span>
              </div>
            </div>

            <a
              href="https://customer.nesco.gov.bd/pre/panel"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 p-2.5 rounded-xl bg-background border border-border hover:border-primary/40 transition-colors text-foreground font-medium"
            >
              <span>অফিশিয়াল পোর্টাল</span>
              <ExternalLink className="size-3 text-muted-foreground" />
            </a>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>কোনো মিটার পাসওয়ার্ড সংরক্ষণ করা হয় না। সকল হিসাব স্থানীয়ভাবে সুরক্ষিত।</span>
          </div>
          <div>
            © 2026 BillBari Platform. All calculations based on BERC NESCO LT-A Tariffs.
          </div>
        </div>
      </div>
    </footer>
  )
}
