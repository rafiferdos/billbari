export type SubscriptionTier = "free" | "detective_monthly" | "lifetime"

export interface PaymentPlan {
  id: "detective_monthly" | "lifetime"
  nameBangla: string
  subtitleBangla: string
  priceBdt: number
  billingPeriodBangla: string
  isPopular?: boolean
  isBestValue?: boolean
  features: string[]
}

export const PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: "detective_monthly",
    nameBangla: "বিদ্যুৎ গোয়েন্দা",
    subtitleBangla: "খুঁটিয়ে খুঁটিয়ে বিদ্যুৎ ব্যবহারের নিখুঁত হিসাব ও দৈনন্দিন নজরদারি",
    priceBdt: 20,
    billingPeriodBangla: "প্রতি মাসে (৩০ দিন)",
    isPopular: true,
    features: [
      "প্রতিদিনের গড় খরচ ও ব্যালেন্স রানওয়ে আনলক",
      "ব্যালেন্স শেষ হওয়ার সুনির্দিষ্ট দিন ও বার কাউন্টডাউন",
      "আনলিমিটেড মিটার ডাটাবেসে আজীবন ক্লাউড সংরক্ষণ",
      "প্রতিদিনের মিটার রিডিং ও স্ন্যাপশট হিস্ট্রি ট্র্যাকিং",
      "ট্যারিফ ধাপ ৪-থেকে-৫ জাম্প সতর্কতা (রেট দ্বিগুণ হওয়া রোধ)",
      "বিকাশ রিচার্জে কাটা চার্জ ও সরকারি ১% রিবেট রসিদ",
    ],
  },
  {
    id: "lifetime",
    nameBangla: "আজীবন বিদ্যুৎ অভিভাবক",
    subtitleBangla: "এককালীন স্থায়ী মেম্বারশিপ, চিরদিনের জন্য বিলবাড়ির পূর্ণ এক্সেস",
    priceBdt: 100,
    billingPeriodBangla: "এককালীন (আজীবন)",
    isBestValue: true,
    features: [
      "সব প্রিমিয়াম ফিচারে আজীবন চিরস্থায়ী আনলিমিটেড এক্সেস",
      "ভবিষ্যতের সকল নতুন প্রিমিয়াম টুল ও ফিচারে অগ্রাধিকার",
      "কোনো মাসিক রিনিউ বা কাটার ঝামেলা নেই",
      "একাধিক মিটারের ভল্ট ও পিডিএফ স্টেটমেন্ট ডাউনলোড",
      "সারাজীবনের জন্য 'বিদ্যুৎ অভিভাবক' স্পেশাল গোল্ডেন মেডেল",
    ],
  },
]

export interface PaymentRecord {
  id: string
  userId: string
  provider: "bkash"
  planType: "detective_monthly" | "lifetime"
  amountBdt: number
  senderNumber: string
  trxId: string
  status: "completed" | "pending" | "failed"
  verifiedAt: string
  createdAt: string
}

export interface SubscriptionStatus {
  tier: SubscriptionTier
  isPremium: boolean
  tierNameBangla: string
  expiresAt: string | null
  daysRemaining: number | null
  startedAt: string | null
}
