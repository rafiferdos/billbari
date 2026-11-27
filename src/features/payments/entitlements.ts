// Single source of truth for free vs Pro. Re-tiering a feature is a one-line change.

export type FeatureTier = "free" | "pro"
export type FeatureId =
  | "balance" | "customerInfo" | "arrearNotice" | "rechargeHistory" | "tokenReceipt" | "monthlyUsage" | "nescoDownloads" | "nescoServices"
  | "freeStats" | "tariffTable" | "billCalculator" | "printView" | "recentSearches" | "themes"
  | "runway" | "dailyBurn" | "slabForecast" | "seasonality" | "costEfficiency" | "rechargeBehaviour" | "personalInsights" | "advancedCharts"
  | "snapshots" | "autoDailyPulse" | "unlimitedSavedMeters" | "savedMetersOverview" | "lowBalanceAlert" | "csvExport"
  | "applianceSimulator" | "rechargePlanner" | "savingPlan"

export interface FeatureInfo {
  tier: FeatureTier
  /** True when NESCO's own portal offers it; those are always free. */
  nescoParity: boolean
  nameBn: string
  nameEn: string
  descBn: string
  descEn: string
}

const feature = (tier: FeatureTier, nameBn: string, nameEn: string, descBn: string, descEn: string, nescoParity = false): FeatureInfo =>
  ({ tier, nescoParity, nameBn, nameEn, descBn, descEn })
const nesco = (nameBn: string, nameEn: string, descBn: string, descEn: string) =>
  feature("free", nameBn, nameEn, descBn, descEn, true)
const free = (nameBn: string, nameEn: string, descBn: string, descEn: string) =>
  feature("free", nameBn, nameEn, descBn, descEn)
const pro = (nameBn: string, nameEn: string, descBn: string, descEn: string) =>
  feature("pro", nameBn, nameEn, descBn, descEn)

export const FEATURES: Record<FeatureId, FeatureInfo> = {
  balance: nesco("বর্তমান ব্যালেন্স", "Current balance", "মিটারে এখন কত টাকা আছে", "Money left on the meter now"),
  customerInfo: nesco("গ্রাহকের তথ্য", "Customer details", "নেসকোর রেকর্ডে থাকা সব তথ্য", "Everything NESCO has on record"),
  arrearNotice: nesco("বকেয়া নোটিশ", "Arrear notice", "বকেয়া থাকলে সতর্কবার্তা", "Warning when arrears exist"),
  rechargeHistory: nesco("রিচার্জ হিস্ট্রি", "Recharge history", "সব রিচার্জ ও টোকেন", "Every recharge and token"),
  tokenReceipt: nesco("টোকেন রসিদ", "Token receipt", "কপি, প্রিন্ট ও শেয়ার", "Copy, print and share"),
  monthlyUsage: nesco("মাসিক ব্যবহার", "Monthly usage", "মাসভিত্তিক ইউনিট ও খরচ", "Units and cost by month"),
  nescoDownloads: nesco("নেসকো PDF", "NESCO PDFs", "সার্টিফিকেট ও হিস্ট্রি ডাউনলোড", "Certificate and history downloads"),
  nescoServices: nesco("নেসকো সেবা", "NESCO services", "রিচার্জ, অফিস, অভিযোগের লিংক", "Recharge, offices, complaints"),
  freeStats: free("মৌলিক হিসাব", "Basic stats", "গড় ব্যবহার, ধাপ, মাসিক তুলনা", "Averages, tariff step, monthly change"),
  tariffTable: free("ট্যারিফ তালিকা", "Tariff table", "বিইআরসি এলটি-এ রেট", "BERC LT-A rates"),
  billCalculator: free("বিল ক্যালকুলেটর", "Bill calculator", "ইউনিট দিলে বিল দেখুন", "Bill for any number of units"),
  printView: free("প্রিন্ট", "Print", "হিস্ট্রি প্রিন্ট করুন", "Print your history"),
  recentSearches: free("সাম্প্রতিক সার্চ", "Recent searches", "এই ডিভাইসে আগের মিটার", "Meters searched on this device"),
  themes: free("৮টি থিম", "8 themes", "রং, আকার ও লেআউট বদলান", "Change colors, shapes and layout"),
  runway: pro("কয়দিন চলবে", "Days left", "ব্যালেন্স শেষ হওয়ার দিন ও তারিখ", "When your balance runs out"),
  dailyBurn: pro("দৈনিক খরচ", "Daily burn", "দিনে গড়ে কত টাকা ও ইউনিট", "Average taka and units per day"),
  slabForecast: pro("ধাপ পূর্বাভাস", "Tier forecast", "মাস শেষে কোন ধাপে যাবেন", "Which tier you'll end the month in"),
  seasonality: pro("মৌসুমি প্রভাব", "Seasonality", "কোন মাসে খরচ বেশি-কম", "Your high and low months"),
  costEfficiency: pro("প্রকৃত ইউনিট দর", "True unit cost", "চার্জসহ প্রতি ইউনিটের দাম", "Per-unit cost with all charges"),
  rechargeBehaviour: pro("রিচার্জ অভ্যাস", "Recharge habits", "গড় রিচার্জ, মাধ্যম, বিরতি", "Average size, channel, gaps"),
  personalInsights: pro("ব্যক্তিগত পরামর্শ", "Personal insights", "আপনার ব্যবহারের ভিত্তিতে পরামর্শ", "Advice from your own usage"),
  advancedCharts: pro("বিস্তারিত চার্ট", "Detailed charts", "রিচার্জ ও ব্যবহারের ট্রেন্ড", "Recharge and usage trends"),
  snapshots: pro("ব্যালেন্স স্ন্যাপশট", "Balance snapshots", "দিনে দিনে ব্যালেন্স ট্র্যাকিং", "Track balance day by day"),
  autoDailyPulse: pro("স্বয়ংক্রিয় দৈনিক হিসাব", "Automatic daily check", "প্রতি রাতে নিজে থেকেই স্ন্যাপশট", "A snapshot every night, automatically"),
  unlimitedSavedMeters: pro("আনলিমিটেড মিটার", "Unlimited meters", "যত খুশি মিটার সংরক্ষণ", "Save as many meters as you like"),
  savedMetersOverview: pro("সব মিটার একসাথে", "All meters at a glance", "সংরক্ষিত মিটারের সর্বশেষ ব্যালেন্স", "Latest balance of every saved meter"),
  lowBalanceAlert: pro("কম ব্যালেন্স সতর্কতা", "Low-balance alert", "সীমার নিচে নামলে সতর্ক করুন", "Warn below your limit"),
  csvExport: pro("CSV এক্সপোর্ট", "CSV export", "এক্সেলে খোলার মতো ফাইল", "A file you can open in Excel"),
  applianceSimulator: pro("যন্ত্রপাতি সিমুলেটর", "Appliance simulator", "কোন যন্ত্রে কত খরচ", "What each appliance costs"),
  rechargePlanner: pro("রিচার্জ প্ল্যানার", "Recharge planner", "কত টাকা রিচার্জ করলে কয়দিন চলবে", "How much to recharge for N days"),
  savingPlan: pro("সাশ্রয় পরিকল্পনা", "Saving plan", "বিল কমানোর পরামর্শ", "Ways to cut your bill"),
}

export const FREE_SAVED_METER_LIMIT = 1

export function canUse(id: FeatureId, viewer: { isPremium?: boolean } | null | undefined): boolean {
  return FEATURES[id].tier === "free" || viewer?.isPremium === true
}

/** In declaration order. */
export function featuresByTier(tier: FeatureTier): FeatureId[] {
  return (Object.keys(FEATURES) as FeatureId[]).filter((id) => FEATURES[id].tier === tier)
}

export function canSaveAnotherMeter(a: { isPremium: boolean; savedCount: number; alreadySaved: boolean }): boolean {
  return a.alreadySaved || canUse("unlimitedSavedMeters", a) || a.savedCount < FREE_SAVED_METER_LIMIT
}
