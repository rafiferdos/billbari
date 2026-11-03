# Phase 9 — Saved-meter management: Favorite toggle and delete

## Finding

Phase 5 gave saved meters a retrieval menu, but no way to manage them.
Checking the server showed the gap was deeper than missing UI: there was
no favorite-toggle endpoint at all. `saveMeterFn` always writes
`isFavorite: false`, and its upsert never touches `is_favorite`, so a
favorite could never be set through any existing function. The
`saved_meters` table already has the `is_favorite` column, and the
snapshot code already orders by it, so only the endpoint was missing.

## Changes

- `src/features/auth/auth-server.ts`: new `setSavedMeterFavoriteFn`
  (POST, `{ meterNumber, isFavorite }`). It updates only `is_favorite`
  and `updated_at` for that user's meter. No other server behavior changed.
- `src/features/meter/saved-meters-menu.tsx`: each saved meter row now
  has a star Button (filled amber when favorite, optimistic update with
  revert and toast on failure) and a trash Button. Delete is two-step
  inside the row (Delete / Cancel) instead of a new dialog primitive,
  so an accidental tap cannot delete a meter. The Favorite Badge is
  replaced by the star, since the star already shows the state.
- Menu ordering: favorites first, then most recently updated. The server
  orders by `updated_at` only, so a favorite would otherwise sink below
  newer saves.
- Loading a meter still closes the menu; favorite and delete actions
  keep it open, so several meters can be managed in one visit.

## Still open (unchanged by this phase)

- Server-side alert-threshold field for saved meters (alert stays
  localStorage-only, device/browser only, not a push notification).
- History Calendar date-range picker (blocked on date normalisation in
  the parser; a picker that silently dropped unparseable dates would
  be worse).
- Chart axis tick crowding at 360px with 12 months (needs a live chart
  to judge, not a static fix).
