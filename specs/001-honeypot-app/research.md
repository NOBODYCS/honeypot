# Research: Honeypot app (specs/001-honeypot-app)

Decisions resolving the open points from the app document. Each entry: decision → rationale →
alternatives rejected.

## R-01 Server stack: zero-dependency Node.js 22+
- **Decision**: `node:http` for HTTP, `node:sqlite` for the database, `node:test` for tests.
  No npm packages.
- **Rationale**: constitution IX (simplicity) + no-dependencies rule; repo had no package
  manifest. Node 22 is the runtime baseline; `node:sqlite` gives a single-file DB with no
  native build.
- **Alternative rejected**: Express/FastAPI + better-sqlite3 — adds dependencies against the
  zero-dep principle.

## R-02 Money representation: integer cents
- **Decision**: all amounts are integer minor units; splits assign the remainder to one side
  (`contribution(B) = total − contribution(A)`); display via `Intl.NumberFormat` with the
  configured ISO 4217 code, 2 fraction digits.
- **Rationale**: floats cannot represent decimal cents exactly (0.1+0.2≠0.3); independent
  rounding of two shares can leave the total off by a cent. Integer cents + remainder rule
  makes every invariant exact and testable (app doc R15).

## R-03 Cash flow: shared-pot model
- **Decision**: after payday each person transfers `contribution(P)` (R4) into a virtual pot;
  the pot pays all shared costs; expenses without payer = pot-paid (split by share); expenses
  with payer = fronted personally; settle-up only over fronted expenses and always sums to
  zero; pot balance at close returned by share (app doc R8).
- **Rationale**: the stage-1 spec mixed a pot with per-expense payer settlement and could not
  record fixed costs as expenses, so settle-up could not sum to zero. The prototype confirmed
  the pot is the intended mental model.
- **Alternative rejected**: direct-payment-only model — loses the "transfer after payday" UX
  and the pot balance line.

## R-04 Months: calendar `YYYY-MM` keys
- **Decision**: months keyed by `YYYY-MM` (unique); current month = today's calendar month; at
  most one open at a time; new month pre-fills editable defaults from the most recent month.
- **Rationale**: simplest rule for "current month" (just the date); satisfies R10/R11.
- **Alternative rejected**: "latest open month" bookkeeping — extra state, same behavior.

## R-05 Derived data: compute from raw only
- **Decision**: all derived numbers are computed from raw inputs for calculations; persisted
  only as a frozen close snapshot (History display) or display cache (app doc R16).
- **Rationale**: owner-approved amendment; keeps month isolation structural while allowing
  snapshots.

## R-06 Frontend: native web platform, no component library
- **Decision**: static single-page semantic HTML + modern CSS + vanilla JS; theming via CSS
  custom properties configured per profile in Settings; i18n via a messages dictionary + `Intl`.
- **Rationale**: G1/G3/G4 and the installed Modern Web Guidance skill; the shared React/shadcn
  prototype is a sketch only and is not committed (hardcoded locale/currency and demo data
  violate A1–A3, and shadcn/Tailwind/Lucide are themselves AI-slop defaults per R-12).
- **Alternative rejected**: React + shadcn/Tailwind as in the prototype.

## R-07 Database: single SQLite file, WAL
- **Decision**: one file at `HONEYPOT_DB_PATH` (default `/data/honeypot.db`), WAL mode, on a
  Docker volume outside the repo, gitignored.
- **Rationale**: stage-2 guidance (single-file SQLite) + A6; trivially backable up with `cp`.

## R-08 API shape: small JSON API + static single page
- **Decision**: one process serves `public/` statically and a JSON API under `/api/*` (see
  `contracts/api.md`). No auth (P7).
- **Rationale**: simplest thing that covers the single-screen UI with two concurrent users.

## R-09 Deployment artifact
- **Decision**: repo ships only the compose contents (in `quickstart.md`) for a Portainer
  stack; the actual host setup (nginx reverse proxy, DNS, VPN) is done interactively by the
  owners after a working build.
- **Rationale**: owner instruction; keeps VPN/proxy out of app scope.

## R-10 node:sqlite availability
- **Decision**: use `node:sqlite`; if the runtime requires it, start with
  `--experimental-sqlite`. Verify in the first setup task; record the exact requirement in
  `plan.md` after T002.
- **Rationale**: avoid a native dependency; confirm empirically during implementation.

## R-11 Layout: one screen
- **Decision**: the entire app is a single page — header bar (profile switch, month selector,
  panels, close), center column with all main functions (plan, live figures, spending log,
  close summary), left/right mirrored side panels with each partner's name + personal
  obligatory list. Settings / History / Leftover log / close summary open as slide-over
  panels on the same page. Every field is editable by either profile while the month is open.
- **Rationale**: owner amendment 2026-11-17 (app-spec §4, 3.3) — personal expenses on the sides,
  everything else in the center, no multi-page navigation.
- **Alternative rejected**: the stage-1 multi-screen S1–S8 flow.

## R-12 Art direction: no "AI-generated" look (app-spec G6)
- **Decision**: locked design tokens in `public/styles.css` (named custom properties: base +
  1–2 accents), one distinctive display font paired with a body font (strong weight/size
  contrast), intentional borders/radii, WCAG/APCA contrast checks, `prefers-reduced-motion`
  respected, and the asymmetric-but-balanced one-screen layout from R-11.
- **Banned (the documented AI-slop tells)**: default fonts with no pairing (Inter / Roboto /
  Poppins / Geist / DM Sans everywhere), indigo/purple→blue gradients, gradient text, glow
  blobs, pill badges over centered headlines, rows of 3–4 identical icon-cards, glassmorphism,
  thin-gray-bordered cards with soft shadows, uniform 16px radii, emoji as icons, the
  shadcn/Tailwind/Lucide default kit, centered-everything layouts, scroll-animation spam,
  generic marketing copy.
- **Rationale**: owner instruction; research (2025–2026 design writing on "AI slop") shows these
  defaults are statistically over-represented in generated UI and instantly recognizable.
  Technical implementation still follows Modern Web Guidance (G1).
- **Alternative rejected**: accepting default styling from a UI kit.

## R-13 Theme: highly configurable per profile
- **Decision**: each profile stores a theme object (accent, background, surface, text colors +
  light/dark mode) in the DB, edited from the Settings panel; switching profiles sets the CSS
  custom properties on `:root`. Styles only — layout and information identical for both.
- **Rationale**: owner amendment (app-spec 3.4) — more than a single seed color.
- **Alternative rejected**: single seed color only.
