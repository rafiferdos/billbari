# Phase 2 — Data parity, free stats, entitlements

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Read
> `docs/v2/MASTER-PLAN.md` sections 2, 3, 7, 8 first. Phase 1 must be done.

**Goal:** BillBari returns everything NESCO shows (all customer fields, arrear
notice, receipt data, PDF downloads). It computes the free statistics correctly,
without invented numbers. It has one entitlement matrix, and the server enforces
Pro where data lives on our server.

**Architecture:** The NESCO session (cookies + CSRF) is shared between the meter
fetch and a new PDF proxy route. Parsing is label-based, with the old positional
mapping as fallback. Stats and entitlements are pure modules with unit tests.
`ProGate` is the only way UI locks a feature.

**Out of scope:** page redesigns (Phase 3+). Existing pages must still compile and run.

---

## Task 1: Capture redacted NESCO fixtures

**Files:** Create `scripts/capture-nesco-fixture.mjs`, `tests/fixtures/nesco/` (`recharge.html`, `monthly.html`, `downloads.json`); modify `.gitignore` (add `tests/fixtures/nesco/*.raw.html`)

- [ ] **Step 1: Ask the user** in chat: "Phase 2 needs one real meter number to capture NESCO's HTML as a test fixture. Only a redacted copy is committed (name, address, phone, meter/customer numbers and tokens replaced). Please send a meter number you own, or say 'skip'." If they skip, go to Step 5.
- [ ] **Step 2: Write the script.** Usage `node scripts/capture-nesco-fixture.mjs <meterNo>`. Portal URL = `process.env.NESCO_PROXY_URL || process.env.NESCO_PORTAL_URL || "https://customer.nesco.gov.bd/pre/panel"`. Steps:
  - GET the panel and read cookies + CSRF (same headers as `nesco-service.ts`).
  - POST `submit=রিচার্জ হিস্ট্রি` and `submit=মাসিক ব্যবহার`, and save the raw HTML to `recharge.raw.html` / `monthly.raw.html`.
  - POST each download value (`সার্টিফিকেট ডাউনলোড করুন`, `রিচার্জ হিস্ট্রি ডাউনলোড করুন`, `মাসিক ব্যবহার ডাউনলোড করুন`) and record `{ kind, status, contentType, bytes }` in `downloads.json`. Never save PDF bodies.
  - Write redacted copies `recharge.html` / `monthly.html` using cheerio:
    - every occurrence of the meter number and customer number → `12345678`;
    - inputs in `#con_info_div` whose label matches `/নাম|name|পিতা|স্বামী|father|husband|ঠিকানা|address|মোবাইল|mobile|phone|ইমেইল|email|এনআইডি|nid/i` → `REDACTED`;
    - every 16–20 digit token (with or without dashes) → a fake token of the same format, numbered `0000-0000-0000-0000-0001`, `…0002`, etc.;
    - `data-customername` → `REDACTED`.
  - Print the label list of `#con_info_div` (labels only).
- [ ] **Step 3:** Run it with the user's meter. Verify the redaction: `grep -c "<their meter>" tests/fixtures/nesco/*.html` → 0 (do not paste the number into the commit or `PROGRESS.md`). Open both files and confirm no name, address, or phone remains.
- [ ] **Step 4:** Note in `PROGRESS.md`: the label list, which download kinds returned `application/pdf`, and whether `#arrear_notice_div` was present/visible.
- [ ] **Step 5:** Commit (redacted files, script, `.gitignore` only): `test(v2-p2): redacted NESCO fixtures and capture script`. If skipped: commit the script only, and note "fixtures skipped" in `PROGRESS.md`.

---

## Task 2: Shared NESCO session + robust parser

**Files:**
- Create: `src/features/nesco/parse-utils.ts`, `src/features/nesco/nesco-session.ts`
- Modify: `src/features/nesco/nesco-service.ts`, `src/features/nesco/types.ts`, `src/features/nesco/sample-data.ts`
- Test: `tests/nesco-parser.test.ts`

**Interfaces (Produces):**
```ts
// types.ts (additions)
export interface CustomerField { label: string; value: string }
export interface RechargeReceiptData { orderNo?: string; seq?: string; purchaseAmount?: string; totalAmount?: string; debtAmount?: string;
  paidAmount?: string; saleName?: string; purchaseDate?: string; purchaseEnergy?: string }
// CustomerInfo gains: fields: CustomerField[]; arrearNotice: string | null; balanceUpdatedAt: string | null
// RechargeRecord gains: receipt?: RechargeReceiptData

// parse-utils.ts
export function toNum(raw: string | null | undefined): number   // strips everything except digits . -; Bangla digits converted first; NaN → 0

// nesco-session.ts
export interface NescoSession { portalUrl: string; cookieHeader: string; csrfToken: string }
export function getPortalUrl(): string
export async function openNescoSession(): Promise<NescoSession>            // throws the same Bangla errors as today (403, status, no CSRF)
export async function postNescoForm(s: NescoSession, custNo: string, submit: string): Promise<Response>
export const NESCO_SUBMIT: { recharge: "রিচার্জ হিস্ট্রি"; monthly: "মাসিক ব্যবহার"; certificate: "সার্টিফিকেট ডাউনলোড করুন";
  rechargePdf: "রিচার্জ হিস্ট্রি ডাউনলোড করুন"; monthlyPdf: "মাসিক ব্যবহার ডাউনলোড করুন" }

// nesco-service.ts — now exported for tests
export function parseCustomerInfo($: cheerio.CheerioAPI, custNo: string): CustomerInfo
export function parseRechargeTable($: cheerio.CheerioAPI): RechargeRecord[]
export function parseConsumptionTable($: cheerio.CheerioAPI): MonthlyConsumptionRecord[]
```

- [ ] **Step 1: Failing tests** (`tests/nesco-parser.test.ts`). Inline HTML builders always run. Fixture tests use `describe.skipIf(!existsSync(fixturePath))`.

```ts
const info = (rows: [string, string][], extra = "") =>
  `<div id="con_info_div">${rows.map(([l, v]) => `<div class="form-group"><label>${l}</label><input class="form-control" value="${v}"></div>`).join("")}</div>${extra}`

it("maps known labels and keeps every field in order", () => {
  const c = parseCustomerInfo(cheerio.load(info([["গ্রাহকের নাম","TEST"],["ফিডার","F-1"],["অনুমোদিত লোড","3"],["অবশিষ্ট ব্যালেন্স","1,234.50"],["ব্যালেন্স আপডেটের সময়","27-11-2026 01:00"]])), "12345678")
  expect(c.name).toBe("TEST"); expect(c.feederName).toBe("F-1"); expect(c.approvedLoadKw).toBe(3)
  expect(c.balance).toBe(1234.5); expect(c.balanceUpdatedAt).toBe("27-11-2026 01:00")
  expect(c.fields.map((f) => f.label)).toEqual(["গ্রাহকের নাম","ফিডার","অনুমোদিত লোড","অবশিষ্ট ব্যালেন্স","ব্যালেন্স আপডেটের সময়"])
})
it("arrear notice: hidden → null, visible → text", () => {
  expect(parseCustomerInfo(cheerio.load(info([], `<div id="arrear_notice_div" style="display:none">x</div>`)), "1").arrearNotice).toBeNull()
  expect(parseCustomerInfo(cheerio.load(info([], `<div id="arrear_notice_div">  বকেয়া ৳৫০০  </div>`)), "1").arrearNotice).toBe("বকেয়া ৳৫০০")
})
it("never throws on an empty page", () => {
  const c = parseCustomerInfo(cheerio.load("<html></html>"), "12345678")
  expect(c.meterNumber).toBe("12345678"); expect(c.balance).toBe(0); expect(c.fields).toEqual([])
  expect(parseRechargeTable(cheerio.load("<html></html>"))).toEqual([])
  expect(parseConsumptionTable(cheerio.load("<html></html>"))).toEqual([])
})
it("reads receipt data attributes and prefers data-token", () => { /* one tbody row with <a class="consumerRechargeData" data-token="1111-2222-3333-4444-5555" data-order="77" data-salename="bKash"> → record.token, receipt.orderNo "77", receipt.saleName "bKash" */ })
it("toNum handles Bangla digits, commas and junk", () => {
  expect(toNum("১,২৩৪.৫০")).toBe(1234.5); expect(toNum("৳ -12.5 ")).toBe(-12.5); expect(toNum("")).toBe(0); expect(toNum(undefined)).toBe(0)
})
describe.skipIf(!hasFixtures)("real fixtures", () => {
  it("parses customer fields, recharges and months", () => { /* fields.length > 5; rechargeHistory.length > 0 with 20-digit tokens; monthlyUsage.length > 0, every usageKwh ≥ 0 */ })
})
```
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement.**
  - `toNum`: `fromBanglaNumber` (from `@/lib/bangla`), then strip `[^0-9.-]`, then `parseFloat`, with `|| 0`. Replace every `parseFloat(x?.replace(/[^0-9.-]/g, "") || "0") || 0` in `nesco-service.ts` with `toNum(x)`.
  - Move `getPortalUrl`, the browser headers, the CSRF/cookie logic, and the POST headers into `nesco-session.ts`. `fetchNescoData` calls `openNescoSession()` and `postNescoForm()` twice in parallel. Its behavior and error messages stay unchanged.
  - `parseCustomerInfo`: collect `{label, value}` pairs from `#con_info_div label` (fall back to the whole document if the div is absent). The value is the first `input` that is the next sibling, else the first `input` in the label's parent, else the `#<for>` input. Skip pairs whose label is empty. Map keys by label keyword (case-insensitive, first match wins; check `balanceUpdatedAt` before `balance`):

    | key | label contains |
    | --- | --- |
    | `balanceUpdatedAt` | (`ব্যালেন্স` or `balance`) and (`সময়`, `তারিখ`, `time`, `date`, `update`) |
    | `balance` | `ব্যালেন্স`, `balance` |
    | `name` | `গ্রাহকের নাম`, `customer name` |
    | `address` | `ঠিকানা`, `address` |
    | `electricityOffice` | `অফিস`, `office` |
    | `feederName` | `ফিডার`, `feeder` |
    | `meterNumber` | `মিটার নম্বর`, `meter no`, `meter number` |
    | `customerNumber` | `গ্রাহক নম্বর`, `customer no`, `consumer no` |
    | `approvedLoadKw` | `লোড`, `load` |
    | `tariff` | `ট্যারিফ`, `tariff` |

    Any key still missing falls back to today's positional value (`inputList[n]`), then to today's defaults. `tariff` default stays `"LT-A (Domestic)"`. `arrearNotice`: `#arrear_notice_div` text (whitespace collapsed, trimmed) unless its `style` contains `display:none`/`display: none` or the text is empty → `null`.
  - `parseRechargeTable`: per row, if `a.consumerRechargeData` exists, read `data-token` (preferred over cell text), `data-order`, `data-seq`, `data-purchaseamount`, `data-totalamount`, `data-debtamount`, `data-paidamount`, `data-salename`, `data-purchasedate`, `data-purchaseenergy` into `receipt` (strings; omit empty).
  - `sample-data.ts`: give each sample `fields` (built from its info, Bangla labels), `arrearNotice: null`, `balanceUpdatedAt: null`.
- [ ] **Step 4:** `pnpm test && pnpm typecheck` → PASS (fix compile errors where `CustomerInfo` is constructed). Commit: `feat(v2-p2): label-based NESCO parser with shared session`

---

## Task 3: NESCO PDF download proxy

**Files:**
- Create: `src/features/nesco/downloads.ts`, `src/routes/api/nesco/download.ts`
- Test: `tests/nesco-downloads.test.ts`

**Interfaces (Produces):**
```ts
export type NescoDownloadKind = "certificate" | "recharge" | "monthly"
export const NESCO_DOWNLOAD_KINDS: NescoDownloadKind[]    // enabled kinds = those that returned application/pdf in Task 1;
                                                           // if fixtures were skipped: ["certificate"] and a TODO in PROGRESS.md
export function parseDownloadQuery(q: { kind?: string | null; meter?: string | null }):
  { ok: true; kind: NescoDownloadKind; meter: string } | { ok: false; error: string }
export function isPdfContentType(ct: string | null): boolean
export function buildDownloadFilename(kind: NescoDownloadKind, meter: string): string  // "billbari-<kind>-<meter>.pdf"
export function nescoDownloadHref(kind: NescoDownloadKind, meter: string): string     // "/api/nesco/download?kind=…&meter=…"
```

- [ ] **Step 1: Failing tests:** `parseDownloadQuery({kind:"certificate", meter:"১২৩৪৫৬৭৮"})` → `{ok:true, meter:"12345678"}`; unknown kind → `ok:false`; a kind not in `NESCO_DOWNLOAD_KINDS` → `ok:false`; meter `"1234"` → `ok:false`; meter `"123456789012"` → `ok:false`. `isPdfContentType("application/pdf; charset=binary")` → true; `"text/html"` → false; `null` → false. `buildDownloadFilename("monthly","12345678")` → `"billbari-monthly-12345678.pdf"`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement `downloads.ts`.
- [ ] **Step 4: Route** (copy the `createFileRoute(...)({ server: { handlers: { GET } } })` shape from `src/routes/api/cron/daily-pulse.ts`). Flow:
  - Call `parseDownloadQuery` with the URL search params; on `ok:false` return 400 JSON `{ error }`.
  - `openNescoSession()`, then `postNescoForm(session, meter, NESCO_SUBMIT[kind → certificate | rechargePdf | monthlyPdf])`.
  - If `!res.ok` or `!isPdfContentType(...)`, return 502 JSON `{ error: "নেসকো পোর্টাল এই মুহূর্তে PDF দিচ্ছে না। একটু পরে আবার চেষ্টা করুন।" }`.
  - Otherwise return `new Response(res.body, { headers: { "Content-Type": "application/pdf", "Content-Disposition": \`attachment; filename="${buildDownloadFilename(kind, meter)}"\`, "Cache-Control": "no-store" } })`.
  - Catch session errors → 502 with the error message.
- [ ] **Step 5:** `pnpm generate-routes && pnpm typecheck` → PASS. If the user gave a meter in Task 1, run `pnpm dev` and download `/api/nesco/download?kind=certificate&meter=<it>`; the file opens as a PDF. Don't commit the PDF.
- [ ] **Step 6:** Commit: `feat(v2-p2): NESCO PDF download proxy`

---

## Task 4: Month/date helpers, free stats, analytics correctness

**Files:**
- Create: `src/lib/nesco-dates.ts`, `src/features/analytics/free-stats.ts`, `src/features/analytics/daily-rate.ts`
- Modify: `src/features/analytics/insights-generator.ts`, `tests/billbari.test.ts` (only if existing numeric expectations change)
- Test: `tests/free-stats.test.ts`

**Interfaces (Produces):**
```ts
// nesco-dates.ts
export function parseNescoDate(s: string | null | undefined): Date | null    // moved from insights-generator (parseRechargeDate), same behavior
export function monthIndex(month: string | number): number | null          // 0–11; English full/short, Bangla names (values of BANGLA_MONTHS), "1"–"12", "01", Bangla digits
export function sortMonthlyDesc<T extends { year: number | string; month: string }>(rows: T[]): T[]   // newest first; rows with unparseable month keep input order at the end
export function isSameCalendarMonth(row: { year: number | string; month: string }, now: Date): boolean

// daily-rate.ts
export function estimateDailyKwh(monthly: MonthlyConsumptionRecord[], now: Date):
  { kwhPerDay: number; source: "current_month" | "last_complete_month" } | null

// free-stats.ts
export interface FreeStats {
  latestMonth: { year: number; monthIndex: number; usageKwh: number; rechargeBdt: number; isCurrentMonth: boolean } | null
  monthOverMonthKwhPct: number | null     // two most recent COMPLETE months: round((c0 - c1) / c1 * 100); null if < 2 or c1.usageKwh ≤ 0
  avgMonthlyKwh: number | null            // mean usageKwh of ≤ 12 most recent complete months with usageKwh > 0; rounded to 1 decimal
  avgMonthlyRechargeBdt: number | null    // mean rechargeBdt of ≤ 12 most recent complete months with rechargeBdt > 0; rounded to whole taka
  currentSlab: { step: number; nameBn: string; nameEn: string; ratePerUnit: number; minUnits: number; maxUnits: number | null } | null
    // 0 < usage ≤ 50 → lifeline: { step: 0, nameBn: "লাইফলাইন", nameEn: "Lifeline", ratePerUnit: LIFELINE_RATE, minUnits: 0, maxUnits: 50 }
    // (calculateNescoBill reports step 1 for these, but bills the lifeline rate); otherwise from calculateNescoBill(latestMonth.usageKwh, load).activeStep
  balanceUnitsEstimate: number | null     // floor(balance / calculateNescoBill(avgMonthlyKwh, load).effectiveRatePerUnit); null if avg null or rate ≤ 0
  last12MonthsRechargeBdt: number         // sum rechargeBdt of the 12 most recent rows
  totalRebateBdt: number                  // sum discountBdt of all rows
  daysSinceLastRecharge: number | null    // floor((now − newest parseNescoDate(record.date)) / 86_400_000)
}
export function computeFreeStats(data: NescoFetchResult, now?: Date): FreeStats
export interface DeductionTotals { gross: number; net: number; rent: number; demandCharge: number; pfcCharge: number; vat: number; arrears: number; subsidy: number }
export function computeDeductionTotals(records: RechargeRecord[]): DeductionTotals
```
`load` = `approvedLoadKw` as number (`toNum(String(...))`), default 2 when ≤ 0.

- [ ] **Step 1: Failing tests** with `now = new Date(2026, 10, 27)` (27 Nov 2026) and rows (newest last on purpose, to prove sorting): `Sep 2026 250 kWh ৳2000 rebate 20`, `Oct 2026 300 kWh ৳2500 rebate 25`, `Nov 2026 120 kWh ৳1000 rebate 10`.

```ts
expect(s.latestMonth).toMatchObject({ year: 2026, monthIndex: 10, usageKwh: 120, isCurrentMonth: true })
expect(s.monthOverMonthKwhPct).toBe(20)               // Oct 300 vs Sep 250
expect(s.avgMonthlyKwh).toBe(275)
expect(s.currentSlab?.step).toBe(2)                   // 120 kWh → tier 2 (76–200), 7.2 ৳
// lifeline: latest month 40 kWh → { step: 0, ratePerUnit: LIFELINE_RATE, maxUnits: 50 }
expect(s.totalRebateBdt).toBe(55)
// empty meter
const e = computeFreeStats({ ...data, monthlyUsage: [], rechargeHistory: [] }, now)
expect(e).toMatchObject({ latestMonth: null, monthOverMonthKwhPct: null, avgMonthlyKwh: null, currentSlab: null,
  balanceUnitsEstimate: null, last12MonthsRechargeBdt: 0, totalRebateBdt: 0, daysSinceLastRecharge: null })
expect(JSON.stringify(e)).not.toMatch(/NaN|Infinity/)
// daily rate
expect(estimateDailyKwh(rows, new Date(2026, 10, 10))).toEqual({ kwhPerDay: 12, source: "current_month" })        // 120 / 10
expect(estimateDailyKwh(rows, new Date(2026, 10, 3))?.source).toBe("last_complete_month")                        // day < 5 → Oct 300 / 31
expect(estimateDailyKwh([], now)).toBeNull()
// months
expect(monthIndex("November")).toBe(10); expect(monthIndex("নভেম্বর")).toBe(10); expect(monthIndex("১১")).toBe(10); expect(monthIndex("xyz")).toBeNull()
// deductions
expect(computeDeductionTotals([{ amountBdt: 1000, netEnergyBdt: 900, rent: 40, vat: 45, … } as RechargeRecord]).gross).toBe(1000)
```
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement.
  - `estimateDailyKwh` rule: newest row is the current calendar month and `now.getDate() ≥ 5` → `usageKwh / now.getDate()` (2 decimals). Otherwise use the newest non-current row with `usageKwh > 0` → `usageKwh / daysInMonth(that month)`. Else `null`.
- [ ] **Step 4: Fix `generateAnalytics`** (existing logic bugs):
  - (a) Use `sortMonthlyDesc(monthlyUsage)` instead of trusting array order.
  - (b) Replace the invented `250`-unit fallback and the `latestMonthUnits / 30` daily rate with `estimateDailyKwh(…, new Date())`.
  - (c) Add `hasEnoughData: boolean` to `EnergyAnalytics` (`true` when the daily estimate is not null) and `dailyKwhSource: "current_month" | "last_complete_month" | null` to `CalculatedEstimates`.
  - (d) When `hasEnoughData` is false: `avgDailyKwh`, `avgDailyCostBdt`, `estimatedDaysRemaining`, projections and runway numbers are `0`, and `runway.urgencyLevel` is `"healthy"`.
  - (e) Import `parseNescoDate` from `@/lib/nesco-dates` and delete the local copy.
  - UI that shows runway must hide values when `!hasEnoughData`. Today that is `AdvancedStats` and the runway `StatCard` in `src/routes/index.tsx`: show the text `t.stats.notEnoughData` (add the key: "হিসাবের জন্য যথেষ্ট তথ্য নেই" / "Not enough data to estimate").
- [ ] **Step 5:** `pnpm test`. If existing `tests/billbari.test.ts` expectations for `generateAnalytics` change because of (a)–(d), update them to the new correct values and list each one in `PROGRESS.md`. → PASS. Commit: `feat(v2-p2): free stats and honest daily-rate analytics`

---

## Task 5: Entitlement matrix

**Files:** Create `src/features/payments/entitlements.ts`; Test: `tests/entitlements.test.ts`

**Interfaces (Produces):**
```ts
export type FeatureTier = "free" | "pro"
export type FeatureId =
  | "balance" | "customerInfo" | "arrearNotice" | "rechargeHistory" | "tokenReceipt" | "monthlyUsage" | "nescoDownloads" | "nescoServices"
  | "freeStats" | "tariffTable" | "billCalculator" | "printView" | "recentSearches" | "themes"
  | "runway" | "dailyBurn" | "slabForecast" | "seasonality" | "costEfficiency" | "rechargeBehaviour" | "personalInsights" | "advancedCharts"
  | "snapshots" | "autoDailyPulse" | "unlimitedSavedMeters" | "savedMetersOverview" | "lowBalanceAlert" | "csvExport"
  | "applianceSimulator" | "rechargePlanner" | "savingPlan"
export interface FeatureInfo { tier: FeatureTier; nescoParity: boolean; nameBn: string; nameEn: string; descBn: string; descEn: string }
export const FEATURES: Record<FeatureId, FeatureInfo>
export const FREE_SAVED_METER_LIMIT = 1
export function canUse(feature: FeatureId, viewer: { isPremium?: boolean } | null | undefined): boolean
export function featuresByTier(tier: FeatureTier): FeatureId[]       // declaration order
export function canSaveAnotherMeter(a: { isPremium: boolean; savedCount: number; alreadySaved: boolean }): boolean
```

Tiers and `nescoParity` exactly as master plan section 3. Copy:

| FeatureId | nameBn | nameEn | descBn | descEn |
| --- | --- | --- | --- | --- |
| balance | বর্তমান ব্যালেন্স | Current balance | মিটারে এখন কত টাকা আছে | Money left on the meter now |
| customerInfo | গ্রাহকের তথ্য | Customer details | নেসকোর রেকর্ডে থাকা সব তথ্য | Everything NESCO has on record |
| arrearNotice | বকেয়া নোটিশ | Arrear notice | বকেয়া থাকলে সতর্কবার্তা | Warning when arrears exist |
| rechargeHistory | রিচার্জ হিস্ট্রি | Recharge history | সব রিচার্জ ও টোকেন | Every recharge and token |
| tokenReceipt | টোকেন রসিদ | Token receipt | কপি, প্রিন্ট ও শেয়ার | Copy, print and share |
| monthlyUsage | মাসিক ব্যবহার | Monthly usage | মাসভিত্তিক ইউনিট ও খরচ | Units and cost by month |
| nescoDownloads | নেসকো PDF | NESCO PDFs | সার্টিফিকেট ও হিস্ট্রি ডাউনলোড | Certificate and history downloads |
| nescoServices | নেসকো সেবা | NESCO services | রিচার্জ, অফিস, অভিযোগের লিংক | Recharge, offices, complaints |
| freeStats | মৌলিক হিসাব | Basic stats | গড় ব্যবহার, ধাপ, মাসিক তুলনা | Averages, tariff step, monthly change |
| tariffTable | ট্যারিফ তালিকা | Tariff table | বিইআরসি এলটি-এ রেট | BERC LT-A rates |
| billCalculator | বিল ক্যালকুলেটর | Bill calculator | ইউনিট দিলে বিল দেখুন | Bill for any number of units |
| printView | প্রিন্ট | Print | হিস্ট্রি প্রিন্ট করুন | Print your history |
| recentSearches | সাম্প্রতিক সার্চ | Recent searches | এই ডিভাইসে আগের মিটার | Meters searched on this device |
| themes | ৮টি থিম | 8 themes | রং, আকার ও লেআউট বদলান | Change colors, shapes and layout |
| runway | কয়দিন চলবে | Days left | ব্যালেন্স শেষ হওয়ার দিন ও তারিখ | When your balance runs out |
| dailyBurn | দৈনিক খরচ | Daily burn | দিনে গড়ে কত টাকা ও ইউনিট | Average taka and units per day |
| slabForecast | ধাপ পূর্বাভাস | Tier forecast | মাস শেষে কোন ধাপে যাবেন | Which tier you'll end the month in |
| seasonality | মৌসুমি প্রভাব | Seasonality | কোন মাসে খরচ বেশি-কম | Your high and low months |
| costEfficiency | প্রকৃত ইউনিট দর | True unit cost | চার্জসহ প্রতি ইউনিটের দাম | Per-unit cost with all charges |
| rechargeBehaviour | রিচার্জ অভ্যাস | Recharge habits | গড় রিচার্জ, মাধ্যম, বিরতি | Average size, channel, gaps |
| personalInsights | ব্যক্তিগত পরামর্শ | Personal insights | আপনার ব্যবহারের ভিত্তিতে পরামর্শ | Advice from your own usage |
| advancedCharts | বিস্তারিত চার্ট | Detailed charts | রিচার্জ ও ব্যবহারের ট্রেন্ড | Recharge and usage trends |
| snapshots | ব্যালেন্স স্ন্যাপশট | Balance snapshots | দিনে দিনে ব্যালেন্স ট্র্যাকিং | Track balance day by day |
| autoDailyPulse | স্বয়ংক্রিয় দৈনিক হিসাব | Automatic daily check | প্রতি রাতে নিজে থেকেই স্ন্যাপশট | A snapshot every night, automatically |
| unlimitedSavedMeters | আনলিমিটেড মিটার | Unlimited meters | যত খুশি মিটার সংরক্ষণ | Save as many meters as you like |
| savedMetersOverview | সব মিটার একসাথে | All meters at a glance | সংরক্ষিত মিটারের সর্বশেষ ব্যালেন্স | Latest balance of every saved meter |
| lowBalanceAlert | কম ব্যালেন্স সতর্কতা | Low-balance alert | সীমার নিচে নামলে সতর্ক করুন | Warn below your limit |
| csvExport | CSV এক্সপোর্ট | CSV export | এক্সেলে খোলার মতো ফাইল | A file you can open in Excel |
| applianceSimulator | যন্ত্রপাতি সিমুলেটর | Appliance simulator | কোন যন্ত্রে কত খরচ | What each appliance costs |
| rechargePlanner | রিচার্জ প্ল্যানার | Recharge planner | কত টাকা রিচার্জ করলে কয়দিন চলবে | How much to recharge for N days |
| savingPlan | সাশ্রয় পরিকল্পনা | Saving plan | বিল কমানোর পরামর্শ | Ways to cut your bill |

- [ ] **Step 1: Failing tests:** every `nescoParity` feature has tier `free`; `canUse("runway", null)` false; `canUse("runway", { isPremium: true })` true; `canUse("balance", null)` true; every FEATURES entry has non-empty Bangla and English copy; `canSaveAnotherMeter({isPremium:false, savedCount:1, alreadySaved:false})` false; same with `alreadySaved:true` → true; `{isPremium:true, savedCount:50, alreadySaved:false}` → true.
- [ ] **Step 2–4:** FAIL → implement → PASS. Commit: `feat(v2-p2): entitlement matrix`

---

## Task 6: Server-side Pro enforcement

**Files:** Modify `src/features/auth/auth-server.ts`, `src/features/snapshots/snapshot-server.ts`

- [ ] **Step 1:** In `auth-server.ts` add
  `export async function getProUserOrError(): Promise<{ user: User } | { error: string }>` (no user → `"এই ফিচার ব্যবহার করতে লগইন করুন।"`; `!user.isPremium` → `"এই ফিচারটি প্রো প্ল্যানে পাওয়া যায়।"`).
- [ ] **Step 2:** `saveSnapshotFn`, `getSnapshotsFn`, `syncAutomatedDailyPulseFn`: replace the login-only check with `getProUserOrError()`. Keep each function's existing return shape and error path. `deleteSnapshotFn` stays login-only (users may always delete their own data).
- [ ] **Step 3:** `saveMeterFn`: after the login check, read `COUNT(*)` of the user's saved meters and whether this meter is already saved. If `!canSaveAnotherMeter(...)`, return `{ success: false, error: "ফ্রি প্ল্যানে ১টি মিটার সংরক্ষণ করা যায়। আরও মিটারের জন্য প্রো নিন।" }`. `getSavedMetersFn` keeps returning everything (no data hidden).
- [ ] **Step 4:** `triggerGlobalMidnightCronFn`: change the users query to `WHERE subscription_tier = 'lifetime' OR (subscription_tier = 'detective_monthly' AND subscription_expires_at > ?)` with `new Date().toISOString()` (today it ignores expiry).
- [ ] **Step 5:** `pnpm typecheck && pnpm test` → PASS. Manual with `pnpm dev`: a signed-in free user saving a 2nd meter sees the toast error; snapshots page for a free user gets the error, not data. Commit: `feat(v2-p2): enforce Pro on the server`

---

## Task 7: `ProGate` component

**Files:** Create `src/features/payments/pro-gate.tsx`; modify `src/features/i18n/translations.ts`

**Interfaces (Produces):**
```ts
export function useEntitlement(feature: FeatureId): { allowed: boolean; reason: "ok" | "signin" | "upgrade" }
export function ProGate(props: { feature: FeatureId; children: React.ReactNode; variant?: "card" | "inline" | "section"; className?: string }): React.JSX.Element
```

- [ ] **Step 1:** Translations under `pro`: `badge` (প্রো / Pro), `signIn` (লগইন করুন / Sign in), `upgrade` (প্রো নিন — ৳২০/মাস থেকে / Get Pro — from ৳20/month), `lockedTitle` (প্রো ফিচার / Pro feature).
- [ ] **Step 2:** Implement. `allowed` → render `children` only.
  Locked (never render `children`, not even hidden):
  - `card`: `Card` with `Lock` icon, `Badge` (pro.badge), feature name and description from `FEATURES` (language-aware), one `Button`. The button is `pro.signIn` → `openAuthModal("login")` when signed out, else `pro.upgrade` → `openPricingModal()`.
  - `inline`: a single `Button variant="outline" size="sm"` with `Lock` icon + feature name and the same action.
  - `section`: shadcn `Empty` (icon `Sparkles`, title, description, same action). It is used for whole sections/pages.
- [ ] **Step 3:** `pnpm typecheck && pnpm lint` → PASS. Commit: `feat(v2-p2): ProGate`

---

## Task 8: Verify and hand off

- [ ] `pnpm typecheck && pnpm test && pnpm lint && pnpm build` → all PASS.
- [ ] `pnpm dev`: search a real meter (or the sample) → home still renders, balance correct, no console errors.
- [ ] Update `docs/v2/PROGRESS.md`: Phase 2 done; fixture status; enabled download kinds; changed test expectations; anything Phase 3 must know. Commit `docs(v2-p2): progress`.

## Exit criteria

- Parser tests green (inline always; fixtures if captured). No positional-only parsing left without a label path.
- `computeFreeStats` and `estimateDailyKwh` tested, including the empty meter (no NaN/Infinity).
- No invented 250-unit fallback remains (`grep -n "250" src/features/analytics/insights-generator.ts` shows no fallback).
- Snapshots and the extra saved meters are blocked server-side for non-Pro users; the cron respects expiry.
