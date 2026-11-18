# Quickstart: Honeypot app (specs/001-honeypot-app)

## Run locally

Requires Node.js 22+ (uses `node:http`, `node:sqlite`; add `--experimental-sqlite` if your
runtime needs the flag — see research.md R-10).

```bash
HONEYPOT_DB_PATH=./data/honeypot.db PORT=8080 node src/server.js
# open http://localhost:8080
```

## Test

```bash
node --test tests/
```

Money-rule property tests (tests/money.test.js) must pass before any UI work.

## Docker Compose (for Portainer — the agreed compose contents)

The app is one container; the SQLite file lives on a volume, never in the repo. Your nginx
reverse proxy (managed manually, TLS + local DNS + VPN-only) points at the published port.

```yaml
services:
  honeypot:
    image: ghcr.io/nobodycs/honeypot:latest   # published by CI from this repo; pin :sha-<commit> if you prefer
    restart: unless-stopped
    ports:
      - "8080:8080"                # nginx proxies to this; LAN only in practice
    environment:
      HONEYPOT_DB_PATH: /data/honeypot.db
      PORT: "8080"
    volumes:
      - honeypot-data:/data
volumes:
  honeypot-data:
```

The full host setup (Docker VM, Portainer stack, nginx, DNS, VPN) is done interactively by
the owners after a working build — out of app scope (app doc §7, §10.4).

## First run

Open the app → pick your profile (remembered per browser) → open the Settings panel to set
real profile names, per-profile theme colors + light/dark, currency code, categories, language
→ create the current month in the center column → plan → log spending → close → leftover log
panel.

## Anonymization reminder

Screenshots and docs use generic demo data only (A1–A5); the DB file is gitignored (A6).
