# Honeypot Constitution

## Core Principles

### I. Money integrity (NON-NEGOTIABLE)
All amounts are stored and computed as integer minor units (cents) — never floats. Every split
assigns the remainder to one side so the two shares always sum exactly to the total
(e.g. `contribution(B) = total − contribution(A)`). The money rules R1–R16 in
`specs/001-honeypot-app/app-spec.md` are the single source of truth for all money math,
implemented once as pure functions and covered by property tests (shares sum to total,
settle-up sums to zero, planned = guaranteed − variable share).

### II. Month isolation
Each month is a separate plan keyed by calendar year-month (`YYYY-MM`); the current month is
today's month and at most one month is open at a time. No balance, leftover, or settlement
carries between months. Creating a month only pre-fills editable defaults from the most
recent month.

### III. Proportional split; personal stays personal
Every shared cost total is split by net salary share (full salaries, never pre-reduced).
Personal obligatory costs reduce only their owner's leftover; sharing is explicit,
item-scoped (`partnerShare%`, default 0) and never changes the shared-pot split.

### IV. Raw data is the only input
Derived values (shares, contributions, leftovers, plan-vs-actual, pot balance, settle-up) are
computed from raw inputs on every calculation. They may be persisted only as a frozen snapshot
of a closed month or as a display cache — never read back into other calculations.

### V. Trust, not security
The app is LAN-only with no authentication by design; VPN, DNS, and reverse proxy are outside
app scope. Personal data never enters the repo: generic defaults in code, real data only in
the runtime database, which lives on a volume outside the repo and is gitignored (A1–A6).

### VI. Modern web platform + deliberate art direction
All frontend work follows Google's Modern Web Guidance (`.vibe/skills/modern-web-guidance`):
semantic HTML, modern CSS, native platform features, accessibility and performance per its
guides. No legacy patterns, no UI component library. On top of that, the UI must follow the
art direction in app-spec G6 and must NOT fall into the common "AI-generated" clichés
(default fonts with no pairing, indigo/purple gradients, gradient text, glow blobs, pill
badges, uniform icon-card rows, glassmorphism, gray-bordered shadowed cards, emoji icons,
shadcn/Tailwind/Lucide defaults, centered-everything layouts). Instead: locked design tokens
in `public/styles.css` (named colors, one base + 1–2 accents), one distinctive display font
paired with a body font, contrast checked (WCAG/APCA), `prefers-reduced-motion` respected.

### VII. Single screen, fully editable, per-profile styles only
The whole app is ONE screen: header bar, center column with the main functions (month plan,
live figures, spending log, close), and left/right mirrored side panels with each partner's
name + personal obligatory list. Settings / History / Leftover log open as slide-over panels
on the same page. Every field is editable by either profile at any time while the month is
open — profile choice is prefill convenience, never a permission. Each profile's theme is
highly configurable from Settings (accent, background, surface, text colors + light/dark) and
applied via CSS custom properties; layout and information stay identical for both profiles —
styles only, never layout.

### VIII. i18n from day one
English UI by default with a language switch from the start; all numbers and dates via
`Intl.NumberFormat` / `Intl.DateTimeFormat` with the configured ISO 4217 currency code.

### IX. Simplicity
Smallest correct change. Zero-dependency server (Node.js built-ins + `node:sqlite`),
single-file SQLite, static frontend with vanilla JS. No npm packages, no frameworks, no build
step.

## Technology & Constraints

- Language/runtime: JavaScript on Node.js 22+ (built-in modules only: `node:http`,
  `node:sqlite`, `node:test`). No npm dependencies.
- Storage: single SQLite file at `HONEYPOT_DB_PATH` (default `/data/honeypot.db`), WAL mode.
- API: small JSON HTTP API served by the same process; static single-page frontend from
  `public/`.
- Target platform: Linux server in a Docker container (LAN-only), deployed via a Portainer
  compose stack behind the owners' manually managed nginx reverse proxy.
- Anonymization A1–A6 applies to every repo file, including tests, seeds, README, screenshots.
- License: MIT.

## Development Workflow

- Spec-driven: work flows from `specs/<NNN-feature>/` (spec → plan → tasks → implement).
  This constitution supersedes ad-hoc decisions; amendments require a version bump and a note
  in the change log.
- Money rules are tested before UI work (property tests on the invariants in Principle I).
- Validation rules from the app document (amounts > 0 in cents, expense date within month,
  `partnerShare%` ∈ [0,100], one open month) are enforced server-side.
- UI work passes a G6 art-direction checklist review (ban list) before merge.
- Every change goes through a PR; PRs must verify constitution compliance.

## Governance

The constitution supersedes all other practices. Amendments require: documentation of the
change, a semantic version bump (MAJOR for removed/redefined principles, MINOR for new
principles/sections, PATCH for clarifications), and a change-log entry. All PRs must verify
compliance; any complexity beyond the principles above must be justified in the PR.

**Version**: 1.0.0 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-17
