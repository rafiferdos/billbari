# Phase 2 — Home as answer-first (shadcn only)

Status: pushed as commit `0a1bf44`. Phase 1 was pushed separately
as commit `a96b331`.

Scope: home route only (`src/routes/index.tsx`), plus the Phase 1 check
correction below. No payment changes, no backend changes, no logic changes
to analytics, tariffs, or meter fetching.

## Correction found at the start of Phase 2

The Phase 1 check scanned line by line and missed tags that end at a line
break, for example `<form` with attributes on the next line. The true
baseline was 25 raw-control occurrences, not 6. The check now scans whole
file contents. `docs/PHASE-1-AUDIT.md` was corrected to the 25-item baseline.

## What changed on home

- Search: raw `<form>` removed. Search is now shadcn Input + Button.
  Enter in the Input triggers the same search as the Button.
- Search controls: raw clear and paste `<button>` elements replaced with
  shadcn Button (ghost icon-xs for clear, secondary xs for paste).
- Answer stays visible: search banner, source Alert, customer Card, and the
  4 KPI StatCards stay above the tabs, always visible when data is loaded.
- Detail moves into shadcn Tabs, default Overview:
  - Overview: AdvancedStats.
  - Insights: the existing insights grid, unchanged.
  - Charts: ConsumptionChart, RechargeTrendChart, SlabProgressCard, and
    the Quick Navigation Card, unchanged inside the tab.
  - Saving: BillSavingSection, once in the data branch. The no-data branch
    still shows BillSavingSection when no meter is loaded, as before.
- No component logic was changed. AdvancedStats, charts, slab, and saving
  sections were moved into TabsContent wrappers only.

## Result

- `src/routes/index.tsx` raw controls: form 1 and button 2 before Phase 2,
  0 after Phase 2.
- Total raw-control baseline: 25 before Phase 2, 22 after Phase 2.
  Remaining 22 are in other files and are allowlisted for later phases.
- `node scripts/check-shadcn-controls.mjs` passes, and notes the two
  reduced index.tsx exceptions.

## Verification (limits, stated plainly)

- shadcn-only check: passed, with the reduction notes above.
- JSX syntax: parsed with TypeScript with module resolution disabled.
  The only errors are missing-module errors, which are expected without
  `node_modules` installed. The error set is identical to the pre-change
  file, plus the one expected new import for `@/components/ui/tabs`.
- Full `pnpm typecheck`, `pnpm lint`, and `pnpm build` were NOT run here:
  pnpm is not installed in this workspace and dependencies are not
  installed. Run those on a machine with dependencies installed before
  release, or in CI.
