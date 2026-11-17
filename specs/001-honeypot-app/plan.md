# Implementation Plan: Honeypot two-person monthly budget planner

**Branch**: `vibe/spec-kit-setup-9b6767` (PR #1) | **Date**: 2026-11-17 | **Spec**: `specs/001-honeypot-app/spec.md`

**Input**: Feature specification from `specs/001-honeypot-app/spec.md`; source of truth:
`specs/001-honeypot-app/app-spec.md` (money rules R1–R16, single-screen layout §4, G6 art
direction).

## Summary

Build a self-hosted, LAN-only, two-person monthly budget planner as ONE screen: a
zero-dependency Node.js server (single-file SQLite, JSON API) serving a static single-page
frontend — header bar, center column with plan/live figures/spending log/close, mirrored
personal side panels — with per-profile configurable themes (CSS custom properties) and a
deliberate non-"AI-generated" art direction (G6). Money rules R1–R16 over integer cents,
shared-pot model, derived-on-read. Deployed later via a Portainer compose stack behind the
owners' nginx proxy.

## Technical Context

**Language/Version**: JavaScript, Node.js 22+ (built-in modules only; `--experimental-sqlite`
if required — research.md R-10)

**Primary Dependencies**: none (no npm packages). `node:http`, `node:sqlite`, `node:test`

**Storage**: single-file SQLite at `HONEYPOT_DB_PATH` (default `/data/honeypot.db`), WAL mode;
schema in `data-model.md`; DB file gitignored, lives on a Docker volume (A6)

**Testing**: `node --test tests/` — property tests for money invariants first
(tests/money.test.js), then API tests (tests/api.test.js)

**Target Platform**: Linux server, Docker container (`node:22-alpine`), LAN-only; Portainer
compose stack behind manually managed nginx reverse proxy (compose in `quickstart.md`)

**Project Type**: web application — single service (static `public/` single page + JSON API
`/api/*`)

**Performance Goals**: 2 concurrent users; p95 < 100 ms on LAN; static assets cached

**Constraints**: integer cents only (R15); no auth in the app (P7); no derived data stored as
inputs (R16); single-screen layout, every field editable by either profile while the month is
open (FR-001/FR-003); per-profile theme configurable in Settings, styles only (FR-014); G6 art
direction (no AI-slop clichés; locked design tokens, distinctive font pairing, WCAG/APCA
contrast, reduced-motion); anonymization A1–A6 in every repo file; Modern Web Guidance for the
frontend (G1); English UI + i18n switch; MIT license

**Scale/Scope**: 2 users, one screen + panels, one SQLite file, one feature package

## Constitution Check

*Gates: all pass — see `.specify/memory/constitution.md`.*

- I Money integrity → integer cents, R1–R16 pure functions, property tests. PASS
- II Month isolation → `YYYY-MM` keys, one open month, prefill-only copy. PASS
- III Proportional split / personal stays personal → R2–R4, R12–R14. PASS
- IV Raw data only as input → R16; only frozen close snapshot persisted. PASS
- V Trust not security + no personal data in repo → P7, A1–A6, gitignored DB. PASS
- VI Modern web platform + deliberate art direction → Modern Web Guidance skill + G6 token
  lock and ban list. PASS
- VII Single screen, fully editable, per-profile styles only → one-page layout, side panels,
  everyone-edits, configurable themes via CSS custom properties. PASS
- VIII i18n from day one → dictionary + Intl. PASS
- IX Simplicity → zero-dep Node, single-file SQLite, vanilla JS, no build step. PASS

No violations → Complexity Tracking: none required.

## Project Structure

### Documentation (this feature)

```text
specs/001-honeypot-app/
├── app-spec.md          # fixed app document v2 (source of truth, R1–R16, layout §4, G6)
├── spec.md              # this feature's spec
├── research.md          # Phase 0 decisions (R-01…R-13)
├── data-model.md        # Phase 1 schema
├── contracts/
│   └── api.md           # Phase 1 HTTP API
├── quickstart.md        # Phase 1 run/test/deploy (compose for Portainer)
├── plan.md              # This file
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── server.js            # node:http server: static public/ + /api/* routing
├── db.js                # SQLite open, schema (data-model.md), WAL
├── money.js             # R1–R16 pure functions over integer cents (single source of truth)
└── api.js               # JSON API handlers per contracts/api.md
public/
├── index.html           # single screen: header + center column + mirrored side panels (semantic HTML)
├── styles.css           # locked design tokens (G6) + CSS custom properties themes + layout
└── app.js               # vanilla JS: panels, fetch /api/*, i18n dictionary, Intl formatting, theme switch
tests/
├── money.test.js        # property tests on money invariants (run first)
└── api.test.js          # API endpoint tests
Dockerfile               # node:22-alpine, copies src/ public/, exposes 8080
docker-compose.yml       # reference only — deployed via Portainer (see quickstart.md)
README.md                # per app doc §9
.gitignore               # data/, *.db, node_modules/
```

**Structure Decision**: single project — one Node service serving one static page plus
`/api/*`; no separate frontend/backend packages, no `node_modules`, no build step
(constitution IX).

## Complexity Tracking

No constitution violations; table intentionally empty.
