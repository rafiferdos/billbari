# BillBari v2 — Progress log

Each phase appends its section when it finishes. The next phase reads this first.
Never paste personal data (meter numbers, names, tokens) here.

| Phase | Status | Commit range | Date |
| --- | --- | --- | --- |
| 1 — Design system | done | `6b51297..845599b` plus a final docs commit | 2026-11-27 |
| 2 — Data & entitlements | done | `80f6142..4c4a803` plus a docs commit | 2026-11-27 |
| 3 — Shell & home | done | `a0508e1..225ab7e` plus a docs commit | 2026-11-27 |
| 4 — Records & tools | done | `5112d6e..742ebaa` plus a docs commit | 2026-11-27 |
| 5 — Pro & polish | not started | | |

Plan baseline: commit `3205907`, 2026-11-27. `node_modules` was not installed at
planning time; Phase 1 Step 1 installs it and records the test/typecheck baseline.

---

<!-- Template for each phase:

## Phase N — <name> (done YYYY-MM-DD)

**Deviations from the plan:** what changed and why (file moved, API differed, value adjusted).
**Numbers:** test count, token-lint total, anything measured.
**For the next phase:** facts the next phase needs (enabled download kinds, fixture status, known issues).
**Checklists:** paste inventory or QA tables here when the phase asks for one.

-->

## Phase 1 — Design system (done 2026-11-27)

**Baseline found at Step 1:** tests 23/23 pass; typecheck 2 errors; lint 78 errors;
`pnpm build` failed on Windows (inline `NODE_ENV=`). Fixed in `fix(v2-p1): green baseline`.
Still present, not fixed: vitest prints one `ReferenceError: module is not defined`
(from React in the Vite runner) while all tests pass.

**Deviations from the plan:**
- Baseline fixes: `shellEmulator: true` in `pnpm-workspace.yaml`; two type errors;
  ESLint ignores tool/build folders; `no-unnecessary-condition` lowered to warn (the
  hits are guards on DB rows and scraped HTML). 78 lint warnings remain.
- Adding dependencies re-resolved the `latest` TanStack packages to newer patch/minor
  versions (`@tanstack/eslint-config` 0.4.0 → 0.5.0 among them).
- `shadcn add` also created `textarea.tsx` (needed by `input-group`).
- A `none` shadow token is emitted as `0 0 #0000`; a literal `none` breaks Tailwind's
  composed `box-shadow` and removes focus rings.
- `input`, `select`, `input-group`, `textarea` use `border-input bg-background`
  instead of `bg-input/50`: `--input` equals `--border`, which is ink in `dharalo`.
- `NumberField` always formats with `en-US`: Base UI cannot parse Bengali digits, so
  Bengali keyboard input is not accepted. `Meter` and `NumberField` read translations,
  so they need `LanguageProvider`. New keys: `common.close/increase/decrease`.
- `<Toaster />` mounts before the navbar so it is listening before page effects run.
- Added Noto Sans Bengali to the mono number font stack.
- No theme color needed adjusting: all 16 theme-modes passed contrast as written.
- The old `billbari_color_theme` choice is not migrated; returning users start on
  `bidyut`.
- The branch review was a self-review, not a fresh-context reviewer.

**Numbers:** 80 tests. Token-lint baseline: **257** across 20 files.

**Checked in the browser:** all 8 themes × light/dark on `/` and `/tariffs`: no
horizontal scroll at 360 and 1280; radius, border width, control height, fonts, page
decoration and glass blur follow the theme; touch devices clamp control heights;
choice survives reload and in-app navigation with no console or hydration errors; error
and success toasts appear, and a toast over an open dialog can be dismissed without
closing the dialog. Flash-on-load is covered by the init-script tests and script order, not by a
frame capture.

**Page-level styles that still mask the theme (Phases 3–5):**
- The navbar ignores `--bb-header-bg`/`-fg`, so `sonar` has no green header bar, and
  `data-layout` / `data-nav` change nothing yet.
- Many `<Card>`s pass `border shadow-xs`, which hides theme border width and shadows
  (`dharalo` hard shadows show on primitives and unstyled cards only). Worst:
  `routes/index.tsx`, `analytics/advanced-stats.tsx`, `routes/snapshots.tsx`,
  `routes/tariffs.tsx`.
- Fixed control heights (`h-8`–`h-11`) in the navbar, home search, history, snapshot
  history and auth dialog. These also bypass the touch-height clamp.
- Palette colors: `nesco/source-badge.tsx` (40), `routes/snapshots.tsx` (37),
  `analytics/advanced-stats.tsx` (26).

**For the next phase:**
- The built-in sample meter number returned a **live** NESCO portal response in the
  browser check (success toast said live data). It may belong to a real customer.
  Phase 2 should serve sample data for it without calling the portal. The response
  was not inspected or recorded.
- `useAppTheme().theme.chart` holds per-theme chart settings; nothing reads it yet.

---

## Phase 2 — Data & entitlements (done 2026-11-27)

**Fixtures:** captured and redacted (`tests/fixtures/nesco/`). All three download
kinds (certificate, recharge, monthly) returned `application/pdf` and are enabled.
`#arrear_notice_div` was **absent** on the captured account, so the arrear notice is
tested on hand-written HTML only.

`#con_info_div` labels, in order: গ্রাহকের নাম · পিতা/স্বামীর নাম · ঠিকানা · মোবাইল ·
সংশ্লিষ্ট বিদ্যুৎ অফিস · ফিডারের নাম · কনজ্যুমার নম্বর · মিটার নম্বর ·
অনুমোদিত লোড (কি.ও) · অনুমোদিত ট্যারিফ · মিটারের ধরণ · মিটার স্ট্যাটাস ·
মিটার স্থাপনের তারিখ · মিনিমাম রিচার্জের পরিমাণ (টাকা) ·
অবশিষ্ট ব্যালেন্স (টাকা)(সময়ঃ … )

**Deviations from the plan:**
- Parser: each input sits in the label's next sibling, several pairs per row, so
  that is tried before the parent. The balance time is embedded in the balance
  label. `কনজ্যুমার নম্বর` added as a customer-number keyword.
- One vend can carry several tokens (NESCO joins them with `,<br>`);
  `record.token` is then `"t1, t2, t3"`.
- Capture script also redacts office, feeder, mobile and install date, and strips
  scripts and comments.
- Built-in sample numbers are served from sample data without calling the portal,
  and the PDF proxy answers 404 for them.
- The PDF proxy answers non-Bangla (network, timeout) errors with the generic
  Bangla PDF message.
- Rebates are summed as absolute values (NESCO reports them negative).
  `estimateDailyKwh` ignores a current month with 0 kWh.
- Home's slab card also had a `|| 250` fallback; it now uses projected units and
  is hidden without data.
- Added `vitest.config.ts` (no app plugins, so server functions are testable; blanks
  `TURSO_*`). Server tests use an in-memory database.
- A meter/customer number that belongs to a real household was hard-coded in the
  translation hint, sample snapshots and tests; replaced with `12345678`. It remains
  in git history.
- The branch review was a self-review, not a fresh-context reviewer.
- Task 6 manual browser check not done: the dev server uses a remote database, so
  no test accounts were created. `tests/server-gates.test.ts` covers the gates.

**Numbers:** 144 tests. Lint 0 errors, 69 warnings. Token-lint total 257. No
existing `billbari.test.ts` analytics expectation changed. Browser: sample and one
live meter render on `/` with no console errors.

**Open problems (found, not fixed):**
- Fixed after the phase: `/api/cron/daily-pulse` ran for a request with no secret.
  It now answers 401 unless `CRON_SECRET` is configured and sent, so the deployment
  must set that variable or the nightly run stops.
- Before the `vitest.config.ts` fix, `pnpm test` wrote test users, snapshots and
  payments to whatever `TURSO_DATABASE_URL` pointed at. Those rows were not removed.
- `login`/`register` return a user without `isPremium`, so Pro users look free
  until a reload.
- Month-over-month and seasonality in `generateAnalytics` still include the partial
  current month (`computeFreeStats` does not).
- `parseNescoDate` reads an all-numeric `DD-MM-YYYY` as month-first when the day is
  12 or less (NESCO sends month names, so live data is unaffected).

**For the next phase:**
- Use `computeFreeStats`, `computeDeductionTotals`, `nescoDownloadHref` and
  `ProGate`; none of the pages use them yet.
- `ProGate` shows the locked state while the user is still loading; consider a
  skeleton.
- `getSnapshotsFn` returns `[]` for non-Pro viewers, so the tracking UI must lock
  with `ProGate` rather than read an error.
- Hide runway numbers when `analytics.hasEnoughData` is false. The snapshot dialog
  still shows ৳0 per day in that case.


---

## Phase 3 — Shell & home (done 2026-11-27)

**Deviations from the plan:**
- External, download and in-app links are anchors styled with `buttonVariants`, not
  `Button render` (that would give links `role="button"`).
- Search submits with `force: true`, as before. `MeterContext` gained `failedMeter`
  so Retry reloads the number that failed; `fetchMeter` now accepts Bangla digits
  everywhere, including the history page.
- One `MeterSearch` instance stays above landing, loading and dashboard, so typed
  input survives errors. The loading skeleton shows under it.
- A vend with several tokens shows one row and copy button per token.
- Low-balance warning is `balance < threshold` (was `<=`).
- Certificate PDF is hidden for sample data (the proxy answers 404 for it).
- `SlabProgressCard` is in the Pro-gated `/insights`; its bill breakdown exists
  nowhere else.
- Footer keeps the NESCO helpline and official portal link.
- History, tracking and tools pages lost their own container padding (`main` is now
  `page-shell`).
- The header is at least 72rem wide even in narrow themes; Pro badges show from `xl`.
- The split layout's sticky aside scrolls on its own when taller than the window.
- Stats are memoised on the result object, not on `fetchedAt`.
- Extra files: `meter/use-save-meter.ts`, `dashboard/{dashboard,landing,region-parts,types}`.
  Removed: `navbar.tsx`, `analytics/stat-card.tsx`, unused `hero` keys.
- Fixed a Phase 1 bug: print CSS hid the print root too (selector specificity), so
  every print came out blank. Dialog print roots also get their own print rules.
- The branch review was a self-review, not a fresh-context reviewer.

**Numbers:** 177 tests. Lint 0 errors, 70 warnings. Token-lint total 257 → 211.

**Checked in the browser (sample meter, signed out):** `bidyut`, `khata`, `console`
× light/dark × 360/768/1280: no horizontal scroll, dock or menu per theme, footer
clear of the dock, bento rows and split aside as planned, balance + token + runway
card within 1.5 screens at 360. All 8 themes at 360/1024/1280 for header fit. Token
copy (clipboard stubbed), receipt, print rules applied on screen, short-number error,
"/" shortcut, clear, More sheet, menu sheet, meter chip menu. Locked `runway` and
`proInsights` text holds no values.

**Not checked:** signed-in and Pro views in the browser (the dev server uses a remote
database; unit tests cover the locked and open regions), the certificate link on a
live meter, a real print dialog, the error card against a failing portal, share.

**Inventory (nothing from the old home page is lost):**

| Old | New home | ✔ |
| --- | --- | --- |
| Hero input, paste, clear | `MeterSearch` | ✔ |
| `SavedMetersMenu` | Landing (signed in) + header meter chip | ✔ |
| `SourceBanner` / `SourceBadge` | Above the grid / `balance` | ✔ |
| Customer card | `customerInfo` | ✔ |
| Save meter | `balance` | ✔ |
| Alert threshold, dialog, banner | `balance` (Pro) | ✔ |
| Snapshot button + dialog | `quickActions` (Pro) | ✔ |
| Stat cards | `balance` / `runway` / `lastRecharge` | ✔ |
| Overview tab | `/insights` | ✔ |
| Insights tab | `proInsights` + `/insights` | ✔ |
| Charts tab | `usageChart` + `/insights` | ✔ |
| `SlabProgressCard` | `thisMonth` slab meter + `/insights` | ✔ |
| Quick navigation card | Nav + `quickActions` | ✔ |
| Saving tab | `/tariffs` (already there) | ✔ |
| Landing value cards, sample meters | Free/Pro list, sample link | ✔ |
| Navbar | `AppHeader` + `MobileDock` / menu | ✔ |

**For the next phase:**
- Reuse `TokenDisplay`, `ReceiptDialog`, `splitTokens`, `sortRechargesDesc`,
  `monthName`, `NESCO_LINKS`, `MeterError`.
- `/help` and `/insights` are interim pages. `/insights` still uses the old palette
  components (`advanced-stats`, charts); `source-badge` too.
- `ProGate` shows locked while the user is still loading, so Pro users see a flash.
- `meter-context` and `saved-meters-menu` still hold inline `isBangla` strings.
- Dev builds only: the TanStack devtools button covers the dock's "More" cell.

---

## Phase 4 — Records, tools & help (done 2026-11-27)

**Deviations from the plan:**
- CSV prefixes `'` to text that starts like a formula (`= + - @`); numbers are untouched.
- The print table is portalled to `<body>` with its own print CSS (black on white,
  the page behind removed), so it prints without blank pages. `downloadCsv` releases
  its URL on the next tick.
- Chart: recharge is now a line (theme curve and stroke width) over usage bars, on the
  same shared axis as before, so kWh bars stay small beside ৳.
- NESCO PDF buttons are hidden for sample data (the proxy answers 404), as the
  certificate button already was. Token search also matches without dashes and in
  Bangla digits.
- The appliance simulator had no numeric inputs and no hours field: its +/− quantity
  stepper became a `NumberField` (0–20). No hours input was added.
- UI copy in the simulator and saving tips moved to translations; the appliance,
  preset and tip data dictionaries stay in their files.
- The calculator slider still ends at 800; the number field goes to 2000. The
  breakdown table shows short tier names (ranges are in the tariff table).
- FAQ storage answer says an automatic daily job "can" record Pro snapshots: the
  repo has the endpoint but no schedule.
- Commit `5112d6e` alone does not typecheck (translation blocks landed one commit
  early).
- The branch review was a self-review, not a fresh-context reviewer.

**Numbers:** 198 tests. Lint 0 errors, 69 warnings. Token-lint total 211 → 161.
Last code commit `742ebaa`.

**Checked in the browser (sample meter):** `bidyut`, `dharalo`, `komol` × light/dark ×
360/1280 on History (both tabs), Tools and Help: no page horizontal scroll. In `komol`
at 1280 the recharge table scrolls about 27px inside its card. With a temporary local
Pro override (not committed): planner, simulator, apply-to-calculator, monthly CSV
content and file name. Signed out: planner, simulator, tips and CSV locked with no
values. Pagination, search, receipt, one-month chart, and print rules applied on
screen at A4 width.

**Not checked:** a real print dialog, a real file download, NESCO PDF buttons on a live
meter, signed-in views with a real account.

**NESCO parity (master plan section 2) — reachable in the UI:**
- [x] Customer info (home) · [x] Balance (home) · [x] Arrear notice (home; never seen
  on a live account)
- [x] Recharge history (History) · [x] Token receipt (History, home)
- [x] Monthly usage (History) · [x] Certificate PDF (home, Help)
- [x] History and usage PDFs, plus print (History) · [x] NESCO links (Help)

**For the next phase:**
- Reuse `toCsv`/`downloadCsv`, `usePrint`/`PrintableTable`, `planRecharge`,
  `filterRecharges`.
- Records without `netEnergyBdt` count their gross amount as net energy in the
  deduction totals (Phase 2 behaviour), so "net" can equal "gross" on sample data and
  older tables.
- A failed meter search writes the number to the server log (`nesco-service.ts`).
- Nothing in the repo schedules `/api/cron/daily-pulse`.
- Appliance simulator and saving tips still use the older dense card styling.
