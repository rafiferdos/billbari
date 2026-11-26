# BillBari v2 — Master Plan

> **For agentic workers:** read this whole file once, then the phase file you were
> asked to run (`docs/v2/PHASE-N-*.md`). Execute that phase task by task, inline
> (REQUIRED SUB-SKILL: superpowers:executing-plans). Steps use `- [ ]` checkboxes.
> Never start a phase whose predecessor is not marked done in `docs/v2/PROGRESS.md`.

**Goal:** Replace the NESCO prepaid portal for everyday use. A user types a meter
number and gets everything NESCO shows (free), a few computed statistics (free), and
deeper analytics and tracking (Pro), in a modern, mobile-first UI with 8 full themes.

**Architecture:** TanStack Start (SSR on Vercel via Nitro). NESCO data is scraped
server-side (`src/features/nesco`). Analytics are pure functions over that data.
The design system is a TypeScript theme registry that generates CSS custom
properties at SSR time. Structural variants (layout, nav) are `data-*` attributes
on `<html>`, set before first paint.

**Tech stack (already installed, do not replace):** React 19, TanStack Start/Router/
Query/DB, Tailwind CSS v4, shadcn CLI with style `base-rhea` (components built on
`@base-ui/react`), Recharts 3, Turso/libSQL, Vitest, pnpm.

Plan written 2026-11-27 against commit `3205907`.

---

## 1. Phases

| Phase | File | Delivers |
| --- | --- | --- |
| 1 | `PHASE-1-DESIGN-SYSTEM.md` | Theme engine, 8 themes, tokenized primitives, new components, Base UI Toast, appearance panel, token lint |
| 2 | `PHASE-2-DATA-ENTITLEMENTS.md` | Robust NESCO parser + fixtures, NESCO PDF downloads, free stats, entitlement matrix, server-side Pro enforcement, `ProGate` |
| 3 | `PHASE-3-SHELL-HOME.md` | App header + mobile dock, meter search, landing page, prioritized dashboard with 3 layouts, token + receipt UI |
| 4 | `PHASE-4-RECORDS-TOOLS.md` | History (recharges, monthly), print + CSV, Tools (tariff, bill calculator, recharge planner, simulator, tips), Help page |
| 5 | `PHASE-5-PRO-POLISH.md` | Insights page, Tracking (snapshots + saved-meter overview), pricing from matrix, cleanup, token lint to zero, QA matrix, docs |

Each phase ends green (`pnpm typecheck && pnpm test && pnpm lint && pnpm build`),
updates `docs/v2/PROGRESS.md`, and makes one or more commits. Nothing is pushed.

---

## 2. What NESCO offers (verified 2026-11-27 on `customer.nesco.gov.bd/pre/panel`)

Everything in this table is **free** in BillBari. That is the product rule.

| NESCO portal item | How NESCO does it | BillBari equivalent (free) | Phase |
| --- | --- | --- | --- |
| Customer info (`#con_info_div`) | Read-only inputs: name, address, office, feeder, meter no, customer no, sanctioned load, tariff, balance, more | Customer info card showing **every** field NESCO returns, in NESCO's order | 2, 3 |
| Current balance | Last input in the info block | Balance hero with "updated at" time | 2, 3 |
| Arrear notice (`#arrear_notice_div`) | Shown when arrears exist | Destructive alert at the top of the dashboard | 2, 3 |
| Recharge history (`submit=রিচার্জ হিস্ট্রি`) | Table: token, rent, demand, PFC, VAT, arrears, rebate, energy ৳, gross ৳, kWh, via, date, status | History page (table on desktop, list on mobile) + recent 3 on home | 4, 3 |
| Vending token receipt (`/pre/showToken` modal + Print) | Per-row modal with print | Receipt dialog: copy, print, share | 3 |
| Monthly usage (`submit=মাসিক ব্যবহার`) | Table: year, month, recharge, rebate, energy ৳, rent, demand, VAT, total, month-end balance, kWh | Monthly tab with table/list + chart | 4 |
| Certificate download (`submit=সার্টিফিকেট ডাউনলোড করুন`) | PDF in new tab | Proxied PDF download | 2 |
| Recharge history / monthly usage download (`রিচার্জ হিস্ট্রি ডাউনলোড করুন`, `মাসিক ব্যবহার ডাউনলোড করুন`) | Handled by portal JS (button may be hidden) | Proxied PDF if the portal still serves it; always a free print view | 2, 4 |
| Links: ekPay bill/recharge, payment channels, prepaid manual, service offices, complaints, citizen charter, FAQ, new connection, postpaid bill | Navbar dropdowns | Help page "নেসকো সেবা" | 4 |

Free computed statistics ("a few we calculate"), all from `computeFreeStats` (Phase 2):
average monthly kWh, average monthly recharge, latest month kWh + month-over-month %,
current tariff slab + rate, estimated units the balance buys, total recharged in the
last 12 months, total rebate received, days since last recharge, deduction totals
on the history page.

---

## 3. Entitlement matrix (single source of truth: `src/features/payments/entitlements.ts`)

Both paid plans (`detective_monthly` "মিটার প্লাস" ৳20/30 days, `lifetime`
"প্রিমিয়াম আনলিমিটেড" ৳100) unlock the same Pro set. `isPremium` on the user is
the only entitlement flag. Re-tiering a feature is a one-line change in the matrix.

| FeatureId | Tier | NESCO parity | Enforced where |
| --- | --- | --- | --- |
| `balance`, `customerInfo`, `arrearNotice`, `rechargeHistory`, `tokenReceipt`, `monthlyUsage`, `nescoDownloads`, `nescoServices` | free | yes | — |
| `freeStats`, `tariffTable`, `billCalculator`, `printView`, `recentSearches`, `themes` | free | no | — |
| `runway` (days left, depletion date) | pro | no | UI (`ProGate`) |
| `dailyBurn` (avg daily ৳ and kWh) | pro | no | UI |
| `slabForecast` (projected month units/bill, slab-jump warning) | pro | no | UI |
| `seasonality`, `costEfficiency`, `rechargeBehaviour`, `personalInsights`, `advancedCharts` | pro | no | UI |
| `snapshots` (balance snapshots + history) | pro | no | **server** (`saveSnapshotFn`, `getSnapshotsFn`) + UI |
| `autoDailyPulse` (midnight auto-snapshot) | pro | no | **server** (cron query) |
| `unlimitedSavedMeters` (free: `FREE_SAVED_METER_LIMIT = 1`) | pro | no | **server** (`saveMeterFn`) + UI |
| `savedMetersOverview` | pro | no | UI (data comes from Pro-only snapshots) |
| `lowBalanceAlert` | pro | no | UI |
| `csvExport` | pro | no | UI |
| `applianceSimulator`, `rechargePlanner`, `savingPlan` | pro | no | UI |

Client-computed Pro stats are gated in the UI only. That is accepted: their inputs
are public NESCO data. Server-stored data (snapshots, saved meters) is gated on the
server. Existing data of lapsed users is never deleted, only read-blocked or
add-blocked as listed.

**Locked content rule (kept from Phase 3 of v1):** a locked feature renders a
locked card with the feature name, one line of description, and one action (Sign in
if signed out, Upgrade if signed in). It never renders the real values, not even
blurred or hidden with CSS.

---

## 4. Information architecture

| Route | Purpose | Tier | Created/rewritten in |
| --- | --- | --- | --- |
| `/` | Landing (no meter) or dashboard (meter loaded) | free + Pro tiles | 3 |
| `/history` | Recharges & tokens tab (default), Monthly usage tab (`?tab=monthly`) | free + Pro CSV | 4 |
| `/insights` | Pro analytics hub | Pro | stub 3, full 5 |
| `/tariffs` | Tools: tariff table, bill calculator, recharge planner, appliance simulator, saving tips (path kept to avoid broken links; label "টুলস") | mixed | 4 |
| `/snapshots` | Tracking: saved-meter overview, snapshots (label "ট্র্যাকিং") | Pro | 5 |
| `/help` | NESCO services + FAQ | free | stub 3, full 4 |
| `/api/nesco/download` | PDF proxy | free | 2 |

Nav items (`src/components/nav-items.ts`, Phase 3), in this order:
Home `/`, History `/history`, Insights `/insights` (Pro badge), Tools `/tariffs`,
Tracking `/snapshots` (Pro badge), Help `/help`.
Mobile dock shows the first 4 plus a "More" button opening a Sheet with the rest
and account actions.

The active meter stays in `MeterProvider` (sessionStorage), not in the URL. A
meter number in a URL would leak a customer's name and address through shared
links and browser history.

---

## 5. Display priorities

Rule: DOM order = priority order = mobile order. Desktop layouts only reposition.

### 5.1 Home dashboard (meter loaded)

Above the grid, always full width, in this order: compact meter search; customer
name + masked meter line (`••••1234`); arrear alert (only if `arrearNotice`).

| P | RegionId | Content | Tier | Bento md / lg span | Split column |
| --- | --- | --- | --- | --- | --- |
| 1 | `balance` | Balance (huge, num font), updated-at, source badge, health meter, actions: Refresh, Recharge (ekPay), Save meter, Low-balance alert (Pro) | free | 2 / 7 | aside |
| 2 | `lastRecharge` | Last recharge amount, net energy, date, via, **token with Copy + Receipt** | free | 1 / 5 | aside |
| 3 | `runway` | Days left, depletion date, daily burn | Pro | 1 / 4 | main |
| 4 | `thisMonth` | Latest month kWh, MoM %, current slab + rate, avg monthly kWh, units balance buys | free | 1 / 4 | main |
| 5 | `quickActions` | Certificate PDF, All recharges, Bill calculator, NESCO services | free | 1 / 4 | aside |
| 6 | `usageChart` | 12-month kWh bars | free | 2 / 8 | main |
| 7 | `recentRecharges` | Last 3 recharges with token copy, link to history | free | 2 / 4 | main |
| 8 | `customerInfo` | All NESCO fields, Accordion (closed < lg, open ≥ lg) | free | 2 / 6 | aside |
| 9 | `proInsights` | Pro: top 3 insights + link. Free: 3 locked teaser tiles + CTA | Pro | 2 / 6 | main |

Bento lg rows (12 columns): `[balance 7, lastRecharge 5]`, `[runway 4, thisMonth 4,
quickActions 4]`, `[usageChart 8, recentRecharges 4]`, `[customerInfo 6, proInsights 6]`.
Stack: one column in P order. Split (≥ lg): sticky aside `22rem` + main column,
each column in P order. Below lg every layout is one column in P order.

### 5.2 Landing (no meter)

1. Headline + one-line promise. 2. Meter search (hero). 3. Recent searches chips
(local). 4. Saved meters (signed in). 5. "নমুনা দেখুন" sample link.
6. Free vs Pro two-column list generated from `FEATURES`. 7. Data-source trust line.

### 5.3 Other pages (top to bottom)

- History / Recharges: filters toolbar (year, search) → deduction totals (free stats)
  → list/table (10 per page) → print, NESCO PDF, CSV (Pro).
- History / Monthly: range toggle (12 months / all) → chart → table/list → print, NESCO PDF, CSV (Pro).
- Tools: bill calculator → tariff table → recharge planner (Pro) → appliance simulator (Pro) → saving tips (Pro).
- Insights (Pro): runway → slab forecast → insights list → cost efficiency → recharge behaviour → seasonality + charts → eco.
- Tracking (Pro): saved-meter overview → take snapshot → snapshot chart → snapshot list.
- Help: NESCO services grid → certificate download (needs meter) → FAQ accordion.

---

## 6. Design system

### 6.1 Token contract

Themes are data in `src/features/theme/themes.ts`. `buildThemeCss()` turns them
into CSS injected in `<head>` by `__root.tsx`. Components read tokens only through
Tailwind classes mapped in `src/styles.css` or the utilities listed below.

Color tokens (per mode, shadcn names): `--background --foreground --card
--card-foreground --popover --popover-foreground --primary --primary-foreground
--secondary --secondary-foreground --muted --muted-foreground --accent
--accent-foreground --destructive --border --input --ring --chart-1..5 --success
--warning`.

BillBari tokens (prefix `--bb-` to avoid Tailwind theme-variable collisions):

| Token | Meaning |
| --- | --- |
| `--radius` | Base radius (shadcn scale multiplies it) |
| `--bb-border-w` | Card/input/outline border width |
| `--bb-control-radius` | Buttons, inputs, select triggers, tabs |
| `--bb-control-shadow` | Hard shadow on controls (brutal theme) or `none` |
| `--bb-card-shadow` | Card shadow |
| `--bb-card-backdrop` | Card `backdrop-filter` value (`blur(…)` on glass themes, else `none`) |
| `--bb-header-bg`, `--bb-header-fg`, `--bb-header-backdrop`, `--bb-header-h` | App header |
| `--bb-page-bg` | `background` shorthand for the fixed page decoration layer, or `none` |
| `--bb-font-sans`, `--bb-font-heading`, `--bb-font-num` | Font stacks (Latin family first, Bangla second) |
| `--bb-heading-weight`, `--bb-heading-tracking` | Heading style |
| `--bb-container`, `--bb-page-px` | Page max width and side gutter |
| `--bb-section-gap`, `--bb-grid-gap`, `--bb-card-p` | Spacing rhythm |
| `--bb-control-h`, `--bb-control-h-sm`, `--bb-control-h-lg` | Control heights (clamped up on touch, see 6.4) |

Structural attributes on `<html>`: `data-theme`, `data-layout` (`bento | stack |
split`), `data-nav` (`top | dock`). Tailwind custom variants: `layout-bento:`,
`layout-stack:`, `layout-split:`, `nav-dock:`, `nav-top:`.

Utilities (defined with `@utility` in `src/styles.css`): `page-shell`,
`surface-card`, `section-stack`, `num`. Exact CSS is in Phase 1.

### 6.2 The 8 themes (full values in Phase 1, Task 2)

| id | Bangla / English | Personality | Radius | Border | Fonts (heading / body) | Container | Density | Layout | Nav |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `bidyut` (default) | বিদ্যুৎ / Bidyut | Clean energy, teal-green, soft shadows | 0.75rem | 1px | Inter + Noto Sans Bengali | 72rem | cozy | bento | dock |
| `nishi` | নিশি / Night Grid | Neon blue/cyan, glow borders, dark-first | 1rem | 1px | Space Grotesk + Anek Bangla, JetBrains Mono numbers | 80rem | cozy | bento | dock |
| `khata` | খাতা / Ledger | Paper and ink, ruled page, serif headings | 0.25rem | 1px | Fraunces + Noto Serif Bengali / Inter + Noto Sans Bengali | 52rem | compact | stack | top |
| `dharalo` | ধারালো / Brutal | Neo-brutalist, ink + yellow, hard offset shadows | 0 | 2px | Space Grotesk + Anek Bangla 700 | 76rem | roomy, tall controls | bento | top |
| `komol` | কোমল / Soft | Pastel violet, pill controls, big rounded cards | 1.5rem | 1px | Baloo Da 2 | 46rem | roomy | stack | dock |
| `console` | কনসোল / Console | Data-dense, slate + amber, monospace numbers | 0.375rem | 1px | Inter + Noto Sans Bengali, JetBrains Mono numbers | 96rem | dense | split | top |
| `sonar` | সোনার বাংলা / Sonar Bangla | Flag green + red accent, green header bar | 0.875rem | 1px | Anek Bangla / Inter + Noto Sans Bengali | 72rem | cozy | split | dock |
| `aurora` | অরোরা / Aurora | Gradient mesh background, frosted glass cards | 1.25rem | 1px | Space Grotesk + Anek Bangla / Inter + Noto Sans Bengali | 76rem | cozy | bento | top |

Every theme has light and dark modes. Light/dark/system stays on `next-themes`
(class strategy). All 8 themes are free.

### 6.3 Component sourcing rule (the user's rule, made concrete)

"BEUI" = **Base UI** (`@base-ui/react`). "SadCN/SharedScene" = **shadcn/ui**.

1. If shadcn has the component, add it with `pnpm exec shadcn add <name>`. Our
   `components.json` style is `base-rhea`, so the CLI installs the **Base UI-backed**
   version. That satisfies "prefer Base UI when both have it".
2. If Base UI has a primitive that shadcn does not wrap (`Meter`, `NumberField`,
   `Toast`, `Toolbar`), write a wrapper in `src/components/ui/<name>.tsx` in the
   same style as its siblings (data-slot attributes, `cn` from `"cn"`, tokens).
   `Toast` replaces `sonner`, because both libraries offer a toast and Base UI wins.
3. If only shadcn has it (`chart`, `table`, `card`, `skeleton`, `calendar`, `empty`,
   `item`, `kbd`, `spinner`, `input-group`, `pagination`), use shadcn's.
4. Never add `@radix-ui/*` or `vaul`. After every `shadcn add`, check `package.json`;
   if one appeared, revert that component and use rule 2 instead.

Component inventory after Phase 1 (existing + new):
existing: alert, avatar, badge, button, calendar, card, chart, dialog, dropdown-menu,
form, input, label, popover, progress, select, separator, skeleton, slider, switch,
table, tabs, tooltip. New (shadcn base): accordion, alert-dialog, collapsible, empty,
field, input-group, item, kbd, pagination, scroll-area, sheet, spinner, toggle-group.
New (Base UI wrappers): meter, number-field, toast. Removed: sonner.

### 6.4 Accessibility and responsiveness constraints

- Design at 360px first; no horizontal page scroll at 360, 768, 1280.
- Text contrast ≥ 4.5:1, UI/icon contrast ≥ 3:1, enforced by a unit test over all
  themes and modes (Phase 1).
- Touch: on `(pointer: coarse)` control heights are clamped to ≥ 2.5rem (sm ≥ 2.25rem).
- Visible focus ring on every interactive element (`--ring`).
- `prefers-reduced-motion: reduce` disables transitions and animations.
- Dock never covers content: pages reserve `calc(4.5rem + env(safe-area-inset-bottom))`.
- Every user-visible string exists in Bangla and English (`translations.ts`).
- Numbers use the `num` utility (tabular numerals); Bangla digits when language is `bn`.

---

## 7. Global constraints (apply to every task)

- Package manager: `pnpm`. Run `pnpm install` first if `node_modules` is missing.
- New runtime dependencies allowed: only the 7 font packages in Phase 1 and whatever
  `shadcn add` pulls in (subject to rule 6.3.4). Nothing else without asking the user.
- No raw HTML controls in app code (`pnpm check:controls`, existing rule).
- No raw Tailwind palette colors (`emerald-500`, `amber-*`, …), hex colors, or
  `shadow-xs|sm|md|lg|xl|2xl` in app code. Use tokens (`text-primary`,
  `text-success`, `text-warning`, `text-destructive`, `bg-muted`, `shadow-card`).
  Enforced by `pnpm check:tokens` (Phase 1) with a shrinking baseline; zero at end of Phase 5.
- Copy: new strings go into `src/features/i18n/translations.ts` under both `bn` and
  `en`. When a file is rewritten, move its inline `isBangla ? "…" : "…"` pairs into
  translations too.
- Real NESCO data and estimates stay visually distinct: estimates carry the
  "হিসাব / Est." badge.
- Never commit personal data. Fixtures are redacted (Phase 2 explains how).
- Don't change bKash verification, auth, or the database schema unless a task says so.
- Commit format: `feat(v2-pN): <summary>` / `fix(v2-pN): …`. Don't push.
- If a step's assumption is false in the code (a file moved, an API differs),
  do the closest correct thing, and record the deviation in `PROGRESS.md`.

---

## 8. Review focus (failure modes no single happy-path test covers)

1. **NESCO HTML drift**: missing labels, hidden arrear div, legacy 5/6-column
   tables, empty tables → parser returns sane defaults, never throws. Tests: Phase 2 Task 2.
2. **First paint theming**: no stored theme, invalid stored id, `localStorage` throws
   (private mode) → default theme, no flash, no hydration error. Test: Phase 1 Task 4.
3. **Pro leakage**: locked cards must not contain the real numbers in the DOM.
   Check: Phase 3 Task 6 and Phase 5 QA (search page text for the value).
4. **Meter input**: Bangla digits, spaces, dashes, pasted text with labels → normalized
   or a clear error. Tests: Phase 3 Task 2.
5. **Empty/new meter**: zero recharges or zero monthly rows → free stats return
   `null`, UI shows Empty states, never `NaN`, `Infinity`, or "-0". Tests: Phase 2 Task 4.
6. **Readability of glass/gradient themes and the dock**: text on translucent cards,
   dock overlapping the last card, iOS safe area. Check: Phase 5 QA matrix.
