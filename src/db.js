import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  theme_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS months (
  id INTEGER PRIMARY KEY,
  ym TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('open','closed')),
  closed_at TEXT,
  summary_json TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_months_one_open
  ON months(status) WHERE status = 'open';

CREATE TABLE IF NOT EXISTS plan_items (
  id INTEGER PRIMARY KEY,
  month_id INTEGER NOT NULL REFERENCES months(id),
  kind TEXT NOT NULL CHECK (kind IN ('fixed','variable','personal')),
  label TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  owner_profile_id INTEGER REFERENCES profiles(id),
  partner_share_pct INTEGER NOT NULL DEFAULT -1
    CHECK (partner_share_pct BETWEEN -1 AND 100)
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY,
  month_id INTEGER NOT NULL REFERENCES months(id),
  date TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  plan_item_id INTEGER REFERENCES plan_items(id),
  payer_profile_id INTEGER REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS leftover_entries (
  id INTEGER PRIMARY KEY,
  month_id INTEGER NOT NULL REFERENCES months(id),
  profile_id INTEGER NOT NULL REFERENCES profiles(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  category TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT ''
);
`;

export const THEME_PRESETS = ['paper', 'ink', 'sunrise', 'berry', 'ocean', 'contrast'];

export const DEFAULT_THEMES = [
  { preset: 'paper', mode: 'light' },
  { preset: 'berry', mode: 'dark' },
];

export const DEFAULT_SETTINGS = {
  currency_code: 'EUR',
  language: 'en',
  categories: JSON.stringify(['Groceries', 'Eating out', 'Household', 'Transport', 'Other']),
};

export function openDb(dbPath) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  const cols = db.prepare('PRAGMA table_info(expenses)').all().map((c) => c.name);
  if (!cols.includes('category')) {
    db.exec("ALTER TABLE expenses ADD COLUMN category TEXT NOT NULL DEFAULT ''");
  }
  const planDdl = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='plan_items'").get();
  if (planDdl && planDdl.sql.includes('BETWEEN 0 AND 100')) {
    db.exec('PRAGMA foreign_keys = OFF;');
    db.exec(`CREATE TABLE plan_items_new (
      id INTEGER PRIMARY KEY,
      month_id INTEGER NOT NULL REFERENCES months(id),
      kind TEXT NOT NULL CHECK (kind IN ('fixed','variable','personal')),
      label TEXT NOT NULL,
      amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
      owner_profile_id INTEGER REFERENCES profiles(id),
      partner_share_pct INTEGER NOT NULL DEFAULT -1 CHECK (partner_share_pct BETWEEN -1 AND 100)
    );`);
    db.exec(`INSERT INTO plan_items_new SELECT id, month_id, kind, label, amount_cents, owner_profile_id, CASE WHEN partner_share_pct = 0 THEN -1 ELSE partner_share_pct END FROM plan_items;`);
    db.exec('DROP TABLE plan_items;');
    db.exec('ALTER TABLE plan_items_new RENAME TO plan_items;');
    db.exec('PRAGMA foreign_keys = ON;');
  }
  return db;
}

export function ensureSeeded(db) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM profiles').get().n;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO profiles (name, theme_json) VALUES (?, ?)');
    insert.run('Partner A', JSON.stringify(DEFAULT_THEMES[0]));
    insert.run('Partner B', JSON.stringify(DEFAULT_THEMES[1]));
  }
  const put = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING'
  );
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    put.run(key, value);
  }
}
