import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, ensureSeeded } from '../src/db.js';
import { createApi, ApiError } from '../src/api.js';

let db;
let api;

beforeEach(() => {
  db = openDb(':memory:');
  ensureSeeded(db);
  api = createApi(db);
});

async function call(method, path, body) {
  return api.handle(method, path, body);
}

test('GET /api/state returns seeded profiles, settings, current month', async () => {
  const { body } = await call('GET', '/api/state');
  assert.equal(body.profiles.length, 2);
  assert.equal(body.profiles[0].name, 'Partner A');
  assert.equal(body.profiles[1].name, 'Partner B');
  assert.equal(body.settings.currencyCode, 'EUR');
  assert.equal(body.settings.language, 'en');
  assert.ok(Array.isArray(body.settings.categories));
  assert.match(body.currentYm, /^\d{4}-\d{2}$/);
  assert.equal(body.openMonth, null);
  assert.ok(body.profiles[0].theme.accent);
});

test('PUT /api/settings updates currency, language, categories', async () => {
  const { body } = await call('PUT', '/api/settings', {
    currencyCode: 'USD',
    language: 'de',
    categories: ['Alpha', 'Beta'],
  });
  assert.equal(body.currencyCode, 'USD');
  assert.equal(body.language, 'de');
  assert.deepEqual(body.categories, ['Alpha', 'Beta']);
  const state = await call('GET', '/api/state');
  assert.equal(state.body.settings.currencyCode, 'USD');
});

test('PUT /api/settings rejects invalid values', async () => {
  await assert.rejects(
    () => call('PUT', '/api/settings', { currencyCode: 'EURO' }),
    (e) => e instanceof ApiError && e.status === 400
  );
  await assert.rejects(
    () => call('PUT', '/api/settings', { language: 'xx' }),
    (e) => e instanceof ApiError && e.status === 400
  );
  await assert.rejects(
    () => call('PUT', '/api/settings', { categories: 'nope' }),
    (e) => e instanceof ApiError && e.status === 400
  );
});

test('PUT /api/profiles/:id updates name and merges theme', async () => {
  const { body } = await call('PUT', '/api/profiles/1', {
    name: 'Profile one',
    theme: { accent: '#123456', mode: 'dark' },
  });
  assert.equal(body.name, 'Profile one');
  assert.equal(body.theme.accent, '#123456');
  assert.equal(body.theme.mode, 'dark');
  assert.equal(body.theme.background, body.theme.background);
  const state = await call('GET', '/api/state');
  assert.equal(state.body.profiles[0].name, 'Profile one');
});

test('PUT /api/profiles/:id rejects bad input', async () => {
  await assert.rejects(
    () => call('PUT', '/api/profiles/99', { name: 'X' }),
    (e) => e instanceof ApiError && e.status === 404
  );
  await assert.rejects(
    () => call('PUT', '/api/profiles/1', { name: '  ' }),
    (e) => e instanceof ApiError && e.status === 400
  );
  await assert.rejects(
    () => call('PUT', '/api/profiles/1', { theme: { accent: 'red' } }),
    (e) => e instanceof ApiError && e.status === 400
  );
});

test('unknown route returns 404 ApiError', async () => {
  await assert.rejects(
    () => call('GET', '/api/nope'),
    (e) => e instanceof ApiError && e.status === 404
  );
});

test('US2: month create, prefill, plan update, lock', async () => {
  const created = await call('POST', '/api/months', { ym: '2026-01' });
  assert.equal(created.body.ym, '2026-01');
  assert.equal(created.body.status, 'open');

  await assert.rejects(
    () => call('POST', '/api/months', { ym: '2026-01' }),
    (e) => e instanceof ApiError && e.status === 409
  );
  await assert.rejects(
    () => call('POST', '/api/months', { ym: '2026-02' }),
    (e) => e instanceof ApiError && e.status === 409
  );
  await assert.rejects(
    () => call('POST', '/api/months', { ym: 'nope' }),
    (e) => e instanceof ApiError && e.status === 400
  );

  const plan = await call('PUT', '/api/months/2026-01/plan', {
    salaries: { 1: 250000, 2: 150000 },
    items: [
      { kind: 'fixed', label: 'Rent', amountCents: 90000 },
      { kind: 'variable', label: 'Groceries', amountCents: 40000 },
      { kind: 'personal', label: 'Phone', amountCents: 3000, ownerProfileId: 1, partnerSharePct: 0 },
      { kind: 'personal', label: 'Course', amountCents: 12000, ownerProfileId: 2, partnerSharePct: 50 },
    ],
  });
  assert.equal(plan.body.salaries['1'], 250000);
  assert.equal(plan.body.items.length, 4);
  assert.equal(plan.body.summary.combinedIncome, 400000);
  assert.equal(plan.body.summary.contributions.A + plan.body.summary.contributions.B, 130000);

  const state = await call('GET', '/api/state');
  assert.equal(state.body.openMonth.ym, '2026-01');

  const listed = await call('GET', '/api/months');
  assert.deepEqual(listed.body.months, [{ ym: '2026-01', status: 'open' }]);

  const fetched = await call('GET', '/api/months/2026-01');
  assert.equal(fetched.body.items[0].label, 'Rent');
  assert.equal(fetched.body.summary.sharedPlannedTotal, 130000);

  await assert.rejects(
    () => call('PUT', '/api/months/2026-01/plan', { salaries: {}, items: [{ kind: 'fixed', label: 'X', amountCents: -5 }] }),
    (e) => e instanceof ApiError && e.status === 400
  );
  await assert.rejects(
    () => call('PUT', '/api/months/2026-01/plan', { salaries: {}, items: [{ kind: 'personal', label: 'X', amountCents: 5, ownerProfileId: 1, partnerSharePct: 101 }] }),
    (e) => e instanceof ApiError && e.status === 400
  );
  await assert.rejects(
    () => call('PUT', '/api/months/2099-01/plan', { salaries: {}, items: [] }),
    (e) => e instanceof ApiError && e.status === 404
  );
});

test('US2: new month prefills editable defaults from most recent month', async () => {
  await call('POST', '/api/months', { ym: '2026-01' });
  await call('PUT', '/api/months/2026-01/plan', {
    salaries: { 1: 200000, 2: 100000 },
    items: [
      { kind: 'fixed', label: 'Rent', amountCents: 80000 },
      { kind: 'variable', label: 'Groceries', amountCents: 30000 },
      { kind: 'personal', label: 'Phone', amountCents: 2500, ownerProfileId: 1, partnerSharePct: 25 },
    ],
  });
  await call('POST', '/api/months/2026-01/close');

  const next = await call('POST', '/api/months', { ym: '2026-02' });
  assert.equal(next.body.status, 'open');
  assert.equal(next.body.items.length, 3);
  assert.deepEqual(
    next.body.items.map((i) => [i.kind, i.label, i.amountCents]),
    [
      ['fixed', 'Rent', 80000],
      ['variable', 'Groceries', 30000],
      ['personal', 'Phone', 2500],
    ]
  );
  assert.equal(next.body.items[2].partnerSharePct, 25);
  assert.equal(next.body.salaries['1'], 200000);
  assert.equal(next.body.salaries['2'], 100000);
  assert.equal(next.body.summary.potBalance, 30000);
  assert.equal(next.body.expenses.length, 0);
});

test('US2: closed month plan is locked (409)', async () => {
  await call('POST', '/api/months', { ym: '2026-01' });
  await call('PUT', '/api/months/2026-01/plan', { salaries: { 1: 100000, 2: 100000 }, items: [] });
  await call('POST', '/api/months/2026-01/close');
  await assert.rejects(
    () => call('PUT', '/api/months/2026-01/plan', { salaries: {}, items: [] }),
    (e) => e instanceof ApiError && e.status === 409
  );
});
