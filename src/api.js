import { computeSummary } from './money.js';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const LANGUAGES = ['en', 'de'];

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
    .map((r) => ({ id: r.id, name: r.name, theme: JSON.parse(r.theme_json) }));
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
  if (month.status !== 'open') throw new ApiError(409, `month ${ym} is closed`);
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
      'SELECT id, date, description, amount_cents, plan_item_id, payer_profile_id FROM expenses WHERE month_id = ? ORDER BY date, id'
    )
    .all(monthId)
    .map((r) => ({
      id: r.id,
      date: r.date,
      description: r.description,
      amountCents: r.amount_cents,
      planItemId: r.plan_item_id,
      payerProfileId: r.payer_profile_id,
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
    };
  });

  route('PUT', '/api/settings', (m, body) => {
    const current = getSettings(db);
    const next = {
      currencyCode: body.currencyCode ?? current.currencyCode,
      language: body.language ?? current.language,
      categories: body.categories ?? current.categories,
    };
    if (!/^[A-Z]{3}$/.test(next.currencyCode)) {
      throw new ApiError(400, 'currencyCode must be a 3-letter ISO 4217 code');
    }
    if (!LANGUAGES.includes(next.language)) {
      throw new ApiError(400, `language must be one of ${LANGUAGES.join(', ')}`);
    }
    if (
      !Array.isArray(next.categories) ||
      next.categories.some((c) => typeof c !== 'string' || !c.trim())
    ) {
      throw new ApiError(400, 'categories must be an array of non-empty strings');
    }
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
