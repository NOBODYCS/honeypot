# Honeypot — App Document (fixed draft v2)

Status: **Draft v2, 2026-11-17**. Consolidates the approved stage-1 product spec with all
agreed amendments. Where this document and the stage-1 spec conflict, this document wins.
This document follows anonymization rules A1–A5 and is safe to store in the public repo.

## Change log (vs stage-1 spec)

- 2026-11-18: figure explanations are user-facing product behavior — every live figure and
  close/history figure carries a plain caption plus a tooltip with a worked example computed
  from live numbers (see constitution Principle X / 1.10.0). Wording must stay aligned with
  R1–R16 (fixed costs auto-paid by the pot, pot pays pot-paid expenses).
- 2026-11-18 (R17, advisory only): the app may SUGGEST per-item splits for shared costs so both
  partners end up contributing the same % of their own salary (suggestFairSplit in money.js).
  Suggestions are never applied silently, never on load, never to items with a manual %;
  applying them writes ordinary editable partnerSharePct values. They never change the pot
  model or close math (R1–R16 unchanged).

- Cash flow made explicit: shared-pot model (R8 amended). Expenses without a payer are
  pot-paid and split by share; only payer-tagged ("fronted") expenses produce a settle-up
  line, and settle-up lines always sum to zero.
- Money stored as integer minor units (cents); every split assigns the remainder so the two
  shares sum exactly (new R15).
- Derived values may be stored only as a frozen close snapshot or display cache, never read
  back into calculations (new R16).
- Months keyed by calendar year-month (`YYYY-MM`); current month = today's month; at most one
  open month; creating a month only pre-fills editable defaults from the most recent month.
- Leftover log editable only on the most recently closed month; older months read-only.
- Currency stored as ISO 4217 code, formatted with `Intl.NumberFormat` (2 fraction digits).
- License: MIT. Deployment (Docker/Portainer/nginx/DNS/VPN) is an interactive job done by the
  owners after a working build; the agreed compose snippet is folded into
  `specs/001-honeypot-app/quickstart.md`.
- Frontend: Modern Web Guidance, no UI component library, per-profile **styles only** via CSS
  custom properties. Validation rules added. SQLite file lives outside the repo and is
  gitignored.
- **Single-screen layout** (owner amendment, 2026-11-17): all app functionality on one screen —
  the center column holds the main functions (month plan/dashboard, spending log, close), and
  the left and right mirrored side panels hold each partner's name + personal obligatory list.
  Every field is fillable and editable by either partner at any time while the month is open.
- **Theme highly configurable per profile from Settings** (not just one seed color): accent,
  background, surface, text colors + light/dark, applied via CSS custom properties (3.4).
- **Artistic direction added (G6)**: the UI must avoid the common "AI-generated" clichés
  (banned list in G6); Modern Web Guidance still governs the technical implementation.

## 1. Purpose

A self-hosted web app for exactly two people who share a household and split shared costs
proportionally to net salaries instead of 50/50. One month at a time: plan at the start,
track spending during the month, close with a summary at the end, then each person logs what
they did with their leftover money.

Working name: **Honeypot**. Public-repo tagline: "Honeypot: a two-person shared budget
planner" (the name otherwise reads as a security honeypot project).

## 2. Principles

- **P1 Month isolation.** Each month is a separate plan keyed by calendar year-month. No
  balance, pot, or debt carries automatically into the next month.
- **P2 Proportional split.** Every shared cost total is split by salary share.
- **P3 Personal stays personal.** Personal obligatory costs belong to one person and reduce
  only that person's leftover. Any personal item may declare a `partnerShare%` (default 0%,
  both directions). Sharing never changes the shared-pot split.
- **P4 Fixed vs variable.** Fixed shared costs (rent, utilities, internet) and variable shared
  costs (groceries, eating out) are separate categories.
- **P5 Two leftover lines.** "Guaranteed" = salary − 100%-certain payments (fixed shared share
  + personal obligatory). "Planned" = guaranteed − variable plan share.
- **P6 Zero personal data in the repository.** Profiles, themes, categories, currency are
  runtime settings in the database; generic defaults in the repo. The SQLite file lives on a
  volume outside the repo and is gitignored.
- **P7 Trust, not security.** No passwords, no auth in the app. LAN-only; VPN/DNS/proxy are
  outside app scope and handled by the owners. Anyone who reaches the app can see and edit
  everything. Accepted by design.
- **P8 Raw data is the only input.** Derived numbers are computed from raw inputs on every
  calculation (see R16).

## 3. Profiles and entrance

- **3.1** Two profiles, created in Settings. Generic defaults out of the box: "Partner A",
  "Partner B". Real names typed once on first run, stored in the database only.
- **3.2** On first visit the app asks which profile you are (two buttons, no password);
  afterwards the header switch does the same. Pick freely.
- **3.3** The chosen profile is remembered per browser (localStorage) and shown in the header
  with a switch control. Picking a profile is a convenience, not an identity: forms prefill
  with the current profile, but **every field in the app is fillable and editable by either
  profile at any time while the month is open**.
- **3.4** Per-profile theme, **highly configurable from Settings**: each profile has its own
  theme colors (accent, background, surface, text) plus a light/dark choice, stored and
  applied as CSS custom properties. Switching profiles swaps the custom properties only —
  buttons, highlights, active states change palette. **Layout and information stay identical
  for both profiles (styles only, never layout).**

## 4. Layout — one screen

All app functionality lives on **one screen** (a single page, no separate routes):

- **Header bar**: current profile name + switch control (remembered per browser; first visit
  asks which profile you are), current month (today's calendar month) + month selector,
  buttons opening Settings / History / Leftover log as slide-over panels on the same page, and
  Close month.
- **Center column (main functions)**: the current month at a glance — both salaries, fixed
  shared items (name + amount), variable shared items (name + planned amount) with plan vs
  actual, the spending log (add expense: date, description, amount, optional link to a planned
  variable item, optional payer; unplanned total), "transfer after payday" per person,
  guaranteed / planned / projected leftover per person, spending so far vs plan. Creating a
  month happens from here when no month is open; creating pre-fills all lists from the most
  recent month as **editable defaults only** — nothing else carries. Editable while open,
  locked after closing.
- **Left side panel**: Partner A — name + their personal obligatory list (name + amount +
  optional "partner shares %", default 0%).
- **Right side panel**: Partner B — mirrored exactly.

Every field on the screen is fillable and editable by **either** partner at any time while the
month is open (3.3). Personal lists sit in the side panels; everything shared sits in the
center. Fixed costs are never expense entries; a fixed-cost variance is logged as an unplanned
expense. Closing a month shows the summary (each person's proportional contribution vs what
they actually paid, guaranteed / planned / actual leftover, pot balance, one-line settle-up
only if at least one expense has a payer, and the "personal support" section listing every
shared personal item in money), locks plan and expenses, and stores a frozen summary snapshot
for History. The Leftover log panel is editable only for the **most recently closed** month
(entries: amount, category, free note, per profile). History lists closed months newest
first, read-only. The Settings panel holds profile names, per-profile theme colors (3.4),
currency (ISO 4217 code), expense categories (editable list), and UI language.

## 5. Exact money rules

- R1 `combinedIncome = salaryA + salaryB`
- R2 `share(P) = salary(P) / combinedIncome`
- R3 `sharedPlannedTotal = fixedTotal + variablePlannedTotal`
- R4 `contribution(P) = sharedPlannedTotal × share(P)` (the "transfer after payday")
- R5 `guaranteedLeft(P) = salary(P) − fixedTotal × share(P) − personalOut(P)`
- R6 `plannedLeft(P) = guaranteedLeft(P) − variablePlannedTotal × share(P)`
- R7 `actualSpent = Σ expenses`; `projectedLeft(P) = salary(P) − (fixedTotal + actualSpent) × share(P) − personalOut(P)`
- R8 **Pot model.** After payday each person transfers `contribution(P)` (R4) into the shared
  pot; the pot pays all shared costs. An expense with no payer = paid from the pot. An expense
  with a payer = fronted by that person from personal money. `fronted(P) = Σ expenses with
  payer = P`; `settle(P) = fronted(P) − share(P) × Σ fronted` — positive: owed money,
  negative: owes; the two settle lines always sum to zero. If no expense has a payer, the
  settle-up line is not shown. Pot balance at close = `sharedPlannedTotal − fixedTotal − Σ
  pot-paid expenses`; it is returned to each person by `share(P)` at close (P1: nothing
  carries over).
- R9 Month statuses: `open → closed`. Closed = read-only except the leftover log (most
  recently closed month only).
- R10 Months are keyed by calendar year-month (`YYYY-MM`, unique). The current month is
  today's calendar month. At most one month is open at a time. Closing one month does not
  create the next.
- R11 No balance, leftover, or settlement carries between months automatically. Creating a
  month only pre-fills item names and amounts as editable defaults (see §4).
- R12 Personal cost sharing: `personalOut(P) = Σ own items × (100% − partnerShare%) + Σ
  partner's items × partnerShare%`.
- R13 Sharing is explicit, item-scoped, and printed in the month summary ("personal support"
  section). It never changes the shared-pot split.
- R14 R1–R4 always use full salaries. No income is reduced before the split; help appears as
  its own line in money, never as a quiet shift of percentages.
- R15 **Integer money.** All amounts are stored and computed as integer minor units (cents).
  Every split assigns the remainder to one side (e.g. `contribution(B) = total −
  contribution(A)`) so the two shares always sum exactly to the total. Display via
  `Intl.NumberFormat` with the configured ISO 4217 currency code, 2 fraction digits.
- R16 **Derived data is never an input.** Shares, contributions, leftovers, plan-vs-actual,
  pot balance, and settle-up are always computed from raw inputs (salaries, plan items,
  expenses, settings) for any calculation. They may be persisted only as a frozen snapshot of
  a closed month (for history display) or as a display cache, and must never be read as
  inputs to other calculations.

### Validation rules

- Expense amount: integer cents, > 0. Expense date: within the month. `partnerShare%` ∈
  [0, 100]. Month key unique; at most one open month.

## 6. Design and build guidance

- **G1** All frontend work follows Google's Modern Web Guidance (installed in this repo at
  `.vibe/skills/modern-web-guidance`): semantic HTML, modern CSS, native web platform
  solutions, accessibility and performance per its guides. No legacy patterns.
- **G2** The project is a Spec Kit package: constitution (`.specify/memory/constitution.md`)
  plus this feature's spec/plan/tasks under `specs/001-honeypot-app/`. Code is generated from
  those files.
- **G3** Per-profile theme (3.4) via CSS custom properties, configurable per profile in
  Settings. Styles only; layout and information identical for both profiles. No UI component
  library.
- **G4** UI language: English by default, with an i18n switch built in from the start. All
  numbers/dates via `Intl.NumberFormat` / `Intl.DateTimeFormat`.
- **G5** Server: zero-dependency Node.js (built-in `node:http` + `node:sqlite`), single-file
  SQLite database, static frontend with vanilla JS. No npm packages.
- **G6 Artistic direction — do not look AI-generated.** Avoid the well-known machine-default
  clichés: default fonts (Inter / Roboto / Poppins / Geist / DM Sans everywhere with no
  pairing), purple/indigo→blue gradients, gradient text, glowing blobs, pill badges over
  centered headlines, rows of 3–4 identical icon-cards, glassmorphism, thin-gray-bordered
  cards with soft shadows, uniform 16px radii, emoji as icons, the shadcn/Tailwind/Lucide
  default component kit, centered-everything layouts, scroll-animation spam, generic
  marketing copy. Instead: lock a small design-token set (named colors, one base + 1–2
  accents), use one distinctive display font paired with a body font (strong weight/size
  contrast), use the asymmetric-but-balanced one-screen layout of §4 with intentional borders
  and radii, check color contrast (WCAG/APCA), and respect `prefers-reduced-motion`. G1 (Modern
  Web Guidance) still governs the technical implementation: semantic HTML, modern CSS, native
  platform features, accessibility, performance.

## 7. Non-goals

No bank integration or import. No third profile. No passwords or HTTPS in the app (reverse
proxy handles TLS). No automatic rollover of balances. No native mobile app, responsive web
only. No alerts or judgment: it calculates and records. Deployment host setup (VPN, DNS,
proxy) is out of app scope and done interactively by the owners.

## 8. Anonymization rules (applies to every repo file)

- A1 No real names, amounts, city, or identifying details in code, comments, tests, seeds,
  README, screenshots.
- A2 Profile data lives only in the runtime database.
- A3 Example numbers in docs are clearly fake round numbers.
- A4 Screenshots use generic demo data only.
- A5 This document follows the same rules so it can be stored in the repo safely.
- A6 The SQLite database file is never committed: it lives on a Docker volume outside the
  repo and is gitignored.

## 9. README requirements

Written for a stranger: the problem, the money model, features, quick start with Docker
Compose, configuration, screenshots with fake data, license (**MIT**).

## 10. Roadmap of stages

1. Product spec — approved 2026-11-17; amended by this document.
2. Data model and API design — `specs/001-honeypot-app/data-model.md` and
   `specs/001-honeypot-app/contracts/api.md`. R1–R16 are the single source of truth for all
   money math; schema, seeds, and tests follow A1–A6.
3. UI flows — `specs/001-honeypot-app/spec.md`. The single-screen layout of §4 (center = main
   functions, mirrored personal side panels); per-profile configurable theme via CSS custom
   properties (3.4, G3); artistic direction per G6; Modern Web Guidance per G1; English UI with
   i18n switch (G4).
4. Deployment — done interactively by the owners after a working build (Docker on the server
   VM, Portainer stack, nginx reverse proxy managed manually, local DNS, VPN-only). The agreed
   compose contents for Portainer are folded into `specs/001-honeypot-app/quickstart.md`.
5. Spec Kit package assembly — this repo: constitution + `specs/001-honeypot-app/`
   (app-spec, spec, research, data-model, contracts, quickstart, plan, tasks) + README.
