# Bug Fix Spec: post-2.1.3 defect pass (specs/003-bug-fix)

**Branch**: `vibe/bug-fix-003-f39d82` | **Spec dir**: `specs/003-bug-fix/`

**Created**: 2026-11-24

**Status**: Draft

**Input**: Constitution v2.1.3 (`.specify/memory/constitution.md`) + app document
(`specs/001-honeypot-app/app-spec.md`, R1–R16 and change log through 2.1). Audit method: full
read of `src/*.js` + `public/app.js` against the constitution, edge-case probes of the API
(`createApi` over `:memory:`), and simulation of the exact client payloads the UI sends.
All 76 existing tests pass — these are defects the current suite does not catch.

## Found defects

### B1 (P1 — core flow broken): expense add/edit from the UI always fails with 400
`public/app.js` `renderExpenses()` computes `defDate` (today clamped into the open month,
~line 1350) but the submit payload never includes `date`. `validateExpenseBody` in
`src/api.js` requires a date within the month, so every "Add expense" / "Save" in the
spending log is rejected (`400 invalid`, shown as an i18n error toast). Reproduced by
sending the exact UI payload: `{ category, description, amountCents, planItemId: null,
payerProfileId }` → 400 "expense date must be within the month".
**Fix**: client sends `date: editing?.date ?? defDate` (keeps the existing date on edit,
today-clamped on add — constitution X: "the add form defaults the date to today (clamped
into the month)").

### B2 (P1 — data integrity): autosave never learns server-assigned item ids (id churn)
`autosave()` sends `id: i.id ?? null` but never copies the ids the server assigned back into
`state.draft.items`. Reproduced at API level: save a new item (server assigns id 1), save
again the same draft item still without id → the server deletes row 1 and re-inserts as id 2.
Every subsequent autosave churns the row, and any `expenses.plan_item_id` link to it is
orphaned (`plan_item_id = NULL`) — violating constitution X: "Plan saves are ID-PRESERVING
upserts in one transaction … Autosave sends ids."
**Fix**: after a successful `PUT /plan`, assign the freshly assigned ids (response rows whose
id was not in the previous server state, in insertion order) to the sent id-less draft items
in payload order, and clear stale ids on draft rows the server dropped (skipped rows).

### B3 (P2 — constitution X violation): doubled "%%" in the "% of own salary" tooltip
`figTipParams()` passes `pct: \`${pct(...)}%\`` while both locale templates `tipOfIncome` end
with `= {pct}%.` → the tooltip renders e.g. "62.5%%". Constitution X: "The '% of own salary'
phrasing never double-prints '%'".
**Fix**: pass the bare number (`pct: pct(...)`); the template prints the single `%`.

### B4 (P3 — stale wording vs app-spec 2.1): spending-log tooltip still mentions planned-item links
`tipSpendingLog` (en: "Link it to a planned item or leave it unplanned…", pl equivalent)
describes a field that the 2.1 rework removed ("no date or planned-item fields … the log is
for shared spending only"). The visible hint (`spendingLogHint`) was updated; the tooltip was
not. Constitution/app-spec: wording must stay aligned with the current model.
**Fix**: reword `tipSpendingLog` in en + pl (category creatable from the form, payer pick,
shared spending only).

### B5 (P2 — atomicity): plan PUT persists salaries outside the item transaction
`PUT /api/months/:ym/plan` calls `putSalaries()` before `BEGIN`, so if the item transaction
rolls back, the new salaries are already committed — a partial write. Constitution X requires
the plan save to be "in one transaction".
**Fix**: move the salary writes inside the `BEGIN … COMMIT` block (validation stays before it).

## Non-goals
- No changes to the money model (R1–R16), schema, API shape, or UI layout. No constitution
  amendment needed — the fixes restore behavior the constitution already mandates.

## Acceptance criteria
- B1: posting the UI's expense payload shape (with `date`) succeeds; a static guard in
  `tests/ui-static.test.js` fails the build if the payload omits `date`.
- B2: after two consecutive autosave-style saves of the same new item, the server row id is
  unchanged and the draft item carries the id (static guard for the id sync-back).
- B3: `figTipParams` pct param carries no `%` (static guard); tooltip text renders one `%`.
- B4: `tipSpendingLog` in en + pl no longer mentions planned-item links (static guard).
- B5: `tests/api.test.js` atomicity test — a `RAISE(ABORT)` trigger on `plan_items` during a
  plan PUT leaves salaries and items unchanged.
- `npm test` fully green (76 existing + new guards).
