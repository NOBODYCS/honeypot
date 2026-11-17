# Feature Specification: Honeypot two-person monthly budget planner

**Feature Branch**: `vibe/spec-kit-setup-9b6767` (PR #1) | **Spec dir**: `specs/001-honeypot-app/`

**Created**: 2026-11-17

**Status**: Draft

**Input**: Fixed app document v2: `specs/001-honeypot-app/app-spec.md` (single-screen layout,
mirrored personal side panels, everyone-edits-everything, highly configurable per-profile
themes, G6 art direction; money rules R1–R16 are the single source of truth).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Profile pick and header (Priority: P1)

As one of the two partners, I open the app and pick my profile once; the app remembers it per
browser and shows it in the header with a switch — and I can edit every field regardless of
which profile is selected.

**Why this priority**: The header profile drives prefill and theming; everything else assumes it.

**Independent Test**: Open in two browsers, pick different profiles; each is remembered across
reloads; switching profiles swaps theme only; any field is editable under either profile.

**Acceptance Scenarios**:

1. **Given** two profiles exist, **When** I first open the app, **Then** I'm asked which
   profile I am (two buttons, no password).
2. **Given** a chosen profile, **When** I reload, **Then** the same profile is selected
   (localStorage) and shown in the header with a working switch.
3. **Given** either profile selected, **When** I edit any field, **Then** the edit saves —
   profile choice is never a permission.

---

### User Story 2 - Month plan on the center column (Priority: P1)

As a partner, I create/open the current month and fill in both salaries, fixed and variable
shared items in the center column, and each partner's personal obligatory list in their side
panel (with optional partner-share %). A new month pre-fills from the most recent one as
editable defaults.

**Why this priority**: The plan is the input to every calculation.

**Independent Test**: Create a month, edit center + side panels, reload — persisted; create
another month — pre-filled, all editable; close a month — everything locks.

**Acceptance Scenarios**:

1. **Given** no open month, **When** I create one for the current calendar month, **Then** it
   becomes the single open month (keyed `YYYY-MM`).
2. **Given** an existing month, **When** I create a new month, **Then** item names and amounts
   copy as editable defaults; no balance/leftover/settlement carries (R11).
3. **Given** a closed month, **When** I try to edit it, **Then** it is locked (R9).

---

### User Story 3 - Live figures on the center column (Priority: P1)

As a partner, the center column always shows the current month's live numbers: transfers after
payday, guaranteed / planned / projected leftovers per person, plan-vs-actual spending.

**Why this priority**: This is the main "how are we doing" view; all numbers derive from plan +
expenses (R1–R8, R15–R16).

**Independent Test**: With a plan and expenses, figures match the money tests exactly;
projected line updates as actuals are entered; shares always sum to totals.

**Acceptance Scenarios**:

1. **Given** an open month, **When** I look at the center column, **Then** I see salaries,
   fixed/variable totals, per-person transfers (R4), leftovers (R5–R7), plan-vs-actual.
2. **Given** expenses entered, **When** actuals change, **Then** projected leftover (R7)
   updates immediately.

---

### User Story 4 - Spending log (Priority: P2)

As a partner, I log expenses in the center column with date, description, amount, optional
link to a planned variable item, optional payer; I see plan vs actual per item plus the
unplanned total.

**Why this priority**: Actuals drive projections and the close summary.

**Independent Test**: Add/edit/delete expenses; linked vs unplanned totals correct; validation
rejects amount ≤ 0, dates outside the month; payer-tagged expenses feed settle-up.

**Acceptance Scenarios**:

1. **Given** an open month, **When** I add an expense with a payer, **Then** it counts in
   `fronted(P)` for settle-up (R8).
2. **Given** an expense without payer, **Then** it is pot-paid: counted in `actualSpent` (R7),
   not in settle-up.
3. **Given** planned variable items, **When** I link expenses, **Then** plan vs actual per item
   and the unplanned total show.

---

### User Story 5 - Month close (Priority: P2)

As a partner, I close the month from the header; a summary panel shows contributions vs
actually paid, leftovers, pot balance, the settle-up line (only if any payer is set), and the
personal-support section; the month locks and is frozen into History.

**Why this priority**: Closing is the settlement moment of the app.

**Independent Test**: Close with and without payer-tagged expenses; verify settle sums to zero,
lock, and the frozen snapshot in History.

**Acceptance Scenarios**:

1. **Given** an open month, **When** I confirm close, **Then** plan and expenses lock (R9),
   the summary shows, and a frozen snapshot is stored for History (display-only, R16).
2. **Given** payer-tagged expenses, **When** closed, **Then** the one-line settle-up shows who
   owes whom, summing to zero (R8).
3. **Given** no payer-tagged expenses, **Then** no settle-up line; pot balance returned by
   share.
4. **Given** personal items with partnerShare%, **When** closed, **Then** the "personal support"
   section lists each shared item and contribution in money (R12/R13).

---

### User Story 6 - Settings panel and per-profile themes (Priority: P2)

As a partner, I open the Settings panel and set profile names, each profile's theme (accent,
background, surface, text colors + light/dark), currency (ISO code), expense categories, and
UI language — applied immediately.

**Why this priority**: Theming and language are core UX promises (3.4, G4); theme is highly
configurable per partner, not a single seed color.

**Independent Test**: Change a profile's theme colors/mode — only that profile's styles change,
layout identical; switch language — all strings switch; set currency — amounts reformat via
Intl.

**Acceptance Scenarios**:

1. **Given** Settings open, **When** I edit Partner A's theme, **Then** CSS custom properties
   update for Partner A only; layout and information identical (styles only).
2. **Given** the language switch, **When** I change language, **Then** all UI text switches
   (English default).
3. **Given** a currency code, **When** amounts render, **Then** `Intl.NumberFormat`, 2 fraction
   digits, that currency.

---

### User Story 7 - Leftover log panel (Priority: P3)

After closing, each of us logs leftover entries (amount, category, note) in the Leftover log
panel — editable only for the most recently closed month.

**Independent Test**: Close a month, add entries per profile; close another — older month's
log becomes read-only.

**Acceptance Scenarios**:

1. **Given** the most recently closed month, **When** I open the Leftover log panel, **Then** I
   can add/edit entries per profile.
2. **Given** a newer closed month exists, **When** I view an older month in History, **Then**
   its leftover log is read-only.

---

### User Story 8 - History panel (Priority: P3)

As a partner, I open the History panel: closed months newest first, read-only (frozen summary,
plan, expenses, leftover log).

**Independent Test**: Close two months; History lists both newest first, all read-only.

**Acceptance Scenarios**:

1. **Given** closed months, **When** I open History, **Then** they are listed newest first,
   fully read-only.

### Edge Cases

- Salaries of 0 or empty → shares defined as 0 (no division by zero).
- Edits on a closed month → rejected (locked, R9), except leftover log of the latest closed
  month.
- Creating a month for an existing `YYYY-MM` → rejected; two open months → rejected (R10).
- `partnerShare%` outside [0,100], expense amount ≤ 0 or non-integer cents, expense date
  outside the month → rejected.
- Closing with no expenses → no settle-up line (R8); pot balance = planned variable.
- Rounding: odd totals still split exactly (R15 remainder rule).
- First visit with no profiles configured → generic "Partner A"/"Partner B" defaults exist.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST be a single screen (one page): header bar, center column with main
  functions, left/right mirrored side panels with each partner's personal obligatory list;
  Settings / History / Leftover log / close-summary open as panels on the same page.
- **FR-002**: System MUST store exactly two profiles with generic defaults "Partner A" /
  "Partner B"; real names and all personal data live only in the runtime database (A2/A6).
- **FR-003**: Every field MUST be fillable and editable by either profile at any time while
  the month is open; the header profile only prefills forms and applies the theme.
- **FR-004**: Profile selection MUST be remembered per browser (localStorage) with a header
  switch control; first visit asks which profile you are.
- **FR-005**: System MUST key months by calendar `YYYY-MM`; current month = today's month; at
  most one open month; closing does not create the next (R10).
- **FR-006**: Creating a month MUST pre-fill item names and amounts from the most recent month
  as editable defaults; nothing else carries (R11).
- **FR-007**: System MUST implement money rules R1–R16 as pure functions over integer cents,
  with the remainder rule so splits sum exactly (R15).
- **FR-008**: System MUST implement the pot model of R8: pot-paid vs payer-fronted expenses,
  settle-up only when a payer exists, settle values summing to zero.
- **FR-009**: System MUST enforce validation: amount > 0 integer cents, expense date within
  month, `partnerShare%` ∈ [0,100], unique month key, one open month.
- **FR-010**: Closing a month MUST lock plan and expenses (R9) and store a frozen summary
  snapshot used only for History display (R16).
- **FR-011**: The leftover log MUST be editable only on the most recently closed month; older
  months read-only.
- **FR-012**: All derived numbers MUST be computed from raw inputs on every calculation; only
  frozen snapshots/display caches may be persisted (R16).
- **FR-013**: Settings MUST include profile names, per-profile theme (accent, background,
  surface, text colors + light/dark), ISO 4217 currency code, editable expense categories, UI
  language.
- **FR-014**: Per-profile theming MUST be CSS custom properties set from Settings; layout and
  information identical for both profiles (styles only, never layout).
- **FR-015**: UI MUST be English by default with a working language switch; numbers/dates via
  Intl (G4).
- **FR-016**: Frontend MUST follow Modern Web Guidance (semantic HTML, modern CSS, native
  platform, a11y + performance); no UI component library, no legacy patterns (G1).
- **FR-017**: UI MUST follow the G6 art direction: no AI-generated clichés (ban list in
  app-spec G6); locked design tokens, distinctive font pairing, contrast-checked, reduced-motion
  respected.
- **FR-018**: Server MUST be zero-dependency Node.js 22+ (`node:http`, `node:sqlite`),
  single-file SQLite at `HONEYPOT_DB_PATH`; no auth in the app (P7).
- **FR-019**: The SQLite file MUST never be committed (volume outside repo + gitignore, A6).

### Key Entities *(include if feature involves data)*

- **Profile**: two per installation; name; theme (accent/background/surface/text colors +
  light/dark mode). Runtime-only personal data.
- **Settings**: currency code, language, expense categories (editable list).
- **Month**: `YYYY-MM` key (unique), status open/closed, frozen summary snapshot (closed only,
  display-only).
- **PlanItem**: month, kind fixed / variable / personal, label, amount in integer cents,
  `partnerShare%` (personal items), owner profile (personal items).
- **Expense**: month, date (within month), description, amount in integer cents, optional link
  to a planned variable item, optional payer profile.
- **LeftoverEntry**: month + profile, amount in cents, category, free note.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Property tests prove the money invariants on randomized inputs: shares sum
  exactly, settle-up sums to zero, planned = guaranteed − variable share, closing a month
  changes nothing in other months.
- **SC-002**: Both partners can complete a full month cycle (plan → spend → close → leftover
  log) on the single screen without errors; panels open/close on the same page.
- **SC-003**: All money displayed with the configured currency via Intl, 2 fraction digits;
  integer-cent storage verified in the DB.
- **SC-004**: Theme configurator changes styles per profile immediately with identical layout;
  language switch works; a11y basics pass per Modern Web Guidance.
- **SC-005**: G6 art-direction checklist (ban list) passes in review — no AI-slop tells.
- **SC-006**: No personal data in the repo: grep finds no real names/amounts (A1–A6); DB file
  gitignored.

## Assumptions

- Exactly two users on a trusted LAN; no auth in the app (P7) — accepted by design.
- Node.js 22+ runtime (Docker `node:22-alpine`); `node:sqlite` available (experimental flag
  if required by the runtime version).
- Single currency per installation (ISO 4217 code in settings).
- Deployment (Portainer stack, nginx proxy, DNS, VPN) is configured by the owners after a
  working build; only the compose contents are part of this repo.
- The React prototype shared during planning is a sketch only; it is not part of the repo and
  the build follows the app document + Modern Web Guidance instead.
