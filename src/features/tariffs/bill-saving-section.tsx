import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/features/i18n/language-context"
import {
  BILL_SAVING_TIPS,
  type SavingCategory,
} from "./bill-saving-advice"
import {
  Wind,
  Zap,
  Sparkles,
  Home,
  Refrigerator,
  CookingPot,
  Flame,
  Droplets,
  CheckCircle2,
  Shirt,
  ShowerHead,
  AlertTriangle,
  CreditCard,
  Lightbulb,
  Laptop,
  Sun,
  Search,
  TrendingDown,
} from "lucide-react"

function renderAdviceIcon(iconName: string, className = "size-4") {
  switch (iconName) {
    case "Wind":
      return <Wind className={className} />
    case "Zap":
      return <Zap className={className} />
    case "Sparkles":
      return <Sparkles className={className} />
    case "Home":
      return <Home className={className} />
    case "Refrigerator":
      return <Refrigerator className={className} />
    case "CookingPot":
      return <CookingPot className={className} />
    case "Flame":
      return <Flame className={className} />
    case "Droplets":
      return <Droplets className={className} />
    case "CheckCircle2":
      return <CheckCircle2 className={className} />
    case "Shirt":
      return <Shirt className={className} />
    case "ShowerHead":
      return <ShowerHead className={className} />
    case "AlertTriangle":
      return <AlertTriangle className={className} />
    case "CreditCard":
      return <CreditCard className={className} />
    case "Lightbulb":
      return <Lightbulb className={className} />
    case "Laptop":
      return <Laptop className={className} />
    case "Sun":
      return <Sun className={className} />
    default:
      return <Zap className={className} />
  }
}

export function BillSavingSection() {
  const { isBangla, formatBDT, formatNumber } = useLanguage()
  const [activeCategory, setActiveCategory] = React.useState<SavingCategory>("all")
  const [searchQuery, setSearchQuery] = React.useState<string>("")

  const filteredTips = React.useMemo(() => {
    return BILL_SAVING_TIPS.filter((tip) => {
      const matchesCategory =
        activeCategory === "all" || tip.category === activeCategory

      if (!searchQuery.trim()) return matchesCategory

      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        tip.titleBangla.toLowerCase().includes(q) ||
        tip.titleEnglish.toLowerCase().includes(q) ||
        tip.descriptionBangla.toLowerCase().includes(q) ||
        tip.descriptionEnglish.toLowerCase().includes(q) ||
        tip.actionBangla.toLowerCase().includes(q) ||
        tip.actionEnglish.toLowerCase().includes(q)

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  // Total potential cumulative savings calculation
  const totalPotentialSavings = React.useMemo(() => {
    return BILL_SAVING_TIPS.reduce((sum, tip) => sum + tip.savingsBdtPerMonth, 0)
  }, [])

  const categories: { id: SavingCategory; labelBangla: string; labelEnglish: string }[] = [
    { id: "all", labelBangla: "সব পরামর্শ", labelEnglish: "All Strategies" },
    { id: "ac_cooling", labelBangla: "❄️ এসি ও কুলিং", labelEnglish: "❄️ AC & Cooling" },
    { id: "kitchen", labelBangla: "🍳 ফ্রিজ ও রান্নাঘর", labelEnglish: "🍳 Fridge & Kitchen" },
    { id: "heavy_loads", labelBangla: "⚡ পাম্প ও ভারী যন্ত্র", labelEnglish: "⚡ Pump & Motors" },
    { id: "slab_habits", labelBangla: "📊 স্ল্যাব ও মিটার কৌশল", labelEnglish: "📊 Slab Habits" },
    { id: "standby_lighting", labelBangla: "🔌 স্ট্যান্ডবাই ড্রেন", labelEnglish: "🔌 Standby & Lighting" },
    { id: "renewable_voltage", labelBangla: "☀️ সোলার ও ভোল্টেজ", labelEnglish: "☀️ Solar & Voltage" },
  ]

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="rounded-2xl border shadow-xs overflow-hidden bg-linear-to-br from-primary/10 via-background to-muted/30">
        <CardContent className="p-5 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary text-primary-foreground shadow-xs">
                  <TrendingDown className="size-4" />
                </span>
                <Badge variant="outline" className="text-xs bg-background/80 border-primary/30 text-primary font-bold">
                  {isBangla ? "বাস্তব জীবনরক্ষাকারী কৌশল" : "Proven Efficiency Playbook"}
                </Badge>
              </div>
              <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-foreground">
                {isBangla
                  ? "বিদ্যুৎ বিল সাশ্রয়ের জাদুকরী টিপস ও গাইড"
                  : "Proven Electricity Bill Saving Strategies"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isBangla
                  ? "নেসকো প্রিপেইড মিটারে প্রতি মাসে ৳১,৫০০ থেকে ৳৩,০০০ পর্যন্ত বিল কমানোর ২০+ পরীক্ষিত ও প্রকৌশলগত সাশ্রয়ী উপায়।"
                  : "Battle-tested adjustments and daily habits to slash ৳1,500 - ৳3,000 off your monthly prepaid power bills."}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-background border border-border/80 shadow-xs text-center shrink-0 space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground block">
                {isBangla ? "সম্মিলিত মাসিক সাশ্রয় সম্ভাবনা:" : "Total Monthly Potential:"}
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ~{formatBDT(totalPotentialSavings)}
              </div>
              <span className="text-[10px] text-muted-foreground block">
                {isBangla ? "২০টি পরামর্শের সমন্বয়ে" : "across 20 actionable strategies"}
              </span>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="space-y-3 pt-2">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={
                  isBangla
                    ? "টিপস খুঁজুন (যেমন: এসি, ফ্রিজ, পাম্প, স্ল্যাব, ইস্ত্রি)..."
                    : "Search tips (e.g. AC, fridge, pump, slab, iron, standby)..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-xs bg-background rounded-xl"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {isBangla ? cat.labelBangla : cat.labelEnglish}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTips.map((tip) => (
          <Card
            key={tip.id}
            className="rounded-2xl border shadow-xs overflow-hidden hover:border-primary/40 transition-all flex flex-col justify-between"
          >
            <CardHeader className="pb-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                    {renderAdviceIcon(tip.iconName, "size-4")}
                  </span>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground leading-snug">
                      {isBangla ? tip.titleBangla : tip.titleEnglish}
                    </CardTitle>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {isBangla ? tip.categoryBangla : tip.categoryEnglish}
                    </span>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 font-bold px-2 py-0.5 rounded-full ${
                    tip.impact === "high"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : tip.impact === "pro"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      : "bg-primary/10 text-primary border-primary/30"
                  }`}
                >
                  {tip.impact === "high"
                    ? isBangla
                      ? "বিশাল সাশ্রয়"
                      : "High Impact"
                    : tip.impact === "pro"
                    ? isBangla
                      ? "প্রো টেকনিক"
                      : "Pro Technique"
                    : isBangla
                    ? "মাঝারি সাশ্রয়"
                    : "Medium Impact"}
                </Badge>
              </div>

              <CardDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
                {isBangla ? tip.descriptionBangla : tip.descriptionEnglish}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              {/* Action Box */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-foreground text-[11px]">
                  <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                  <span>{isBangla ? "করণীয় পদক্ষেপ:" : "Actionable Step:"}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {isBangla ? tip.actionBangla : tip.actionEnglish}
                </p>
              </div>

              {/* Savings & Fact Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <TrendingDown className="size-3.5 shrink-0" />
                  <span>
                    {isBangla ? "সাশ্রয়:" : "Est. Save:"} ~{formatBDT(tip.savingsBdtPerMonth)}
                    {tip.savingsPct ? ` (${formatNumber(tip.savingsPct)}%)` : ""}/
                    {isBangla ? "মাস" : "mo"}
                  </span>
                </div>

                {tip.factBangla && (
                  <span className="text-[11px] text-muted-foreground truncate max-w-[200px]" title={isBangla ? tip.factBangla : tip.factEnglish}>
                    {isBangla ? tip.factBangla : tip.factEnglish}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTips.length === 0 && (
          <div className="col-span-full p-8 text-center rounded-2xl border border-dashed border-border text-muted-foreground space-y-2">
            <Search className="size-8 mx-auto text-muted-foreground/60" />
            <p className="text-sm font-medium">
              {isBangla
                ? "আপনার সার্চের সাথে মিলে এমন কোনো পরামর্শ পাওয়া যায়নি।"
                : "No saving tips matched your search query."}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                setActiveCategory("all")
              }}
              className="text-xs font-semibold text-primary underline cursor-pointer"
            >
              {isBangla ? "সব পরামর্শ দেখুন" : "View all strategies"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
