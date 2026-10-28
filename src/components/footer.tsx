import { PhoneCall, ShieldCheck, ExternalLink, Zap } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t border-border/80 bg-muted/30 py-8 text-xs text-muted-foreground mt-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border/60">
          <div className="space-y-1.5 max-w-md">
            <div className="flex items-center gap-2 text-foreground font-bold">
              <Zap className="size-4 text-primary fill-current" />
              <span className="text-base font-extrabold">বিলবাড়ি</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              নেসকো প্রিপেইড গ্রাহকদের জন্য বিদ্যুৎ খরচ, রিচার্জ ও প্রতিদিনের ব্যয়ের সহজ হিসাব রাখার পোর্টাল।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-background border border-border">
              <PhoneCall className="size-4 text-primary shrink-0" />
              <div>
                <span className="text-[10px] text-muted-foreground block">নেসকো হেল্পলাইন</span>
                <span className="font-bold text-foreground">১৬৬০৩ (16603)</span>
              </div>
            </div>

            <a
              href="https://customer.nesco.gov.bd/pre/panel"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 p-2.5 rounded-xl bg-background border border-border hover:border-primary/40 transition-colors text-foreground font-medium"
            >
              <span>সরকারি ওয়েবসাইট</span>
              <ExternalLink className="size-3 text-muted-foreground" />
            </a>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>আপনার তথ্যের শতভাগ নিরাপত্তা নিশ্চিত করা হয়।</span>
          </div>
          <div>
            © 2026 বিলবাড়ি। বাংলাদেশ এনার্জি রেগুলেটরি কমিশনের রেট অনুযায়ী প্রস্তুতকৃত।
          </div>
        </div>
      </div>
    </footer>
  )
}
