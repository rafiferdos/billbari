# Phase 4 — Records, tools and help

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Read
> `docs/v2/MASTER-PLAN.md` sections 2, 3, 5.3, 7 first. Phases 1–3 must be done.

**Goal:** Full NESCO parity for records (every recharge and token, every month,
receipt, print, NESCO PDFs), plus the free tariff tools and the Pro tools
(recharge planner, appliance simulator, saving plan), plus a complete Help page.

**Architecture:** Pages compose existing primitives and Phase 2/3 modules. New
logic lives in pure, tested modules (`csv.ts`, `recharge-planner.ts`). Printing
mounts a print-only view on demand (`usePrint`), so only one `data-print-root`
exists at a time.

---

## Task 1: CSV export and print helpers

**Files:** Create `src/features/export/csv.ts`, `src/hooks/use-print.ts`, `src/features/export/printable-table.tsx`; Test: `tests/csv.test.ts`

**Interfaces (Produces):**
```ts
export interface CsvColumn<T> { header: string; value: (row: T) => string | number | null | undefined }
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string   // "﻿" + header + rows, CRLF, RFC 4180 quoting
export function downloadCsv(filename: string, csv: string): void         // Blob "text/csv;charset=utf-8", temp anchor via document.createElement, revoke URL
export function usePrint(): { printing: boolean; print: () => void }      // print() → printing=true → next frame window.print(); "afterprint" → false
export function PrintableTable(props: { title: string; subtitle: string; columns: { header: string; align?: "left" | "right" }[];
  rows: (string | number)[][]; footer?: string }): React.JSX.Element      // root has data-print-root; header shows title, subtitle, printed date
```

- [ ] **Step 1: Failing tests:** output starts with `"﻿"`; lines joined by `"\r\n"`; `a,b` → `"a,b"`; `he said "hi"` → `"he said ""hi"""`; a value with `\n` is quoted; `null`/`undefined` → empty field; numbers are written as-is.
- [ ] **Step 2–3:** FAIL → implement → PASS. Commit: `feat(v2-p4): csv export and print helpers`

---

## Task 2: History page

**Files:** Rewrite `src/routes/history.tsx`; modify `src/features/analytics/consumption-chart.tsx`; create `src/features/history/recharge-list.tsx`, `src/features/history/monthly-list.tsx`

Keep today's behavior: the period filter (`all | 30 | 90 | 365` days), search over token/amount/channel, and the rule (see the comment near today's `filteredRecharges`) that records whose date cannot be parsed are never silently hidden.

- [ ] **Step 1: Route search:** `validateSearch: (s: Record<string, unknown>): { tab?: "monthly" } => (s.tab === "monthly" ? { tab: "monthly" } : {})`. The key is optional, so plain `<Link to="/history">` stays valid. The Tabs value is `tab ?? "recharges"`. Tab changes call `navigate({ search: v === "monthly" ? { tab: "monthly" } : {}, replace: true })`.
- [ ] **Step 2: Page frame:** `h1` "রিচার্জ ও ব্যবহারের হিস্ট্রি" / "Recharge and usage history"; `MeterSearch variant="compact"`; name + `maskMeter`; `SourceBanner`. No meter → `Empty` with the compact search. Loading → Skeletons. Error → `MeterError`.
- [ ] **Step 3: Recharges tab** (top to bottom):
  - **Toolbar:** period `Select`, search `InputGroup`. Action buttons: Print (`usePrint`); NESCO PDF (only if `NESCO_DOWNLOAD_KINDS` has `recharge`, href `nescoDownloadHref("recharge", meter)`); `<ProGate feature="csvExport" variant="inline">` CSV button → `downloadCsv("billbari-recharges-<meter>.csv", toCsv(filtered, cols))`.
  - **Deduction totals** (free) for the filtered rows from `computeDeductionTotals`: gross, net energy, meter rent, demand, VAT, PFC, arrears, rebate. Small stat grid `grid-cols-2 sm:grid-cols-4`, `num`.
  - **List:** below `md`, `RechargeList` of shadcn `Item`s (date + channel, amount, kWh, `TokenDisplay size="sm"`, tap opens `ReceiptDialog`). At `md+`, a `Table` with columns #, তারিখ, টোকেন, রিচার্জ ৳, বিদ্যুৎ ৳, kWh, মাধ্যম, রসিদ (button). Right-align numbers.
  - 10 rows per page with shadcn `Pagination`; reset to page 1 when filters change. A "Showing X of Y" line when filtered.
  - Remove today's token dialog; `ReceiptDialog` replaces it.
  - **Print view:** when `printing`, render `PrintableTable` (title "রিচার্জ হিস্ট্রি", subtitle name + masked meter + period) with every filtered row (not just the current page) and the totals as `footer`.
- [ ] **Step 4: Monthly tab:**
  - `ToggleGroup` "১২ মাস / সব মাস" ("12 months / All").
  - `ConsumptionChart`, updated to read `useAppTheme().theme.chart` (bar radius, stroke width, curve, grid dash) and to use `sortMonthlyDesc` reversed for display.
  - `MonthlyList` (`Item`s below `md`) / `Table` (`md+`) with columns year, month, kWh, recharge, rebate, energy ৳, rent, demand, VAT, total, month-end balance (skip columns that are 0 for every row).
  - Toolbar: Print, NESCO PDF (`monthly` kind if enabled), CSV (Pro).
- [ ] **Step 5:** Move inline strings to `translations.ts`. `pnpm typecheck && pnpm lint && pnpm build` → PASS. Manual: filters, pagination, receipt, print preview (only the table prints), CSV (Pro account or temporarily set `isPremium` in dev; do not commit that). Commit: `feat(v2-p4): history page with receipts, print and csv`

---

## Task 3: Recharge planner (Pro, new)

**Files:** Create `src/features/tools/recharge-planner.ts`, `src/features/tools/recharge-planner-card.tsx`; Test: `tests/recharge-planner.test.ts`

**Interfaces (Produces):**
```ts
export interface RechargePlanInput { balanceBdt: number; dailyKwh: number; monthUnitsSoFar: number; today: Date; targetDays: number; sanctionedLoadKw: number }
export interface RechargePlan {
  neededKwh: number              // dailyKwh × targetDays, 1 decimal
  estimatedCostBdt: number       // ceil(total cost for the period)
  shortfallBdt: number           // max(0, estimatedCostBdt − balanceBdt)
  recommendedRechargeBdt: number // shortfall rounded UP to the next ৳50; 0 when shortfall is 0
  slabAfter: number              // calculateNescoBill(monthUnitsSoFar + seg1Units, load).activeStep.step
  crossesSlab: boolean           // slabAfter > activeStep.step of calculateNescoBill(monthUnitsSoFar, load)
}
export function planRecharge(input: RechargePlanInput): RechargePlan
```

Algorithm (the tariff is progressive per calendar month, so cost is the bill difference, not units × rate):
```
bill(u) = calculateNescoBill(u, load).totalBill            // includes fixed charges, VAT, rebate
remaining = daysInMonth(today) − today.getDate() + 1
seg1Days = min(targetDays, remaining);  seg1Units = dailyKwh × seg1Days
cost = bill(monthUnitsSoFar + seg1Units) − bill(monthUnitsSoFar)     // fixed charges cancel within the same month
rest = targetDays − seg1Days
while rest > 0: d = min(rest, 30); cost += bill(dailyKwh × d); rest −= d   // each later month starts at 0 units, pays its own fixed charges
```
`targetDays` is clamped to 1–90; a negative or NaN input becomes 0 (`dailyKwh`, `balanceBdt`, `monthUnitsSoFar`).
`dailyKwh ≤ 0` → return all zeros and `crossesSlab: false` before the loop (no usage to plan from; otherwise later months would add fixed charges for zero usage).

- [ ] **Step 1: Failing tests** (`today = new Date(2026, 10, 10)`, load 2):
  - `dailyKwh: 0` → `{ neededKwh: 0, estimatedCostBdt: 0, shortfallBdt: 0, recommendedRechargeBdt: 0 }` (objectContaining).
  - `balanceBdt: 10000, dailyKwh: 5, targetDays: 10, monthUnitsSoFar: 45` → `shortfallBdt` 0, `recommendedRechargeBdt` 0.
  - `monthUnitsSoFar: 190, dailyKwh: 10, targetDays: 5, balanceBdt: 0` → `slabAfter` 3, `crossesSlab` true.
  - `balanceBdt: 0, dailyKwh: 8, targetDays: 30` → `recommendedRechargeBdt % 50 === 0`, `≥ shortfallBdt`, `− shortfallBdt < 50`.
  - Multi-month (`today = new Date(2026, 10, 25)`): the cost for `targetDays: 30` is greater than for `targetDays: 6`.
- [ ] **Step 2–3:** FAIL → implement → PASS.
- [ ] **Step 4: Card** (`<ProGate feature="rechargePlanner" variant="card">`):
  - Needs a loaded meter, else `Empty` + `MeterSearch variant="compact"`. Needs `estimateDailyKwh(...) !== null`, else `Empty` `t.stats.notEnoughData`.
  - Input: `NumberField` target days (default 30, min 1, max 90).
  - Output: `recommendedRechargeBdt` (big, `num`), needed kWh, estimated cost, current balance, and an estimate badge.
  - When `crossesSlab`: `Alert` "এই হারে চললে এ মাসে ধাপ {slabAfter}-এ উঠবেন" / "At this rate you'll reach tier {slabAfter} this month".
  - Link button "রিচার্জ করুন" → `EKPAY_RECHARGE_URL`.
  - `monthUnitsSoFar` = latest month usage when it is the current calendar month, else 0.
- [ ] **Step 5:** Commit: `feat(v2-p4): recharge planner`

---

## Task 4: Tools page (`/tariffs`)

**Files:** Rewrite `src/routes/tariffs.tsx`; modify `src/features/tariffs/appliance-simulator.tsx` (inputs only), `src/features/tariffs/bill-saving-section.tsx` (styles only)

Order (master plan 5.3): bill calculator → tariff table → recharge planner (Pro) → appliance simulator (Pro) → saving tips (Pro).

- [ ] **Step 1:** Header `h1` "টুলস ও ট্যারিফ" / "Tools and tariffs". Below it, a horizontal `ScrollArea` of anchor chips (`Button variant="outline" size="sm"` linking to `#calculator`, `#tariff`, `#planner`, `#simulator`, `#saving`). Sections are `section-stack`, and each has `scroll-mt-[calc(var(--bb-header-h)+1rem)]`.
- [ ] **Step 2: Bill calculator (free):** keep today's logic (`calculateNescoBill(units, loadKw, isSinglePhase)`). Replace numeric `Input`s with `NumberField` (units 0–2000 step 1; load 1–20 step 0.5). Keep the `Slider` for units. Show the slab breakdown table and totals (energy, demand, meter rent, VAT, rebate, total, effective ৳/unit). Prefill units from the loaded meter's latest month when available.
- [ ] **Step 3: Tariff table (free):** lifeline + `NESCO_LTA_SLABS` rows (step, range, ৳/unit, `num`, right-aligned) and fixed charges: demand ৳42/kW, meter rent ৳40, VAT 5%, prepaid rebate 1% (`tariff-constants.ts` values; don't retype numbers). Add a note "সূত্র: বিইআরসি এলটি-এ (আবাসিক) ট্যারিফ" / "Source: BERC LT-A (residential) tariff".
- [ ] **Step 4:** `RechargePlannerCard` (Task 3).
- [ ] **Step 5:** `<ProGate feature="applianceSimulator" variant="section">` around `ApplianceSimulator`. Inside the simulator, replace numeric `Input`s for quantity/hours with `NumberField`; change nothing else in its logic. `<ProGate feature="savingPlan" variant="section">` around `BillSavingSection`.
- [ ] **Step 6:** Move inline strings; replace raw palette classes in these files with tokens. `pnpm typecheck && pnpm lint && pnpm build` → PASS. Commit: `feat(v2-p4): tools page`

---

## Task 5: Help page (`/help`)

**Files:** Rewrite `src/routes/help.tsx`; create `src/features/help/faq.ts`

**Interfaces (Produces):**
```ts
export const NESCO_LINK_GROUPS: { id: "pay" | "complain" | "guides" | "connection"; titleBn: string; titleEn: string; linkIds: string[] }[]
export const BILLBARI_FAQ: { qBn: string; qEn: string; aBn: string; aEn: string }[]
```

- [ ] **Step 1: Groups** (ids from `NESCO_LINKS`):
  - pay "রিচার্জ ও বিল" / "Recharge and bills": recharge, paymentChannels, postpaid, misc
  - complain "অভিযোগ ও যোগাযোগ" / "Complaints and contact": complaint, officeComplaint, ministryComplaint, contact
  - guides "নির্দেশিকা" / "Guides": manual, charter, acts, faq
  - connection "সংযোগ ও অফিস" / "Connection and offices": newConnection, offices

  Test (append to `tests/entitlements.test.ts` or a new `tests/help.test.ts`): every `linkIds` entry exists in `NESCO_LINKS`, and every `NESCO_LINKS` id appears in exactly one group.
- [ ] **Step 2: Page order:**
  - **Services:** a grid of group cards with `Item` rows (name, desc, `ExternalLink` icon; `target="_blank" rel="noopener noreferrer"`).
  - **Certificate card:** if a meter is loaded and `certificate` is enabled, a download button; otherwise `MeterSearch variant="compact"` with a hint.
  - **FAQ:** `Accordion`.
- [ ] **Step 3: FAQ** (write natural bn + en answers from these facts):
  1. Is BillBari official? No. It is independent and reads NESCO's public customer portal.
  2. How fresh is the data? It is fetched from NESCO when you search, and NESCO's own "balance updated" time is shown. Before writing this answer, check whether `getMeterDataFn`/`server-db` cache responses (the `cached_real` data source) and state the real behavior.
  3. Why can the meter show a different balance? The meter updates in real time; NESCO's server updates periodically.
  4. Lost your token? The History page lists every token; copy it and enter it on the meter.
  5. What is free? Everything NESCO shows, plus basic stats. Pro adds forecasts, tracking, exports and tools (link opens pricing).
  6. What do you store? Recent searches stay on your device. Saved meters and snapshots are stored only when you sign in. Check the code and state the truth; don't promise anything the code doesn't do.
- [ ] **Step 4:** `pnpm typecheck && pnpm test && pnpm lint && pnpm build` → PASS. Commit: `feat(v2-p4): help page with NESCO services and FAQ`

---

## Task 6: Verify and hand off

- [ ] For `bidyut`, `dharalo`, `komol` (light + dark) at 360 and 1280: History (both tabs, receipt, print preview), Tools (all sections, planner locked for free and working for Pro), Help. No horizontal scroll; tables scroll inside their card if needed (`ScrollArea`), never the page.
- [ ] Token lint: counts only went down; update the baseline and record the total.
- [ ] `PROGRESS.md`: Phase 4 done, notes for Phase 5. Commit `docs(v2-p4): progress`.

## Exit criteria

- Every NESCO parity row in master plan section 2 is reachable in the UI (tick them in `PROGRESS.md`).
- CSV and recharge planner tests green; print shows only the intended table or receipt.
