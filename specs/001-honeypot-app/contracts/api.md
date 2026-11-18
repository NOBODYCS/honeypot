# API Contracts: Honeypot app (specs/001-honeypot-app)

One Node process serves the static single page from `public/` and a JSON API under `/api/*`.
No auth (P7, LAN-only). All money in requests/responses is **integer cents**. Amounts display
via `Intl.NumberFormat` client-side with the configured ISO 4217 code. Errors:
`{ "error": "..." }` with 4xx/5xx.

## State

- `GET /api/state` → `{ profiles: [{id, name, theme: {accent, background, surface, text,
  mode}}], settings: {currencyCode, language, categories}, currentYm, openMonth: {...} | null }`
- Profile selection is client-side (localStorage); the header displays it. No server session.

## Settings & profiles

- `PUT /api/settings` — `{ currencyCode?, language?, categories? }` → updated settings
- `PUT /api/profiles/:id` — `{ name?, theme? }` → updated profile (name + theme object)

## Months

- `GET /api/months` → `{ months: [{ym, status}] }`
- `POST /api/months` — `{ ym }`; creates a month, pre-filling plan items from the most recent
  month as editable defaults (R11). 409 if `ym` exists or another month is open (R10).
- `GET /api/months/:ym` → month + plan items + expenses + live computed summary
- `PUT /api/months/:ym/plan` — `{ salaries: {profileId: cents}, items: [...] }`; 409 when
  closed (R9). Every field editable by either profile while open (FR-003).
- `POST /api/months/:ym/close` — closes the month; computes and freezes `summary_json`
  (R8 settle-up, R12 personal support, leftovers after shared/personal costs); locks plan + expenses (R9)

## Expenses (open month only)

- `POST /api/months/:ym/expenses` — `{ date, description, amountCents, planItemId?,
  payerProfileId? }`; validations: amount > 0 integer cents, date within month, planItemId
  must be a variable item of this month
- `DELETE /api/expenses/:id` — open month only

## Leftover log (most recently closed month only)

- `POST /api/months/:ym/leftovers` — `{ profileId, amountCents, category, note }`; 409 if the
  month is not the most recently closed one
- `DELETE /api/leftovers/:id` — same restriction

## Derived computations (server-side, from raw inputs only — R16)

`GET /api/months/:ym/summary` → `{ combinedIncome, shares, sharedPlannedTotal,
contributions, leftAfterShared, leftAfterPersonal, actualSpent,
settle: {A,B} | null, personalSupport: [...], planVsActual: [...] }` — all integer cents.
