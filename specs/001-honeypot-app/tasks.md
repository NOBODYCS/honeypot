---

description: "Task list for the Honeypot two-person monthly budget planner app"
---

# Tasks: Honeypot app (specs/001-honeypot-app)

**Input**: Design documents from `specs/001-honeypot-app/` (app-spec.md, spec.md, plan.md,
research.md, data-model.md, contracts/api.md, quickstart.md)

**Prerequisites**: plan.md (required), spec.md (user stories), data-model.md, contracts/api.md

**Tests**: money-rule property tests are REQUIRED and written first (constitution I);
API tests required. UI verified manually per quickstart + G6 art-direction checklist.

**Organization**: tasks grouped by user story; each story independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependencies)
- **[Story]**: user story label (US1…US8)

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Create project structure: `src/`, `public/`, `tests/`, `Dockerfile`, `docker-compose.yml` (reference), root `.gitignore` per plan.md
- [ ] T002 [P] Add minimal `package.json` (type: module, scripts start/test; zero dependencies) and verify `node:sqlite` availability on Node 22 (`--experimental-sqlite` if needed — research.md R-10)
- [ ] T003 [P] Seed script `src/seed.js`: generic defaults only — profiles "Partner A"/"Partner B" with generic theme values, settings (currencyCode "EUR", language "en", default categories) (A1–A3)

## Phase 2: Foundational (blocking)

- [ ] T004 `src/db.js`: open SQLite at `HONEYPOT_DB_PATH` (WAL), create schema from data-model.md (incl. `theme_json` on profiles), partial unique index for one open month
- [ ] T005 `src/money.js`: implement R1–R16 as pure functions over integer cents (remainder rule R15); no storage of derived values (R16)
- [ ] T006 Write `tests/money.test.js` property tests FIRST and watch them fail: shares sum to total, settle sums to zero, planned = guaranteed − variable share, month isolation (data-model.md invariants)
- [ ] T007 Make money tests pass (T005 complete); add API test skeleton `tests/api.test.js`
- [ ] T008 `src/server.js`: `node:http` server, static `public/`, `/api/*` router, JSON error shape, PORT/HONEYPOT_DB_PATH env
- [ ] T009 `src/api.js`: `GET /api/state`, `PUT /api/settings`, `PUT /api/profiles/:id` (contracts/api.md)
- [ ] T010 [P] `public/styles.css`: LOCKED design tokens per G6 (named custom properties, base + 1–2 accents, distinctive display/body font pairing, intentional borders/radii, contrast-checked, reduced-motion) + single-screen layout (header / center / mirrored side panels); `public/index.html` semantic one-screen shell; `public/app.js` bootstrap + i18n dictionary (en) + Intl helpers + theme application from profile theme_json

**Checkpoint**: foundation ready; money invariants green; server serves the one-screen shell + state endpoint.

## Phase 3: User Story 1 - Profile pick and header (P1) 🎯 MVP

**Goal**: first-visit profile pick, per-browser memory, header switch; everything editable by either profile.
**Independent Test**: two browsers pick different profiles; remembered across reloads; switch works; edits allowed under either profile.

- [ ] T011 [US1] `public/app.js`: profile pick on first visit, localStorage persistence, header switch control
- [ ] T012 [US1] Verify no field is gated by profile (FR-003): edit any field under either profile

**Checkpoint**: US1 functional standalone.

## Phase 4: User Story 2 - Month plan, center column + side panels (P1)

**Goal**: create current `YYYY-MM` month (one open at a time); center column: salaries, fixed, variable items; side panels: personal lists with partnerShare%; prefill-from-latest on create; lock on close.
**Independent Test**: create/edit month, reload persists; new month prefills editable defaults; closed month locked.

- [ ] T013 [US2] API: `POST /api/months` (unique ym, one-open rule, prefill copy per R11), `GET /api/months`, `PUT /api/months/:ym/plan` (409 when closed)
- [ ] T014 [US2] `public/app.js`: center-column plan editing (salaries, fixed/variable lists) + mirrored side panels (personal lists + partnerShare% default 0, add/remove), validation per FR-009
- [ ] T015 [US2] tests/api.test.js: month create/prefill/lock cases

**Checkpoint**: US2 functional standalone.

## Phase 5: User Story 3 - Live figures (P1)

**Goal**: center column always shows current-month live numbers (transfers, guaranteed/planned/projected leftovers, plan-vs-actual).
**Independent Test**: figures match money.test expectations; projected updates with actuals.

- [ ] T016 [US3] API: `GET /api/months/:ym/summary` computing R1–R8/R12 from raw inputs (R16)
- [ ] T017 [US3] `public/app.js`: live figure rendering in the center column

**Checkpoint**: US3 functional standalone.

## Phase 6: User Story 4 - Spending log (P2)

**Goal**: center-column expense CRUD with date/description/amount/link/payer; plan-vs-actual per item + unplanned total.
**Independent Test**: add/edit/delete expenses; linked vs unplanned totals correct; validations reject bad input.

- [ ] T018 [US4] API: `POST /api/months/:ym/expenses`, `DELETE /api/expenses/:id` (open month only; amount>0 cents; date in month; link to variable item only)
- [ ] T019 [US4] `public/app.js`: spending log UI in center column + plan-vs-actual + unplanned total

**Checkpoint**: US4 functional standalone.

## Phase 7: User Story 5 - Month close (P2)

**Goal**: close from header; summary panel: contributions vs paid, leftovers, pot balance, settle-up only when payer exists, personal-support section; locks month; freezes snapshot for History.
**Independent Test**: close with/without payer-tagged expenses; settle sums to zero; lock; snapshot in History.

- [ ] T020 [US5] API: `POST /api/months/:ym/close` — compute summary (R5–R8, R12), freeze `summary_json`, set closed, lock plan+expenses (R9)
- [ ] T021 [US5] `public/app.js`: close confirmation + summary panel on the same screen

**Checkpoint**: US5 functional standalone.

## Phase 8: User Story 6 - Settings panel + per-profile themes (P2)

**Goal**: Settings slide-over panel: profile names, per-profile theme configurator (accent/background/surface/text + light/dark), currency code, categories, language — applied immediately, styles only.
**Independent Test**: change theme/mode/language/currency; layout identical, styles/text/format change; persists in DB.

- [ ] T022 [US6] `public/app.js` + styles: theme panel UI (color pickers per theme field), apply profile theme_json to CSS custom properties on switch
- [ ] T023 [US6] i18n: messages dictionary (en + one more language), language switch, `Intl.NumberFormat`/`DateTimeFormat` everywhere
- [ ] T024 [US6] `public/app.js`: Settings panel wired to `PUT /api/settings` and `PUT /api/profiles/:id`

**Checkpoint**: US6 functional standalone.

## Phase 9: User Story 7 - Leftover log panel (P3)

**Goal**: Leftover log slide-over panel, editable only on the most recently closed month.
**Independent Test**: entries editable on latest closed month; older months read-only.

- [ ] T025 [US7] API: `POST /api/months/:ym/leftovers`, `DELETE /api/leftovers/:id` (most-recently-closed rule)
- [ ] T026 [US7] `public/app.js`: leftover log panel

## Phase 10: User Story 8 - History panel (P3)

**Goal**: History slide-over panel: closed months newest first, read-only.
**Independent Test**: two closed months listed newest first, all read-only.

- [ ] T027 [US8] `public/app.js`: History panel reading frozen snapshots (never recomputed into inputs, R16)

## Phase 11: Polish & Cross-Cutting

- [ ] T028 [P] `Dockerfile` (node:22-alpine) + `docker-compose.yml` reference matching quickstart.md
- [ ] T029 G6 art-direction review: checklist against the ban list in app-spec G6 (fonts, gradients, cards, glassmorphism, emoji icons, contrast, reduced-motion); fix any hits
- [ ] T030 [P] README.md final pass per app doc §9 (problem, money model, features incl. one-screen layout and per-profile themes, compose quick start, config, MIT; screenshots with generic demo data after first build, A4)
- [ ] T031 Run full `node --test tests/` + manual quickstart.md walkthrough (full month cycle on the single screen)
- [ ] T032 Anonymization audit: grep repo for real-looking names/amounts; confirm DB gitignored (A1–A6)

## Dependencies & Execution Order

- Phase 1 (Setup) → Phase 2 (Foundational, blocks all stories) → US phases in priority order: US1 → US2 → US3 → US4 → US5 → US6 → US7 → US8 → Polish.
- US2 depends on Phase 2; US3 on US2; US4 on US2; US5 on US4; US6 on Phase 2 (settings/profile APIs T009); US7/US8 on US5.
- Money tests (T006) must fail before T007 implementation completes (constitution I).

## Parallel Opportunities

- T002/T003 parallel with T004; T010 parallel with T008/T009.
- Within US phases, API task and UI task can proceed in parallel against contracts/api.md.

## Implementation Strategy

MVP first: Setup → Foundational → US1 + US2 + US3 (header/profile, plan with side panels, live figures) → validate a full plan renders correct numbers on the single screen → then US4/US5 (spend/close), US6 (settings/themes), US7/US8, Polish. Commit after each task or logical group.

## Notes

- All money in integer cents end-to-end (R15); property tests guard the invariants.
- One screen only; panels are slide-overs on the same page; no routes, no build step.
- No npm install step; static frontend only.
- Never commit the DB file (A6); generic demo data only in repo files (A1–A5).
- G6 art-direction checklist (T029) must pass before the PR is ready for review.
