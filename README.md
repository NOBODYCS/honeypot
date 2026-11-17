# Honeypot — a two-person shared budget planner

Honeypot is a small self-hosted web app for exactly two people who share a household and want
to split shared costs **proportionally to net salaries** instead of 50/50. (The name is a
deliberate red herring — this is not a security honeypot.)

One month at a time: plan at the start of the month, track spending during the month, close
the month with a summary and a settle-up line, then each person logs what they did with their
leftover money. Nothing rolls over — every month starts fresh.

## The money model

- Shared costs (fixed like rent/utilities + variable like groceries) are split by salary
  share: `share(P) = salary(P) / (salaryA + salaryB)`.
- After payday, each person transfers their calculated share into a shared pot; the pot pays
  all shared costs. If someone fronted a bill personally, they mark it as payer, and the close
  summary settles it — the "who owes whom" line always adds up exactly.
- Personal obligatory costs (installments, meds, therapy) stay personal — they only reduce
  their owner's leftover. Optionally, any personal item can say "partner chips in X%", shown as
  its own money line ("personal support") at close, never silently changing the split.
- Two leftover lines per person: **guaranteed** (salary − fixed share − personal costs) and
  **planned** (guaranteed − planned variable share), plus a **projected** line that updates as
  actual spending is logged.
- All amounts are integer cents; splits always sum exactly. Full rules: R1–R16 in
  `specs/001-honeypot-app/app-spec.md`.

## Features

- **One screen, everything on it:** header (profile switch, month, panels, close), a center
  column with the month plan, live figures, and the spending log, and mirrored side panels
  with each partner's name and personal obligatory list. Every field is editable by either
  partner at any time.
- Profile pick remembered per browser — a convenience, not a login (the app is LAN-only, no
  passwords, by design).
- Month close: contributions vs actually paid, leftovers, pot balance, settle-up line, and the
  personal-support breakdown; the month locks and appears in read-only History.
- Leftover log (most recently closed month), settings (names, themes, currency, categories,
  language).
- **Per-profile themes, highly configurable from Settings** (accent/background/surface/text
  colors + light/dark) via CSS custom properties — styles only, the layout is identical for
  both partners.
- English UI with a language switch; modern accessible frontend built per Google's Modern Web
  Guidance (see `.vibe/skills/modern-web-guidance`) with a deliberate, non-generic art direction.

## Quick start (Docker Compose, Portainer)

The app is a single container; the SQLite file lives on a volume, never in the repo:

```yaml
services:
  honeypot:
    image: honeypot:latest        # build from this repo
    restart: unless-stopped
    ports:
      - "8080:8080"                # your nginx reverse proxy points here; LAN only
    environment:
      HONEYPOT_DB_PATH: /data/honeypot.db
    volumes:
      - honeypot-data:/data
volumes:
  honeypot-data:
```

Point your reverse proxy (TLS, local DNS, VPN-only access) at the container — that part is
managed outside the app.

## Configuration

Runtime settings live in the database (created on first run): profile names, per-profile theme
colors and light/dark mode, ISO 4217 currency code, expense categories, UI language.
Environment: `HONEYPOT_DB_PATH` (default `/data/honeypot.db`), `PORT` (default `8080`).

## Development

Spec-driven (GitHub Spec Kit): constitution in `.specify/memory/constitution.md`, feature docs
in `specs/001-honeypot-app/` (app-spec, spec, research, data-model, contracts, quickstart,
plan, tasks). Zero-dependency Node.js 22+ (`node:http` + `node:sqlite`); run with
`node src/server.js`, test with `node --test tests/`.

## Screenshots

Added after the first working build, using generic demo data only (anonymization rule A4).

## License

MIT
