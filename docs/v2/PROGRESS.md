# BillBari v2 — Progress log

Each phase appends its section when it finishes. The next phase reads this first.
Never paste personal data (meter numbers, names, tokens) here.

| Phase | Status | Commit range | Date |
| --- | --- | --- | --- |
| 1 — Design system | done | `6b51297..845599b` plus a final docs commit | 2026-11-27 |
| 2 — Data & entitlements | not started | | |
| 3 — Shell & home | not started | | |
| 4 — Records & tools | not started | | |
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

