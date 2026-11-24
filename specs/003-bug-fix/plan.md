# Implementation Plan: post-2.1.3 bug-fix pass (specs/003-bug-fix)

**Branch**: `vibe/bug-fix-003-f39d82` | **Date**: 2026-11-24 | **Spec**: `specs/003-bug-fix/spec.md`

**Input**: defect list B1–B5 from `specs/003-bug-fix/spec.md`; rules from constitution v2.1.3
(Principles I, X) and `specs/001-honeypot-app/app-spec.md` (R8, R15, R16, validation rules).

## Summary

Five small, targeted fixes — four in `public/app.js`, one in `src/api.js` — plus regression
guards in `tests/ui-static.test.js` and `tests/api.test.js`. No schema, API-shape, money-model,
or layout changes.

## Technical Context

**Language/Version**: JavaScript, Node.js 22+ (built-ins only) — unchanged

**Primary Dependencies**: none

**Storage**: unchanged (single-file SQLite, WAL)

**Testing**: `npm test` (`node --test`) — 76 existing tests must stay green; add:
- `tests/ui-static.test.js`: static guards for B1 (expense payload sends `date`), B2 (autosave
  syncs server ids back into the draft), B3 (no `%`-suffixed tip param), B4 (spending-log tip
  wording) — same regex-over-source style as the existing guards
- `tests/api.test.js`: atomicity test for B5 using a `RAISE(ABORT)` trigger on `plan_items`

**Target Platform**: unchanged (Linux container, LAN-only)

**Project Type**: web app — static `public/` + JSON API `/api/*`

**Constraints**: integer cents only (R15); smallest correct change (Principle IX); every
user-visible string via `I18N` in en + pl with placeholder parity (enforced by tests)

## Work items

1. **B1** `public/app.js` `renderExpenses()` submit: add `date: editing?.date ?? defDate` to
   the payload (both POST and PUT paths share it).
2. **B2** `public/app.js` `autosave()`: capture `prevServerIds` before the PUT; after the PUT,
   assign fresh ids to sent id-less draft items in payload order; null out stale ids on
   unsent (skipped) rows the server dropped.
3. **B3** `public/app.js` `figTipParams()`: `pct: pct(...)` without the trailing `%`.
4. **B4** `public/app.js` I18N: reword `tipSpendingLog` in en and pl (no planned-item link;
   category creatable from the form; shared spending only).
5. **B5** `src/api.js` `PUT /api/months/:ym/plan`: move `putSalaries(db, month.ym, salaries)`
   inside the `BEGIN … COMMIT` block.
6. Regression guards in the two test files; run `npm test`.

## Risk & rollback
- All changes are small and local; revert = revert the PR. No data migration. B2 changes only
  client-side draft bookkeeping against the unchanged upsert API.
