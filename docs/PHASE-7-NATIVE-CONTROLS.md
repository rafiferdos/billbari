# Phase 7 — Replace remaining native controls (shadcn only)

Status: pushed with this commit.

Scope: the last 18 raw-control occurrences from the Phase 1 baseline,
across 8 files. No payment changes, no backend changes, no analytics
or tariff logic changes. Every replacement keeps the same handler,
the same disabled state, and the same visual classes, only moved
onto a shadcn component.

## Replacements

- Language toggle (2 buttons): shadcn Button, variant ghost, with the
  same pill classes and active/inactive styling.
- Auth dialog (2 forms): new `src/components/ui/form.tsx` Form
  component, used in place of `<form>`. See the note below.
- Pricing dialog (1 form, 2 labels): Form, plus the existing shadcn
  Label for the TrxID and sender-number labels.
- Snapshot dialog (1 form): Form.
- History (2 forms, 1 button): Form for both meter-search forms, and
  shadcn Button (ghost) for the token copy button in the table.
- Appliance simulator (4 buttons): shadcn Button (ghost) for preset
  cards (with flex-col, so the card layout is unchanged), category
  pills, and both stepper buttons, keeping their disabled state.
- Bill-saving section (2 buttons): shadcn Button (ghost) for category
  pills, and Button (link) for the "View all strategies" action.
- Tariffs route (1 button): shadcn Button (outline) for the scroll
  to the simulator section.

## The Form note, stated plainly

There is no react-hook-form in this project, so the official shadcn
Form (which is built on react-hook-form) was NOT added. Adding that
dependency only to wrap submit handlers would be scope creep, and it
could not be installed or tested here. Instead, `ui/form.tsx` is a
thin wrapper around a native `<form>`: app code uses the component,
Enter-to-submit and required inputs still work, and the underlying
`<form>` lives in the primitives folder, exactly like `<label>` in
`label.tsx` and `<table>` in `table.tsx`, which the check excludes
by design. If a future phase adds react-hook-form, this wrapper is
the file to replace.

## Check freeze

`scripts/check-shadcn-controls.mjs` now has an empty baseline. It
passes with **0 raw-control occurrences** in app code, and it fails
on any new raw control. The old Phase 1 exception list is removed
from the script.

## Verification (limits, stated plainly)

- `node scripts/check-shadcn-controls.mjs` passes: 0 occurrences.
- JSX syntax checked with TypeScript with module resolution disabled:
  no syntax errors in any changed file. The only errors in that mode
  are expected missing-module errors without installed dependencies.
- Full `pnpm typecheck`, `pnpm lint`, and `pnpm build` were NOT run here:
  pnpm and dependencies are not installed in this workspace. Run those
  before release, or in CI. This matters more for Phase 7 than for
  earlier phases, because Button class merging (for example the
  preset card's flex-col) and the new Form wrapper need a real build
  and a visual check at 360px, in dark and light mode, in Bangla and
  English, and with keyboard navigation, before release.
- The replaced controls were not clicked against a live server here
  for the same reason. Handlers and disabled states are unchanged,
  with no new server contract.
