export interface NescoLink {
  id: string
  nameBn: string
  nameEn: string
  descBn: string
  descEn: string
  href: string
}

export const EKPAY_RECHARGE_URL = "https://ekpay.gov.bd/#/payment/electricity-bill"

const link = (id: string, nameBn: string, nameEn: string, descBn: string, descEn: string, href: string): NescoLink =>
  ({ id, nameBn, nameEn, descBn, descEn, href })

export const NESCO_LINKS: NescoLink[] = [
  link("recharge", "প্রি-পেইড মিটার রিচার্জ (একপে)", "Recharge prepaid meter (ekPay)", "সরকারি একপে থেকে অনলাইনে রিচার্জ করুন", "Recharge online on the government ekPay site", EKPAY_RECHARGE_URL),
  link("paymentChannels", "বিল পরিশোধ ও রিচার্জের মাধ্যম", "Payment and recharge channels", "কোন কোন মাধ্যমে টাকা দেওয়া যায়", "Every way to pay or recharge", "https://customer.nesco.gov.bd/bill-payment-media"),
  link("manual", "প্রি-পেইড মিটার ব্যবহার সহায়িকা (PDF)", "Prepaid meter user manual (PDF)", "মিটারের বোতাম ও কোড বোঝার নির্দেশিকা", "How to use your meter's keypad and codes", "https://customer.nesco.gov.bd/uploads/prepaid_meter_user_manual.pdf"),
  link("offices", "সার্ভিস অফিস সমূহ", "Service offices", "কাছের বিদ্যুৎ অফিস খুঁজুন", "Find your nearest electricity office", "https://customer.nesco.gov.bd/service-offices"),
  link("complaint", "অনলাইনে অভিযোগ করুন", "File a complaint online", "বিদ্যুৎ সেবা নিয়ে অভিযোগ জানান", "Report a problem with your service", "https://complain.nesco.gov.bd/nesco-citizen-complaint"),
  link("officeComplaint", "দপ্তর ভিত্তিক অভিযোগ কেন্দ্র", "Office-wise complaint centres", "প্রতিটি অফিসের অভিযোগ নম্বর", "Complaint numbers for each office", "https://customer.nesco.gov.bd/office-wise-complain"),
  link("ministryComplaint", "মন্ত্রণালয়ের অভিযোগ ব্যবস্থাপনা", "Ministry complaint system", "বিদ্যুৎ মন্ত্রণালয়ে অভিযোগ করুন", "Escalate to the power ministry", "https://complain.mpemr.gov.bd/citizen_complain"),
  link("charter", "নাগরিক সনদ (PDF)", "Citizen charter (PDF)", "সেবার সময়সীমা ও গ্রাহকের অধিকার", "Service timelines and your rights", "https://customer.nesco.gov.bd/uploads/acts_and_policies/citizen_charter.pdf"),
  link("newConnection", "নতুন সংযোগের আবেদন", "Apply for a new connection", "নতুন বিদ্যুৎ সংযোগের অনলাইন আবেদন", "Apply online for electricity", "https://connection.nesco.gov.bd/"),
  link("postpaid", "পোস্ট-পেইড বিল দেখুন", "View postpaid bill", "পোস্ট-পেইড মিটারের বিল দেখুন", "Check a postpaid meter's bill", "https://customer.nesco.gov.bd/post/bill"),
  link("misc", "বিবিধ বিল", "Miscellaneous bills", "অন্যান্য ফি পরিশোধ করুন", "Pay other fees", "https://bill.nesco.gov.bd/MiscFee"),
  link("acts", "আইন ও নীতিমালা", "Acts and policies", "বিদ্যুৎ সংক্রান্ত আইন ও বিধি", "Electricity laws and rules", "https://customer.nesco.gov.bd/acts-and-policies"),
  link("faq", "নেসকো জিজ্ঞাসা", "NESCO FAQ", "সাধারণ প্রশ্নের উত্তর", "Answers to common questions", "https://customer.nesco.gov.bd/faqs"),
  link("contact", "নেসকোর সাথে যোগাযোগ", "Contact NESCO", "ফোন, ইমেইল ও ঠিকানা", "Phone, email and address", "https://customer.nesco.gov.bd/contact-us"),
]
