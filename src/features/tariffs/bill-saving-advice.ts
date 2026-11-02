export type SavingCategory =
  | "all"
  | "ac_cooling"
  | "kitchen"
  | "heavy_loads"
  | "slab_habits"
  | "standby_lighting"
  | "renewable_voltage"

export interface BillSavingTip {
  id: string
  titleBangla: string
  titleEnglish: string
  category: SavingCategory
  categoryBangla: string
  categoryEnglish: string
  impact: "high" | "medium" | "pro"
  savingsBdtPerMonth: number // Estimated BDT savings per month
  savingsPct?: number // Estimated percentage reduction for that appliance/bracket
  iconName: string
  descriptionBangla: string
  descriptionEnglish: string
  actionBangla: string
  actionEnglish: string
  factBangla?: string
  factEnglish?: string
}

export const BILL_SAVING_TIPS: BillSavingTip[] = [
  // 1. AC & Cooling
  {
    id: "ac_25c_fan_combo",
    titleBangla: "এসির তাপমাত্রা ২৫°C + সিলিং ফ্যান কম্বিনেশন",
    titleEnglish: "The 25°C AC + Low Ceiling Fan Sweet Spot",
    category: "ac_cooling",
    categoryBangla: "❄️ এসি ও কুলিং",
    categoryEnglish: "❄️ AC & Cooling",
    impact: "high",
    savingsBdtPerMonth: 1500,
    savingsPct: 30,
    iconName: "Wind",
    descriptionBangla:
      "এসি ১৮°C বা ২০°C তে দিলে ঘর দ্রুত ঠান্ডা হয় না, বরং ইনভার্টার কম্প্রেসার সারারাত ১০০% ফুল পাওয়ারে চলে। তাপমাত্রা ২৫°C বা ২৬°C তে রেখে সিলিং ফ্যান হালকা গতিতে চালালে ঘরের ঠান্ডা বাতাস সমানভাবে ছড়িয়ে পড়ে এবং শরীর একই রকম স্বস্তি পায়।",
    descriptionEnglish:
      "Lowering the AC thermostat to 18°C doesn't cool the room faster; it merely locks the compressor at 100% maximum wattage all night. Setting at 25°C or 26°C while running a ceiling fan on low speed circulates chilled air evenly, providing identical comfort while dropping compressor draw to a fractional idle.",
    actionBangla:
      "রিমোটের তাপমাত্রা ২৫°C সেট করুন এবং ফ্যান ১ বা ২ স্পিডে চালান। প্রতি ১ ডিগ্রি তাপমাত্রা বাড়ালে বিদ্যুৎ বিলে প্রায় ৬% সাশ্রয় হয়।",
    actionEnglish:
      "Fix your thermostat to 25°C and turn on your ceiling fan on speed 1 or 2. Every single degree you raise above 20°C trims roughly 6% off your cooling power bill.",
    factBangla: "মাসে আনুমানিক ১৮০ ইউনিট থেকে কমে ১২৫ ইউনিটে নেমে আসে (সাশ্রয় ~৳১,৫০০)।",
    factEnglish: "Cuts monthly AC draw from ~180 kWh down to ~125 kWh (saving ~৳1,500/month).",
  },
  {
    id: "bldc_fan_upgrade",
    titleBangla: "সাধারণ ফ্যান বদলে BLDC সুপার এনার্জি সেভিং ফ্যান",
    titleEnglish: "BLDC Brushless DC Fan Revolution",
    category: "ac_cooling",
    categoryBangla: "❄️ এসি ও কুলিং",
    categoryEnglish: "❄️ AC & Cooling",
    impact: "high",
    savingsBdtPerMonth: 1200,
    savingsPct: 60,
    iconName: "Zap",
    descriptionBangla:
      "বাসার সাধারণ ইন্ডাকশন ফ্যানগুলো ৭৫ থেকে ৮৫ ওয়াট বিদ্যুৎ টানে এবং পুরোনো রেগুলেটর দিয়ে স্পিড কমালেও বিদ্যুৎ অপচয় হয়। আধুনিক BLDC ফ্যান ফুল স্পিডে মাত্র ২৮-৩০ ওয়াট এবং রাতে লো স্পিডে মাত্র ১২-১৫ ওয়াট বিদ্যুৎ ব্যবহার করে।",
    descriptionEnglish:
      "Traditional AC ceiling fans consume 75W to 85W at full blast, and conventional resistance regulators dissipate leftover energy as waste heat. Modern BLDC (Brushless DC) inverter fans consume only 28W-30W at full speed and as low as 12W at night.",
    actionBangla:
      "বাসার ৩টি সাধারণ ফ্যান পরিবর্তন করে বিএলডিসি ফ্যান লাগান। দিনে ১৪ ঘণ্টা চললে ৩টি ফ্যানে মাসে প্রায় ১২০ ইউনিট বিদ্যুৎ বাঁচবে।",
    actionEnglish:
      "Replace your top 3 most frequently used fans with 28W BLDC inverter fans. Across 14 hours of daily runtime, 3 fans save ~120 kWh every single month.",
    factBangla: "ফ্যানের বিদ্যুৎ বিলে সরাসরি ৬০% সাশ্রয় হয়।",
    factEnglish: "Direct 60% energy reduction on fan electricity expenditure.",
  },
  {
    id: "ac_filter_biweekly",
    titleBangla: "প্রতি ১৫ দিনে এসির এয়ার ফিল্টার ওয়াশ",
    titleEnglish: "Bi-Weekly AC Mesh Air Filter Cleaning",
    category: "ac_cooling",
    categoryBangla: "❄️ এসি ও কুলিং",
    categoryEnglish: "❄️ AC & Cooling",
    impact: "medium",
    savingsBdtPerMonth: 450,
    savingsPct: 15,
    iconName: "Sparkles",
    descriptionBangla:
      "বাতাসের ধুলাবালি এসির ইনডোর জালি ফিল্টারে আটকে গেলে বাতাস চলাচল বাধাগ্রস্ত হয়। ফলে ঘর ঠান্ডা হতে দ্বিগুণ সময় লাগে এবং কম্প্রেসার একটানা চলে বেশি বিদ্যুৎ খরচ করে।",
    descriptionEnglish:
      "Airborne dust rapidly clogs the indoor plastic mesh filters, choking airflow over the cooling coils. This doubles the time needed to cool your room and forces the compressor to run overtime at elevated amperage.",
    actionBangla:
      "এসির সামনের ঢাকনা তুলে প্লাস্টিক নেট ফিল্টার দুটি খুলে কলের পানিতে ধুয়ে শুকিয়ে আবার লাগিয়ে দিন। এতে মাত্র ৫ মিনিট সময় লাগে।",
    actionEnglish:
      "Pop open the AC front panel, remove the mesh filters, rinse with tap water, let them dry, and pop them back in. Takes under 5 minutes.",
    factBangla: "ফিল্টার পরিষ্কার রাখলে এসির কার্যক্ষমতা ১৫% পর্যন্ত বৃদ্ধি পায়।",
    factEnglish: "Restores up to 15% cooling efficiency and prevents ice buildup on coils.",
  },
  {
    id: "ac_outdoor_shade",
    titleBangla: "এসির আউটডোর ইউনিটে সরাসরি রোদের তাপ প্রতিরোধ",
    titleEnglish: "AC Outdoor Condenser Shading & Airflow",
    category: "ac_cooling",
    categoryBangla: "❄️ এসি ও কুলিং",
    categoryEnglish: "❄️ AC & Cooling",
    impact: "medium",
    savingsBdtPerMonth: 600,
    savingsPct: 10,
    iconName: "Home",
    descriptionBangla:
      "এসির আউটডোর কনডেন্সার সরাসরি দুপুরের কড়া রোদে থাকলে ৪২°C গরমে গ্যাস ঠান্ডা করতে কম্প্রেসারকে অতিরিক্ত চাপ নিতে হয়। আউটডোরের উপর হালকা শেড থাকলে কম্প্রেসারের তাপমাত্রা কম থাকে।",
    descriptionEnglish:
      "When your AC outdoor compressor unit is baked in direct midday sunlight, it has to dissipate heat against 42°C+ ambient temperatures, sharply driving up head pressure and power consumption.",
    actionBangla:
      "আউটডোর ইউনিটের উপরে রোদ ঠেকাতে বাতাস চলাচলের জায়গা রেখে হালকা শেড বা ছাউনি দিন। কখনোই বাতাস বের হওয়ার মুখ বন্ধ করবেন না।",
    actionEnglish:
      "Install an airy awning or canopy over the outdoor unit to block direct sun while keeping exhaust airflow 100% unobstructed.",
    factBangla: "আউটডোরের তাপমাত্রা কম থাকলে বিদ্যুৎ টানে প্রায় ১০% কম।",
    factEnglish: "Lowers condensing temperature and trims up to 10% compressor energy draw.",
  },

  // 2. Kitchen & Refrigerator
  {
    id: "fridge_gasket_currency_test",
    titleBangla: "ফ্রিজের দরজার গ্যাসকেট পরীক্ষা (কাগজের নোট টেস্ট)",
    titleEnglish: "The Refrigerator Dollar Bill Gasket Test",
    category: "kitchen",
    categoryBangla: "🍳 ফ্রিজ ও রান্নাঘর",
    categoryEnglish: "🍳 Fridge & Kitchen",
    impact: "high",
    savingsBdtPerMonth: 350,
    savingsPct: 20,
    iconName: "Refrigerator",
    descriptionBangla:
      "ফ্রিজের দরজার রাবার গ্যাসকেট আলগা বা শক্ত হয়ে ফাঁক তৈরি হলে ঠান্ডা বাতাস অনবরত বাইরে বের হয়ে যায়। ফলে কম্প্রেসার দিনে ২০ ঘণ্টার বেশি সময় চালু থাকে এবং প্রচুর বিদ্যুৎ অপচয় করে।",
    descriptionEnglish:
      "Worn, cracked, or dirty rubber door seals allow chilled air to escape continuously. The internal thermostat senses warming air and keeps the compressor running up to 20 hours a day.",
    actionBangla:
      "একটি ১০ বা ২০ টাকার নোট ফ্রিজের দরজায় রেখে দরজা বন্ধ করুন। নোটটি যদি সহজে টানা যায়, তবে গ্যাসকেট বদলান বা গরম পানি ও ভেসলিন দিয়ে নরম করুন।",
    actionEnglish:
      "Close the fridge door on a banknote. If it slips out effortlessly without resistance, your gasket is leaking cold air and needs cleaning, warm water rejuvenation, or replacement.",
    factBangla: "গ্যাসকেটের ফাঁক বন্ধ করলে ফ্রিজের কম্প্রেসার চলা ২০% কমে যায়।",
    factEnglish: "Eliminating seal leaks cuts compressor running cycles by up to 20%.",
  },
  {
    id: "fridge_coil_dust_cleaning",
    titleBangla: "ফ্রিজের পেছনের কয়েল ও ভেন্ট পরিষ্কার",
    titleEnglish: "Clean Rear Refrigerator Condenser Coils",
    category: "kitchen",
    categoryBangla: "🍳 ফ্রিজ ও রান্নাঘর",
    categoryEnglish: "🍳 Fridge & Kitchen",
    impact: "medium",
    savingsBdtPerMonth: 250,
    savingsPct: 15,
    iconName: "Sparkles",
    descriptionBangla:
      "ফ্রিজের পেছনের কালো জাল বা নিচে থাকা কনডেন্সার কয়েলে ধুলো ও ঝুল জমলে ফ্রিজ ভেতর থেকে তাপ বাইরে বের করতে পারে না। এতে ফ্রিজ গরম হয়ে অতিরিক্ত বিদ্যুৎ টানে।",
    descriptionEnglish:
      "Dust, cobwebs, and grease blanket the rear condenser coils over time, acting like an insulating blanket that blocks heat dissipation and strains the compressor.",
    actionBangla:
      "প্রতি ৬ মাসে একবার ফ্রিজের প্লাগ খুলে পেছনের কয়েল ব্রাশ বা শুকনা কাপড় দিয়ে পরিষ্কার করুন এবং দেয়াল থেকে অন্তত ৪ ইঞ্চি দূরে রাখুন।",
    actionEnglish:
      "Unplug the fridge once every 6 months, vacuum or brush off the rear coil grid, and ensure at least 4 inches of breathing space between the fridge and the wall.",
    factBangla: "দেয়াল থেকে ফাঁকা রাখা ও কয়েল পরিষ্কারে ফ্রিজের আয়ু বাড়ে এবং ১৫% বিল কমে।",
    factEnglish: "Ensures rapid heat rejection, prolongs compressor lifespan, and saves ~15% power.",
  },
  {
    id: "rice_cooker_unplug_warm",
    titleBangla: "ভাত হওয়ার সাথে সাথে রাইস কুকারের প্লাগ খোলা",
    titleEnglish: "Eliminate Rice Cooker 'Keep Warm' Parasite Drain",
    category: "kitchen",
    categoryBangla: "🍳 ফ্রিজ ও রান্নাঘর",
    categoryEnglish: "🍳 Fridge & Kitchen",
    impact: "medium",
    savingsBdtPerMonth: 300,
    savingsPct: 40,
    iconName: "CookingPot",
    descriptionBangla:
      "রাইস কুকারে ভাত রান্না হতে ২৫ মিনিট লাগে, কিন্তু অনেকেই ঘণ্টার পর ঘণ্টা প্লাগ লাগিয়ে রাখেন। 'Keep Warm' মোডে কুকারটি অনবরত ৪০-৫০ ওয়াট বিদ্যুৎ টানতে থাকে, যা ভাত রান্নার চেয়েও বেশি বিল বাড়ায়!",
    descriptionEnglish:
      "Cooking rice takes ~25 minutes, but leaving the appliance plugged in locks it into 'Keep Warm' mode, continually drawing 40W-50W for 6 to 10 hours. This standby heating consumes more energy than cooking the rice itself!",
    actionBangla:
      "ভাত হওয়া মাত্রই প্লাগ খুলে ফেলুন। রাইস কুকারের ঢাকনা বন্ধ রাখলে খাবার এমনিতেই ২-৩ ঘণ্টা পর্যাপ্ত গরম থাকে।",
    actionEnglish:
      "Unplug the cord the minute cooking completes. The insulated pot retains serving heat naturally for 2 to 3 hours without burning power.",
    factBangla: "সারাদিন ওয়ার্ম মোড বন্ধ রাখলে মাসে প্রায় ২৫ ইউনিট বিদ্যুৎ বাঁচে।",
    factEnglish: "Eliminates ~25 kWh per month of phantom heating waste (~৳250-৳350).",
  },
  {
    id: "induction_flat_cookware",
    titleBangla: "ইনডাকশন কুকারে সম্পূর্ণ সমান ও চৌম্বকীয় পাত্র ব্যবহার",
    titleEnglish: "Use Flat, Magnetic Cookware on Induction Cooktops",
    category: "kitchen",
    categoryBangla: "🍳 ফ্রিজ ও রান্নাঘর",
    categoryEnglish: "🍳 Fridge & Kitchen",
    impact: "medium",
    savingsBdtPerMonth: 400,
    savingsPct: 25,
    iconName: "Flame",
    descriptionBangla:
      "বাঁকা তলা বা অসমান পাত্র ইন্ডাকশন চুলার ইলেকট্রোম্যাগনেটিক ফিল্ডের সাথে পূর্ণ সংযোগ পায় না। ফলে বিদ্যুৎ অপচয় হয় এবং রান্না হতে দ্বিগুণ সময় লাগে।",
    descriptionEnglish:
      "Warped, thin, or partially magnetic pans fail to couple cleanly with the induction coil's magnetic field, forcing the cooktop to draw extra wattage and take twice as long to boil.",
    actionBangla:
      "ইনডাকশন চুলার সাইজের সাথে মিলিয়ে ভারী ও ১০০% সমান তলার চৌম্বকীয় পাত্র (স্টেইনলেস স্টিল বা কাস্ট আয়রন) ব্যবহার করুন।",
    actionEnglish:
      "Cook with thick, perfectly flat-bottomed ferromagnetic stainless steel or cast iron cookware that matches the burner diameter.",
    factBangla: "সঠিক পাত্রে রান্না করলে গ্যাসের চেয়েও দ্রুত রান্না হয় এবং ২৫% বিদ্যুৎ বাঁচে।",
    factEnglish: "Achieves 90% thermal transfer efficiency, saving up to 25% cooking electricity.",
  },

  // 3. Heavy Loads & Motors
  {
    id: "water_pump_morning_timing",
    titleBangla: "পানির মোটর সকাল ৬টা-৮টায় চালানো (ভোল্টেজ সুবিধা)",
    titleEnglish: "Run Water Pump Early Morning During High Voltage",
    category: "heavy_loads",
    categoryBangla: "⚡ মোটর ও ভারী যন্ত্র",
    categoryEnglish: "⚡ Pump & Heavy Loads",
    impact: "high",
    savingsBdtPerMonth: 500,
    savingsPct: 25,
    iconName: "Droplets",
    descriptionBangla:
      "সন্ধ্যা ৬টা থেকে রাত ১০টা পর্যন্ত পিক আওয়ারে লাইনে ভোল্টেজ নেমে ১৮০-১৯০ ভোল্ট হতে পারে। কম ভোল্টেজে ১ ঘোড়া মোটর ঘুরতে অতিরিক্ত অ্যাম্পিয়ার টানে, মোটর অতিরিক্ত গরম হয় এবং ট্যাঙ্কি ভরতে ২০-৩০ মিনিট বেশি সময় লাগে।",
    descriptionEnglish:
      "During evening peak hours (6 PM - 10 PM), line voltage frequently sags to 180V-190V. Low voltage forces induction motors to draw excessive amperage, overheating motor windings and taking 20-30 minutes longer to fill the roof tank.",
    actionBangla:
      "পানির মোটর সকালে (সকাল ৬টা থেকে ৮টা) অথবা গভীর রাতে চালান যখন লাইনে ফ্রেশ ২২০-২৩০ ভোল্ট থাকে। এতে অর্ধেক সময়ে ট্যাঙ্কি পূর্ণ হয়ে যায়।",
    actionEnglish:
      "Run your water pump between 6:00 AM - 8:00 AM when residential voltage is at peak 220V-230V. The pump operates at maximum torque and fills tanks in nearly half the time.",
    factBangla: "মোটরের জীবনকাল দ্বিগুণ হয় এবং পাম্পের বিদ্যুৎ বিল ২৫% কমে।",
    factEnglish: "Prevents motor burnout and reduces pumping power consumption by ~25%.",
  },
  {
    id: "overhead_tank_float_switch",
    titleBangla: "ছাদের ট্যাংকিতে অটো-ফ্লোট সুইচ স্থাপন (উপচে পড়া বন্ধ)",
    titleEnglish: "Automate Roof Tank with an Overflow Float Switch",
    category: "heavy_loads",
    categoryBangla: "⚡ মোটর ও ভারী যন্ত্র",
    categoryEnglish: "⚡ Pump & Heavy Loads",
    impact: "high",
    savingsBdtPerMonth: 400,
    savingsPct: 20,
    iconName: "CheckCircle2",
    descriptionBangla:
      "মোটর চালিয়ে ভুলে অন্য কাজে চলে গেলে প্রতিদিন ১০-১৫ মিনিট ট্যাঙ্কি উপচে পানি ও বিদ্যুৎ নষ্ট হয়। মাসে এভাবে প্রায় ১৫-২০ ইউনিট বিদ্যুৎ স্রেফ ড্রেনে চলে যায়।",
    descriptionEnglish:
      "Forgetting to turn off the water pump causes tanks to overflow for 10-20 minutes daily. Over a month, this wastes thousands of liters of treated water and burns 15-20 kWh of electricity straight down the drain.",
    actionBangla:
      "মাত্র ৳৪০০-৳৬০০ টাকায় একটি অটোমেটিক ওয়াটার লেভেল ফ্লোট সুইচ লাগান। ট্যাঙ্কি পূর্ণ হওয়া মাত্র মোটর নিজে নিজেই বন্ধ হয়ে যাবে।",
    actionEnglish:
      "Install a simple float sensor switch (costs ~৳450-৳600). The circuit automatically cuts motor power the second water hits top level.",
    factBangla: "ট্যাঙ্কি উপচানো বন্ধে মোটর রক্ষা পায় এবং মাসে ৳৪০০ সাশ্রয় হয়।",
    factEnglish: "Completely eliminates overflow waste, saving ~৳400/month and protecting walls.",
  },
  {
    id: "batch_ironing_strategy",
    titleBangla: "সপ্তাহের কাপড় একদিনে একসাথে ইস্ত্রি (ব্যাচ আয়রনিং)",
    titleEnglish: "Batch Ironing Strategy vs Daily Single Shirts",
    category: "heavy_loads",
    categoryBangla: "⚡ মোটর ও ভারী যন্ত্র",
    categoryEnglish: "⚡ Pump & Heavy Loads",
    impact: "medium",
    savingsBdtPerMonth: 300,
    savingsPct: 65,
    iconName: "Shirt",
    descriptionBangla:
      "একটি ১০০০ ওয়াটের ইস্ত্রি প্রতিবার গরম হতেই প্রথম ৪-৫ মিনিট পূর্ণ শক্তিতে বিদ্যুৎ টানে। প্রতিদিন অফিসে যাওয়ার আগে একটি করে কাপড় ইস্ত্রি করলে মাসে ৩০ বার ইস্ত্রি গরম করার অপচয় হয়।",
    descriptionEnglish:
      "A 1,000W iron draws peak current for the first 4-5 minutes solely heating its metal soleplate. Ironing one shirt every morning means paying that high-wattage warmup penalty 30 separate times a month.",
    actionBangla:
      "সপ্তাহে একদিন সব জামাকাপড় একসাথে ইস্ত্রি করুন। ভারী কাপড় দিয়ে শুরু করুন এবং ইস্ত্রি বন্ধ করার পরও শেষ ৫ মিনিট অবশিষ্ট তাপে হালকা কাপড় ইস্ত্রি করুন।",
    actionEnglish:
      "Iron a week's supply of clothes in one 25-minute session. Start with heavy cottons, and unplug the iron for the final 5 minutes to press delicates using stored thermal heat.",
    factBangla: "একসাথে ইস্ত্রি করলে ইস্ত্রির বিদ্যুৎ খরচ ৬৫% কমে যায়।",
    factEnglish: "Cuts clothes ironing power expenditure by ~65%, saving ~15-20 kWh/month.",
  },
  {
    id: "washing_machine_cold_wash",
    titleBangla: "ওয়াশিং মেশিনে হিটার ছাড়া স্বাভাবিক পানিতে কাপড় ধোয়া",
    titleEnglish: "Use Cold Water / Normal Temperature Wash Cycles",
    category: "heavy_loads",
    categoryBangla: "⚡ মোটর ও ভারী যন্ত্র",
    categoryEnglish: "⚡ Pump & Heavy Loads",
    impact: "high",
    savingsBdtPerMonth: 600,
    savingsPct: 85,
    iconName: "Droplets",
    descriptionBangla:
      "অটোমেটিক ওয়াশিং মেশিনের মোট বিদ্যুতের ৮৫-৯০% খরচ হয় শুধু পানি গরম করার হিটার চালাতে (প্রায় ২০০০ ওয়াট)। সাধারণ তাপমাত্রার পানিতে কাপড় ধুলে শুধু মোটর চলে, যাতে খরচ হয় মাত্র ২৫০-৩০০ ওয়াট।",
    descriptionEnglish:
      "Approximately 85% to 90% of electricity consumed by automatic washing machines goes toward heating the water via 2,000W internal heating elements. Running a cold/ambient cycle uses only the 250W motor.",
    actionBangla:
      "মেশিনের তাপমাত্রায় 'Cold' বা স্বাভাবিক পানি নির্বাচন করুন এবং কাপড় কম হলে না ধুয়ে পুরো লোড পূর্ণ হলে একসাথে ওয়াশ দিন।",
    actionEnglish:
      "Select 'Cold Wash' on your dial and always run full loads rather than frequent half-empty batches.",
    factBangla: "হিটার ছাড়া প্রতি ওয়াশে বিদ্যুৎ খরচ ২ ইউনিট থেকে কমে মাত্র ০.৩ ইউনিটে নামে।",
    factEnglish: "Drops per-wash power consumption from ~2.0 kWh down to a meager 0.3 kWh.",
  },
  {
    id: "geyser_15min_rule",
    titleBangla: "গিজার একটানা অন না রেখে গোসলের ১৫ মিনিট পূর্বে চালু",
    titleEnglish: "The 15-Minute Water Geyser Pre-Shower Rule",
    category: "heavy_loads",
    categoryBangla: "⚡ মোটর ও ভারী যন্ত্র",
    categoryEnglish: "⚡ Pump & Heavy Loads",
    impact: "high",
    savingsBdtPerMonth: 800,
    savingsPct: 50,
    iconName: "ShowerHead",
    descriptionBangla:
      "শীতকালে গিজার ঘণ্টার পর ঘণ্টা অন রাখলে পানি ঠান্ডা হওয়ার সাথে সাথে ১৫০০ ওয়াটের হিটার বারবার অটো চালু হয়ে সারাদিন বিদ্যুৎ পোড়ায়।",
    descriptionEnglish:
      "Leaving a 1,500W water heater on all morning causes it to cycle its heating element on every 20 minutes to offset thermal tank loss, consuming electricity continuously.",
    actionBangla:
      "গোসলের ১৫ থেকে ২০ মিনিট আগে গিজার অন করুন। গোসলে যাওয়ার সময় সুইচ বন্ধ করে যান। এতে পর্যাপ্ত গরম পানি পাওয়া যায় এবং অপচয় শূন্য হয়।",
    actionEnglish:
      "Turn on the geyser 15 to 20 minutes before your shower, and switch it OFF at the wall before stepping into the bathroom.",
    factBangla: "শীতকালে শুধু এই একটি অভ্যাসে মাসে ৳৮০০ থেকে ৳১,২০০ টাকা বাঁচে।",
    factEnglish: "Saves ~50 to 80 kWh/month during winter months (~৳800 to ৳1,200).",
  },

  // 4. Prepaid Meter & Slab Optimization
  {
    id: "slab_4_cliff_avoidance",
    titleBangla: "ট্যারিফ ধাপ ৪ থেকে ৫ এ ওঠার ভয়ংকর লাফ প্রতিরোধ",
    titleEnglish: "Avoid the Punitive Slab 4-to-5 Cliff Jump",
    category: "slab_habits",
    categoryBangla: "📊 স্ল্যাব ও মিটার কৌশল",
    categoryEnglish: "📊 Slab & Meter Habits",
    impact: "pro",
    savingsBdtPerMonth: 2000,
    savingsPct: 40,
    iconName: "AlertTriangle",
    descriptionBangla:
      "নেসকো আবাসিক ট্যারিফে মাসিক ব্যবহার ৪০০ ইউনিট পর্যন্ত প্রতি ইউনিট রেট ৳৮.০২। কিন্তু ৪০০ ইউনিট পার হলেই (ধাপ ৫) অতিরিক্ত প্রতি ইউনিটের রেট একলাফে ৳১২.৬৭ (+৳৪.৬৫ বাড়তি প্রতি ইউনিটে) হয়ে যায়!",
    descriptionEnglish:
      "Under NESCO residential (LT-A) tariffs, units up to 400 kWh cost ৳8.02/unit. But the moment monthly consumption crosses 400 kWh into Slab 5, the marginal unit rate explodes to ৳12.67 (+৳4.65 hike per unit!).",
    actionBangla:
      "মাসের ২৫ তারিখের পর মিটারের মোট ইউনিট চেক করুন। ব্যবহার যদি ৩৮০ ইউনিটের কাছে থাকে, তবে মাসের শেষ কয়েকদিন এসি ও হিটার ব্যবহার সীমিত রেখে ৪০০ ইউনিটের নিচে শেষ করুন।",
    actionEnglish:
      "Check your monthly consumption after the 25th. If you are near 380 units, strictly ration AC and heavy loads for the remaining few days to close the month under 400 kWh.",
    factBangla: "ধাপ ৫ এ ওঠা আটকাতে পারলে বিলের বড় অংশ সাশ্রয় হয়।",
    factEnglish: "Preventing entry into Tier 5 avoids a massive 58% rate hike on your marginal units.",
  },
  {
    id: "prepaid_rebate_planned_recharge",
    titleBangla: "মাসের শুরুতে বড় এককালীন রিচার্জে সরকারি ১% ক্যাশব্যাক",
    titleEnglish: "Maximize the 1% Government Rebate with Planned Recharges",
    category: "slab_habits",
    categoryBangla: "📊 স্ল্যাব ও মিটার কৌশল",
    categoryEnglish: "📊 Slab & Meter Habits",
    impact: "medium",
    savingsBdtPerMonth: 100,
    savingsPct: 5,
    iconName: "CreditCard",
    descriptionBangla:
      "বারবার ৳২০০-৳৫০০ করে রিচার্জ করলে প্রতি লেনদেনে বিকাশ/নগদ চার্জ কাটে এবং ব্যালেন্স শেষ হওয়ার মানসিক চাপ থাকে। প্রতি রিচার্জে সরকার ১% সরাসরি রিবেট দেয়।",
    descriptionEnglish:
      "Recharging in small increments of ৳200-৳500 incurs recurring mobile banking service fees and prevents accurate monthly budget pacing. The Bangladesh government awards a direct 1% cash rebate on all prepaid deposits.",
    actionBangla:
      "মাসের শুরুতে এককালীন আনুমানিক পুরো মাসের খরচ (৳৩,০০০-৳৫,০০০) রিচার্জ করুন। পুরো সরকারি ১% ছাড় একসাথে মিলবে এবং মাসের খরচ একনজরে ট্র্যাক করা যাবে।",
    actionEnglish:
      "Deposit your full estimated monthly power budget (e.g. ৳3,000-৳5,000) in a single transaction on the 1st of the month. You collect the full 1% rebate and gain clean visibility.",
    factBangla: "বিকাশ চার্জ বাঁচে এবং সম্পূর্ণ সরকারি ১% সুবিধা পাওয়া যায়।",
    factEnglish: "Eliminates repeated transaction fees and unlocks maximum government rebate credit.",
  },
  {
    id: "lifeline_50_unit_target",
    titleBangla: "ছোট পরিবার বা ব্যাচেলরদের জন্য লাইফলাইন (৫০ ইউনিট) টার্গেট",
    titleEnglish: "Target the Ultra-Subsidized Lifeline Rate (0-50 kWh)",
    category: "slab_habits",
    categoryBangla: "📊 স্ল্যাব ও মিটার কৌশল",
    categoryEnglish: "📊 Slab & Meter Habits",
    impact: "pro",
    savingsBdtPerMonth: 450,
    savingsPct: 50,
    iconName: "Zap",
    descriptionBangla:
      "মাসে মোট ব্যবহার ৫০ ইউনিটের মধ্যে রাখতে পারলে সরকারি লাইফলাইন রেট প্রতি ইউনিট মাত্র ৳৪.৬৩ (সাধারণ রেট ৳৫.২৬ বা ৳৭.২০ এর চেয়ে অনেক কম)। কিন্তু ৫১ ইউনিট হলেই পুরো লাইফলাইন সুবিধা বাতিল হয়ে যায়!",
    descriptionEnglish:
      "If total monthly consumption stays within 50 kWh, NESCO grants the deeply subsidized 'Lifeline' rate of just ৳4.63/unit. But consuming even 51 kWh invalidates the lifeline tariff completely!",
    actionBangla:
      "ব্যাচেলর বা ছোট ফ্ল্যাটে এলইডি লাইট ও ফ্যান ব্যবহারে সতর্ক থাকুন। ৫০ ইউনিটের মধ্যে থাকলে মাসিক বিদ্যুৎ বিল মাত্র ৳৩৫০ এর মধ্যে রাখা সম্ভব।",
    actionEnglish:
      "If you live in a bachelor studio or 1-bedroom home, monitor units closely. Keeping total usage under 50 kWh locks your monthly bill below ~৳350.",
    factBangla: "৫০ ইউনিটের নিচে থাকলে প্রতি ইউনিটে প্রায় ৳০.৬৩ থেকে ৳২.৫৭ কম খরচ হয়।",
    factEnglish: "Saves up to ৳2.57 per unit across your entire electricity bill.",
  },

  // 5. Standby / Vampire Loads & Lighting
  {
    id: "phantom_vampire_load_switch",
    titleBangla: "অদৃশ্য বিদ্যুৎ চোর (স্ট্যান্ডবাই পাওয়ার) পুরোপুরি বন্ধ",
    titleEnglish: "Slay Vampire & Phantom Standby Loads with Master Strips",
    category: "standby_lighting",
    categoryBangla: "🔌 স্ট্যান্ডবাই অপচয়",
    categoryEnglish: "🔌 Standby & Lighting",
    impact: "high",
    savingsBdtPerMonth: 400,
    savingsPct: 10,
    iconName: "Zap",
    descriptionBangla:
      "টিভি, অ্যান্ড্রয়েড টিভি বক্স, মাইক্রোওভেনের ঘড়ির ডিসপ্লে, সাউন্ডবার এবং চার্জার প্লাগে গুঁজে রাখলে বন্ধ থাকা অবস্থাতেও দিনে-রাতে অনবরত ৩০-৫০ ওয়াট বিদ্যুৎ টানতে থাকে।",
    descriptionEnglish:
      "Smart TVs, Android TV boxes, microwave clock LEDs, set-top decoders, audio soundbars, and idle phone/laptop chargers quietly draw 30W-50W around the clock even when turned 'off'.",
    actionBangla:
      "টিভি ও বিনোদনের সব প্লাগ একটি মাল্টিপ্লাগে রাখুন এবং রাতে ঘুমানোর আগে মাল্টিপ্লাগের মূল লাল সুইচটি অফ করে দিন।",
    actionEnglish:
      "Plug your entertainment setup into a switched power strip and flip the master switch off before going to bed or leaving the house.",
    factBangla: "স্ট্যান্ডবাই ড্রেন বন্ধ করলে প্রতি মাসে ২৫ থেকে ৩৫ ইউনিট বিদ্যুৎ সাশ্রয় হয়।",
    factEnglish: "Eliminates 25 to 35 kWh/month of unseen vampire drain (~৳300-৳450).",
  },
  {
    id: "led_replacement_12w",
    titleBangla: "পুরোনো সিএফএল বা টিউবলাইট বদলে ৯-১২ ওয়াট এলইডি বাতি",
    titleEnglish: "Upgrade CFLs and Fluorescent Tubes to High-Lumen LEDs",
    category: "standby_lighting",
    categoryBangla: "🔌 স্ট্যান্ডবাই অপচয়",
    categoryEnglish: "🔌 Standby & Lighting",
    impact: "medium",
    savingsBdtPerMonth: 350,
    savingsPct: 75,
    iconName: "Lightbulb",
    descriptionBangla:
      "একটি পুরোনো ৬০ ওয়াট ফিলামেন্ট বাতি বা ৪০ ওয়াট চোকের টিউবলাইট প্রচুর তাপ তৈরি করে। একটি ৯ বা ১২ ওয়াটের আধুনিক এলইডি বাতি একই পরিমাণ বা তার চেয়ে বেশি আলো দেয় অথচ বিদ্যুৎ নেয় মাত্র এক-চতুর্থাংশ।",
    descriptionEnglish:
      "Old 60W incandescent bulbs and 40W magnetic-ballast fluorescent tube lights convert up to 90% of electricity into waste heat. A modern 9W-12W LED bulb provides superior lumens while drawing 75% less power.",
    actionBangla:
      "বাসার প্রতিটি ঘরে ভালো ব্র্যান্ডের ৯W বা ১২W এলইডি বাতি লাগান। একটি বাতি প্রতিদিন ৮ ঘণ্টা চললে মাসে বিদ্যুৎ খরচ মাত্র ২.৮ ইউনিট।",
    actionEnglish:
      "Replace every tube light and incandescent bulb with 9W/12W energy-star LEDs. Running 8 hours daily, an LED uses only 2.8 kWh/month.",
    factBangla: "বাসার লাইটিং খরচে সরাসরি ৭৫% সাশ্রয় নিশ্চিত হয়।",
    factEnglish: "Immediate 75% drop in home lighting electricity expenditure.",
  },
  {
    id: "laptop_vs_desktop_pc",
    titleBangla: "সারাদিনের অফিসের কাজে ভারী ডেস্কটপের বদলে ল্যাপটপ ব্যবহার",
    titleEnglish: "Workstation Efficiency: Laptops vs Desktop Towers",
    category: "standby_lighting",
    categoryBangla: "🔌 স্ট্যান্ডবাই অপচয়",
    categoryEnglish: "🔌 Standby & Lighting",
    impact: "medium",
    savingsBdtPerMonth: 600,
    savingsPct: 75,
    iconName: "Laptop",
    descriptionBangla:
      "একটি বড় মনিটর ও পাওয়ার সাপ্লাইসহ ডেস্কটপ পিসি কাজের সময় ২০০ থেকে ৩০০ ওয়াট বিদ্যুৎ টানে। অন্যদিকে একটি সাধারণ কাজের ল্যাপটপ মাত্র ৩০ থেকে ৪৫ ওয়াট বিদ্যুৎ ব্যবহার করে।",
    descriptionEnglish:
      "A desktop tower workstation paired with an external monitor draws 180W to 300W during work. A modern laptop running the same productivity apps uses only 30W to 50W.",
    actionBangla:
      "দৈনিক ৮-১০ ঘণ্টা রিমোট ওয়ার্ক বা পড়াশোনার কাজে ল্যাপটপ ব্যবহার করুন এবং কাজ শেষে স্লিপ বা হাইবারনেট মোড সক্রিয় রাখুন।",
    actionEnglish:
      "Use a laptop for daily 8-10 hour work or study routines. Set automated display sleep after 5 minutes of inactivity.",
    factBangla: "প্রতিদিন ৮ ঘণ্টা ব্যবহারে মাসে প্রায় ৬০ ইউনিট বিদ্যুৎ সাশ্রয় হয়।",
    factEnglish: "Saves ~60 kWh of electricity per month (~৳500-৳700).",
  },

  // 6. Renewable & Power Factor
  {
    id: "solar_net_metering",
    titleBangla: "ছাদের নেট-মিটারিং সোলার সংযোগ (দিনের বেজ লোড শূন্য)",
    titleEnglish: "Rooftop Net-Metered Solar: Eliminate Daytime Slabs",
    category: "renewable_voltage",
    categoryBangla: "☀️ সোলার ও ভোল্টেজ",
    categoryEnglish: "☀️ Solar & Voltage",
    impact: "pro",
    savingsBdtPerMonth: 3000,
    savingsPct: 80,
    iconName: "Sun",
    descriptionBangla:
      "ছাদে ১.৫ থেকে ২ কিলোওয়াটের অন-গ্রিড সোলার সিস্টেম দিনে প্রায় ১৮০-২২০ ইউনিট বিদ্যুৎ উৎপাদন করে। দিনের বেলা ফ্রিজ, ফ্যান, পাম্প ও এসির বিদ্যুৎ সরাসরি সূর্য থেকে চলে, ফলে গ্রিডের মিটার ধাপ ১ বা ২ এর উপরে উঠতেই পারে না।",
    descriptionEnglish:
      "A 1.5 kW to 2 kW rooftop on-grid solar installation generates ~180-220 kWh/month under Bangladesh sun conditions. This absorbs daytime base loads (fridge, fans, pump, daylight AC), keeping your grid meter permanently locked in low tariff tiers.",
    actionBangla:
      "নিজের বা যৌথ বাড়ির ছাদে অন-গ্রিড নেট মিটারিং সোলার স্থাপন করুন। সরকারি নিয়মে বাড়তি বিদ্যুৎ গ্রিডেও বিক্রি করা যায়।",
    actionEnglish:
      "Consider installing a net-metered rooftop solar setup. Surplus generated daytime units offset nighttime grid consumption.",
    factBangla: "মাসিক বিদ্যুৎ বিল ৮০% পর্যন্ত কমে শূন্যের কাছাকাছি নামানো সম্ভব।",
    factEnglish: "Can slash residential grid power bills by up to 80%.",
  },
]
