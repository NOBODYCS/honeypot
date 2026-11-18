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
item-scoped (`partnerShare%`, default 0) and never changes the shared-cost split.
The app is the source of truth for assignments: what is entered in the app (splits, payers)
reflects the ideal, and real-life payments follow the app — never the other way round.

### IV. Raw data is the only input
Derived values (shares, contributions, leftovers after shared/personal costs, plan-vs-actual,
settle-up) are computed from raw inputs on every calculation. There is NO shared pot: partners
pay shared costs from their own salaries, fairly (equal % of own salary); leftovers are each
partner's own money (model v2.0, see app-spec R5–R8). They may be persisted only as a frozen snapshot
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
month is open — profile choice is prefill convenience, never a permission. The theme belongs to the
PARTNER PROFILE (server-side), never to the browser: Settings shows only the current profile's
name/theme and MUST NOT let one partner edit the other's. Each profile picks one of the
predefined FULL-theme presets (paper / ink / sunrise / berry / ocean / contrast — six families,
each with a light AND a dark variant via `data-mode`, changing colors, fonts, radii, density and
shadows together) via the `data-theme` + `data-mode` attributes; layout and information stay
identical for both profiles — styles only, never layout. Presets are pre-verified for contrast;
free-form color input is not allowed.

### VIII. i18n from day one
English UI by default with a language switch from the start; all numbers and dates via
`Intl.NumberFormat` / `Intl.DateTimeFormat` with the configured ISO 4217 currency code.

### IX. Simplicity
Smallest correct change. Zero-dependency server (Node.js built-ins + `node:sqlite`),
single-file SQLite, static frontend with vanilla JS. No npm packages, no frameworks, no build
step.

### X. Readability and working controls (NON-NEGOTIABLE)
- UI/UX regressions are PREVENTED and DETECTED automatically, not by memory:
  `tests/ui-static.test.js` (run by `npm test` and CI on every push/PR) enforces i18n parity
  and placeholder/dead-key checks, WCAG 2.2 AA contrast for every preset × light/dark token
  pair, button-handler wiring for every visible button, scaling rules (no fixed control
  heights, no nowrap buttons, zoom allowed, text-scale opt-in, coarse-pointer targets), theme
  scoping (per partner profile, never localStorage; settings edit only the current profile),
  single-Save settings, autosave/live-calc wiring, and card layout for side panels. The PR
  template (`.github/PULL_REQUEST_TEMPLATE.md`) requires the manual visual pass. New UI rules
  MUST be encoded there, not just chatted about.
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
- Plan editing is LIVE: figures recompute client-side from the draft on every keystroke
  (shared `money.js` served at `/shared/money.js`) and autosave debounced — no per-form Save
  button; Settings has exactly ONE Save button. Every shared cost item (fixed/variable) has an
  editable partner-share % (empty = salary split); the split/coverage bars and per-partner
  % -of-own-income update immediately.
- The month view MUST make the money split obvious at a glance: a share bar (% per side of the
  shared plan, adjustable via the salary inputs), a live coverage bar (who fronted what % of
  who fronted each expense — the payer pick on each expense), per-partner leftover rows
  (after shared costs, after personal costs), the settle-up balance line, plus the
  equal-%-of-own-income fairness note. Fair share
  is DEFINED as an equal % of each partner's own income; the UI must say what every % means
  (share of the shared plan) via plain-language labels and delayed tooltips
  info tips — explicit, never in-your-face. Each partner's info lives on their own side
  (color-coded: side A = accent, side B = accent-2), never mixed.
- UI MUST scale gracefully: text resizable to 200% without loss of content or function
  (SC 1.4.4), content reflows at 320 CSS px width without two-dimensional scrolling (SC
  1.4.10), controls use `min-height` (never fixed `height`) and `rem` font sizes with the
  `<meta name="text-scale" content="scale">` opt-in (never a root `font-size` override,
  never `user-scalable=no`), button labels may wrap (no `white-space: nowrap` on
  interactive text), and pointer targets are >= 24x24 CSS px (SC 2.5.8), bumped to ~44px
  under `@media (pointer: coarse)`.
- No two-dimensional scrolling in panels or cards at default size: item rows are cards with
  `flex-wrap: wrap`, table headers never `white-space: nowrap`, grid children are
  `min-width: 0`; `.table-wrap { overflow-x: auto }` is a fallback for wide data tables
  only, never a trigger in side panels or the plan.
- DOM building never passes raw `null`/`false` into `replaceChildren`/`append` (they render
  as the literal text "null") — always filter through the `kids()` helper. Encoded as a
  static guard test.
- Plan items (fixed/variable) render as cards with a TWO-SIDED split editor: both partners'
  % are visible and editable side by side, kept in sync to sum to 100, blank = automatic
  salary split (with an "auto" reset). Personal items show the partner's % labeled with the
  partner's name.
- Settings is grouped into labeled sections — "Your profile" (name/theme/mode, per-profile
  only), "App" (currency/language), "Expense categories" — with exactly ONE Save button.
  Closing Settings without saving re-applies the saved theme (no lingering unsaved preview),
  and the mandatory profile pick cannot be dismissed with Escape until a profile is chosen.
- Inline styles are applied via CSSOM (`el.style.setProperty`), NEVER the `style` attribute:
  the CSP (`style-src 'self'`, no unsafe-inline) blocks inline style attributes, so bars/dots
  would silently lose their styling. Encoded as a guard test.
- Sticky side panels offset by the MEASURED topbar height (`--topbar-h`, set on load/resize),
  never a hardcoded pixel guess, so a wrapped topbar can never overlap them.
- Every input has an i18n'd aria-label (no hardcoded English labels); optional % values render
  as "—" via pctStr(), never the literal "null%".
- Every user-visible label, field, section header, figure caption, button, hint, badge and empty
  state gets a short plain visible label (max ~4 words, no jargon) plus a deeper explanation in a
  delayed tooltip: the label text itself is the trigger, the tip opens after ~2s of hover and
  immediately on keyboard focus and tap, it is dismissible with Escape and on focus-out, it has
  `role="tooltip"`, the associated field references it via `aria-describedby`, and its width is
  rem-based so it survives 200% text scaling (SC 1.4.4). i18n convention: label key `K` pairs
  with tooltip key `tip<Capitalized(K)>` in BOTH locales, enforced by tests/ui-static.test.js.
- Static file serving must contain path resolution strictly inside PUBLIC_DIR (separator
  boundary check), guarded by test + smoke.
- Plan saves are ID-PRESERVING upserts in one transaction: items sent with an existing id are
  UPDATEd (so expenses.plan_item_id links survive), new items are INSERTed, removed items
  orphan their expenses (plan_item_id = NULL) instead of failing the FK. Autosave sends ids.
- Autosave must be FLUSHED before switching months or closing a month (flushAutosave), and must
  report rows it skipped (empty label / zero amount) instead of claiming a plain "Saved."
- Creating a month picks the first free YYYY-MM starting at the current month; the main view
  targets the OPEN month only, and a header "New month" button is enabled exactly when no month
  is open. Closing never auto-creates (R10) but creating the next month must always be possible.
- API errors carry a machine `code`; the client maps known codes to i18n strings (err_* keys),
  so the PL UI never shows raw English server messages. Month dropdown labels are rebuilt after
  a language switch.
- Expenses are editable in place (PUT /api/expenses/:id); the add form defaults the date to
  today (clamped into the month) and keeps date/category/payer/link after each save. Destructive
  deletes (plan row, expense, leftover) require the in-app confirm dialog. Settings discards are
  guarded by a dirty-check confirm on close (button, backdrop, Escape).
- The save indicator lives in the header (all `.save-state` nodes), not only in the salaries
  card. The balance badge hides when the settle-up is zero. Field labels wrap their controls in
  real `<label>` elements; item cards are role=group with an aria-label. Categories are deduped
  (case-insensitive) server-side. The "% of own salary" phrasing never double-prints "%".

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

**Version**: 2.1.1 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-18

## Change Log

- **2.1.1 (2026-11-18)** — PATCH: layout hardening after owner visual report (clipping /
  overlap / bad wrapping): tooltips now flip left/up to stay inside the viewport AND inside
  scrolling dialogs (measured via getBoundingClientRect, CSSOM only); `td.num` nowrap applies
  only ≥40em so tables never force side-scrolling at phone width; category chips and tooltip
  text wrap (`overflow-wrap`); split-row % inputs shrink instead of overflowing. Guarded by
  ui-static tests. 73/73 pass.
- **2.1.0 (2026-11-18)** — MINOR: owner follow-ups. (a) Fair-share suggestions are fully live:
  chips appear as soon as an item is added, recompute on every keystroke, and when equalization
  is impossible they also propose adjusting the custom % values (still one-click, never silent).
  (b) Deletes no longer ask for confirmation (only close-month and settings-dirty still do).
  (c) The salary hint is one short line (% of own salary only; % of shared costs stays on the
  split bar); the hint paragraphs under Fixed/Variable sections are removed (the Split tooltip
  covers it). (d) No underlines on hoverable elements. (e) No planned/actual split in the UI —
  the app states what reality should look like. (f) Spending log reworked: no date or planned-item
  fields, categories are creatable from the form (persisted to settings), per-category totals
  strip, log is for shared spending only. 72/72 tests pass.
- **2.0.1 (2026-11-18)** — PATCH: owner principle recorded in Principle III — the app reflects
  the ideal and reality follows it: what is set in the app (splits, payers) is the source of
  truth for who pays whom; anything not entered there is matched to the app afterwards, not
  vice versa.
- **2.0.0 (2026-11-18)** — MAJOR: no-pot model rework (owner decision). The shared pot is gone:
  partners pay shared costs from their own salaries, fairly (equal % of own salary); leftovers
  are each partner's own money. Removed: pot balance figure, pot return, the coverage bar
  ("who paid so far"), and the guaranteed/planned/projected leftover figures. New leftover
  figures: after shared costs (live) and after personal costs (app-spec R5/R6; R7 reserved).
  Settle-up is the balance equation over the SUM of all fronted amounts and is phrased as
  "X chipped in Y more — Z pays it back"; an even balance says so explicitly. Payer-less
  expenses = split by share, each paying their own part. History snapshots from before 2.0
  render with a legacy fallback. 68/68 tests pass.
- **1.12.0 (2026-11-18)** — MINOR: fair-share split suggestions (advisory only). Shared
  fixed/variable items with an empty (auto) split get a suggestion chip with one-click apply,
  plus one "apply all" action in the plan section; suggestions recompute live on every draft
  change. Applying fills the A%/B% inputs as normal manual values — never silent, never on
  load, always undoable via auto. Math in money.js `suggestFairSplit`: one shared integer %
  for all auto items so that, if accepted, both partners contribute the same % of their own
  salary (within integer-%/R15 rounding); clamped "closest possible" case is flagged and says
  so in the tooltip. Property-tested (within 1 income point when amounts allow; R15 sums exact)
  + ui-static guards. 67/67 tests pass.
- **1.11.0 (2026-11-18)** — MINOR: spinner-free numeric entry. No `type="number"` anywhere;
  every numeric field is a plain text input with `inputmode="decimal"` (money) or
  `"numeric"` (percent). Live filtering on every keystroke/paste keeps only digits and one
  decimal separator (both `.` and `,` accepted, normalized on parse to integer cents); on
  blur money snaps to 2 decimals and percent to an integer 0–100. Drafts only ever hold
  committed parsed cents; autosave/validation/R15 untouched. Helpers live in money.js
  (sanitizeNumericInput/parseFlexibleMoney/formatMoneyInput/formatPctInput) with unit tests;
  ui-static guards ban type=number. 63/63 tests pass.
- **1.10.0 (2026-11-18)** — MINOR: live figures explained for real. Every figure (contribution,
  % of own salary, the three leftover lines, left of shared plan, settle-up, plan split bar vs
  coverage bar, fairness line) now has a plain caption plus a tooltip with 2–3 plain sentences
  AND a worked mini example computed live from the current draft (salaries, plan, spending so
  far), in en+pl with placeholder parity. Same explanations in the close summary dialog and
  History. Guarded by ui-static tests (58/58 pass).
- **1.9.0 (2026-11-18)** — MINOR: plain-language labels + delayed tooltip mechanism
  (Principle X addition). Every visible label/field/header/caption/button/hint/badge/empty
  state now has a short plain label (max ~4 words) plus a tooltip: label text is the trigger,
  2s hover delay, instant on focus/tap, Escape-dismissible, `role="tooltip"` +
  `aria-describedby` association, rem-based sizing for 200% text scaling. i18n pairing
  `K` → `tip<Capitalized(K)>` in en+pl enforced by ui-static tests (57/57 pass). Visible
  labels reworded per owner wording (contribution to shared costs, % of shared costs,
  paid so far by whom, left of shared plan, settle-up as a who-pays-whom sentence, partner
  chip-in labeled with the partner's name).
- **1.8.0 (2026-11-18)** — MINOR: external-audit fixes. Plan PUT no longer FK-500s after an
  expense is linked (id-preserving upsert + orphan links); autosave flushes before month
  switch/close and reports skipped rows; "New month" header button + next-free-ym creation so a
  closed month never dead-ends; expense edit-in-place (PUT) with date defaulting to today and
  form values preserved across adds; API error codes mapped to i18n; month dropdown rebuilt on
  language switch; confirms on destructive deletes; settings dirty-guard on close; header save
  indicator; balance badge hidden at zero; real label-wrapped fields + grouped item cards;
  case-insensitive category dedupe; fixed doubled "%" and the "by salary" bar label; wider
  dialogs, unclipped money inputs, live plan-vs-actual. 55/55 tests pass.
- **1.7.0 (2026-11-18)** — MINOR: second full review pass. Fixed: CSP `style-src 'self'` was
  silently blocking all inline `style` attributes (split bars/colored dots unstyled) — el()
  now applies styles via CSSOM setProperty; "null%" could render when a salary was 0 (pctStr
  guard); hardcoded English aria-label on money inputs → i18n labels on every input; sticky
  side panels now offset by the measured topbar height; profile-pick dialog can't be
  Escape-dismissed before choosing; closing Settings without saving reverts the theme preview;
  static path check tightened to a separator boundary. Guards added for all of the above
  (47/47 tests pass).
- **1.6.0 (2026-11-18)** — MINOR: fixed literal "null" text from raw nulls passed to
  `replaceChildren` (now filtered via `kids()`, guarded by tests); plan items (fixed/variable)
  render as cards with a two-sided A%/B% split editor (synced to 100, blank = salary split,
  "auto" reset) instead of a cramped table with a single % column; killed horizontal
  scrolling (wrapping rows, no nowrap headers, shrinkable grid children); Settings grouped
  into labeled sections (Your profile / App / Categories) with one Save. Guards extended in
  `tests/ui-static.test.js`.
- **1.5.0 (2026-11-18)** — MINOR: added Principle X automation clause: UI/UX guards as
  tests (`tests/ui-static.test.js`: i18n, contrast per preset×mode, button wiring, scaling,
  scoping, autosave) + CI workflow + PR template checklist, so regressions are caught without
  anyone spelling them out.
- **1.4.0 (2026-11-18)** — MINOR: theme confirmed as per-partner-profile (not per browser);
  Settings scoped to the current user only, single Save button. Live calculations: figures
  recompute from the draft on every keystroke + debounced autosave (no plan Save button).
  Per-item partner-share % on fixed/variable costs (-1 = salary split; guarded table rebuild
  migration). Personal expenses render as compact cards — no horizontal scroll in side panels.
  "ISO 4217" removed from the currency label.
- **1.3.0 (2026-11-18)** — MINOR: six preset families (paper/ink/sunrise/berry/ocean/
  contrast), each with light + dark mode. Split semantics made explicit in the UI: share bar =
  % of the shared plan by salary, fairness = equal % of own income, hover/focus
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
