# Phase 3 — App shell and home dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Read
> `docs/v2/MASTER-PLAN.md` sections 4, 5, 6, 7 first. Phases 1–2 must be done.

**Goal:** A mobile-first shell (header, mobile dock or menu, footer) and a home page
that shows NESCO data in strict priority order. The page answers "how much balance
do I have, what was my last token, how long will it last" within the first screen
at 360px. Desktop arranges the same regions in the theme's layout (bento, stack, split).

**Architecture:** Nav items are data. Dock vs menu is pure CSS (`nav-dock:` / `nav-top:`
variants), so SSR is correct. The dashboard renders only on the client (meter data
comes from `MeterProvider`), so `DashboardLayout` can choose the layout in JS from
`useAppTheme()` and `useMediaQuery`. Region order comes from `REGIONS`.

---

## Feature inventory: nothing from today's home page is lost

Before deleting anything in `src/routes/index.tsx`, confirm each row still has a
home. Copy this table into `PROGRESS.md` with a ✔ per row when done.

| Today (index.tsx / navbar.tsx) | New home |
| --- | --- |
| Hero Input + paste + clear | `MeterSearch` (hero on landing, compact on dashboard) |
| `SavedMetersMenu` | Landing "saved meters" + header meter chip dropdown |
| `SourceBanner` / `SourceBadge` | Above the grid / inside `balance` region |
| Customer card | `customerInfo` region |
| Save meter button | `balance` region actions |
| Alert threshold button, `AlertThresholdDialog`, low-balance banner | `balance` region, Pro (`lowBalanceAlert`) |
| Snapshot button + `SnapshotDialog` | `quickActions` region, Pro (`snapshots`) |
| StatCards: balance / runway / avg daily cost / last recharge | `balance` / `runway` / `runway` (daily burn) / `lastRecharge` |
| Tab "overview" `AdvancedStats` | `/insights` (interim page in Task 6, full in Phase 5) |
| Tab "insights" list | `proInsights` region (top 3) + `/insights` |
| Tab "charts": `ConsumptionChart`, `RechargeTrendChart` | `usageChart` region (mini) + `/insights` |
| `SlabProgressCard` | `thisMonth` region (slab meter) |
| Quick navigation card | Nav + `quickActions` |
| Tab "saving" `BillSavingSection` | `/tariffs` (make sure it renders there; Phase 4 gates it) |
| Landing value cards, sample meters | Landing Free/Pro list, "নমুনা দেখুন" link |
| Navbar: links, language, appearance, account menu, pricing | `AppHeader` + `MobileDock` / menu Sheet |

---

## Task 1: Shell — nav data, header, dock, footer

**Files:**
- Create: `src/features/help/nesco-links.ts`, `src/components/nav-items.ts`, `src/components/app-header.tsx`, `src/components/mobile-dock.tsx`, `src/components/account-menu.tsx`
- Modify: `src/components/footer.tsx`, `src/routes/__root.tsx`, `src/features/i18n/translations.ts`
- Delete: `src/components/navbar.tsx` (after its parts move)

**Interfaces (Produces):**
```ts
// nesco-links.ts
export interface NescoLink { id: string; nameBn: string; nameEn: string; descBn: string; descEn: string; href: string }
export const EKPAY_RECHARGE_URL = "https://ekpay.gov.bd/#/payment/electricity-bill"
export const NESCO_LINKS: NescoLink[]
// nav-items.ts
export interface NavItem { to: "/" | "/history" | "/insights" | "/tariffs" | "/snapshots" | "/help"; labelKey: keyof Translations["nav"]; icon: LucideIcon; pro?: boolean }
export const NAV_ITEMS: NavItem[]     // order: home, history, insights(pro), tools, tracking(pro), help
export const DOCK_ITEM_COUNT = 4
```

`NESCO_LINKS` (in this order; write one short `desc` line per link in bn + en):

| id | nameBn | nameEn | href |
| --- | --- | --- | --- |
| recharge | প্রি-পেইড মিটার রিচার্জ (একপে) | Recharge prepaid meter (ekPay) | https://ekpay.gov.bd/#/payment/electricity-bill |
| paymentChannels | বিল পরিশোধ ও রিচার্জের মাধ্যম | Payment and recharge channels | https://customer.nesco.gov.bd/bill-payment-media |
| manual | প্রি-পেইড মিটার ব্যবহার সহায়িকা (PDF) | Prepaid meter user manual (PDF) | https://customer.nesco.gov.bd/uploads/prepaid_meter_user_manual.pdf |
| offices | সার্ভিস অফিস সমূহ | Service offices | https://customer.nesco.gov.bd/service-offices |
| complaint | অনলাইনে অভিযোগ করুন | File a complaint online | https://complain.nesco.gov.bd/nesco-citizen-complaint |
| officeComplaint | দপ্তর ভিত্তিক অভিযোগ কেন্দ্র | Office-wise complaint centres | https://customer.nesco.gov.bd/office-wise-complain |
| ministryComplaint | মন্ত্রণালয়ের অভিযোগ ব্যবস্থাপনা | Ministry complaint system | https://complain.mpemr.gov.bd/citizen_complain |
| charter | নাগরিক সনদ (PDF) | Citizen charter (PDF) | https://customer.nesco.gov.bd/uploads/acts_and_policies/citizen_charter.pdf |
| newConnection | নতুন সংযোগের আবেদন | Apply for a new connection | https://connection.nesco.gov.bd/ |
| postpaid | পোস্ট-পেইড বিল দেখুন | View postpaid bill | https://customer.nesco.gov.bd/post/bill |
| misc | বিবিধ বিল | Miscellaneous bills | https://bill.nesco.gov.bd/MiscFee |
| acts | আইন ও নীতিমালা | Acts and policies | https://customer.nesco.gov.bd/acts-and-policies |
| faq | নেসকো জিজ্ঞাসা | NESCO FAQ | https://customer.nesco.gov.bd/faqs |
| contact | নেসকোর সাথে যোগাযোগ | Contact NESCO | https://customer.nesco.gov.bd/contact-us |

- [ ] **Step 1:** Translations: extend `nav` with `home` (হোম/Home), `history` (হিস্ট্রি/History), `insights` (বিশ্লেষণ/Insights), `tools` (টুলস/Tools), `tracking` (ট্র্যাকিং/Tracking), `help` (সহায়তা/Help), `more` (আরও/More), `menu` (মেনু/Menu); add `footer.disclaimer` ("বিলবাড়ি নেসকোর অফিসিয়াল ওয়েবসাইট নয়। সব তথ্য নেসকোর পাবলিক গ্রাহক পোর্টাল থেকে নেওয়া।" / "BillBari is not an official NESCO site. All data comes from NESCO's public customer portal."). Keep existing keys that other files still use.
- [ ] **Step 2:** Create the `/insights` and `/help` route files now as minimal pages (a heading only), so typed `Link`s compile. Task 6 fills them. Run `pnpm generate-routes`.
- [ ] **Step 3: `AccountMenu`** — move the avatar dropdown (membership status, pricing, logout) and the sign-in button out of `navbar.tsx` unchanged in behavior.
- [ ] **Step 4: `AppHeader`** — `<header className="sticky top-0 z-40 h-(--bb-header-h) border-b-(length:--bb-border-w) border-border text-(--bb-header-fg) [background:var(--bb-header-bg)] [backdrop-filter:var(--bb-header-backdrop)]">`. Inner `page-shell flex h-full items-center gap-2`.
  - Left: logo (`Zap` in a `bg-primary text-primary-foreground` tile) + "বিলবাড়ি".
  - Center (`hidden lg:flex`): `NAV_ITEMS` as `Link`s styled with `buttonVariants({ variant: "ghost", size: "sm" })`, active state via `activeProps={{ "data-active": "true" }}` → `data-[active=true]:bg-accent data-[active=true]:text-accent-foreground`, and a small `Badge` (pro.badge) on `pro` items.
  - Right: meter chip (only when a meter is loaded: `••••` + last 4 digits in `num`, opens `SavedMetersMenu`), `LanguageToggle`, `AppearanceSheet`, `AccountMenu`, and a menu `Button` visible only `max-lg:nav-top:inline-flex hidden` that opens a left `Sheet` with all `NAV_ITEMS`.
- [ ] **Step 5: `MobileDock`** — `<nav aria-label={t.nav.menu} className="fixed inset-x-0 bottom-0 z-40 hidden max-lg:nav-dock:flex border-t-(length:--bb-border-w) border-border pb-[env(safe-area-inset-bottom)] [background:var(--bb-header-bg)] [backdrop-filter:var(--bb-header-backdrop)]">`.
  - First `DOCK_ITEM_COUNT` items plus "More". Each is a `Link` with icon over label (`text-[0.7rem]`), min height 4rem. The active item is `text-primary` with a 2px top indicator. `aria-current="page"` on the active item.
  - "More" opens a bottom `Sheet` with the remaining nav items and `AccountMenu` content.
- [ ] **Step 6: Footer** — `page-shell` row: disclaimer, links to `/help` and Pricing (opens `openPricingModal`), copyright. Under `nav-dock` below lg, add bottom padding so the dock never covers it.
- [ ] **Step 7: Root** — replace `<Navbar />` with `<AppHeader />` + `<MobileDock />`. `<main className="page-shell flex-1 py-(--bb-section-gap) max-lg:nav-dock:pb-[calc(5rem+env(safe-area-inset-bottom))]">`. Delete `navbar.tsx`; `grep -rn "navbar" src` → nothing.
- [ ] **Step 8:** `pnpm typecheck && pnpm lint && pnpm build` → PASS. Check at 360px in a `dock` theme (`bidyut`) and a `top` theme (`khata`): dock/menu shows correctly; at 1280px links are in the header. Commit: `feat(v2-p3): app shell with header, dock and footer`

---

## Task 2: Meter input normalization and `MeterSearch`

**Files:** Create `src/features/meter/meter-input.ts`, `src/features/meter/meter-search.tsx`; Test: `tests/meter-input.test.ts`

**Interfaces (Produces):**
```ts
export type MeterInputError = "empty" | "too_short" | "too_long"
export function normalizeMeterInput(raw: string): { digits: string; error: MeterInputError | null }  // Bangla→Latin digits, drop non-digits; 8–11 digits valid
export function maskMeter(meter: string): string   // "••••" + last 4 digits
export function MeterSearch(props: { variant: "hero" | "compact"; autoFocus?: boolean }): React.JSX.Element
```

- [ ] **Step 1: Failing tests:**
```ts
expect(normalizeMeterInput("১২৩৪৫৬৭৮")).toEqual({ digits: "12345678", error: null })
expect(normalizeMeterInput(" 1234-5678 ").digits).toBe("12345678")
expect(normalizeMeterInput("Meter: 0123 4567 89")).toEqual({ digits: "0123456789", error: null })
expect(normalizeMeterInput("").error).toBe("empty")
expect(normalizeMeterInput("1234").error).toBe("too_short")
expect(normalizeMeterInput("123456789012").error).toBe("too_long")
expect(maskMeter("0123456789")).toBe("••••6789")
```
- [ ] **Step 2–3:** FAIL → implement `meter-input.ts` (use `fromBanglaNumber`) → PASS.
- [ ] **Step 4: `MeterSearch`** uses shadcn `InputGroup` (search icon addon, `InputGroupInput` with `inputMode="numeric"`, `autoComplete="off"`, paste button `ClipboardPaste`, clear button `X`, submit `InputGroupButton` "খুঁজুন/Search").
  - `hero` uses `h-(--bb-control-h-lg)` and a `Kbd` "/" hint on `lg`.
  - Submit normalizes. On error, show the message below with `role="alert"`: `meterInput.empty` "মিটার নম্বর লিখুন" / "Enter a meter number", `too_short` "কমপক্ষে ৮ সংখ্যা দিন" / "Enter at least 8 digits", `too_long` "সর্বোচ্চ ১১ সংখ্যা" / "At most 11 digits". Otherwise call `useMeter().fetchMeter(digits)`.
  - Paste reads `navigator.clipboard.readText()`, normalizes it, and submits when valid.
  - In `hero`, pressing "/" anywhere (not while typing in a field) focuses the input.
  - Show `Spinner` in the submit button while `isLoading`.
- [ ] **Step 5:** Commit: `feat(v2-p3): meter search with input normalization`

---

## Task 3: Token display and receipt

**Files:** Create `src/features/recharge/token.ts`, `src/features/recharge/token-display.tsx`, `src/features/recharge/receipt-dialog.tsx`; Test: `tests/token.test.ts`

**Interfaces (Produces):**
```ts
export function formatToken(token: string): string    // exactly 20 digits (ignoring spaces/dashes) → "1234-5678-9012-3456-7890"; else trimmed input
export function TokenDisplay(props: { token: string; size?: "sm" | "lg" }): React.JSX.Element   // num font, copy button + toast
export function ReceiptDialog(props: { record: RechargeRecord | null; customer: CustomerInfo; onOpenChange: (open: boolean) => void }): React.JSX.Element  // open = record !== null
```

- [ ] **Step 1: Failing tests:** `formatToken("12345678901234567890")` and `formatToken("1234 5678 9012 3456 7890")` → `"1234-5678-9012-3456-7890"`; `formatToken(" ABC ")` → `"ABC"`; `formatToken("")` → `""`.
- [ ] **Step 2–3:** FAIL → implement → PASS.
- [ ] **Step 4: `TokenDisplay`**: `lg` = `text-xl sm:text-2xl font-bold tracking-wider num` with the groups allowed to wrap; `sm` = `text-sm num`. Copy uses `navigator.clipboard.writeText(formatToken(token))` → `toast.success(t.token.copied)` ("টোকেন কপি হয়েছে" / "Token copied"). The copy button has `aria-label`.
- [ ] **Step 5: `ReceiptDialog`** (mirrors NESCO's "Vending Token" modal; free):
  - Title "রিচার্জ রসিদ" / "Recharge receipt".
  - Body wrapped in `data-print-root` as a definition grid: meter (masked) and customer number, name, tariff, sanctioned load, date (`formatDateWithDay`), channel (`receipt.saleName ?? via`), order no, seq, **token** (`TokenDisplay size="lg"`), energy kWh, gross amount, net energy ৳, meter rent, demand charge, PFC, VAT, arrears/debt, rebate. Skip rows whose value is missing or 0, except token, amount, and date.
  - Footer buttons: Copy token, Print (`window.print()`), Share (only if `navigator.share` exists; the text is a Bangla/English summary of meter (masked), token, amount, date).
- [ ] **Step 6:** Commit: `feat(v2-p3): token display and printable receipt`

---

## Task 4: Dashboard layout engine

**Files:** Create `src/features/dashboard/regions.ts`, `src/features/dashboard/dashboard-layout.tsx`; Test: `tests/dashboard-regions.test.ts`

**Interfaces (Produces):**
```ts
export type RegionId = "balance" | "lastRecharge" | "runway" | "thisMonth" | "quickActions" | "usageChart" | "recentRecharges" | "customerInfo" | "proInsights"
export interface RegionSpec { id: RegionId; priority: number; bento: { md: 1 | 2; lg: number }; split: "aside" | "main" }
export const REGIONS: RegionSpec[]           // master plan 5.1 values, priority order
export const BENTO_ROWS: RegionId[][]        // [[balance,lastRecharge],[runway,thisMonth,quickActions],[usageChart,recentRecharges],[customerInfo,proInsights]]
export function regionSpan(id: RegionId, layout: LayoutMode, bp: "base" | "md" | "lg"): number
  // base → 1; stack → 1; bento md → bento.md, lg → bento.lg; split md → bento.md, lg → 1 (columns handle it)
export function DashboardLayout(props: { regions: Partial<Record<RegionId, React.ReactNode>> }): React.JSX.Element
```

- [ ] **Step 1: Failing tests:** REGIONS ids equal the 9 ids in master-plan order, and priorities are strictly ascending. `BENTO_ROWS.flat()` equals the REGIONS order. Each BENTO row's `lg` spans sum to 12. Every `md` is 1 or 2. Both `aside` and `main` are non-empty. `regionSpan("balance","bento","lg")` = 7, `regionSpan("balance","stack","lg")` = 1, `regionSpan("usageChart","split","md")` = 2, `regionSpan("runway","bento","base")` = 1.
- [ ] **Step 2–3:** FAIL → implement `regions.ts` → PASS.
- [ ] **Step 4: `DashboardLayout`**:
  - `layout = useAppTheme().theme.layout`; `isMd = useMediaQuery("(min-width: 768px)")`; `isLg = useMediaQuery("(min-width: 1024px)")`; entries = REGIONS with a non-null node.
  - **split and lg**: `grid grid-cols-[22rem_minmax(0,1fr)] items-start gap-(--bb-grid-gap)`. The aside column is `sticky top-[calc(var(--bb-header-h)+1rem)] flex flex-col gap-(--bb-grid-gap)` with the `aside` regions in priority order. The main column is `flex flex-col gap-(--bb-grid-gap)` with the `main` regions.
  - **Otherwise**: `grid gap-(--bb-grid-gap)` with `gridTemplateColumns` = `repeat(12, minmax(0,1fr))` (bento, lg), `repeat(2, minmax(0,1fr))` (bento/split, md), else `minmax(0,1fr)`. Each wrapper gets `style={{ gridColumn: \`span ${n} / span ${n}\` }}`, where `n = regionSpan(id, layout, isLg ? "lg" : isMd ? "md" : "base")` (inline styles because Tailwind cannot see dynamic class names).
  - Every wrapper: `<div data-region={id} className="min-w-0 [&>*]:h-full">`.
- [ ] **Step 5:** Commit: `feat(v2-p3): dashboard layout engine`

---

## Task 5: Dashboard regions

**Files:** Create in `src/features/dashboard/regions/`: `balance-region.tsx`, `last-recharge-region.tsx`, `runway-region.tsx`, `this-month-region.tsx`, `quick-actions-region.tsx`, `usage-chart-region.tsx`, `recent-recharges-region.tsx`, `customer-info-region.tsx`, `pro-insights-region.tsx`; plus `src/features/dashboard/types.ts` and `src/features/meter/meter-error.tsx`

**Interfaces (Consumes):** `FreeStats`, `computeFreeStats`, `EnergyAnalytics` (+ `hasEnoughData`), `ProGate`, `useEntitlement`, `FEATURES`, `NESCO_DOWNLOAD_KINDS`, `nescoDownloadHref`, `EKPAY_RECHARGE_URL`, `TokenDisplay`, `ReceiptDialog`, `Meter`, `sortMonthlyDesc`, `parseNescoDate`.

**Interfaces (Produces):**
```ts
// types.ts
export interface DashboardData { data: NescoFetchResult; stats: FreeStats; analytics: EnergyAnalytics }
// each region: export function <Name>Region(props: DashboardData): React.JSX.Element
export function MeterError(props: { error: string; onRetry: () => void }): React.JSX.Element  // keeps today's 403/geo-block explanation from index.tsx
```

Shared rules:
- Every region root is a `Card` with a `CardHeader` (title, plus `CardAction` when needed).
- Numbers use `num`. Money goes through `formatBDT`, units through `formatUnits`.
- Computed values carry a `Badge variant="outline"` with `t.common.estimate` ("হিসাব" / "Est."); add that key, and `t.token.copied`, to `translations.ts` if missing.
- Colors come from tokens only (`text-success`, `text-warning`, `text-destructive`, `bg-muted`, …).

- [ ] **BalanceRegion (P1):**
  - Title "বর্তমান ব্যালেন্স". Large balance (`text-4xl sm:text-5xl font-bold num`). Line "হালনাগাদ: {balanceUpdatedAt ?? formatted fetchedAt}". `SourceBadge`.
  - `Meter`: value = balance, max = `stats.avgMonthlyRechargeBdt` (hide when null), label "মাসিক গড় রিচার্জের তুলনায়". Tone: balance < 100 → destructive; < 25% of max → warning; else success.
  - Actions: Refresh (`fetchMeter(meter, { force: true })`). "রিচার্জ করুন" (external link to `EKPAY_RECHARGE_URL`, `target="_blank" rel="noopener noreferrer"`, rendered through `Button` `render`). Save meter (today's `saveMeterFn` flow, including the Phase 2 free-limit error toast). `<ProGate feature="lowBalanceAlert" variant="inline">` around the alert-threshold button that opens `AlertThresholdDialog`.
  - When a threshold is set and balance < threshold (Pro only), show an `Alert` with the warning tone inside the card.
- [ ] **LastRechargeRegion (P2):** newest record by `parseNescoDate`. Gross amount large, net energy and kWh below, date with day, channel. `TokenDisplay size="lg"`. "রসিদ" button opens `ReceiptDialog`. With no records, show `Empty` "এখনো কোনো রিচার্জ নেই" / "No recharges yet".
- [ ] **RunwayRegion (P3):** `<ProGate feature="runway">`. Allowed and `!analytics.hasEnoughData` → `Empty` with `t.stats.notEnoughData`. Allowed otherwise:
  - days left (huge), depletion date (`formatDateWithDay(new Date(Date.now() + days * 86_400_000))`);
  - urgency `Badge` (critical = destructive, warning = warning, healthy = success);
  - daily burn: `avgDailyCostBdt` ৳/day and `avgDailyKwh` units/day.
- [ ] **ThisMonthRegion (P4):**
  - Title = latest month name + year (+ "চলতি মাস" / "This month so far" when `isCurrentMonth`). Big kWh.
  - MoM badge: arrow; increase = warning tone, decrease = success tone; hidden when null.
  - Current slab `Badge` "ধাপ {step} · ৳{rate}/ইউনিট".
  - `Meter` of units inside the current slab (value = usage − minUnits, max = maxUnits − minUnits; hidden for the top slab) with label "পরের ধাপের আগে {n} ইউনিট বাকি".
  - Rows: average monthly kWh; "ব্যালেন্সে আনুমানিক {n} ইউনিট".
  - No months → `Empty`.
- [ ] **QuickActionsRegion (P5):** 2-column grid of outline buttons:
  - Certificate PDF (only if `NESCO_DOWNLOAD_KINDS` has `certificate`; `<a href={nescoDownloadHref("certificate", meter)}>` via `Button render`);
  - All recharges (`/history`), Bill calculator (`/tariffs`), NESCO services (`/help`);
  - `<ProGate feature="snapshots" variant="inline">` "স্ন্যাপশট নিন" opening `SnapshotDialog`.
- [ ] **UsageChartRegion (P6):** shadcn `ChartContainer` + Recharts `BarChart` with the last 12 months ascending.
  - Short month labels (bn/en); `Bar dataKey="usageKwh" fill="var(--chart-1)" radius={[r, r, 0, 0]}` with `r = theme.chart.barRadius`.
  - `CartesianGrid vertical={false} strokeDasharray={theme.chart.gridDash}`; `ChartTooltip` with `ChartTooltipContent`.
  - Height `h-48 sm:h-56`. `Empty` when no months.
- [ ] **RecentRechargesRegion (P7):** 3 newest as shadcn `Item` rows: date + channel, amount, `TokenDisplay size="sm"`, "রসিদ" icon button. Footer link "সব রিচার্জ দেখুন" → `/history`.
- [ ] **CustomerInfoRegion (P8):** `Accordion` single collapsible, open by default when `useMediaQuery("(min-width: 1024px)")`.
  - Show meter number and customer number first, each with a copy button. Then every entry of `customerInfo.fields` in NESCO order as a `dl` (`grid grid-cols-[auto_1fr] gap-x-4 gap-y-2`).
  - When `fields` is empty (sample/old cache), fall back to the mapped properties.
- [ ] **ProInsightsRegion (P9):**
  - Allowed: top 3 `analytics.insights` (title + metric, language-aware) + `Button` link `/insights` "সব বিশ্লেষণ দেখুন".
  - Locked: Card "প্রো বিশ্লেষণ" listing `FEATURES.slabForecast`, `FEATURES.seasonality`, `FEATURES.costEfficiency` (name + description + `Lock` icon) and one action button from `useEntitlement` (sign in or upgrade). No values.
- [ ] **MeterError:** move the error card logic (including the 403/geo-block explanation) out of `index.tsx`; Retry calls `onRetry`.
- [ ] `pnpm typecheck && pnpm lint` → PASS. Commit: `feat(v2-p3): dashboard regions`

---

## Task 6: Home route, landing, and interim pages

**Files:** Rewrite `src/routes/index.tsx`; fill `src/routes/insights.tsx` and `src/routes/help.tsx` (interim); modify `src/routes/tariffs.tsx` only if `BillSavingSection` is missing there.

- [ ] **Step 1: Landing** (no `activeMeterData`, not loading), in master plan 5.2 order:
  - `h1` "আপনার প্রি-পেইড মিটারের সব হিসাব, এক জায়গায়" / "Everything about your prepaid meter, in one place", with a one-line subtitle.
  - `MeterSearch variant="hero" autoFocus`.
  - Recent searches as `Badge`-like buttons (from `recentSearchesCollection`, newest 5).
  - Saved meters (signed in).
  - "নমুনা দেখুন" / "See a sample" link that loads a sample meter the way today's page does.
  - Two cards "ফ্রিতে যা পাবেন" / "Free" and "প্রো-তে আরও" / "Pro adds" listing `featuresByTier("free")` (first 8) and `featuresByTier("pro")` (first 8) with check / sparkle icons. The Pro card has a button that calls `openPricingModal`.
  - Trust line (data comes from NESCO's public portal; estimates are labeled).
- [ ] **Step 2: Loading:** `DashboardLayout` with a `Skeleton` card per region (heights 10rem; 14rem for `usageChart`). **Error:** `MeterError` with retry.
- [ ] **Step 3: Dashboard:**
  - `stats = useMemo(() => computeFreeStats(data), [data.fetchedAt])`; `analytics = useMemo(() => generateAnalytics(data), [data.fetchedAt])`.
  - Above the grid: `MeterSearch variant="compact"`; a line with `customerInfo.name` + `maskMeter(meter)`; `SourceBanner`; arrear `Alert variant="destructive"` when `customerInfo.arrearNotice`.
  - Then `<DashboardLayout regions={{ balance: <BalanceRegion …/>, … }} />` with all 9 regions.
- [ ] **Step 4: Interim `/insights`:** title + `<ProGate feature="personalInsights" variant="section">` containing today's `AdvancedStats`, the insights list, `ConsumptionChart`, and `RechargeTrendChart` (moved from the home tabs). With no meter loaded, show `Empty` with a link home. **Interim `/help`:** title + `NESCO_LINKS` as `Item` rows with external links (`target="_blank" rel="noopener noreferrer"`).
- [ ] **Step 5:** Move every inline `isBangla ? … : …` string in the rewritten files into `translations.ts`.
- [ ] **Step 6:** `pnpm typecheck && pnpm test && pnpm lint && pnpm build` → PASS. The token lint must not exceed the baseline. Run `node scripts/check-theme-tokens.mjs --write-baseline` only if every count went down or stayed the same; record the new total.
- [ ] **Step 7:** Commit: `feat(v2-p3): prioritized home dashboard and landing`

---

## Task 7: Verify and hand off

- [ ] Start the dev preview and load the sample meter. For `bidyut` (bento/dock), `khata` (stack/top), and `console` (split/top), each in light and dark, check widths 360, 768, 1280:
  - 360px: balance, token, and runway (or its locked card) are visible within the first ~1.5 screens; no horizontal scroll; the dock does not cover the last card or the footer.
  - 1280px: the bento rows line up as in master plan 5.1; split shows a sticky aside; stack is one centered column.
  - Copy token, receipt print preview, and certificate link (if enabled) all work.
- [ ] **Pro leakage check:** sign out, load the sample meter, and run in the browser console `document.querySelector('[data-region="runway"]').textContent`. The text must contain no day count (only the feature name, description, and button). Do the same for `proInsights`.
- [ ] Fill the inventory table ✔ marks in `PROGRESS.md`; Phase 3 → done; note any region that needs Phase 4/5 follow-up. Commit `docs(v2-p3): progress`.

## Exit criteria

- Inventory table fully ✔. `navbar.tsx` is gone. Dock/menu correct per theme.
- Region order, spans, and layouts match master plan 5.1 (tests green, visual check done).
- No Pro value leaks into the DOM for free users.
