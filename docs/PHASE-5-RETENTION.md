# Phase 5 — Retention design (shadcn only)

Status: pushed with this commit.

Scope: home retention only. No payment changes, no backend changes, no
analytics logic changes.

## Problem found in audit

Saved meters existed on the server (`saveMeterFn`, `getSavedMetersFn`,
`deleteSavedMeterFn`) but had no UI anywhere. A user could save a meter
from home and never retrieve it. Retention was therefore broken at the
feature level, not just at the visual level.

## Changes

### Saved meters menu (`src/features/meter/saved-meters-menu.tsx`)

- shadcn DropdownMenu on the home search row, next to the search Button.
- Loads fresh on every open, so a meter saved on home appears without a
  page reload.
- Each item shows alias, customer name, or meter number, plus a Favorite
  Badge when `isFavorite` is set. Tapping an item loads that meter with
  force refresh.
- Guest state: one item that opens the sign-in dialog.
- Empty state: a clear message plus a Button to save the current meter,
  or "Search a meter first" when no meter is loaded. No blank menu.
- Limitation, stated plainly: there is still no UI to set or unset
  Favorite, and no UI to delete a saved meter. The server functions
  exist, but Favorite and delete UI are a later phase, not silently
  claimed here.

### Low-balance alert (`src/features/meter/alert-threshold-dialog.tsx`)

- shadcn Dialog with shadcn Slider (100 to 2000 BDT, step 50) and Button.
- Opened from a "Low-balance alert" Button in the customer Card actions.
- When the active meter balance is at or below the set limit, home shows
  a shadcn Alert with the balance, the limit, and a "Change limit"
  Button.
- Local-only, stated in the dialog: the threshold is stored in this
  device and browser only, because `saved_meters` has no alert-threshold
  field yet. It is not a push notification and does not sync. A server
  field is a backend change and is out of scope for this design phase.

### Empty states

- Saved meters menu: empty, guest, and loading states above.
- Home no-data: already Card-based welcome cards, not a blank page, and
  now also has the saved-meters menu in the search row.
- History no-data and snapshots guest views were already Card-based
  and were left unchanged.

## Verification (limits, stated plainly)

- `node scripts/check-shadcn-controls.mjs` passes. No new raw controls.
  Baseline stays at 18.
- JSX syntax checked with TypeScript with module resolution disabled:
  no syntax errors in the three changed files. The only errors in that
  mode are expected missing-module errors without installed dependencies.
- Full `pnpm typecheck`, `pnpm lint`, and `pnpm build` were NOT run here:
  pnpm and dependencies are not installed in this workspace. Run those
  before release, or in CI.
- Saved-meters loading and alert saving were not run against a live
  server here for the same reason. They use the existing server
  functions and localStorage only, with no new server contract.
