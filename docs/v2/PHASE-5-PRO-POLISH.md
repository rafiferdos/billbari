# Phase 5 — Pro pages, cleanup, QA

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Read
> `docs/v2/MASTER-PLAN.md` sections 3, 5.3, 6.4, 7, 8 first. Phases 1–4 must be done.

**Goal:** Pro users get a real analytics hub and a tracking page. Pricing tells the
truth (generated from the entitlement matrix). The codebase has zero hardcoded
colors left, no dead components, and every theme passes a visual and accessibility check.

---

## Task 1: Insights page (`/insights`, Pro)

**Files:** Rewrite `src/routes/insights.tsx`; create in `src/features/insights/`: `runway-section.tsx`, `slab-forecast-section.tsx`, `insights-list-section.tsx`, `cost-efficiency-section.tsx`, `recharge-behaviour-section.tsx`, `seasonality-section.tsx`, `eco-section.tsx`, `insights-locked.tsx`; modify `src/features/analytics/recharge-trend-chart.tsx`

**Interfaces (Consumes):** `generateAnalytics` → `EnergyAnalytics` (`runway`, `estimates`, `slabStats`, `insights`, `costEfficiency`, `rechargeStats`, `seasonality`, `eco`, `hasEnoughData`), `useEntitlement`, `FEATURES`.
Each section: `export function <Name>Section(props: { analytics: EnergyAnalytics; data: NescoFetchResult }): React.JSX.Element`.

- [x] **Step 1: Page frame:** `h1` "বিশ্লেষণ" / "Insights"; compact search; name + masked meter. No meter → `Empty` + search. `!analytics.hasEnoughData` → `Empty` `t.stats.notEnoughData` above the sections that need the daily rate (runway, slab forecast); the other sections still render.
- [x] **Step 2: Locked view** (`insights-locked.tsx`): when `useEntitlement("personalInsights").allowed` is false, render only this. It is a `ProGate`-style section (shadcn `Empty`) titled "প্রো বিশ্লেষণ" plus a list of the page's features (`runway`, `dailyBurn`, `slabForecast`, `personalInsights`, `costEfficiency`, `rechargeBehaviour`, `seasonality`, `advancedCharts`) with name + description from `FEATURES`, and one action button. No values. No section component mounts.
- [x] **Step 3: Sections** (Pro), in this order, inside `section-stack`:
  1. **Runway:** days left (huge), depletion date and hours, urgency badge, daily burn ৳ and kWh, data source of the daily rate (`estimates.dailyKwhSource`: "চলতি মাসের হার" / "This month's rate" or "গত পূর্ণ মাসের হার" / "Last full month's rate").
  2. **Slab forecast:** active step and rate; units left in the step (`Meter`); next step rate and per-unit jump (`slabJumpCostDelta`); projected month units and bill (`estimates.projectedMonthlyUnits`, `projectedMonthlyCostBdt`). If the projection reaches step 5 or more, show `Alert` (warning) "ধাপ ৫-এ রেট ৳১২.৬৭ — প্রায় ৫৮% বেশি" (compute the % from `NESCO_LTA_SLABS`; don't hardcode it).
  3. **Insights list:** all `analytics.insights` as cards (icon by type using tokens: warning → `text-warning`, success/tip → `text-success`, info → `text-primary`) with an estimate badge where `isCalculatedEstimate`.
  4. **Cost efficiency:** effective ৳/kWh incl. overhead, energy-only ৳/kWh, fixed overhead per month, total deductions (gross − net), total government rebate.
  5. **Recharge behaviour:** count, total, average, min/max, favorite channel + %, average gap days, days since last recharge.
  6. **Seasonality:** highest/lowest month (label, kWh, ৳), seasonality gap %, average monthly kWh and ৳; `ConsumptionChart` (all months) and `RechargeTrendChart`. Update `RechargeTrendChart` to read `theme.chart` (strokeWidth, curve type, grid dash, bar radius) as `ConsumptionChart` does since Phase 4.
  7. **Eco:** CO₂ kg and trees (small card).
- [x] **Step 4:** Delete components that are now unused (`grep -rn "<AdvancedStats\|<StatCard\|<SlabProgressCard" src` → none, then delete `advanced-stats.tsx`, `stat-card.tsx`, `slab-progress-card.tsx`). Move inline strings.
- [x] **Step 5:** `pnpm typecheck && pnpm lint && pnpm build` → PASS. Manual as free (locked view; leakage check: page text has no ৳ amounts or day counts except prices in the button) and as Pro (all sections). Commit: `feat(v2-p5): insights hub`

---

## Task 2: Tracking page (`/snapshots`, Pro)

**Files:** Rewrite `src/routes/snapshots.tsx`; create `src/features/snapshots/saved-meters-overview.tsx`, `src/features/snapshots/balance-trend-chart.tsx`; restyle `src/features/snapshots/{snapshot-history,snapshot-dialog}.tsx` (tokens only, keep logic)

- [x] **Step 1: Read today's page fully** and list its behaviors in `PROGRESS.md`: preview mode with `SAMPLE_PRO_SNAPSHOTS`, daily pulse sync, delete, meter filter. Keep all of them.
- [x] **Step 2: Page order:**
  - `h1` "ট্র্যাকিং" / "Tracking".
  - Not Pro → `<ProGate feature="snapshots" variant="section">`. Below it, keep today's sample preview, with every sample value under a visible `Badge` "নমুনা" / "Sample". These are not the user's values, so the locked-content rule holds.
  - Pro:
    1. `SavedMetersOverview`: grid of saved meters (masked number, favorite star as today, last snapshot balance + date from the user's snapshots grouped by meter, "লোড করুন" → `fetchMeter`).
    2. Actions row: "স্ন্যাপশট নিন" (`SnapshotDialog`), "আজকের হিসাব সিঙ্ক করুন" (`syncAutomatedDailyPulseFn`, today's behavior).
    3. `BalanceTrendChart`: balance over time for the active meter (Recharts line or area, `var(--chart-1)`, `theme.chart` settings, x = date ascending).
    4. `SnapshotHistory`.
- [x] **Step 3:** `pnpm typecheck && pnpm lint && pnpm build` → PASS. Manual as free and as Pro. Commit: `feat(v2-p5): tracking page`

---

## Task 3: Pricing that matches the matrix

**Files:** Modify `src/features/payments/pricing-dialog.tsx`, `src/features/payments/types.ts`, `tests/billbari.test.ts` (if it asserts plan feature text)

- [x] **Step 1:** Rewrite `PAYMENT_PLANS[].features` as plan-specific bullets only. `detective_monthly`: "৩০ দিনের জন্য সব প্রো ফিচার", "যেকোনো সময় আবার নবায়ন". `lifetime`: "এককালীন পেমেন্ট, আজীবন সব প্রো ফিচার", "ভবিষ্যতের নতুন প্রো ফিচারও পাবেন". Remove claims that the matrix makes free (for example the deduction/rebate receipt).
- [x] **Step 2:** In the dialog, under the two plan cards, add a shared section "সব প্রো ফিচার" / "Everything in Pro" listing `featuresByTier("pro")` (name + description, language-aware) and a collapsible "ফ্রিতে যা থাকছে" / "Always free" listing `featuresByTier("free")`. Don't change the bKash verification flow or its form.
- [x] **Step 3:** `pnpm test` (update any assertion on the old feature strings) → PASS. Commit: `feat(v2-p5): pricing generated from the entitlement matrix`

---

## Task 4: Zero hardcoded styles, dead code, copy

- [x] **Step 1:** `pnpm check:tokens` and fix every remaining file. Map: emerald/green → `success`; amber/yellow/orange → `warning`; red/rose → `destructive`; blue/violet/primary-ish → `primary`; grays → `muted`/`muted-foreground`/`border`; `shadow-*` → `shadow-card` (cards) or remove; hex colors → tokens.
- [x] **Step 2:** When the count is 0, delete `scripts/theme-token-baseline.json` and change the script so that, with no baseline file, any count > 0 fails. `pnpm lint` → PASS.
- [x] **Step 3:** Dead code: delete unused exports/components (check with `grep` before deleting): old `language-toggle` variants, `source-badge` parts no longer used, `sample-snapshots` only if the preview no longer uses it. `pnpm typecheck` → PASS.
- [x] **Step 4:** Copy: no inline `isBangla ? "…" : "…"` left in files touched by v2 (`grep -rn 'isBangla ?' src | wc -l`, record before/after; files never touched in v2 may keep theirs).
- [x] **Step 5:** Commit: `refactor(v2-p5): tokens only, dead code removed`

---

## Task 5: QA matrix and accessibility

Use the browser preview (and the Lighthouse tool if available). Load the sample meter. Record results as a table in `PROGRESS.md` (✔/✘ + note).

- [x] **Themes × modes on the dashboard:** all 8 themes × light/dark at 360 and 1280 (32 checks):
  - no horizontal scroll;
  - text readable on glass (`aurora`) and gradient (`komol`, `sonar`) backgrounds;
  - header readable (`sonar` green bar);
  - dock never covers content and respects the safe area;
  - layout matches the theme (bento/stack/split);
  - fonts are the theme's fonts (Bangla included).
- [x] **Other pages:** `bidyut`, `khata`, `console` × light/dark at 360 and 1280 for Landing, History, Tools, Insights (free and Pro), Tracking (free and Pro), Help.
- [x] **Keyboard:**
  - Tab order header → search → regions; "/" focuses search on the landing.
  - Dialogs and sheets trap focus, close with Esc, and return focus to the trigger.
  - Every icon-only button has `aria-label` (`grep -rn 'size="icon' src/routes src/features src/components` and check each).
  - Active nav item has `aria-current`.
- [x] **Lighthouse** (mobile) on `/` with a sample meter: Accessibility ≥ 95, Best Practices ≥ 95. Record Performance; fix only clear regressions (for example, unused fonts loading: the network panel should show only the active theme's font files).
- [x] **Reduced motion:** emulate `prefers-reduced-motion: reduce`; no animations remain.
- [x] **Print:** receipt and both history tables print alone, without the page background decoration.
- [x] **No-flash:** reload in each theme; no default-theme flash; no hydration warning in the console.
- [x] Fix ✘ items (primitives or the specific page). Re-run the affected checks.

---

## Task 6: Docs and close-out

- [x] **README.md:** update the feature table (Bangla, matching today's style) to list free (NESCO parity + basic stats) vs Pro features from the matrix, the 8 themes, and the Base UI-first component rule. Don't touch the deploy and security sections except for facts that changed.
- [x] **PROGRESS.md:** Phase 5 done; final token-lint count 0; QA table; remaining known issues.
- [x] `pnpm typecheck && pnpm test && pnpm lint && pnpm build` → all PASS.
- [x] Commit: `docs(v2-p5): readme and final progress`

## Exit criteria

- `/insights` and `/snapshots` complete for Pro; locked views leak no user values.
- Pricing lists exactly what the matrix says.
- `pnpm check:tokens` passes with zero allowed occurrences.
- QA matrix recorded with no open ✘ (or each ✘ listed with a reason in "known issues").
