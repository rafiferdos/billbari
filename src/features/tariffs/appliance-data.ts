export type ApplianceCategory =
  | "all"
  | "cooling_heating"
  | "kitchen"
  | "entertainment_tech"
  | "daily_utility"

export interface ApplianceItem {
  id: string
  nameBangla: string
  category: ApplianceCategory
  categoryBangla: string
  iconName:
    | "Wind"
    | "Flame"
    | "Tv"
    | "Coffee"
    | "Laptop"
    | "Droplets"
    | "Zap"
    | "Sparkles"
    | "Home"
    | "Shirt"
    | "Utensils"
    | "Lightbulb"
    | "Refrigerator"
    | "CookingPot"
    | "ShowerHead"
    | "Wifi"
  defaultWatt: number
  defaultHoursPerDay: number
  dutyCycle: number // Multiplier for cycling compressors or duty (e.g. 0.65 for inverter AC, 0.45 for fridge)
  descriptionBangla: string
  tipBangla: string
  popular?: boolean
}

export function calculateMonthlyUnits(
  item: ApplianceItem,
  count: number,
  hoursPerDay?: number
): number {
  if (count <= 0) return 0
  const hours = hoursPerDay !== undefined ? hoursPerDay : item.defaultHoursPerDay
  const kwhPerDay = (item.defaultWatt * hours * item.dutyCycle) / 1000
  const monthlyTotal = kwhPerDay * 30 * count
  return Math.round(monthlyTotal * 10) / 10
}

export const APPLIANCES: ApplianceItem[] = [
  // Cooling & Heating
  {
    id: "ac_inverter",
    nameBangla: "ইনভার্টার এসি (১.৫ টন)",
    category: "cooling_heating",
    categoryBangla: "শীতলীকরণ ও হিটিং",
    iconName: "Wind",
    defaultWatt: 1100,
    defaultHoursPerDay: 8,
    dutyCycle: 0.7,
    descriptionBangla: "রাতে ৮ ঘণ্টা (২৫°C) চালালে মাসে আনুমানিক ১৮০ - ২২০ ইউনিট খরচ হয়।",
    tipBangla: "তাপমাত্রা ১৮-২০°C এর বদলে ২৫°C তে রাখলে প্রতি ডিগ্রিতে প্রায় ৬% বিদ্যুৎ সাশ্রয় হয়।",
    popular: true,
  },
  {
    id: "ac_non_inverter",
    nameBangla: "নন-ইনভার্টার এসি (১.৫ টন)",
    category: "cooling_heating",
    categoryBangla: "শীতলীকরণ ও হিটিং",
    iconName: "Wind",
    defaultWatt: 1600,
    defaultHoursPerDay: 8,
    dutyCycle: 0.75,
    descriptionBangla: "কম্প্রেসার বারবার ফুল লোডে বন্ধ-চালু হওয়ায় মাসে প্রায় ২৬০ - ৩২০ ইউনিট বিদ্যুৎ নেয়।",
    tipBangla: "নন-ইনভার্টার থেকে ইনভার্টারে আপগ্রেড করলে মাসে প্রায় ৳৮০০-৳১,২০০ টাকা বিল কমানো সম্ভব।",
  },
  {
    id: "ceiling_fan",
    nameBangla: "সিলিং ফ্যান (সাধারণ)",
    category: "cooling_heating",
    categoryBangla: "শীতলীকরণ ও হিটিং",
    iconName: "Wind",
    defaultWatt: 75,
    defaultHoursPerDay: 14,
    dutyCycle: 1.0,
    descriptionBangla: "প্রতিদিন ১৪ ঘণ্টা ব্যবহারে একটি সাধারণ ফ্যানে মাসে প্রায় ৩১-৩৩ ইউনিট খরচ হয়।",
    tipBangla: "BLDC সুপার এনার্জি সেভিং ফ্যান লাগালে বিদ্যুৎ খরচ ৭৫ ওয়াট থেকে কমে মাত্র ২৮-৩০ ওয়াট হয় (৬০% সাশ্রয়)।",
    popular: true,
  },
  {
    id: "room_heater",
    nameBangla: "রুম হিটার (কয়েল / অয়েল)",
    category: "cooling_heating",
    categoryBangla: "শীতলীকরণ ও হিটিং",
    iconName: "Flame",
    defaultWatt: 1500,
    defaultHoursPerDay: 3,
    dutyCycle: 1.0,
    descriptionBangla: "শীতকালে প্রতিদিন ৩ ঘণ্টা চালালে মাসে প্রায় ১৩৫ ইউনিট খরচ হয়।",
    tipBangla: "রুম হিটার প্রিপেইড মিটারে খুব দ্রুত ট্যারিফ ধাপ ৪ ও ৫ এ নিয়ে যায়, কম পাওয়ার মোড ব্যবহার করুন।",
  },
  {
    id: "geyser",
    nameBangla: "ওয়াটার হিটার / গিজার",
    category: "cooling_heating",
    categoryBangla: "শীতলীকরণ ও হিটিং",
    iconName: "ShowerHead",
    defaultWatt: 1500,
    defaultHoursPerDay: 1.5,
    dutyCycle: 1.0,
    descriptionBangla: "শীতকালে গোসল ও গরম পানিতে প্রতিদিন ১.৫ ঘণ্টা চালালে মাসে প্রায় ৬৫-৭০ ইউনিট খরচ হয়।",
    tipBangla: "গোসলের ২০ মিনিট পূর্বে চালু করে পানি গরম হয়ে গেলে বন্ধ করে ফেলুন, সারাদিন অন রাখবেন না।",
    popular: true,
  },

  // Kitchen & Food
  {
    id: "refrigerator",
    nameBangla: "রেফ্রিজারেটর / ফ্রিজ (২২০ লিটার)",
    category: "kitchen",
    categoryBangla: "রান্নাঘর ও খাদ্য",
    iconName: "Refrigerator",
    defaultWatt: 130,
    defaultHoursPerDay: 24,
    dutyCycle: 0.42,
    descriptionBangla: "২৪ ঘণ্টা প্লাগ অন থাকলেও কম্প্রেসার বিরতি দিয়ে চলে, মাসে গড়ে ৩৫-৪৫ ইউনিট নেয়।",
    tipBangla: "দরজা বারবার না খোলা ও পেছনে দেয়াল থেকে অন্তত ৪ ইঞ্চি ফাঁকা রাখলে বাতাস চলাচল ভালো হয়।",
    popular: true,
  },
  {
    id: "deep_freezer",
    nameBangla: "ডিপ ফ্রিজ (চেস্ট ফ্রিজার)",
    category: "kitchen",
    categoryBangla: "রান্নাঘর ও খাদ্য",
    iconName: "Refrigerator",
    defaultWatt: 160,
    defaultHoursPerDay: 24,
    dutyCycle: 0.45,
    descriptionBangla: "মাছ-মাংস সংরক্ষণে সবসময় চালু থাকলে মাসে গড়ে ৪৫-৫৫ ইউনিট খরচ হয়।",
    tipBangla: "ভেতরে মাত্রাতিরিক্ত বরফ জমলে ডিফ্রস্ট করুন, এতে শীতলীকরণ দক্ষতা ৩০% বাড়ে।",
  },
  {
    id: "induction",
    nameBangla: "ইন্ডাকশন / ইনফ্রারেড চুলা",
    category: "kitchen",
    categoryBangla: "রান্নাঘর ও খাদ্য",
    iconName: "CookingPot",
    defaultWatt: 1800,
    defaultHoursPerDay: 1.5,
    dutyCycle: 1.0,
    descriptionBangla: "গ্যাস না থাকায় দিনে ১.৫ ঘণ্টা রান্না করলে মাসে প্রায় ৮০-৯০ ইউনিট বিদ্যুৎ কাটে।",
    tipBangla: "ফ্ল্যাট বটমযুক্ত উপযুক্ত ইন্ডাকশন পাত্র ব্যবহার করলে তাপ অপচয় রোধ হয় এবং দ্রুত রান্না হয়।",
    popular: true,
  },
  {
    id: "rice_cooker",
    nameBangla: "রাইস কুকার (১.৮ লিটার)",
    category: "kitchen",
    categoryBangla: "রান্নাঘর ও খাদ্য",
    iconName: "Utensils",
    defaultWatt: 700,
    defaultHoursPerDay: 1,
    dutyCycle: 1.0,
    descriptionBangla: "প্রতিদিন দুবেলা ভাত রান্না করতে ১ ঘণ্টা চললে মাসে ২১-২২ ইউনিট খরচ হয়।",
    tipBangla: "রান্না শেষ হলে সকেট থেকে প্লাগ খুলে ফেলুন, কারণ 'Warm' মোডে থাকলে হিটার বাড়তি বিদ্যুৎ টানে।",
    popular: true,
  },
  {
    id: "microwave",
    nameBangla: "মাইক্রোওয়েভ ওভেন",
    category: "kitchen",
    categoryBangla: "রান্নাঘর ও খাদ্য",
    iconName: "Utensils",
    defaultWatt: 1200,
    defaultHoursPerDay: 0.5,
    dutyCycle: 1.0,
    descriptionBangla: "প্রতিদিন ২০-৩০ মিনিট খাবার গরম বা বেকিংয়ে মাসে প্রায় ১৮-২০ ইউনিট খরচ হয়।",
    tipBangla: "খাবার গরম করতে মাইক্রোওয়েভ গ্যাস বা ইন্ডাকশন চুলার চেয়ে তিনগুণ দ্রুত ও বিদ্যুৎ সাশ্রয়ী।",
  },
  {
    id: "kettle",
    nameBangla: "ইলেকট্রিক কেটলি",
    category: "kitchen",
    categoryBangla: "রান্নাঘর ও খাদ্য",
    iconName: "Coffee",
    defaultWatt: 1500,
    defaultHoursPerDay: 0.25,
    dutyCycle: 1.0,
    descriptionBangla: "দিনে ৩-৪ বার চা বা গরম পানি করতে ১৫ মিনিট ব্যবহারে মাসে ১০-১২ ইউনিট কাটে।",
    tipBangla: "প্রয়োজনের বেশি পানি না ফুটিয়ে ঠিক যতটুকু দরকার ততটুকু পানি মেপে ফুটান।",
  },

  // Entertainment & Tech
  {
    id: "tv",
    nameBangla: "এলইডি স্মার্ট টিভি (৪৩-৫৫ ইঞ্চি)",
    category: "entertainment_tech",
    categoryBangla: "বিনোদন ও প্রযুক্তি",
    iconName: "Tv",
    defaultWatt: 75,
    defaultHoursPerDay: 6,
    dutyCycle: 1.0,
    descriptionBangla: "প্রতিদিন ৬ ঘণ্টা চললে মাসে গড়ে ১৩-১৫ ইউনিট বিদ্যুৎ খরচ হয়।",
    tipBangla: "টিভির ডিসপ্লে ব্রাইটনেস মাঝারি রাখলে চোখের ক্ষতি রোধ হয় এবং বিদ্যুৎ খরচ ১৫% কমে।",
    popular: true,
  },
  {
    id: "desktop_pc",
    nameBangla: "ডেস্কটপ / গেমিং কম্পিউটার",
    category: "entertainment_tech",
    categoryBangla: "বিনোদন ও প্রযুক্তি",
    iconName: "Laptop",
    defaultWatt: 250,
    defaultHoursPerDay: 6,
    dutyCycle: 1.0,
    descriptionBangla: "ফ্রিল্যান্সিং, অফিস কাজ বা গেমিংয়ে দিনে ৬ ঘণ্টা চললে মাসে ৪৫-৫০ ইউনিট খরচ হয়।",
    tipBangla: "বিরতির সময় বা কাজ শেষে পিসি বন্ধ বা স্লিপ মোডে রাখুন, স্ক্রিন সেভার বিদ্যুৎ বাঁচায় না।",
  },
  {
    id: "laptop",
    nameBangla: "ল্যাপটপ (চার্জার সহ)",
    category: "entertainment_tech",
    categoryBangla: "বিনোদন ও প্রযুক্তি",
    iconName: "Laptop",
    defaultWatt: 60,
    defaultHoursPerDay: 8,
    dutyCycle: 1.0,
    descriptionBangla: "প্রতিদিন ৮ ঘণ্টা ব্যবহারে মাসে মাত্র ১৪-১৫ ইউনিট বিদ্যুৎ খরচ হয় (খুবই সাশ্রয়ী)।",
    tipBangla: "ল্যাপটপ ডেস্কটপ কম্পিউটারের তুলনায় প্রায় ৭৫-৮৫% কম বিদ্যুৎ খরচ করে।",
    popular: true,
  },
  {
    id: "wifi_router",
    nameBangla: "ওয়াইফাই রাউটার ও অনু (ONU)",
    category: "entertainment_tech",
    categoryBangla: "বিনোদন ও প্রযুক্তি",
    iconName: "Wifi",
    defaultWatt: 15,
    defaultHoursPerDay: 24,
    dutyCycle: 1.0,
    descriptionBangla: "২৪ ঘণ্টা দিন-রাত টানা সচল থাকলেও মাসে মাত্র ১০-১১ ইউনিট বিদ্যুৎ খরচ হয়।",
    tipBangla: "দীর্ঘদিন দূরে কোথাও বেড়াতে গেলে ঘরের মেইন সুইচ বা রাউটার প্লাগ খুলে যেতে পারেন।",
  },

  // Daily Utility & Lighting
  {
    id: "led_bulb",
    nameBangla: "এলইডি লাইট / টিউব (১৫ ওয়াট)",
    category: "daily_utility",
    categoryBangla: "নিত্যদিনের ইউটিলিটি",
    iconName: "Lightbulb",
    defaultWatt: 15,
    defaultHoursPerDay: 6,
    dutyCycle: 1.0,
    descriptionBangla: "প্রতিদিন সন্ধ্যা থেকে ৬ ঘণ্টা জ্বললে প্রতিটি বাল্বে মাসে মাত্র ২.৭ ইউনিট খরচ হয়।",
    tipBangla: "পুরনো ১০০ ওয়াটের ফিলামেন্ট বাল্ব বদলে ১৫ ওয়াটের এলইডি দিলে ৮৫% বিদ্যুৎ বাঁচে।",
    popular: true,
  },
  {
    id: "water_pump",
    nameBangla: "পানি তোলার মোটর (১ HP / ৭৫০W)",
    category: "daily_utility",
    categoryBangla: "নিত্যদিনের ইউটিলিটি",
    iconName: "Droplets",
    defaultWatt: 750,
    defaultHoursPerDay: 1,
    dutyCycle: 1.0,
    descriptionBangla: "প্রতিদিন ছাদের পানির ট্যাঙ্কি ভরতে ১ ঘণ্টা চললে মাসে প্রায় ২২-২৫ ইউনিট খরচ হয়।",
    tipBangla: "অটো-ওয়াটার লেভেল কন্ট্রোলার ব্যবহার করলে ট্যাঙ্কি উপচে পড়ার অপচয় ও মোটরের চাপ কমে।",
    popular: true,
  },
  {
    id: "washing_machine",
    nameBangla: "ওয়াশিং মেশিন (অটোমেটিক)",
    category: "daily_utility",
    categoryBangla: "নিত্যদিনের ইউটিলিটি",
    iconName: "Shirt",
    defaultWatt: 450,
    defaultHoursPerDay: 0.6,
    dutyCycle: 1.0,
    descriptionBangla: "সপ্তাহে ৩-৪ দিন স্বাভাবিক তাপমাত্রার পানিতে কাপড় ধুলে মাসে প্রায় ৮-১০ ইউনিট খরচ হয়।",
    tipBangla: "হিটার ওয়াশ এড়িয়ে স্বাভাবিক পানিতে কাপড় ধুলে এবং ফুল লোড দিলে বিদ্যুৎ সাশ্রয় হয়।",
    popular: true,
  },
  {
    id: "iron",
    nameBangla: "কাপড় ইস্ত্রি / আয়রন",
    category: "daily_utility",
    categoryBangla: "নিত্যদিনের ইউটিলিটি",
    iconName: "Shirt",
    defaultWatt: 1000,
    defaultHoursPerDay: 0.3,
    dutyCycle: 1.0,
    descriptionBangla: "সপ্তাহে ২-৩ দিন ২০ মিনিট করে কাপড় ইস্ত্রি করলে মাসে ৮-১০ ইউনিট খরচ হয়।",
    tipBangla: "প্রতিদিন একটি করে কাপড় ইস্ত্রি না করে সপ্তাহের কাপড় একদিনে একসাথে ইস্ত্রি করুন।",
  },
  {
    id: "ips",
    nameBangla: "আইপিএস ও ব্যাটারি ব্যাকআপ",
    category: "daily_utility",
    categoryBangla: "নিত্যদিনের ইউটিলিটি",
    iconName: "Zap",
    defaultWatt: 100,
    defaultHoursPerDay: 6,
    dutyCycle: 1.0,
    descriptionBangla: "বিদ্যুৎ বিভ্রাটের সময় ব্যাকআপ এবং ব্যাটারি চার্জিং লস মিলিয়ে মাসে ১৫-২০ ইউনিট নেয়।",
    tipBangla: "ব্যাটারিতে ডিস্টিল্ড ওয়াটার সঠিক লেভেলে রাখা ও কপার টার্মিনাল পরিষ্কার রাখা প্রয়োজন।",
  },
]

export interface HouseholdPreset {
  id: string
  nameBangla: string
  subtitleBangla: string
  iconName: string
  tagBangla: string
  counts: Record<string, number>
}

export const HOUSEHOLD_PRESETS: HouseholdPreset[] = [
  {
    id: "bachelor",
    nameBangla: "ব্যাচেলর মেস / ছাত্রাবাস",
    subtitleBangla: "১-২ জনের রুম, ফ্যান, লাইট, ল্যাপটপ ও ছোট রাইস কুকার",
    iconName: "Home",
    tagBangla: "সাশ্রয়ী জীবন",
    counts: {
      ceiling_fan: 2,
      led_bulb: 3,
      laptop: 1,
      wifi_router: 1,
      rice_cooker: 1,
    },
  },
  {
    id: "small_family",
    nameBangla: "ছোট পরিবার (২ রুম ফ্ল্যাট)",
    subtitleBangla: "ফ্যান, লাইট, ফ্রিজ, টিভি, রাইস কুকার, রাউটার ও আয়রন",
    iconName: "Home",
    tagBangla: "মধ্যম খরচ",
    counts: {
      ceiling_fan: 3,
      led_bulb: 5,
      refrigerator: 1,
      tv: 1,
      rice_cooker: 1,
      iron: 1,
      wifi_router: 1,
      washing_machine: 1,
    },
  },
  {
    id: "standard_family",
    nameBangla: "আদর্শ পরিবার (৩ রুম + ১টি এসি)",
    subtitleBangla: "রাতে ১টি ইনভার্টার এসি, ফ্যান, বড় ফ্রিজ, টিভি, মোটর ও ওয়াশিং মেশিন",
    iconName: "Home",
    tagBangla: "সর্বাধিক জনপ্রিয়",
    counts: {
      ac_inverter: 1,
      ceiling_fan: 4,
      led_bulb: 8,
      refrigerator: 1,
      water_pump: 1,
      tv: 1,
      washing_machine: 1,
      rice_cooker: 1,
      microwave: 1,
      iron: 1,
      wifi_router: 1,
    },
  },
  {
    id: "winter_home",
    nameBangla: "শীতকালীন স্পেশাল বাসা",
    subtitleBangla: "রুম হিটার, ওয়াটার গিজার, ইলেকট্রিক কেটলি ও অন্যান্য নিত্যব্যবহার্য",
    iconName: "Flame",
    tagBangla: "শীতকালীন পিক",
    counts: {
      ceiling_fan: 1,
      led_bulb: 6,
      refrigerator: 1,
      geyser: 1,
      room_heater: 1,
      kettle: 1,
      tv: 1,
      wifi_router: 1,
    },
  },
  {
    id: "modern_luxury",
    nameBangla: "আধুনিক বিলাসবহুল বাসা",
    subtitleBangla: "২টি এসি, বড় ফ্রিজ + ডিপ ফ্রিজ, গিজার, ওয়াশিং মেশিন, কম্পিউটার",
    iconName: "Zap",
    tagBangla: "উচ্চ বিদ্যুৎ ব্যবহার",
    counts: {
      ac_inverter: 2,
      ceiling_fan: 5,
      led_bulb: 12,
      refrigerator: 1,
      deep_freezer: 1,
      water_pump: 1,
      geyser: 1,
      washing_machine: 1,
      tv: 2,
      microwave: 1,
      desktop_pc: 1,
      laptop: 1,
      wifi_router: 1,
    },
  },
]
