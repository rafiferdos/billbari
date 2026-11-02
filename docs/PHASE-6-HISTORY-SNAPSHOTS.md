# Phase 6 — History and snapshots redesign (shadcn only)

Status: pushed with this commit.

Scope: history and snapshots filtering and detail views only. No
payment changes, no backend changes, no analytics or tariff logic
changes, no parser changes.

## What was already shadcn here

History already used shadcn Tabs, Table, Input, and a token Dialog, and
snapshots already used a shadcn Table and a delete Dialog. This phase
does not claim to have introduced those. It adds what was missing:
filters and a snapshot detail view.

## History (`src/routes/history.tsx`)

- shadcn Select period filter next to the search Input: All time,
  Last 30 days, Last 90 days, Last 12 months.
- The period filter applies before the text search. A recharge whose
  date cannot be parsed is kept, never silently hidden by the filter.
- When the filtered list is shorter than the full list, a count line
  shows "Showing X of Y" in both languages.
- The token detail Dialog, the Tables, and the Tabs are unchanged.

## Snapshots (`src/features/snapshots/snapshot-history.tsx`)

- shadcn Select source filter next to the Add Snapshot Button:
  All sources, NESCO Live, Manual Log, Midnight Sync, Pro Preview.
- The filter affects the table only. The trajectory comparison card
  above the table still uses the full meter set, so filtering cannot
  change the burn-rate comparison.
- Clicking a snapshot row now opens a read-only shadcn Dialog with
  balance, reading, daily cost, source Badge, and notes. The trash
  Button stops propagation, so deleting does not open the detail
  dialog, and deletion still uses its own confirmation Dialog.
- An empty filtered result shows a clear "No snapshots for this
  source" row instead of a blank table.

## Not in this phase

- No Calendar date-range picker was added. History dates come from
  NESCO in mixed formats, and a range picker that silently dropped
  unparseable dates would be worse than the period Select, which
  keeps them. A range picker needs a date-normalisation change first,
  which is backend/parser work and is out of scope here.
- No snapshot edit flow was added. Detail is read-only.

## Verification (limits, stated plainly)

- `node scripts/check-shadcn-controls.mjs` passes. No new raw controls.
  Baseline stays at 18 until Phase 7 removes it.
- JSX syntax checked with TypeScript with module resolution disabled:
  no syntax errors in the two changed files. The only errors in that
  mode are expected missing-module errors without installed dependencies.
- Full `pnpm typecheck`, `pnpm lint`, and `pnpm build` were NOT run here:
  pnpm and dependencies are not installed in this workspace. Run those
  before release, or in CI.
- Filter and detail behaviour was not run against a live server here
  for the same reason. Both use existing data only, with no new server
  contract.
