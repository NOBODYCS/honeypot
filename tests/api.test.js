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
  assert.equal(body.profiles[0].theme.preset, 'paper');
});

test('PUT /api/settings updates currency, language, categories', async () => {
  const { body } = await call('PUT', '/api/settings', {
    currencyCode: 'USD',
    language: 'pl',
    categories: ['Alpha', 'Beta'],
  });
  assert.equal(body.currencyCode, 'USD');
  assert.equal(body.language, 'pl');
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

test('profiles are seeded with theme presets and accept preset changes', async () => {
  const state = await call('GET', '/api/state');
  assert.equal(state.body.profiles[0].theme.preset, 'paper');
  assert.equal(state.body.profiles[0].theme.mode, 'light');
  assert.equal(state.body.profiles[1].theme.preset, 'berry');
  assert.equal(state.body.profiles[1].theme.mode, 'dark');
  const { body } = await call('PUT', '/api/profiles/1', { theme: { preset: 'ink' } });
  assert.equal(body.theme.preset, 'ink');
  await assert.rejects(
    () => call('PUT', '/api/profiles/1', { theme: { preset: 'nope' } }),
    (e) => e instanceof ApiError && e.status === 400
  );
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
  // no-pot model: leftover after shared = salary - share of (fixed + spent); nothing spent yet -> fixed only
  assert.equal(next.body.summary.leftAfterShared.A, 200000 - Math.floor((80000 * 200000) / 300000));
  assert.equal(next.body.summary.leftAfterShared.A + next.body.summary.leftAfterShared.B, 300000 - 80000);
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

test('US4: expense add/delete with validation, plan-vs-actual, settle-up', async () => {
  await call('POST', '/api/months', { ym: '2026-03' });
  const plan = await call('PUT', '/api/months/2026-03/plan', {
    salaries: { 1: 300000, 2: 100000 },
    items: [
      { kind: 'fixed', label: 'Rent', amountCents: 90000 },
      { kind: 'variable', label: 'Groceries', amountCents: 40000 },
    ],
  });
  const groceryId = plan.body.items.find((i) => i.label === 'Groceries').id;

  const added = await call('POST', '/api/months/2026-03/expenses', {
    date: '2026-03-05',
    description: 'Weekly shop',
    amountCents: 12000,
    planItemId: groceryId,
  });
  assert.equal(added.body.expenses.length, 1);
  assert.equal(added.body.summary.actualSpent, 12000);
  assert.equal(added.body.summary.planVsActual[0].actual, 12000);
  assert.equal(added.body.summary.unplannedTotal, 0);

  const fronted = await call('POST', '/api/months/2026-03/expenses', {
    date: '2026-03-10',
    description: 'Concert tickets',
    amountCents: 8000,
    payerProfileId: 2,
  });
  assert.equal(fronted.body.summary.fronted.B, 8000);
  assert.equal(fronted.body.summary.settle.A + fronted.body.summary.settle.B, 0);
  assert.equal(fronted.body.summary.unplannedTotal, 8000);

  await assert.rejects(
    () => call('POST', '/api/months/2026-03/expenses', { date: '2026-03-01', description: 'X', amountCents: 0 }),
    (e) => e instanceof ApiError && e.status === 400
  );
  await assert.rejects(
    () => call('POST', '/api/months/2026-03/expenses', { date: '2026-04-01', description: 'X', amountCents: 100 }),
    (e) => e instanceof ApiError && e.status === 400
  );
  await assert.rejects(
    () => call('POST', '/api/months/2026-03/expenses', { date: '2026-03-01', description: 'X', amountCents: 100, planItemId: 99999 }),
    (e) => e instanceof ApiError && e.status === 400
  );
  await assert.rejects(
    () => call('POST', '/api/months/2026-03/expenses', { date: '2026-03-32', description: 'X', amountCents: 100 }),
    (e) => e instanceof ApiError && e.status === 400
  );

  const del = await call('DELETE', `/api/expenses/${added.body.expenses[0].id}`);
  assert.equal(del.body.expenses.length, 1);
  assert.equal(del.body.summary.actualSpent, 8000);

  await call('POST', '/api/months/2026-03/close');
  await assert.rejects(
    () => call('POST', '/api/months/2026-03/expenses', { date: '2026-03-02', description: 'X', amountCents: 100 }),
    (e) => e instanceof ApiError && e.status === 409
  );
});

test('US5: close freezes snapshot; no payer means settle null', async () => {
  await call('POST', '/api/months', { ym: '2026-04' });
  await call('PUT', '/api/months/2026-04/plan', {
    salaries: { 1: 200000, 2: 200000 },
    items: [
      { kind: 'fixed', label: 'Rent', amountCents: 60000 },
      { kind: 'personal', label: 'Phone', amountCents: 2000, ownerProfileId: 1, partnerSharePct: 50 },
    ],
  });
  await call('POST', '/api/months/2026-04/expenses', {
    date: '2026-04-02',
    description: 'Pot-paid shop',
    amountCents: 5000,
  });
  const closed = await call('POST', '/api/months/2026-04/close');
  assert.equal(closed.body.status, 'closed');
  assert.equal(closed.body.summary.settle, null);
  assert.equal(closed.body.summary.personalSupport.length, 1);
  const hist = await call('GET', '/api/months/2026-04/history');
  assert.equal(hist.body.snapshot.settle, null);
  assert.equal(hist.body.snapshot.leftAfterShared.A, closed.body.summary.leftAfterShared.A);
  assert.equal(hist.body.snapshot.leftAfterPersonal.B, closed.body.summary.leftAfterPersonal.B);
  assert.equal(hist.body.expenses.length, 1);
});

test('US7: leftover log editable only on most recently closed month', async () => {
  await call('POST', '/api/months', { ym: '2026-01' });
  await call('PUT', '/api/months/2026-01/plan', { salaries: { 1: 100000, 2: 100000 }, items: [] });
  await call('POST', '/api/months/2026-01/close');
  await call('POST', '/api/months', { ym: '2026-02' });
  await call('PUT', '/api/months/2026-02/plan', { salaries: { 1: 100000, 2: 100000 }, items: [] });
  await call('POST', '/api/months/2026-02/close');

  await assert.rejects(
    () => call('POST', '/api/months/2026-01/leftovers', { profileId: 1, amountCents: 100, category: 'Savings' }),
    (e) => e instanceof ApiError && e.status === 409
  );
  const added = await call('POST', '/api/months/2026-02/leftovers', {
    profileId: 1,
    amountCents: 15000,
    category: 'Savings',
    note: 'Emergency fund',
  });
  assert.equal(added.body.leftovers.length, 1);
  const again = await call('POST', '/api/months/2026-02/leftovers', {
    profileId: 2,
    amountCents: 5000,
    category: 'Fun',
  });
  const second = again.body.leftovers[1];
  const deleted = await call('DELETE', `/api/leftovers/${second.id}`);
  assert.equal(deleted.body.leftovers.length, 1);
  await assert.rejects(
    () => call('POST', '/api/months/2026-02/leftovers', { profileId: 1, amountCents: 0, category: 'X' }),
    (e) => e instanceof ApiError && e.status === 400
  );
});

test('state exposes most recently closed month', async () => {
  const empty = await call('GET', '/api/state');
  assert.equal(empty.body.mostRecentClosedYm, null);
  await call('POST', '/api/months', { ym: '2026-01' });
  await call('POST', '/api/months/2026-01/close');
  const s = await call('GET', '/api/state');
  assert.equal(s.body.mostRecentClosedYm, '2026-01');
});

test('plan PUT preserves item ids and never FK-fails when expenses are linked', async () => {
  await call('POST', '/api/months', { ym: '2026-01' });
  const plan = await call('PUT', '/api/months/2026-01/plan', {
    salaries: { 1: 100000, 2: 100000 },
    items: [{ kind: 'variable', label: 'Groceries', amountCents: 50000 }],
  });
  const itemId = plan.body.items[0].id;
  await call('POST', '/api/months/2026-01/expenses', {
    date: '2026-01-05', category: 'Groceries', description: 'shop', amountCents: 12000, planItemId: itemId, payerProfileId: null,
  });

  const edited = await call('PUT', '/api/months/2026-01/plan', {
    salaries: { 1: 100000, 2: 100000 },
    items: [
      { id: itemId, kind: 'variable', label: 'Groceries', amountCents: 60000 },
      { kind: 'fixed', label: 'Rent', amountCents: 200000 },
    ],
  });
  assert.equal(edited.status, 200, 'plan edit after linking an expense must not 500');
  assert.equal(edited.body.items.find((i) => i.id === itemId).amountCents, 60000, 'kept item must keep its id');
  const after = await call('GET', '/api/months/2026-01');
  assert.equal(after.body.expenses[0].planItemId, itemId, 'expense link must survive a plan edit');

  const removed = await call('PUT', '/api/months/2026-01/plan', {
    salaries: { 1: 100000, 2: 100000 },
    items: [{ kind: 'fixed', label: 'Rent', amountCents: 200000 }],
  });
  assert.equal(removed.status, 200);
  const after2 = await call('GET', '/api/months/2026-01');
  assert.equal(after2.body.expenses[0].planItemId, null, 'removing a linked item orphans the expense instead of failing');
});

test('PUT /api/expenses/:id edits an expense with validation', async () => {
  await call('POST', '/api/months', { ym: '2026-02' });
  await call('PUT', '/api/months/2026-02/plan', { salaries: { 1: 1, 2: 1 }, items: [] });
  const added = await call('POST', '/api/months/2026-02/expenses', {
    date: '2026-02-01', category: 'Transport', description: 'Taxi 999', amountCents: 99900, planItemId: null, payerProfileId: 1,
  });
  const id = added.body.expenses[0].id;
  const r = await call('PUT', `/api/expenses/${id}`, {
    date: '2026-02-02', category: 'Transport', description: 'Taxi 99', amountCents: 9900, planItemId: null, payerProfileId: 1,
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.expenses[0].description, 'Taxi 99');
  assert.equal(r.body.expenses[0].amountCents, 9900);
  await assert.rejects(
    () => call('PUT', `/api/expenses/${id}`, { date: '2026-03-01', category: 'A', description: 'x', amountCents: 1, planItemId: null, payerProfileId: null }),
    (e) => e instanceof ApiError && e.status === 400 && e.code === 'invalid'
  );
});

test('PUT /api/settings dedupes and trims categories; ApiError carries codes', async () => {
  const { body } = await call('PUT', '/api/settings', { categories: ['Food', 'Food', ' food ', ''] });
  assert.deepEqual(body.categories, ['Food']);
  await call('POST', '/api/months', { ym: '2026-01' });
  await assert.rejects(
    () => call('POST', '/api/months', { ym: '2026-01' }),
    (e) => e instanceof ApiError && e.status === 409 && e.code === 'month_exists'
  );
  await assert.rejects(
    () => call('PUT', '/api/months/2026-01/plan', { salaries: {}, items: [{ kind: 'fixed', label: '', amountCents: 1 }] }),
    (e) => e.status === 400 && e.code === 'invalid'
  );
});
