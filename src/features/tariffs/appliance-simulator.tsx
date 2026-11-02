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
import { useLanguage } from "@/features/i18n/language-context"
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

const PRESET_EN: Record<string, { name: string; subtitle: string; tag: string }> = {
  bachelor_pad: { name: "Bachelor Studio", subtitle: "Fan, lights, mini-fridge & laptop", tag: "Low Energy" },
  small_family: { name: "Small Family", subtitle: "Fans, lights, fridge, TV, washer", tag: "Moderate" },
  standard_family: { name: "Standard Family", subtitle: "Night AC, fans, large fridge, pump, TV", tag: "Most Popular" },
  winter_home: { name: "Winter Home", subtitle: "Room heater, geyser, electric kettle", tag: "Winter Peak" },
  modern_luxury: { name: "Modern Luxury", subtitle: "2 ACs, 2 fridges, geyser, PC, washer", tag: "High Energy" },
}

const APPLIANCE_EN: Record<string, { name: string; desc: string; tip: string; category: string }> = {
  ac_inverter: {
    name: "Inverter AC (1.5 Ton)",
    desc: "Running 8 hours nightly at 25°C consumes ~180 to 220 kWh/month.",
    tip: "Setting the thermostat to 25°C instead of 18°C saves ~6% energy per degree.",
    category: "Cooling & Heating",
  },
  ac_non_inverter: {
    name: "Non-Inverter AC (1.5 Ton)",
    desc: "Compressor cycles at 100% full load, drawing ~260 to 320 kWh/month.",
    tip: "Upgrading to an inverter model saves up to ৳1,200 on monthly power bills.",
    category: "Cooling & Heating",
  },
  ceiling_fan: {
    name: "Ceiling Fan",
    desc: "Running 14 hours daily consumes approximately 32 kWh/month.",
    tip: "BLDC inverter fans consume only 28W vs 75W standard (60% energy savings).",
    category: "Cooling & Heating",
  },
  room_heater: {
    name: "Room Heater",
    desc: "Running 3 hours daily in winter consumes ~135 kWh/month.",
    tip: "Room heaters rapidly elevate meters into peak tariff brackets; use lower heat mode.",
    category: "Cooling & Heating",
  },
  refrigerator: {
    name: "Frost Refrigerator",
    desc: "Runs 24/7 with cycling compressor, consuming ~45 to 55 kWh/month.",
    tip: "Avoid leaving the door ajar to prevent extra compressor cycling.",
    category: "Kitchen & Dining",
  },
  deep_freezer: {
    name: "Deep Freezer",
    desc: "Continuous deep freezing draws ~60 to 75 kWh/month.",
    tip: "Defrost periodically to maintain peak refrigeration efficiency.",
    category: "Kitchen & Dining",
  },
  microwave: {
    name: "Microwave Oven",
    desc: "Reheating meals 20 mins daily consumes ~12 kWh/month.",
    tip: "Significantly faster and more energy efficient than gas/electric stoves for reheating.",
    category: "Kitchen & Dining",
  },
  rice_cooker: {
    name: "Electric Rice Cooker",
    desc: "Cooking once daily draws ~25 to 30 kWh/month.",
    tip: "Unplug immediately after meals to stop standby heating element drain.",
    category: "Kitchen & Dining",
  },
  induction_cooker: {
    name: "Induction Cooktop",
    desc: "Daily heavy cooking consumes ~80 to 120 kWh/month.",
    tip: "Use flat-bottom induction cookware for maximum magnetic heat transfer.",
    category: "Kitchen & Dining",
  },
  kettle: {
    name: "Electric Kettle",
    desc: "Boiling water 3-4 times daily takes ~12 to 15 kWh/month.",
    tip: "Boil only the exact volume of water you intend to use.",
    category: "Kitchen & Dining",
  },
  blender: {
    name: "Blender & Grinder",
    desc: "Short daily operation uses a negligible ~3 to 5 kWh/month.",
    tip: "Minimal energy footprint due to brief runtime.",
    category: "Kitchen & Dining",
  },
  tv: {
    name: "Smart LED TV (43\")",
    desc: "Watching 6 hours daily consumes ~15 to 18 kWh/month.",
    tip: "Modern LED TVs consume very little power compared to old tube monitors.",
    category: "Tech & Media",
  },
  desktop_pc: {
    name: "Desktop Workstation",
    desc: "Working 8 hours daily draws ~45 to 60 kWh/month.",
    tip: "Enable automated Sleep / Hibernate when stepping away from your desk.",
    category: "Tech & Media",
  },
  laptop: {
    name: "Laptop & Charger",
    desc: "Working 8 hours daily draws ~10 to 15 kWh/month.",
    tip: "Laptops consume up to 80% less power than high-power desktop towers.",
    category: "Tech & Media",
  },
  wifi_router: {
    name: "WiFi Router (24/7)",
    desc: "Runs continuously, consuming ~6 to 8 kWh/month.",
    tip: "Consumes very little energy; completely safe to leave running 24/7.",
    category: "Tech & Media",
  },
  sound_system: {
    name: "Home Theater System",
    desc: "Listening 3 hours daily draws ~6 to 10 kWh/month.",
    tip: "Turn off standby power switches at night to eliminate vampire drain.",
    category: "Tech & Media",
  },
  water_pump: {
    name: "Water Pump (1 HP)",
    desc: "Pumping water 1 hour daily consumes ~25 to 30 kWh/month.",
    tip: "Install an automated float switch to prevent wasteful roof tank overflows.",
    category: "Heavy Utilities",
  },
  geyser: {
    name: "Water Geyser",
    desc: "Heating water 1 hour daily draws ~45 to 60 kWh/month in winter.",
    tip: "Turn on 15 minutes before your shower, then switch off immediately.",
    category: "Heavy Utilities",
  },
  washing_machine: {
    name: "Washing Machine",
    desc: "Running 4-5 loads weekly consumes ~15 to 20 kWh/month.",
    tip: "Wash with full loads and cold water for significant energy savings.",
    category: "Heavy Utilities",
  },
  iron: {
    name: "Clothes Iron",
    desc: "Ironing 30 mins alternate days draws ~12 to 18 kWh/month.",
    tip: "Iron your week's clothing in a single session while the element is hot.",
    category: "Heavy Utilities",
  },
  led_bulb: {
    name: "LED Bulb (12W)",
    desc: "Running 8 hours nightly consumes only ~2.8 kWh/month.",
    tip: "Replace all older CFL or incandescent lamps with high-efficiency LEDs.",
    category: "Lighting & Daily",
  },
}

interface ApplianceSimulatorProps {
  onApplyUnits: (units: number) => void
  currentUnits: number
}

export function ApplianceSimulator({ onApplyUnits, currentUnits }: ApplianceSimulatorProps) {
  const { t, isBangla, formatBDT, formatNumber } = useLanguage()

  // Appliance counts state: id -> count
  const [counts, setCounts] = React.useState<Record<string, number>>(() => {
    const defaultPreset = HOUSEHOLD_PRESETS.find((p) => p.id === "standard_family")
    return defaultPreset ? { ...defaultPreset.counts } : {}
  })

  // Selected Preset ID (if matches)
  const [activePresetId, setActivePresetId] = React.useState<string>("standard_family")
  const [selectedCategory, setSelectedCategory] = React.useState<ApplianceCategory>("all")
  const [copiedApplied, setCopiedApplied] = React.useState<boolean>(false)

  // Update count for an appliance
  const updateCount = (id: string, delta: number) => {
    setActivePresetId("")
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
            name: isBangla ? highestItem.nameBangla : APPLIANCE_EN[highestItem.id]?.name || highestItem.nameBangla,
            kwh: highestKwh,
            percent: kwhSum > 0 ? Math.round((highestKwh / kwhSum) * 100) : 0,
          }
        : null,
      breakdownList: list.sort((a, b) => b.kwh - a.kwh),
    }
  }, [counts, isBangla])

  // Calculated estimated bill for these units
  const estimatedBill = React.useMemo(() => {
    if (totalKwh <= 0) return { totalBill: 0, activeStep: { nameBangla: "০ ইউনিট", nameEnglish: "0 kWh" } }
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
                  {t.tariffs.simulatorTitle}
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {t.tariffs.simulatorSubtitle}
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
                <span>{isBangla ? "সব মুছুন" : "Reset"}</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground block">
              {t.tariffs.presetTitle}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {HOUSEHOLD_PRESETS.map((p) => {
                const isActive = activePresetId === p.id
                const en = PRESET_EN[p.id]
                const name = isBangla ? p.nameBangla : en?.name || p.nameBangla
                const sub = isBangla ? p.subtitleBangla : en?.subtitle || p.subtitleBangla
                const tag = isBangla ? p.tagBangla : en?.tag || p.tagBangla

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
                        {tag}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-foreground truncate">
                      {name}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {sub}
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
                  {isBangla ? "মোট নির্বাচিত যন্ত্রপাতি" : "Selected Appliances"}
                </span>
                <div className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">
                  {formatNumber(totalDevices)} <span className="text-xs font-normal">{isBangla ? "টি" : "units"}</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  {t.tariffs.summaryTotalUnits}
                </span>
                <div className="text-xl sm:text-2xl font-extrabold text-primary font-mono">
                  {formatNumber(totalKwh)} <span className="text-xs font-normal">kWh</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  {t.tariffs.summaryNetBill}
                </span>
                <div className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">
                  {formatBDT(estimatedBill.totalBill)}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  {t.slab.currentTier}
                </span>
                <div className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {isBangla ? estimatedBill.activeStep.nameBangla : estimatedBill.activeStep.nameEnglish}
                </div>
              </div>
            </div>

            {/* Smart Highlight & Apply CTA */}
            <div className="pt-2 border-t border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground space-y-1">
                {topConsumer ? (
                  <div>
                    ⚡ {isBangla ? "সর্বোচ্চ বিদ্যুৎ খরচ:" : "Peak consumer:"} <strong>{topConsumer.name}</strong> ({isBangla ? "মোট ব্যবহারের" : "accounting for"}{" "}
                    <strong>{formatNumber(topConsumer.percent)}%</strong> {isBangla ? "বা" : "or"}{" "}
                    <strong>{formatNumber(Math.round(topConsumer.kwh))} kWh</strong>)
                  </div>
                ) : (
                  <div>{isBangla ? "নিচের তালিকা থেকে যন্ত্রপাতির সংখ্যা বাড়িয়ে সিমুলেশন শুরু করুন।" : "Increase appliance counts below to model home energy consumption."}</div>
                )}
                {currentUnits !== totalKwh && (
                  <div className="text-[11px] opacity-80">
                    {isBangla ? "বর্তমানে মূল ক্যালকুলেটরে সেট করা:" : "Currently set on calculator:"} <strong>{formatNumber(currentUnits)} kWh</strong>
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
                    <span>{isBangla ? "ক্যালকুলেটরে বসানো হয়েছে!" : "Applied to Calculator!"}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isBangla
                        ? `এই ${formatNumber(totalKwh)} ইউনিট মূল ক্যালকুলেটরে দেখুন`
                        : `Apply ${formatNumber(totalKwh)} kWh to Calculator`}
                    </span>
                    <ArrowUpRight className="size-3.5" />
                  </>
                )}
              </Button>
            </div>

            {/* Top Consumer Quick Chips */}
            {breakdownList.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-primary/15 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">{isBangla ? "প্রধান ব্যবহারকারী:" : "Top contributors:"}</span>
                {breakdownList.slice(0, 4).map(({ item, kwh, count }) => {
                  const displayName = isBangla
                    ? item.nameBangla.split(" ")[0]
                    : APPLIANCE_EN[item.id]?.name.split(" ")[0] || item.nameBangla.split(" ")[0]
                  return (
                    <span key={item.id} className="bg-background/80 px-2 py-0.5 rounded-md border font-mono">
                      {displayName} ({formatNumber(count)}): {formatNumber(Math.round(kwh))} kWh
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {isBangla
                  ? "যন্ত্রপাতির তালিকা (সংখ্যা বাড়াতে বা কমাতে + / - চাপুন):"
                  : "Appliances List (Tap + / - to adjust quantity):"}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: isBangla ? "সব যন্ত্রপাতি" : "All Appliances" },
                { id: "cooling_heating", label: isBangla ? "❄️ শীতলীকরণ ও গরম" : "❄️ Cooling & Heating" },
                { id: "kitchen", label: isBangla ? "🍳 রান্নাঘর ও খাবার" : "🍳 Kitchen & Dining" },
                { id: "entertainment_tech", label: isBangla ? "💻 বিনোদন ও টেক" : "💻 Media & Tech" },
                { id: "daily_utility", label: isBangla ? "🔌 নিত্য ইউটিলিটি" : "🔌 Heavy Utilities" },
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
                const en = APPLIANCE_EN[item.id]
                const name = isBangla ? item.nameBangla : en?.name || item.nameBangla

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
                            {name}
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatNumber(item.defaultWatt)}W • {isBangla ? `দৈনিক ${formatNumber(item.defaultHoursPerDay)}h` : `${formatNumber(item.defaultHoursPerDay)}h / day`}
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
                          title={isBangla ? "সংখ্যা কমান" : "Decrease"}
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-5 text-center font-mono text-xs font-bold">
                          {formatNumber(count)}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCount(item.id, 1)}
                          className="size-6 flex items-center justify-center rounded-md bg-primary/10 hover:bg-primary/20 text-primary cursor-pointer transition-colors"
                          title={isBangla ? "সংখ্যা বাড়ান" : "Increase"}
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom metrics */}
                    <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">
                        {count > 0
                          ? isBangla ? `${formatNumber(count)} টির ব্যবহার:` : `${formatNumber(count)} items:`
                          : isBangla ? "প্রতিটিতে মাসিক:" : "Per unit monthly:"}
                      </span>
                      <span className="font-mono font-bold text-primary">
                        ~{formatNumber(itemMonthlyKwh)} kWh
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Appliance Energy Guide & Tips */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="size-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold">
              {isBangla ? "বাসার প্রধান যন্ত্রপাতির বিদ্যুৎ ব্যয় ও সাশ্রয়ী টিপস" : "Home Energy Guide & Efficiency Tips"}
            </h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {formatNumber(APPLIANCES.length)} {isBangla ? "টি সাধারণ যন্ত্র" : "Appliances"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {isBangla
            ? "দৈনন্দিন জীবনে বহুল ব্যবহৃত যন্ত্রপাতির বিদ্যুৎ টানার হার, মাসিক সম্ভাব্য খরচ এবং বিআইপি ও বিইআরসি নির্দেশিত সাশ্রয়ী উপায়:"
            : "Power ratings, monthly consumption estimates, and proven efficiency best practices for modern households:"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {APPLIANCES.map((app) => {
            const singleKwh = calculateMonthlyUnits(app, 1)
            const approxCost = Math.round(singleKwh * 7.5)
            const en = APPLIANCE_EN[app.id]
            const name = isBangla ? app.nameBangla : en?.name || app.nameBangla
            const desc = isBangla ? app.descriptionBangla : en?.desc || app.descriptionBangla
            const tip = isBangla ? app.tipBangla : en?.tip || app.tipBangla
            const cat = isBangla ? app.categoryBangla : en?.category || app.categoryBangla

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
                      {cat}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-foreground">{name}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 font-mono">
                      <span>{formatNumber(app.defaultWatt)}W {isBangla ? "লোড" : "load"}</span>
                      <span>•</span>
                      <span>~{formatNumber(app.defaultHoursPerDay)} {isBangla ? "ঘণ্টা/দিন" : "hrs/day"}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  {/* Monthly Units & Cost Badge */}
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">
                      {isBangla ? "মাসিক ইউনিট ও বিল:" : "Monthly Units & Cost:"}
                    </span>
                    <span className="text-primary font-mono font-bold">
                      ~{formatNumber(singleKwh)} kWh ({formatBDT(approxCost)})
                    </span>
                  </div>

                  {/* Pro Tip */}
                  <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60 text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground">{isBangla ? "টিপ:" : "Tip:"}</strong> {tip}
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
