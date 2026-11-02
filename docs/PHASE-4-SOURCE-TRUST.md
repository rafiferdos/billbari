# Phase 4 — Trust and source design (shadcn only)

Status: pushed with this commit.

Scope: home and history only. No payment changes, no backend changes, no
analytics logic changes. Loading Skeleton behaviour is unchanged: home
already showed Skeletons while loading, and history already showed a
loading button state.

## Problem found in audit

- `fetchedAt` was already in the data model for live and sample data, but
  it was never displayed anywhere. A restored session balance therefore
  looked current even when it was days old.
- Home showed a source Alert, but sample used muted styling that was not
  clearly different from live styling, and there was no Badge on any data
  Card.
- History showed no source information at all, and its subtitle called
  every statement "Official" even in sample mode.

## Changes

### New shared component: `src/features/nesco/source-badge.tsx`

- `SourceBadge`: shadcn Badge for Live (emerald), Cached (amber), Sample
  (violet). A stale badge adds "Stale" / "পুরনো".
- `SourceBanner`: shadcn Alert with title, Badge, description, fetched
  time, and a stale warning with a Refresh Button when stale.
- Stale rule, documented here so it can be changed in one place:
  live or cached data older than 24 hours is stale. Sample data is
  never marked stale, because it is not real data at any age.
- Sample treatment: violet Alert and Badge, text "Sample reference
  data, not real meter data" in both languages, and no fetched time
  shown as a fetch time. Sample `fetchedAt` is generation time, so
  showing it as a fetch time would mislead.

### Home (`src/routes/index.tsx`)

- Old source Alert replaced with `SourceBanner`, with Refresh calling
  `fetchMeter` for the same meter with force.
- Customer Card now carries `SourceBadge` next to the tariff Badge.
- KPI cards, charts, and tabs are unchanged. Estimate marking inside
  StatCard ("Estimated" badge) is unchanged and is separate from source.

### History (`src/routes/history.tsx`)

- `SourceBanner` added above the Tabs when data is present, with Refresh
  calling the existing fetch handler for the same meter.
- Subtitle no longer calls sample data "Official". Sample mode now says
  sample reference data in both languages.

## What was not changed

- No `cached_real` data is actually produced by the current server: it
  only returns live or sample. The Cached mapping is kept for restored
  session data that carries that value, so it does not break.
- Snapshot source badges already existed in snapshot history and were
  left unchanged.

## Verification (limits, stated plainly)

- `node scripts/check-shadcn-controls.mjs` passes. No new raw controls.
  Baseline stays at 18.
- JSX syntax checked with TypeScript with module resolution disabled:
  no syntax errors in the three changed files. The only errors in that
  mode are expected missing-module errors without installed dependencies.
- Full `pnpm typecheck`, `pnpm lint`, and `pnpm build` were NOT run here:
  pnpm and dependencies are not installed in this workspace. Run those
  before release, or in CI.
