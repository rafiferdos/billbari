# Phase 8 — Responsiveness review and mobile-first fixes

Status: pushed with this commit, plus a navbar correction below
that is pushed in its own commit. This doc is the senior review,
not a release note.

Method: static audit of every user route and every shared component
at 360px first, then sm (640), md (768), lg (1024). No browser run
was possible here (dependencies are not installed in this workspace),
so widths below are calculated from Tailwind classes, not measured
in a browser. A real device or emulator check at 360px is still
required before release.

## Pages in scope

- `/` home (search banner, customer card, KPI grid, Tabs, AdvancedStats,
  charts, saving section, dialogs)
- `/history` (meter search, Tabs, recharge table, consumption table,
  token dialog)
- `/snapshots` (header actions, preview/status cards, trajectory,
  snapshots table, detail and delete dialogs)
- `/tariffs` (calculator, slab tables, appliance simulator, saving section)
- Global: navbar (top row + mobile subnav), footer, 404, toasts, all dialogs
- No other user routes exist. `appliance-simulator` and the saving
  section are features embedded in `/tariffs` and `/`, not routes.

## Findings, ranked

### P0 — Navbar overflows at 360px (fixed)

Top row at 360px: content width is 328px (360 minus px-4 on both
sides). Brand (~95px) + pricing button (~80px) + language toggle
(~100px) + color toggle (32px) + theme toggle (32px) + login and
register (~110px) is roughly 450px, with no wrap and with shrink-0
controls. The header was `h-16` with a single flex row, so the row
could not wrap and the page scrolled sideways. Fix: the header row
wraps on mobile (`flex-wrap`, auto height), stays a single row on
sm and up (`sm:flex-nowrap sm:h-16`), the controls row also wraps,
the brand name drops to `text-base` on mobile, and mobile subnav
links drop from px-3 to px-2. All controls stay reachable; nothing
is hidden on mobile. The same overflow also existed at tablet
width: the desktop nav appeared at `md` (768px, 720px content)
while brand + nav + controls need about 850px, so the desktop
nav breakpoint moved from `md` to `lg` (1024px, 976px content,
where the row fits) and the mobile subnav now shows until `lg`.

### P0 — Home paste button covers Bangla input text (fixed)

The hero Input reserves `pr-24` (96px) for its right-side buttons,
but the Bangla paste label is "ক্লিপবোর্ড থেকে পেস্ট", so the paste
button alone is about 140px wide, plus the clear button. On mobile
it covered the typed meter digits. In English ("Paste") it fit, which
is why this only showed up in Bangla. Fix: the paste label is hidden
on mobile (icon only) and the Input padding becomes `pr-16 sm:pr-24`,
so the reserved space matches the actual buttons at each width.

### P0 — Home TabsList clips its second row on mobile (fixed)

The home TabsList is `grid grid-cols-2 sm:grid-cols-4`, so on mobile
it is two rows of two triggers. The TabsList primitive sets a fixed
`h-8` for horizontal tabs, so the two rows were squeezed into 32px
and touch targets were far below usable height. Fix: `h-auto!` on
the home TabsList only (the important modifier is the same suffix
already used elsewhere in this codebase, e.g. `animate-none!`).
History and auth TabsLists have two triggers in one row and were
left alone.

### P1 — Home customer name row can overflow (fixed)

The customer name, tariff Badge, and source Badge sat in a
no-wrap flex row. A long customer name plus two badges overflowed
the card at 360px. Fix: that row wraps, and both badges are
`shrink-0` so they are never squeezed.

### P1 — KPI values can clip in the 2-column mobile grid (fixed)

At 360px a KPI card's content width is about 126px (two columns,
gap, p-4). A balance like "৳১২,৩৪৫.৬৭" at `text-2xl` is wider than
that, and the card has `overflow-hidden`, so the value would clip
rather than scroll the page. Fix: the value drops to `text-xl` on
mobile (`text-xl sm:text-3xl`) and gains `break-all`, so a long
digit string wraps instead of clipping.

### P1 — AdvancedStats headers and rows squeeze on mobile (fixed)

Card headers were `flex items-center justify-between` with no wrap
or gap, and metric rows were `justify-between` with no gap, so a
long Bangla label and its value touched or squeezed at 360px.
Fix: headers wrap with a gap, metric rows gain a gap, and card
padding drops to `p-4 sm:p-5`. No numbers or logic changed.

### P1 — Snapshot trajectory title row squeezes (fixed)

The trajectory title and its day-interval Badge were a no-wrap
row. Fix: that row wraps, and the bottom stats block aligns left
on mobile (`text-left sm:text-right`) instead of right-aligning a
full-width block under a border.

### Checked and left alone (no change)

- Tables: history recharge (7 cols), history consumption (5 cols),
  snapshots (7 cols), tariff slabs (4 cols) all sit in
  `overflow-x-auto` wrappers. Horizontal scroll inside the table is
  the correct mobile pattern for dense data; converting them to
  stacked cards would lose column comparison and is out of scope.
- Dialogs: the dialog primitive already caps width at
  `max-w-[calc(100%-2rem)]`, so even the pricing dialog, which does
  not repeat that class, cannot exceed the viewport. All dialog
  contents use `grid-cols-1 sm:grid-cols-2` or single-column layout.
- Grids that were already mobile-first: home welcome cards
  (`grid-cols-1 md:grid-cols-3`), insights (`1 sm:2 lg:3`), charts
  (`1 lg:3`), AdvancedStats (`1 md:2`), saving tips (`1 md:2`),
  appliance cards (`1 sm:2 lg:3`), preset grid (`2 sm:3 lg:5`),
  simulator summary (`2 sm:4`), tariff calculator (`1 lg:3`).
- Charts: `ChartContainer` is `w-full` with fixed heights
  (260px consumption, 220px trend) and `px-2 sm:px-6` content
  padding. Axis labels may crowd at 360px with 12 months of data;
  that is a Recharts tick-interval question, not a layout overflow,
  and changing tick logic without a live chart to look at would be
  guessing, so it is recorded here, not fixed.
- Toasts: Sonner handles small viewports itself; position
  `top-right` was left alone.
- Footer: already `flex-col md:flex-row` with wrapping contact
  actions; no overflow found.
- 404: centered text, no fixed widths; left alone.
- Viewport meta (`width=device-width, initial-scale=1`) is present
  in the root route.

## Breakpoint policy used for fixes

- Base classes are the 360px layout. Nothing in a fix assumes a
  wider screen.
- `sm:` restores the previous desktop-adjacent behaviour where the
  mobile layout would waste space (search row, TabsList, card padding).
- No new breakpoints, no new dependencies, no logic changes, no
  shadcn rule changes. Every fix is a class change, except the paste
  label, which is a visibility change on the existing Button.

## Still required before release

- Run the site at 360px, 375px, 768px, and 1024px in a real browser
  or emulator, in both Bangla and English, and check the navbar
  wrap, the hero search, the home tabs, and a KPI card with a
  6-digit balance.
- Run `pnpm typecheck`, `pnpm lint`, and `pnpm build` (not run here:
  dependencies are not installed in this workspace).


## Correction — navbar, 2026-11-03 (pushed)

The user reported the navbar looked awful on smaller and medium
screens after Phase 8. That criticism is correct: the wrap fix
turned the header into a tall, uneven stack of controls above the
mobile subnav, which is functional but ugly. Wrapping was the
wrong tool for a header.

Replacement design, single row at every width:

- Top row is back to a fixed height (`h-14` mobile, `h-16` desktop)
  with no wrapping. The header no longer grows into a pile.
- Language toggle becomes a 32px globe icon menu below `sm`
  (both languages stay one tap away); the full two-pill toggle
  returns at `sm`, where it fits.
- Pricing becomes crown-icon-only below `sm` (with aria-label and
  title); the full "Meter Plus" label returns at `sm`.
- Guests see only the Login button below `sm`. Register is hidden
  there, not removed: the auth dialog already has login and
  register tabs, so Register is one tap inside it, and the button
  returns at `sm`.
- Color theme is cosmetic, so it is hidden below `md` and returns
  at `md`, where the row fits. Theme (dark/light) stays visible
  at every width.

Width check at 360px, guests: brand ~95 + pricing ~38 + language
32 + theme 32 + login ~59 + gaps ~24 = about 280px against 328px
of content width, so the row fits with room to spare. At 768px
the full set fits with room to spare, and at `lg` the desktop
nav fits as before. The mobile subnav (four icon links) is
unchanged; it is the navigation, not part of the pile.

## Correction — small-screen header and dialog polish, 2026-11-03 (pushed)

A follow-up audit found the same no-wrap squeeze pattern in several more places, plus two structural issues. All fixed here:

- Tariffs breakdown header, slab progress header, snapshot dialog header, consumption chart header, and recharge trend header: title and Badge rows now wrap with a gap, and Badges are shrink-0 so they never squash.
- Consumption chart legend: two long Bangla labels now wrap (gap-x-6, gap-y-1.5) instead of squeezing in one row.
- Pricing dialog: bKash header plus "Send Money" Badge row now wraps with a gap and a shrink-0 Badge.
- All seven DialogHeaders in app code (auth, pricing, snapshot, snapshot-history detail and delete, history token, alert-threshold) now carry pr-10, so long titles can no longer run under the absolute close button.
- Page width unified: history, snapshots, and tariffs moved from max-w-5xl to max-w-6xl, matching home. Content alignment no longer jumps between pages.
- Sticky header cost: the mobile subnav now sits outside the sticky header, so it scrolls away. Only the 56/64px top row stays pinned, freeing about 50px of small-screen height. Desktop navigation is unchanged, and the subnav itself is unchanged.
