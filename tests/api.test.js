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
