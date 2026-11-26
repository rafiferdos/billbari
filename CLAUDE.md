# BillBari — agent instructions

## Running a v2 phase

When asked to "run phase N", "execute phase N", or similar:

1. Read `docs/v2/MASTER-PLAN.md` in full.
2. Read `docs/v2/PROGRESS.md`. Do not start phase N unless phase N−1 is marked done there (phase 1 has no prerequisite).
3. Read the phase file `docs/v2/PHASE-N-*.md` and execute it task by task, in order, ticking the checkboxes in that file as you go.
4. Finish with the phase's verification task: `pnpm typecheck && pnpm test && pnpm lint && pnpm build` all green, `PROGRESS.md` updated, commits made with the `feat(v2-pN): …` format. Never push.

If a step conflicts with the code as it really is, do the closest correct thing and record the deviation in `PROGRESS.md`. Ask the user only for things the plan says to ask (for example the meter number for fixtures in Phase 2) or for genuinely blocking decisions.

## Project rules (always)

- pnpm; TanStack Start + Router; Tailwind v4; shadcn style `base-rhea` (Base UI primitives). Component rule: shadcn's Base UI version first → hand-wrapped Base UI primitive → shadcn-only component. Never add `@radix-ui/*` or `vaul`.
- No raw HTML controls in app code (`pnpm check:controls`). No raw palette colors, hex colors, or fixed shadows in app code (`pnpm check:tokens`, from v2 phase 1).
- Bangla first: every user-facing string has `bn` and `en` in `src/features/i18n/translations.ts`.
- Everything NESCO's portal shows is free; Pro features are listed in `src/features/payments/entitlements.ts` (from v2 phase 2). Locked Pro content never renders the user's real values.
- Never commit personal data (meter numbers, names, addresses, tokens).
