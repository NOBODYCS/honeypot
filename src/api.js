import { computeSummary } from './money.js';
import { THEME_PRESETS } from './db.js';

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const LANGUAGES = ['en', 'pl'];

function getSettings(db) {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    currencyCode: map.currency_code ?? 'EUR',
    language: map.language ?? 'en',
    categories: JSON.parse(map.categories ?? '[]'),
  };
}

function getProfiles(db) {
  return db
    .prepare('SELECT id, name, theme_json FROM profiles ORDER BY id')
    .all()
    .map((r) => {
      const theme = JSON.parse(r.theme_json);
      if (!THEME_PRESETS.includes(theme.preset)) theme.preset = THEME_PRESETS[0];
      if (!['light', 'dark'].includes(theme.mode)) theme.mode = 'light';
      return { id: r.id, name: r.name, theme };
    });
}

function currentYm() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthByYm(db, ym) {
  return db.prepare('SELECT * FROM months WHERE ym = ?').get(ym);
}

function requireMonth(db, ym) {
  const month = getMonthByYm(db, ym);
  if (!month) throw new ApiError(404, `month ${ym} not found`);
  return month;
}

function requireOpenMonth(db, ym) {
  const month = requireMonth(db, ym);
  if (month.status !== 'open') throw new ApiError(409, `month ${ym} is closed`, 'month_closed');
  return month;
}

function monthPlanItems(db, monthId) {
  return db
    .prepare(
      'SELECT id, kind, label, amount_cents, owner_profile_id, partner_share_pct FROM plan_items WHERE month_id = ? ORDER BY id'
    )
    .all(monthId)
    .map((r) => ({
      id: r.id,
      kind: r.kind,
      label: r.label,
      amountCents: r.amount_cents,
      ownerProfileId: r.owner_profile_id,
      partnerSharePct: r.partner_share_pct,
    }));
}

function monthExpenses(db, monthId) {
  return db
    .prepare(
      'SELECT id, date, category, description, amount_cents, plan_item_id, payer_profile_id FROM expenses WHERE month_id = ? ORDER BY date, id'
    )
    .all(monthId)
    .map((r) => ({
      id: r.id,
      date: r.date,
      category: r.category ?? '',
      description: r.description,
      amountCents: r.amount_cents,
      planItemId: r.plan_item_id,
      payerProfileId: r.payer_profile_id,
    }));
}

function monthLeftovers(db, monthId) {
  return db
    .prepare(
      'SELECT id, profile_id, amount_cents, category, note FROM leftover_entries WHERE month_id = ? ORDER BY id'
    )
    .all(monthId)
    .map((r) => ({
      id: r.id,
      profileId: r.profile_id,
      amountCents: r.amount_cents,
      category: r.category,
      note: r.note,
    }));
}

function monthSalaries(db, ym) {
  const rows = db
    .prepare('SELECT key, value FROM settings WHERE key LIKE ?')
    .all(`salary_${ym}_%`);
  const salaries = {};
  for (const row of rows) {
    salaries[row.key.split('_').pop()] = Number(row.value);
  }
  return salaries;
}

function liveSummary(db, month) {
  const items = monthPlanItems(db, month.id);
  const expenses = monthExpenses(db, month.id);
  const salaries = monthSalaries(db, month.ym);
  return computeSummary({
    salaryA: salaries['1'] ?? 0,
    salaryB: salaries['2'] ?? 0,
    items,
    expenses,
  });
}

function monthPayload(db, month) {
  return {
    ym: month.ym,
    status: month.status,
    closedAt: month.closed_at,
    salaries: monthSalaries(db, month.ym),
    items: monthPlanItems(db, month.id),
    expenses: monthExpenses(db, month.id),
    summary: liveSummary(db, month),
  };
}

function validateTheme(theme) {
  if (typeof theme !== 'object' || theme === null) {
    throw new ApiError(400, 'theme must be an object');
  }
  if (theme.preset !== undefined && !THEME_PRESETS.includes(theme.preset)) {
    throw new ApiError(400, `theme.preset must be one of: ${THEME_PRESETS.join(', ')}`);
  }
  const colorRe = /^#[0-9a-fA-F]{6}$/;
  for (const key of ['accent', 'background', 'surface', 'text']) {
    if (theme[key] !== undefined && !colorRe.test(theme[key])) {
      throw new ApiError(400, `theme.${key} must be a #rrggbb color`);
    }
  }
  if (theme.mode !== undefined && !['light', 'dark'].includes(theme.mode)) {
    throw new ApiError(400, 'theme.mode must be "light" or "dark"');
  }
}

function mostRecentClosedYm(db) {
  const row = db
    .prepare("SELECT ym FROM months WHERE status = 'closed' ORDER BY ym DESC LIMIT 1")
    .get();
  return row ? row.ym : null;
}

const YM_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function validateCents(value, { min = 0 } = {}) {
  if (!Number.isInteger(value) || value < min) {
    throw new ApiError(400, `amount must be integer cents >= ${min}`, 'invalid');
  }
}

function validatePlanItem(item) {
  if (!['fixed', 'variable', 'personal'].includes(item.kind)) {
    throw new ApiError(400, 'item.kind must be fixed, variable or personal');
  }
  if (typeof item.label !== 'string' || !item.label.trim()) {
    throw new ApiError(400, 'item.label must be a non-empty string', 'invalid');
  }
  validateCents(item.amountCents);
  if (item.id != null && !Number.isInteger(item.id)) {
    throw new ApiError(400, 'item.id must be an integer when present', 'invalid');
  }
  const pct = item.partnerSharePct ?? -1;
  if (!Number.isInteger(pct) || pct < -1 || pct > 100) {
    throw new ApiError(400, 'partnerSharePct must be an integer in [-1,100] (-1 = salary split)', 'invalid');
  }
  if (item.kind === 'personal' && ![1, 2].includes(item.ownerProfileId)) {
    throw new ApiError(400, 'personal items need ownerProfileId 1 or 2', 'invalid');
  }
}

function putSalaries(db, ym, salaries) {
  const put = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  for (const [pid, cents] of Object.entries(salaries ?? {})) {
    if (![1, 2].includes(Number(pid))) {
      throw new ApiError(400, 'salary profile ids must be 1 or 2');
    }
    validateCents(Number(cents));
    put.run(`salary_${ym}_${pid}`, String(Number(cents)));
  }
}

export function createApi(db) {
  const routes = [];

  function route(method, pattern, handler) {
    const names = [];
    const regex = new RegExp(
      '^' +
        pattern
          .split('/')
          .map((seg) => {
            if (seg.startsWith(':')) {
              names.push(seg.slice(1));
              return '([^/]+)';
            }
            return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          })
          .join('/') +
        '$'
    );
    routes.push({ method, regex, names, handler });
  }

  route('GET', '/api/state', () => {
    const open = db.prepare("SELECT * FROM months WHERE status = 'open'").get();
    return {
      profiles: getProfiles(db),
      settings: getSettings(db),
      currentYm: currentYm(),
      openMonth: open ? { ym: open.ym, status: open.status } : null,
      mostRecentClosedYm: mostRecentClosedYm(db),
    };
  });

  route('PUT', '/api/settings', (m, body) => {
    const current = getSettings(db);
    const next = {
      currencyCode: body.currencyCode ?? current.currencyCode,
      language: body.language ?? current.language,
      categories: body.categories ?? current.categories,
    };
    if (body.currencyCode !== undefined && !/^[A-Z]{3}$/.test(body.currencyCode)) {
      throw new ApiError(400, 'currencyCode must be a 3-letter ISO 4217 code', 'invalid');
    }
    if (body.language !== undefined && !LANGUAGES.includes(body.language)) {
      throw new ApiError(400, `language must be one of ${LANGUAGES.join(', ')}`, 'invalid');
    }
    let categories = body.categories ?? current.categories;
    if (!Array.isArray(categories) || categories.some((c) => typeof c !== 'string')) {
      throw new ApiError(400, 'categories must be an array of non-empty strings', 'invalid');
    }
    const seenCats = new Set();
    next.categories = categories
      .map((c) => c.trim())
      .filter(Boolean)
      .filter((c) => {
        const k = c.toLowerCase();
        if (seenCats.has(k)) return false;
        seenCats.add(k);
        return true;
      });
    const put = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    put.run('currency_code', next.currencyCode);
    put.run('language', next.language);
    put.run('categories', JSON.stringify(next.categories));
    return getSettings(db);
  });

  route('PUT', '/api/profiles/:id', (m, body) => {
    const id = Number(m.id);
    const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
    if (!profile) throw new ApiError(404, 'profile not found');
    const name = body.name ?? profile.name;
    if (typeof name !== 'string' || !name.trim()) {
      throw new ApiError(400, 'name must be a non-empty string');
    }
    const theme = body.theme !== undefined ? body.theme : JSON.parse(profile.theme_json);
    validateTheme(theme);
    const merged = { ...JSON.parse(profile.theme_json), ...theme };
    db.prepare('UPDATE profiles SET name = ?, theme_json = ? WHERE id = ?').run(
      name.trim(),
      JSON.stringify(merged),
      id
    );
    return { id, name: name.trim(), theme: merged };
  });

  route('GET', '/api/months', () => ({
    months: db
      .prepare('SELECT ym, status FROM months ORDER BY ym DESC')
      .all()
      .map((r) => ({ ym: r.ym, status: r.status })),
  }));

  route('POST', '/api/months', (m, body) => {
    const ym = body.ym;
    if (!YM_RE.test(ym ?? '')) {
      throw new ApiError(400, 'ym must be a YYYY-MM calendar month key', 'invalid');
    }
    if (getMonthByYm(db, ym)) {
      throw new ApiError(409, `month ${ym} already exists`, 'month_exists');
    }
    const open = db.prepare("SELECT ym FROM months WHERE status = 'open'").get();
    if (open) {
      throw new ApiError(409, `month ${open.ym} is still open`, 'month_open');
    }
    const source = db
      .prepare('SELECT * FROM months ORDER BY ym DESC LIMIT 1')
      .get();
    const insert = db.prepare('INSERT INTO months (ym, status) VALUES (?, ?)');
    insert.run(ym, 'open');
    const month = getMonthByYm(db, ym);
    if (source) {
      const copy = db.prepare(
        'INSERT INTO plan_items (month_id, kind, label, amount_cents, owner_profile_id, partner_share_pct) VALUES (?, ?, ?, ?, ?, ?)'
      );
      for (const item of monthPlanItems(db, source.id)) {
        copy.run(month.id, item.kind, item.label, item.amountCents, item.ownerProfileId, item.partnerSharePct);
      }
      for (const [pid, cents] of Object.entries(monthSalaries(db, source.ym))) {
        putSalaries(db, ym, { [pid]: cents });
      }
    }
    return monthPayload(db, month);
  });

  route('GET', '/api/months/:ym', (m) => {
    const month = requireMonth(db, m.ym);
    return monthPayload(db, month);
  });

  route('PUT', '/api/months/:ym/plan', (m, body) => {
    const month = requireOpenMonth(db, m.ym);
    const salaries = body.salaries ?? {};
    const items = body.items ?? [];
    if (!Array.isArray(items)) {
      throw new ApiError(400, 'items must be an array', 'invalid');
    }
    for (const item of items) validatePlanItem(item);
    putSalaries(db, month.ym, salaries);
    const existing = monthPlanItems(db, month.id);
    const existingIds = new Set(existing.map((r) => r.id));
    /* Upsert by id so expenses.plan_item_id FKs survive plan edits; removed items
       orphan their expenses (plan_item_id = NULL) instead of failing the FK. */
    db.exec('BEGIN');
    try {
      const keep = new Set();
      const upsert = db.prepare(
        'UPDATE plan_items SET kind = ?, label = ?, amount_cents = ?, owner_profile_id = ?, partner_share_pct = ? WHERE id = ? AND month_id = ?'
      );
      const insert = db.prepare(
        'INSERT INTO plan_items (month_id, kind, label, amount_cents, owner_profile_id, partner_share_pct) VALUES (?, ?, ?, ?, ?, ?)'
      );
      for (const item of items) {
        const pid = Number.isInteger(item.id) && existingIds.has(item.id) ? item.id : null;
        if (pid) {
          upsert.run(item.kind, item.label.trim(), item.amountCents, item.kind === 'personal' ? item.ownerProfileId : null, item.partnerSharePct ?? -1, pid, month.id);
          keep.add(pid);
        } else {
          insert.run(month.id, item.kind, item.label.trim(), item.amountCents, item.kind === 'personal' ? item.ownerProfileId : null, item.partnerSharePct ?? -1);
        }
      }
      const orphan = db.prepare('UPDATE expenses SET plan_item_id = NULL WHERE plan_item_id = ?');
      const del = db.prepare('DELETE FROM plan_items WHERE id = ? AND month_id = ?');
      for (const old of existing) {
        if (!keep.has(old.id)) {
          orphan.run(old.id);
          del.run(old.id, month.id);
        }
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    return monthPayload(db, month);
  });

  route('GET', '/api/months/:ym/summary', (m) => {
    const month = requireMonth(db, m.ym);
    return liveSummary(db, month);
  });

  route('GET', '/api/months/:ym/history', (m) => {
    const month = requireMonth(db, m.ym);
    if (month.status !== 'closed') {
      throw new ApiError(409, 'history is available for closed months only', 'history_closed_only');
    }
    return {
      ym: month.ym,
      closedAt: month.closed_at,
      snapshot: JSON.parse(month.summary_json ?? 'null'),
      items: monthPlanItems(db, month.id),
      expenses: monthExpenses(db, month.id),
      leftovers: monthLeftovers(db, month.id),
    };
  });

  function validateExpenseBody(db, month, body) {
    validateCents(body.amountCents, { min: 1 });
    if (typeof body.description !== 'string' || !body.description.trim()) {
      throw new ApiError(400, 'description must be a non-empty string', 'invalid');
    }
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRe.test(body.date ?? '') && body.date.startsWith(month.ym)) {
      const day = Number(body.date.slice(-2));
      const [yr, mo] = month.ym.split('-').map(Number);
      const lastDay = new Date(Date.UTC(yr, mo, 0)).getUTCDate();
      if (day < 1 || day > lastDay) {
        throw new ApiError(400, 'expense date must be a real day within the month', 'invalid');
      }
    } else {
      throw new ApiError(400, 'expense date must be within the month', 'invalid');
    }
    let planItemId = null;
    if (body.planItemId != null) {
      const item = db.prepare('SELECT * FROM plan_items WHERE id = ?').get(body.planItemId);
      if (!item || item.month_id !== month.id || item.kind !== 'variable') {
        throw new ApiError(400, 'planItemId must be a variable item of this month', 'invalid');
      }
      planItemId = item.id;
    }
    if (body.payerProfileId != null && ![1, 2].includes(body.payerProfileId)) {
      throw new ApiError(400, 'payerProfileId must be 1 or 2', 'invalid');
    }
    if (body.category != null && (typeof body.category !== 'string' || body.category.trim().length > 60)) {
      throw new ApiError(400, 'category must be a string of at most 60 characters', 'invalid');
    }
    return {
      date: body.date,
      category: typeof body.category === 'string' ? body.category.trim() : '',
      description: body.description.trim(),
      amountCents: body.amountCents,
      planItemId,
      payerProfileId: body.payerProfileId ?? null,
    };
  }

  route('POST', '/api/months/:ym/expenses', (m, body) => {
    const month = requireOpenMonth(db, m.ym);
    const v = validateExpenseBody(db, month, body);
    db.prepare(
      'INSERT INTO expenses (month_id, date, category, description, amount_cents, plan_item_id, payer_profile_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(month.id, v.date, v.category, v.description, v.amountCents, v.planItemId, v.payerProfileId);
    return monthPayload(db, month);
  });

  route('PUT', '/api/expenses/:id', (m, body) => {
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(Number(m.id));
    if (!expense) throw new ApiError(404, 'expense not found');
    const month = db.prepare('SELECT * FROM months WHERE id = ?').get(expense.month_id);
    requireOpenMonth(db, month.ym);
    const v = validateExpenseBody(db, month, body);
    db.prepare(
      'UPDATE expenses SET date = ?, category = ?, description = ?, amount_cents = ?, plan_item_id = ?, payer_profile_id = ? WHERE id = ?'
    ).run(v.date, v.category, v.description, v.amountCents, v.planItemId, v.payerProfileId, expense.id);
    return monthPayload(db, month);
  });

  route('DELETE', '/api/expenses/:id', (m) => {
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(Number(m.id));
    if (!expense) throw new ApiError(404, 'expense not found');
    const month = db.prepare('SELECT * FROM months WHERE id = ?').get(expense.month_id);
    requireOpenMonth(db, month.ym);
    db.prepare('DELETE FROM expenses WHERE id = ?').run(expense.id);
    return monthPayload(db, month);
  });

  route('POST', '/api/months/:ym/leftovers', (m, body) => {
    const month = requireMonth(db, m.ym);
    if (month.status !== 'closed') {
      throw new ApiError(409, 'leftover log is for closed months', 'not_closed');
    }
    if (mostRecentClosedYm(db) !== month.ym) {
      throw new ApiError(409, 'only the most recently closed month is editable', 'not_most_recent');
    }
    if (![1, 2].includes(body.profileId)) {
      throw new ApiError(400, 'profileId must be 1 or 2', 'invalid');
    }
    validateCents(body.amountCents, { min: 1 });
    if (typeof body.category !== 'string' || !body.category.trim()) {
      throw new ApiError(400, 'category must be a non-empty string', 'invalid');
    }
    db.prepare(
      'INSERT INTO leftover_entries (month_id, profile_id, amount_cents, category, note) VALUES (?, ?, ?, ?, ?)'
    ).run(month.id, body.profileId, body.amountCents, body.category.trim(), body.note ?? '');
    return { leftovers: monthLeftovers(db, month.id) };
  });

  route('DELETE', '/api/leftovers/:id', (m) => {
    const entry = db.prepare('SELECT * FROM leftover_entries WHERE id = ?').get(Number(m.id));
    if (!entry) throw new ApiError(404, 'leftover entry not found');
    const month = db.prepare('SELECT * FROM months WHERE id = ?').get(entry.month_id);
    if (mostRecentClosedYm(db) !== month.ym) {
      throw new ApiError(409, 'only the most recently closed month is editable', 'not_most_recent');
    }
    db.prepare('DELETE FROM leftover_entries WHERE id = ?').run(entry.id);
    return { leftovers: monthLeftovers(db, month.id) };
  });

  route('POST', '/api/months/:ym/close', (m) => {
    const month = requireOpenMonth(db, m.ym);
    const summary = liveSummary(db, month);
    db.prepare(
      "UPDATE months SET status = 'closed', closed_at = ?, summary_json = ? WHERE id = ?"
    ).run(new Date().toISOString(), JSON.stringify(summary), month.id);
    return monthPayload(db, getMonthByYm(db, month.ym));
  });

  async function handle(method, pathname, body) {
    for (const r of routes) {
      if (r.method !== method) continue;
      const match = r.regex.exec(pathname);
      if (!match) continue;
      const params = {};
      r.names.forEach((n, i) => {
        params[n] = decodeURIComponent(match[i + 1]);
      });
      return { status: 200, body: await r.handler(params, body ?? {}) };
    }
    throw new ApiError(404, `no route for ${method} ${pathname}`);
  }

  return { handle };
}
