export type SubscriptionTier = "free" | "detective_monthly" | "lifetime"

export interface PaymentPlan {
  id: "detective_monthly" | "lifetime"
  nameBangla: string
  subtitleBangla: string
  priceBdt: number
  billingPeriodBangla: string
  isPopular?: boolean
  isBestValue?: boolean
  /** Only what differs between plans; the feature lists come from the entitlement matrix. */
  features: string[]
  featuresEnglish: string[]
}

export const PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: "detective_monthly",
    nameBangla: "মিটার প্লাস",
    subtitleBangla: "দৈনন্দিন খরচ ও মিটারের গভীর হিসাব ও নজরদারি",
    priceBdt: 20,
    billingPeriodBangla: "প্রতি মাসে (৩০ দিন)",
    isPopular: true,
    features: [
      "৩০ দিনের জন্য সব প্রো ফিচার",
      "যেকোনো সময় আবার নবায়ন",
    ],
    featuresEnglish: [
      "Every Pro feature for 30 days",
      "Renew whenever you like",
    ],
  },
  {
    id: "lifetime",
    nameBangla: "প্রিমিয়াম আনলিমিটেড",
    subtitleBangla: "এককালীন মেম্বারশিপ, চিরদিনের জন্য বিলবাড়ির পূর্ণ এক্সেস",
    priceBdt: 100,
    billingPeriodBangla: "এককালীন (আজীবন)",
    isBestValue: true,
    features: [
      "এককালীন পেমেন্ট, আজীবন সব প্রো ফিচার",
      "ভবিষ্যতের নতুন প্রো ফিচারও পাবেন",
    ],
    featuresEnglish: [
      "Pay once, every Pro feature for life",
      "Future Pro features included",
    ],
  },
]
