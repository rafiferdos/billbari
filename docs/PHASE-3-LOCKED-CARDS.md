# Phase 3 — Replace blurred content with clear locked Cards

Scope: all blurred premium content in app code. No payment changes, no
backend changes, no analytics logic changes.

## Problem fixed

The old design rendered real numbers underneath a blurred overlay. The
numbers were still in the page and readable in the DOM, so blur was not a
lock. It was only a visual filter.

## Changes

### StatCard (`src/features/analytics/stat-card.tsx`)

- When a card is locked, it now returns a locked Card only: icon, title,
  Locked badge, a short value statement, and one Button.
- It does NOT render value, subvalue, or trend when locked.
- Auth lock shows Sign In. Premium-only lock shows Unlock with the
  PricingDialog action passed in by the caller.
- Raw buttons in this file are gone: 2 down to 0.

### AdvancedStats, Card 3 (`src/features/analytics/advanced-stats.tsx`)

- Runway Forecasting & Seasonality was the only blurred card in this
  component. Cards 1, 2, and 4 were never blurred.
- When locked, Card 3 now renders a locked Card only: title, value
  statement, and one Button. It does NOT render depletion date, runway,
  or seasonal numbers.
- Button order was also corrected: sign-in comes first when the user is
  not authenticated, upgrade second. The old overlay offered upgrade
  first even to guests.
- Raw buttons in this file are gone: 2 down to 0.

### Snapshots guest view (`src/routes/snapshots.tsx`)

- The guest view no longer renders a blurred sample table behind a lock
  overlay. It now renders a single clear Card with the same heading,
  description, Preview Sample, and Sign In buttons.
- Sample preview itself is unchanged and still opens only when the user
  taps Preview Sample.

## What remains blurred

Only glass-effect `backdrop-blur` on the sticky navbar and language
toggle. Those blur the page background behind chrome, not user data, and
are out of scope.

## Result

- Total raw-control baseline: 22 before Phase 3, 18 after Phase 3.
- `node scripts/check-shadcn-controls.mjs` passes, with reduction notes
  for stat-card and advanced-stats.
- JSX syntax checked with TypeScript with module resolution disabled:
  no syntax errors in the three changed files. The only errors in that
  mode are expected missing-module errors without installed dependencies.
- Full `pnpm typecheck`, `pnpm lint`, and `pnpm build` were NOT run here:
  pnpm and dependencies are not installed in this workspace. Run those
  before release, or in CI.
