import { openDb, ensureSeeded } from './db.js';

const dbPath = process.env.HONEYPOT_DB_PATH || '/data/honeypot.db';
const db = openDb(dbPath);
ensureSeeded(db);
console.log(`Seeded database at ${dbPath}`);
db.close();
