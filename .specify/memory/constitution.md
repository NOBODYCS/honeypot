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
Personal expenses reduce only their owner's leftover; sharing is explicit,
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
name + personal expenses list. Settings / History / Leftover log open as slide-over panels
on the same page and MUST fit on screen at default viewport size without scrolling (internal
scroll only as a fallback). Every field is editable by either profile at any time while the
month is open — profile choice is prefill convenience, never a permission. Each profile picks
one of the predefined FULL-theme presets from Settings (paper / ink / sunrise / berry / ocean /
contrast — six families, each with a light AND a dark variant via `data-mode`, changing colors,
fonts, radii, density and shadows together) via the `data-theme` + `data-mode` attributes;
layout and information stay identical for both profiles — styles only, never layout. Presets
are pre-verified for contrast; free-form color input is not allowed.

### VIII. i18n from day one
English UI by default with a language switch from the start; all numbers and dates via
`Intl.NumberFormat` / `Intl.DateTimeFormat` with the configured ISO 4217 currency code.

### IX. Simplicity
Smallest correct change. Zero-dependency server (Node.js built-ins + `node:sqlite`),
single-file SQLite, static frontend with vanilla JS. No npm packages, no frameworks, no build
step.

### X. Readability and working controls (NON-NEGOTIABLE)
- Every text/background pair MUST meet WCAG 2.2 AA: >= 4.5:1 for normal text, >= 3:1 for
  large text (>= 24px, or >= 18.66px bold) and for non-text UI boundaries (input borders,
  focus rings, icons) — SC 1.4.3 and 1.4.11, measured with the WCAG relative-luminance
  formula. This applies to every design-token pair in the defaults AND in every theme preset
  (light and dark variants included).
- User-picked theme colors (Principle VII) are never applied raw. The theme layer MUST
  validate each pair and auto-derive safe values (adjust the text/background or clamp the
  accent) so that no selectable combination can drop below the minimums. `--accent-ink`,
  the muted inks, the lines, and the toast pair are always DERIVED from the chosen
  accent/background/text — never hard-coded per mode. A "reset to default" must always be
  one click away in Settings.
- All interactive elements are native `<button>`/`<input>`/`<select>`/etc., keyboard
  operable, with a visible `:focus-visible` ring (>= 3:1 against adjacent colors, SC 2.4.7)
  and every state styled: enabled, hover, focus, pressed, disabled, loading. Every button
  MUST have a wired handler in every state in which it is visible — dialog close buttons
  included — and dialogs MUST be closable via button, Escape, and backdrop click.
- The default palette is the locked design-token set in `public/styles.css` (one base +
  1–2 accents, warm paper base, distinctive font pairing per G6). Token changes go through
  the G6 review with the measured contrast ratios of every affected pair in the PR.
- The month view MUST make the money split obvious at a glance: a share bar (% per side of the
  shared plan, adjustable via the salary inputs), a live coverage bar (who fronted what % of
  actual spending vs the pot — the payer pick on each expense), per-partner leftover rows, the
  pot balance and the settle-up line, plus the equal-%-of-own-income fairness note. Fair share
  is DEFINED as an equal % of each partner's own income; the UI must say what every % means
  (share of the shared plan, not of the pot) via plain-language labels and small hover/focus
  info tips — explicit, never in-your-face. Each partner's info lives on their own side
  (color-coded: side A = accent, side B = accent-2), never mixed.
- UI MUST scale gracefully: text resizable to 200% without loss of content or function
  (SC 1.4.4), content reflows at 320 CSS px width without two-dimensional scrolling (SC
  1.4.10), controls use `min-height` (never fixed `height`) and `rem` font sizes with the
  `<meta name="text-scale" content="scale">` opt-in (never a root `font-size` override,
  never `user-scalable=no`), button labels may wrap (no `white-space: nowrap` on
  interactive text), and pointer targets are >= 24x24 CSS px (SC 2.5.8), bumped to ~44px
  under `@media (pointer: coarse)`.

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
- UI work passes a G6 art-direction checklist review (ban list) before merge, plus a
  measured-contrast check (WCAG 2.2 AA ratios for every token pair in both modes, defaults
  and user themes) and a manual keyboard pass (Tab through every control; every visible
  button fires its action).
- Every change goes through a PR; PRs must verify constitution compliance.

## Governance

The constitution supersedes all other practices. Amendments require: documentation of the
change, a semantic version bump (MAJOR for removed/redefined principles, MINOR for new
principles/sections, PATCH for clarifications), and a change-log entry. All PRs must verify
compliance; any complexity beyond the principles above must be justified in the PR.

**Version**: 1.3.0 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-18

## Change Log

- **1.3.0 (2026-11-18)** — MINOR: six preset families (paper/ink/sunrise/berry/ocean/
  contrast), each with light + dark mode. Split semantics made explicit in the UI: share bar =
  % of the shared plan by salary (not of the pot), fairness = equal % of own income, hover/focus
  info tips on the figures, per-partner sides color-coded (accent / accent-2).
- **1.2.0 (2026-11-18)** — MINOR: reworked per-profile theming from free-form colors to
  predefined full-theme presets (`data-theme`, dark mode = its own preset; fixes dark mode
  being clobbered by inline colors). Renamed "personal obligatory" to "personal expenses".
  Added the split-visibility requirement (share bar, live coverage bar, fairness note) and
  the fit-on-screen rule for panels to Principles VII/X. Settings now has a single Save button;
  expense categories are color-coded and selectable per expense.
- **1.1.0 (2026-11-18)** — MINOR: added Principle X (Readability and working controls,
  NON-NEGOTIABLE): enforced WCAG 2.2 AA contrast on all token pairs including user-chosen
  themes, derived (never raw) theme colors with a reset-to-default, visible focus rings and
  all button states, and a wired handler on every visible button. Added the contrast +
  keyboard-pass check to the development workflow.
