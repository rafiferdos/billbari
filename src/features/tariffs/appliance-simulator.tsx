import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  APPLIANCES,
  HOUSEHOLD_PRESETS,
  calculateMonthlyUnits,
  type ApplianceCategory,
  type ApplianceItem,
  type HouseholdPreset,
} from "./appliance-data"
import { calculateNescoBill } from "@/lib/tariff-constants"
import { formatBDT, toBanglaNumber } from "@/lib/bangla"
import {
  Wind,
  Flame,
  Tv,
  Coffee,
  Laptop,
  Droplets,
  Zap,
  Sparkles,
  Home,
  Shirt,
  Utensils,
  Lightbulb,
  Refrigerator,
  CookingPot,
  ShowerHead,
  Wifi,
  Plus,
  Minus,
  RotateCcw,
  ArrowUpRight,
  SlidersHorizontal,
  Check,
  CheckCircle2,
} from "lucide-react"

function renderIcon(iconName: string, className: string = "size-4") {
  switch (iconName) {
    case "Wind":
      return <Wind className={className} />
    case "Flame":
      return <Flame className={className} />
    case "Tv":
      return <Tv className={className} />
    case "Coffee":
      return <Coffee className={className} />
    case "Laptop":
      return <Laptop className={className} />
    case "Droplets":
      return <Droplets className={className} />
    case "Zap":
      return <Zap className={className} />
    case "Sparkles":
      return <Sparkles className={className} />
    case "Home":
      return <Home className={className} />
    case "Shirt":
      return <Shirt className={className} />
    case "Utensils":
      return <Utensils className={className} />
    case "Lightbulb":
      return <Lightbulb className={className} />
    case "Refrigerator":
      return <Refrigerator className={className} />
    case "CookingPot":
      return <CookingPot className={className} />
    case "ShowerHead":
      return <ShowerHead className={className} />
    case "Wifi":
      return <Wifi className={className} />
    default:
      return <Zap className={className} />
  }
}

interface ApplianceSimulatorProps {
  onApplyUnits: (units: number) => void
  currentUnits: number
}

export function ApplianceSimulator({ onApplyUnits, currentUnits }: ApplianceSimulatorProps) {
  // Appliance counts state: id -> count
  const [counts, setCounts] = React.useState<Record<string, number>>(() => {
    // Default to Standard Family
    const defaultPreset = HOUSEHOLD_PRESETS.find((p) => p.id === "standard_family")
    return defaultPreset ? { ...defaultPreset.counts } : {}
  })

  // Selected Preset ID (if matches)
  const [activePresetId, setActivePresetId] = React.useState<string>("standard_family")
  const [selectedCategory, setSelectedCategory] = React.useState<ApplianceCategory>("all")
  const [copiedApplied, setCopiedApplied] = React.useState<boolean>(false)

  // Update count for an appliance
  const updateCount = (id: string, delta: number) => {
    setActivePresetId("") // custom state
    setCounts((prev) => {
      const current = prev[id] || 0
      const next = Math.max(0, Math.min(20, current + delta))
      if (next === 0) {
        const copy = { ...prev }
        delete copy[id]
        return copy
      }
      return { ...prev, [id]: next }
    })
  }

  // Set explicit count
  const applyPreset = (preset: HouseholdPreset) => {
    setActivePresetId(preset.id)
    setCounts({ ...preset.counts })
  }

  // Clear all
  const clearAll = () => {
    setActivePresetId("")
    setCounts({})
  }

  // Calculate totals and insights
  const { totalKwh, totalDevices, topConsumer, breakdownList } = React.useMemo(() => {
    let kwhSum = 0
    let deviceSum = 0
    let highestKwh = 0
    let highestItem: ApplianceItem | null = null

    const list: { item: ApplianceItem; count: number; kwh: number }[] = []

    for (const item of APPLIANCES) {
      const count = counts[item.id] || 0
      if (count > 0) {
        const kwh = calculateMonthlyUnits(item, count)
        kwhSum += kwh
        deviceSum += count
        list.push({ item, count, kwh })

        if (kwh > highestKwh) {
          highestKwh = kwh
          highestItem = item
        }
      }
    }

    const roundedKwh = Math.round(kwhSum)

    return {
      totalKwh: roundedKwh,
      totalDevices: deviceSum,
      topConsumer: highestItem
        ? {
            name: highestItem.nameBangla,
            kwh: highestKwh,
            percent: kwhSum > 0 ? Math.round((highestKwh / kwhSum) * 100) : 0,
          }
        : null,
      breakdownList: list.sort((a, b) => b.kwh - a.kwh),
    }
  }, [counts])

  // Calculated estimated bill for these units
  const estimatedBill = React.useMemo(() => {
    if (totalKwh <= 0) return { totalBill: 0, activeStep: { nameBangla: "০ ইউনিট" } }
    return calculateNescoBill(totalKwh, 2, true)
  }, [totalKwh])

  const handleApply = () => {
    onApplyUnits(totalKwh)
    setCopiedApplied(true)
    setTimeout(() => setCopiedApplied(false), 2500)

    // Smooth scroll to main calculator
    const el = document.getElementById("main-calculator-top")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Filter appliances for display
  const filteredAppliances = React.useMemo(() => {
    if (selectedCategory === "all") return APPLIANCES
    return APPLIANCES.filter((a) => a.category === selectedCategory)
  }, [selectedCategory])

  return (
    <div className="space-y-6">
      {/* Simulator Section Header */}
      <Card className="rounded-2xl border shadow-xs overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <SlidersHorizontal className="size-4" />
                </span>
                <CardTitle className="text-base sm:text-lg font-bold">
                  ঘরের যন্ত্রপাতি পিকার ও আনুমানিক খরচ সিমুলেটর
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                আপনার বাসায় বা রুমে কী কী যন্ত্রপাতি আছে নির্বাচন করুন — স্বয়ংক্রিয়ভাবে মাসিক বিদ্যুৎ খরচ ও বিল বের হবে
              </CardDescription>
            </div>

            {/* Clear Button */}
            {totalDevices > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1 self-start sm:self-auto"
              >
                <RotateCcw className="size-3" />
                <span>সব মুছুন</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground block">
              বাসার ধরন অনুযায়ী রেডিমেড প্রোফাইল বাছুন (১-ক্লিকে সেট করুন):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {HOUSEHOLD_PRESETS.map((p) => {
                const isActive = activePresetId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isActive
                        ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30"
                        : "bg-background hover:bg-muted/60 border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="p-1 rounded-md bg-muted text-primary">
                        {renderIcon(p.iconName, "size-3")}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {p.tagBangla}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-foreground truncate">
                      {p.nameBangla}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {p.subtitleBangla}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Real-time Result Summary Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-primary/10 border border-primary/20 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  মোট নির্বাচিত যন্ত্রপাতি
                </span>
                <div className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">
                  {toBanglaNumber(totalDevices)} <span className="text-xs font-normal">টি</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  মাসিক আনুমানিক বিদ্যুৎ
                </span>
                <div className="text-xl sm:text-2xl font-extrabold text-primary font-mono">
                  {toBanglaNumber(totalKwh)} <span className="text-xs font-normal">kWh</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  সম্ভাব্য মাসিক বিল
                </span>
                <div className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">
                  {formatBDT(estimatedBill.totalBill)}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  আনুমানিক ট্যারিফ ধাপ
                </span>
                <div className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {estimatedBill.activeStep.nameBangla}
                </div>
              </div>
            </div>

            {/* Smart Highlight & Apply CTA */}
            <div className="pt-2 border-t border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground space-y-1">
                {topConsumer ? (
                  <div>
                    ⚡ সর্বোচ্চ বিদ্যুৎ খরচ: <strong>{topConsumer.name}</strong> (মোট ব্যবহারের{" "}
                    <strong>{toBanglaNumber(topConsumer.percent)}%</strong> বা{" "}
                    <strong>{toBanglaNumber(Math.round(topConsumer.kwh))} kWh</strong>)
                  </div>
                ) : (
                  <div>নিচের তালিকা থেকে যন্ত্রপাতির সংখ্যা বাড়িয়ে সিমুলেশন শুরু করুন।</div>
                )}
                {currentUnits !== totalKwh && (
                  <div className="text-[11px] opacity-80">
                    বর্তমানে মূল ক্যালকুলেটরে সেট করা: <strong>{toBanglaNumber(currentUnits)} kWh</strong>
                  </div>
                )}
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                disabled={totalKwh === 0}
                className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 shadow-xs w-full sm:w-auto shrink-0"
              >
                {copiedApplied ? (
                  <>
                    <Check className="size-3.5 text-white" />
                    <span>ক্যালকুলেটরে বসানো হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <span>এই {toBanglaNumber(totalKwh)} ইউনিট মূল ক্যালকুলেটরে দেখুন</span>
                    <ArrowUpRight className="size-3.5" />
                  </>
                )}
              </Button>
            </div>

            {/* Top Consumer Quick Chips */}
            {breakdownList.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-primary/15 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">প্রধান ব্যবহারকারী:</span>
                {breakdownList.slice(0, 4).map(({ item, kwh, count }) => (
                  <span key={item.id} className="bg-background/80 px-2 py-0.5 rounded-md border font-mono">
                    {item.nameBangla.split(" ")[0]} ({toBanglaNumber(count)}টি): {toBanglaNumber(Math.round(kwh))} kWh
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                যন্ত্রপাতির তালিকা (সংখ্যা বাড়াতে বা কমাতে + / - চাপুন):
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "সব যন্ত্রপাতি" },
                { id: "cooling_heating", label: "❄️ শীতলীকরণ ও গরম" },
                { id: "kitchen", label: "🍳 রান্নাঘর ও খাবার" },
                { id: "entertainment_tech", label: "💻 বিনোদন ও টেক" },
                { id: "daily_utility", label: "🔌 নিত্য ইউটিলিটি" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as ApplianceCategory)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium cursor-pointer transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-foreground text-background font-bold shadow-xs"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Appliance Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAppliances.map((item) => {
                const count = counts[item.id] || 0
                const isSelected = count > 0
                const itemMonthlyKwh = count > 0 ? calculateMonthlyUnits(item, count) : calculateMonthlyUnits(item, 1)

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-primary/5 border-primary/40 shadow-xs ring-1 ring-primary/20"
                        : "bg-card border-border/80 hover:border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`p-2 rounded-xl shrink-0 ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {renderIcon(item.iconName, "size-4")}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-foreground leading-snug">
                            {item.nameBangla}
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {toBanglaNumber(item.defaultWatt)}W • দৈনিক {toBanglaNumber(item.defaultHoursPerDay)}h
                          </span>
                        </div>
                      </div>

                      {/* Stepper Buttons */}
                      <div className="flex items-center gap-1.5 bg-background border rounded-lg p-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateCount(item.id, -1)}
                          disabled={count === 0}
                          className="size-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          title="সংখ্যা কমান"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-5 text-center font-mono text-xs font-bold">
                          {toBanglaNumber(count)}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCount(item.id, 1)}
                          className="size-6 flex items-center justify-center rounded-md bg-primary/10 hover:bg-primary/20 text-primary cursor-pointer transition-colors"
                          title="সংখ্যা বাড়ান"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom metrics */}
                    <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">
                        {count > 0 ? `${toBanglaNumber(count)} টির ব্যবহার:` : "প্রতিটিতে মাসিক:"}
                      </span>
                      <span className="font-mono font-bold text-primary">
                        ~{toBanglaNumber(itemMonthlyKwh)} kWh
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Appliance Energy Guide & Tips (Relatable Examples) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="size-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold">
              বাসার প্রধান যন্ত্রপাতির বিদ্যুৎ ব্যয় ও সাশ্রয়ী টিপস
            </h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {toBanglaNumber(APPLIANCES.length)} টি সাধারণ যন্ত্র
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          দৈনন্দিন জীবনে বহুল ব্যবহৃত যন্ত্রপাতির বিদ্যুৎ টানার হার, মাসিক সম্ভাব্য খরচ এবং বিআইপি ও বিইআরসি নির্দেশিত সাশ্রয়ী উপায়:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {APPLIANCES.map((app) => {
            const singleKwh = calculateMonthlyUnits(app, 1)
            // estimate cost at average residential rate ~8 BDT
            const approxCost = Math.round(singleKwh * 7.5)

            return (
              <Card
                key={app.id}
                className="rounded-2xl p-4 border shadow-xs flex flex-col justify-between space-y-3 bg-card hover:border-primary/40 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-muted text-foreground">
                      {renderIcon(app.iconName, "size-4")}
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {app.categoryBangla}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-foreground">{app.nameBangla}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 font-mono">
                      <span>{toBanglaNumber(app.defaultWatt)}W লোড</span>
                      <span>•</span>
                      <span>দৈনিক ~{toBanglaNumber(app.defaultHoursPerDay)} ঘণ্টা</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {app.descriptionBangla}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  {/* Monthly Units & Cost Badge */}
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">মাসিক ইউনিট ও বিল:</span>
                    <span className="text-primary font-mono font-bold">
                      ~{toBanglaNumber(singleKwh)} kWh ({formatBDT(approxCost)})
                    </span>
                  </div>

                  {/* Pro Tip */}
                  <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60 text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">টিপ:</strong> {app.tipBangla}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
