export const NESCO_LINK_GROUPS: {
  id: "pay" | "complain" | "guides" | "connection"
  titleBn: string
  titleEn: string
  linkIds: string[]
}[] = [
  { id: "pay", titleBn: "রিচার্জ ও বিল", titleEn: "Recharge and bills", linkIds: ["recharge", "paymentChannels", "postpaid", "misc"] },
  {
    id: "complain",
    titleBn: "অভিযোগ ও যোগাযোগ",
    titleEn: "Complaints and contact",
    linkIds: ["complaint", "officeComplaint", "ministryComplaint", "contact"],
  },
  { id: "guides", titleBn: "নির্দেশিকা", titleEn: "Guides", linkIds: ["manual", "charter", "acts", "faq"] },
  { id: "connection", titleBn: "সংযোগ ও অফিস", titleEn: "Connection and offices", linkIds: ["newConnection", "offices"] },
]

// The answers describe what the code does today; change them together with it.
export const BILLBARI_FAQ: { qBn: string; qEn: string; aBn: string; aEn: string; pricing?: boolean }[] = [
  {
    qBn: "বিলবাড়ি কি নেসকোর অফিসিয়াল সেবা?",
    qEn: "Is BillBari an official NESCO service?",
    aBn: "না। বিলবাড়ি স্বাধীন একটি সেবা, যা নেসকোর পাবলিক গ্রাহক পোর্টাল থেকে তথ্য পড়ে দেখায়।",
    aEn: "No. BillBari is independent. It reads NESCO's public customer portal and shows you what is there.",
  },
  {
    qBn: "তথ্য কতটা হালনাগাদ?",
    qEn: "How fresh is the data?",
    aBn: "আপনি সার্চ বা রিফ্রেশ করলে তখনই নেসকো থেকে আনা হয়, বিলবাড়ির সার্ভার কোনো ক্যাশ রাখে না। এই ব্রাউজার ট্যাব বন্ধ না করা পর্যন্ত শেষ ফলাফল থেকে যায়, তাই নতুন তথ্যের জন্য রিফ্রেশ চাপুন। নেসকো যে সময়ে ব্যালেন্স হালনাগাদ করেছে, সেটিও দেখানো হয়।",
    aEn: "It is fetched from NESCO when you search or refresh; BillBari's server keeps no cached copy. This browser tab keeps the last result until you close it, so press refresh for newer figures. NESCO's own balance-updated time is shown too.",
  },
  {
    qBn: "মিটারের ব্যালেন্সের সাথে মিলছে না কেন?",
    qEn: "Why does my meter show a different balance?",
    aBn: "মিটার তাৎক্ষণিকভাবে হিসাব করে, আর নেসকোর সার্ভার হালনাগাদ হয় কিছু সময় পরপর। তাই দুটির মধ্যে পার্থক্য থাকতে পারে; মিটারের সংখ্যাটিই সর্বশেষ।",
    aEn: "The meter counts in real time, while NESCO's server updates periodically. The two can differ; the meter has the latest figure.",
  },
  {
    qBn: "টোকেন হারিয়ে ফেলেছি, কী করব?",
    qEn: "I lost my token. What now?",
    aBn: "হিস্ট্রি পাতায় নেসকোর রেকর্ডে থাকা প্রতিটি রিচার্জের টোকেন আছে। টোকেনটি কপি করে বা দেখে মিটারে প্রবেশ করান।",
    aEn: "The History page lists the token of every recharge in NESCO's record. Copy it, or read it off the screen, and enter it on your meter.",
  },
  {
    qBn: "কোনটা ফ্রি, আর প্রো-তে কী পাব?",
    qEn: "What is free, and what does Pro add?",
    aBn: "নেসকো পোর্টাল যা দেখায় তার সবই ফ্রি, সাথে কিছু মৌলিক হিসাব। প্রো-তে যোগ হয় পূর্বাভাস, ট্র্যাকিং, CSV ডাউনলোড ও টুলস।",
    aEn: "Everything NESCO's portal shows is free, plus basic statistics. Pro adds forecasts, tracking, CSV exports and tools.",
    pricing: true,
  },
  {
    qBn: "আমার কোন তথ্য সংরক্ষণ করা হয়?",
    qEn: "What do you store?",
    aBn: "সাম্প্রতিক সার্চ (নম্বর ও গ্রাহকের নাম) এবং আপনার দেখা স্ন্যাপশট আপনার ব্রাউজারে থাকে। সার্চ করলে আমাদের ডেটাবেজে কিছু সেভ হয় না, তবে সার্চ ব্যর্থ হলে সার্ভারের ত্রুটি-লগে নম্বরটি থাকতে পারে। অ্যাকাউন্ট খুললে নাম, ইমেইল (গুগল দিয়ে ঢুকলে প্রোফাইল ছবিও), আপনার সেভ করা মিটার (গ্রাহকের নাম ও ঠিকানাসহ), স্ন্যাপশট এবং পেমেন্টের তথ্য সংরক্ষিত হয়। প্রো অ্যাকাউন্টে প্রতি রাতে সেভ করা মিটারের ব্যালেন্স স্ন্যাপশট নেওয়া হয়।",
    aEn: "Recent searches (number and customer name) and the snapshots you view are kept in your browser. A search saves nothing to our database, though a failed search can leave the number in the server's error log. With an account we store your name, email (and profile picture if you use Google), saved meters (with the customer's name and address), snapshots and payment details. For Pro accounts, a nightly job records a balance snapshot of saved meters.",
  },
]
