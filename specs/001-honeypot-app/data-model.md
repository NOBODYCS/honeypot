# Data Model: Honeypot app (specs/001-honeypot-app)

Single-file SQLite (`HONEYPOT_DB_PATH`, default `/data/honeypot.db`), WAL mode. All money is
**integer cents** (`*_cents INTEGER`, never floats — app doc R15). Derived values are never
stored as inputs; the only persisted derived data is `months.summary_json`, a frozen snapshot of
a closed month used solely for History display (app doc R16). Anonymization A1–A6: seeds use
generic names ("Partner A", "Partner B") and generic theme values only.

## Tables

### profiles
- `id INTEGER PRIMARY KEY`
- `name TEXT NOT NULL` — display name, set in Settings; defaults "Partner A" / "Partner B"
- `theme_json TEXT NOT NULL` — per-profile theme (app-spec 3.4): `{ accent, background,
  surface, text, mode: "light"|"dark" }`, edited in Settings; applied as CSS custom properties

Exactly two rows exist (enforced by app logic, not schema).

### settings
- `key TEXT PRIMARY KEY`
- `value TEXT NOT NULL`

Keys: `currency_code` (ISO 4217, e.g. "EUR"), `language` (e.g. "en"), `categories` (JSON array
of expense category strings).

### months
- `id INTEGER PRIMARY KEY`
- `ym TEXT NOT NULL UNIQUE` — calendar month key `YYYY-MM` (R10)
- `status TEXT NOT NULL CHECK (status IN ('open','closed'))` — R9
- `closed_at TEXT` — NULL while open
- `summary_json TEXT` — frozen close snapshot for History only; never read by calculations
  (R16)

At most one row with `status='open'` (enforced by app logic + a partial unique index).

### plan_items
- `id INTEGER PRIMARY KEY`
- `month_id INTEGER NOT NULL REFERENCES months(id)`
- `kind TEXT NOT NULL CHECK (kind IN ('fixed','variable','personal'))` — P4 / P3
- `label TEXT NOT NULL`
- `amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0)` — fixed/personal amounts;
  planned amount for variable
- `owner_profile_id INTEGER REFERENCES profiles(id)` — NULL for shared items, set for
  personal items
- `partner_share_pct INTEGER NOT NULL DEFAULT 0 CHECK (partner_share_pct BETWEEN 0 AND 100)`
  — personal items only (R12), default 0

### expenses
- `id INTEGER PRIMARY KEY`
- `month_id INTEGER NOT NULL REFERENCES months(id)`
- `date TEXT NOT NULL` — ISO date, validated to be within the month
- `description TEXT NOT NULL`
- `amount_cents INTEGER NOT NULL CHECK (amount_cents > 0)`
- `plan_item_id INTEGER REFERENCES plan_items(id)` — optional link; variable items only;
  fixed costs are never expense entries (R7)
- `payer_profile_id INTEGER REFERENCES profiles(id)` — NULL = split by share, each paid their own part; set = fronted personally (R8)

### leftover_entries
- `id INTEGER PRIMARY KEY`
- `month_id INTEGER NOT NULL REFERENCES months(id)` — only the most recently closed month is
  editable
- `profile_id INTEGER NOT NULL REFERENCES profiles(id)`
- `amount_cents INTEGER NOT NULL CHECK (amount_cents > 0)`
- `category TEXT NOT NULL` — from settings categories
- `note TEXT NOT NULL DEFAULT ''`

## Derived-on-read (never stored as inputs — R16)

Computed from the tables above on every request: `combinedIncome`, `share(P)`,
`sharedPlannedTotal`, `contribution(P)` (R1–R4), `leftAfterShared` /
`leftAfterPersonal` (R5–R6), `fronted(P)` / `settle(P)` (R8), `personalOut(P)`
(R12), plan-vs-actual per variable item and unplanned total.

## Invariants to test (property tests, tests/money.test.js)

- Shares sum exactly to the total; `contribution(A) + contribution(B) = sharedPlannedTotal`.
- `settle(A) + settle(B) = 0` whenever any payer-tagged expense exists.
- `leftAfterPersonal = leftAfterShared − personalOut`; `leftAfterShared = salary − fixedShare − share × actualSpent`.
- Closing a month changes nothing in any other month (R11).
- All stored amounts are integers ≥ 0 (expenses > 0).
