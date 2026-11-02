# Phase 1 Audit — Freeze (shadcn-only)

Baseline commit: `e458f23` — feat: mobile cross-device optimization, shadcn slider & datepicker, and vibrant color theme system.

Scope of Phase 1: audit only, plus a freeze check. No redesign, no payment
changes, no backend changes. Payment and backend fixes are a separate,
later track.

## Rule (frozen)

App code uses shadcn/ui components for interactive controls, never raw HTML
controls. The rule covers `src/routes`, `src/features`, and `src/components`,
excluding the primitives themselves in `src/components/ui`, which render the
underlying HTML by design.

Banned in app code: `form`, `label`, `button`, `input`, `select`, `textarea`,
`table`, `thead`, `tbody`, `tfoot`, `tr`, `td`, `th`.

Layout and semantic tags (`div`, `span`, `main`, `h1`, `header`, etc.) are
not controls and are out of scope for this check.

Enforcement: `pnpm check:controls` runs `scripts/check-shadcn-controls.mjs`.
`pnpm lint` now runs ESLint and then this check, so a new raw control fails
lint.

## Audit result: corrected baseline (2026-11-03)

Correction to the original Phase 1 push: the first version of the check
scanned line by line and missed tags that end at a line break, for example
`<form` with attributes on the next line. The check now scans whole file
contents. The true baseline is 25 raw-control occurrences, not 6.

| File | Tag | Count | Replacement phase |
| --- | --- | --- | --- |
| `src/components/language-toggle.tsx` | `button` | 2 | Later phase |
| `src/features/analytics/advanced-stats.tsx` | `button` | 2 | Later phase |
| `src/features/analytics/stat-card.tsx` | `button` | 2 | Later phase |
| `src/features/auth/auth-dialog.tsx` | `form` | 2 | Phase 7: shadcn Form |
| `src/features/payments/pricing-dialog.tsx` | `form` | 1 | Phase 7: shadcn Form |
| `src/features/payments/pricing-dialog.tsx` | `label` | 2 | Phase 7: shadcn Label |
| `src/features/snapshots/snapshot-dialog.tsx` | `form` | 1 | Phase 7: shadcn Form |
| `src/features/tariffs/appliance-simulator.tsx` | `button` | 4 | Later phase |
| `src/features/tariffs/bill-saving-section.tsx` | `button` | 2 | Later phase |
| `src/routes/history.tsx` | `form` | 2 | Later phase |
| `src/routes/history.tsx` | `button` | 1 | Later phase |
| `src/routes/index.tsx` | `form` | 1 | Phase 2: removed, search becomes Input + Button with Enter key |
| `src/routes/index.tsx` | `button` | 2 | Phase 2: shadcn Button (clear and paste) |
| `src/routes/tariffs.tsx` | `button` | 1 | Later phase |

No raw `input`, `select`, `textarea`, or `table` exists in app code.
Those are already shadcn Input, Table, and (available, see below) Select.

The check allowlists exactly these 25 occurrences, counted per file and tag.
Removing one passes with a note. Adding any new raw control, or adding one
more in an allowlisted file, fails lint.

Note: shadcn Form is not yet present in `src/components/ui`. Phase 7 adds
it via the shadcn CLI (it is a wrapper around form handling, not a
hand-written native form in app code). Until then, the 4 `form` wrappers
above are the documented exceptions.

## Frozen shadcn pool

22 components exist in `src/components/ui`. 19 are used in app code:

alert, avatar, badge, button, calendar, card, chart, dialog, dropdown-menu,
input, label, popover, progress, skeleton, slider, sonner, table, tabs,
tooltip.

Not yet used in app code, available for Phase 2 without adding a library:

- `select` — month and meter filters, snapshot source picker.
- `separator` — section dividers inside Cards and Dialogs.
- `switch` — alert and preference toggles.

## Overloaded routes (Phase 2 entry points)

| File | Lines | Phase 2 action |
| --- | --- | --- |
| `src/routes/index.tsx` | 664 | Split into answer Card + Tabs (Overview, History, Insights, Saving). Current order on the page: 4 StatCards, AdvancedStats, ConsumptionChart, RechargeTrendChart, SlabProgressCard, BillSavingSection (rendered twice: lines 638 and 646), SnapshotDialog. |
| `src/routes/history.tsx` | 604 | shadcn Table + Select month filter + Dialog row detail. |
| `src/routes/snapshots.tsx` | 493 | shadcn Table + Chart + Progress runway + Alert at 5 days or fewer. |
| `src/routes/tariffs.tsx` | 345 | Keep as the Saving tab source; do not duplicate its content on home. |
| `src/features/tariffs/appliance-simulator.tsx` | 711 | Keep as a feature component; do not inline it into a route. |
| `src/features/analytics/insights-generator.ts` | 711 | Logic only; no UI change in Phase 1. |

## Design problems confirmed for Phase 2 (not fixed here)

1. Home shows everything at once: no single answer in the first viewport.
2. Free access gives the main prize (token and balance); paid access only
   unblurs history, so there is no strong reason to pay.
3. Live, estimated, and sample data are not separated clearly in the journey.
4. No retention loop: no alert, reminder, or saved-meter reason to return
   before power runs out.
5. BillSavingSection appears twice in home route code, in mutually exclusive branches (with data, and without data), so it is duplicated code even though only one branch renders at a time.

## Verification (Phase 1, corrected)

- `node scripts/check-shadcn-controls.mjs` — passes on the corrected
  baseline above: 25 occurrences.
- `pnpm lint` — ESLint plus the check above (run after install; not run in
  this audit environment, which has no `node_modules` installed).
- No source files other than `package.json`, this report, and the check
  script were changed in Phase 1. The check-script correction itself is
  part of the Phase 2 commit, so the Phase 1 commit on GitHub still
  contains the line-based version of the check.
