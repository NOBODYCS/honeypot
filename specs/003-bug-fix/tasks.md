---

description: "Task list for the post-2.1.3 bug-fix pass (specs/003-bug-fix)"
---

# Tasks: bug-fix pass (specs/003-bug-fix)

**Input**: `specs/003-bug-fix/spec.md` (defects B1–B5) and `specs/003-bug-fix/plan.md`

**Prerequisites**: plan.md, spec.md

**Tests**: regression guards required — ui-static guards for B1–B4, an API atomicity test for
B5. `npm test` must be fully green.

## Format: `[ID] [P?] Description`

- **[P]**: can run in parallel (different files, no dependencies)

## Phase 1: spec artifacts

- [x] T001 Write `specs/003-bug-fix/spec.md` (B1–B5 with reproduction + acceptance criteria)
- [x] T002 Write `specs/003-bug-fix/plan.md` and `specs/003-bug-fix/tasks.md`

## Phase 2: fixes

- [x] T003 B1: `public/app.js` — expense submit payload sends `date: editing?.date ?? defDate`
- [x] T004 B2: `public/app.js` `autosave()` — sync server-assigned ids back into `state.draft.items` (fresh ids in payload order; clear stale ids on skipped rows)
- [x] T005 B3: `public/app.js` `figTipParams()` — `pct` param without trailing `%` (no doubled %%)
- [x] T006 B4: `public/app.js` I18N — reword `tipSpendingLog` en+pl to match the 2.1 spending log (no planned-item link)
- [x] T007 B5: `src/api.js` — move `putSalaries` inside the plan-PUT transaction

## Phase 3: regression guards + verification

- [x] T008 [P] `tests/ui-static.test.js` — guards: expense payload includes `date`; autosave id sync-back present; no `%`-suffixed `pct` tip param; spending-log tip has no planned-item wording
- [x] T009 [P] `tests/api.test.js` — atomicity test: RAISE(ABORT) trigger on `plan_items` during plan PUT leaves salaries + items unchanged (verified red without the fix)
- [x] T010 `npm test` 78/78 green + API smoke of the fixed payloads; branch `vibe/bug-fix-003-f39d82` pushed, PR opened
