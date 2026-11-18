import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const app = read('public/app.js');
const html = read('public/index.html');
const css = read('public/styles.css');
const server = read('src/server.js');
const db = read('src/db.js');
const api = read('src/api.js');

function i18n() {
  const start = app.indexOf('const I18N = {');
  const end = app.indexOf('};', start) + 2;
  return new Function(app.slice(start, end) + '; return I18N;')();
}

/* ---------- i18n ---------- */

test('i18n: en/pl key parity and placeholder parity', () => {
  const { en, pl } = i18n();
  assert.deepEqual(Object.keys(pl).sort(), Object.keys(en).sort());
  for (const k of Object.keys(en)) {
    const pe = [...String(en[k]).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const pp = [...String(pl[k]).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    assert.deepEqual(pp, pe, `placeholder mismatch on ${k}`);
  }
});

test('i18n: every t() key and data-i18n(-aria) key exists; no dead keys', () => {
  const { en } = i18n();
  const used = new Set([...app.matchAll(/\bt\('([\w-]+)'/g)].map((m) => m[1]));
  for (const m of html.matchAll(/data-i18n(?:-aria)?="([\w-]+)"/g)) used.add(m[1]);
  for (const pr of ['presetPaper', 'presetInk', 'presetSunrise', 'presetBerry', 'presetOcean', 'presetContrast']) used.add(pr);
  for (const k of used) assert.ok(k in en, `used but missing key: ${k}`);
  for (const k of Object.keys(en)) assert.ok(used.has(k), `dead key: ${k}`);
});

test('i18n: no hardcoded user-facing strings outside the dictionary', () => {
  const allowed = new Set(['i']);
  for (const m of app.matchAll(/text: '([^']*)'/g)) {
    assert.ok(allowed.has(m[1]), `hardcoded text: '${m[1]}'`);
  }
});

/* ---------- contrast (WCAG 2.2 AA) ---------- */

function lum(hex) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
function tokensOf(re) {
  const m = css.match(re);
  const o = {};
  if (!m) return o;
  for (const mm of m[1].matchAll(/--([\w-]+):\s*([^;]+);/g)) o[mm[1]] = mm[2].trim();
  return o;
}

test('contrast: every preset x mode meets WCAG AA (4.5:1 text, 3:1 borders)', () => {
  const rootTokens = tokensOf(/:root\s*\{([^}]*)\}/);
  const presets = [...css.matchAll(/\[data-theme='([\w-]+)'\]/g)].map((m) => m[1]);
  const ids = [...new Set(presets)];
  assert.ok(ids.length >= 6, 'expected at least 6 theme presets');
  for (const id of ids) {
    const light = tokensOf(new RegExp(`\\[data-theme='${id}'\\]\\s*\\{([^}]*)\\}`));
    const dark = tokensOf(new RegExp(`\\[data-theme='${id}'\\]\\[data-mode='dark'\\]\\s*\\{([^}]*)\\}`));
    for (const over of [light, dark]) {
      const t = { ...rootTokens, ...over };
      const g = (k) => {
        const v = t[k];
        if (!v) return undefined;
        if (v.startsWith('#')) return v;
        const m = v.match(/var\((--[\w-]+)\)/);
        return m ? t[m[1].replace(/^--/, '')] : undefined;
      };
      const text = [
        ['ink', 'canvas'], ['ink', 'surface'], ['ink', 'surface-2'],
        ['ink-2', 'surface'], ['ink-3', 'surface'],
        ['accent', 'canvas'], ['accent-ink', 'accent'],
        ['danger', 'surface'], ['danger-ink', 'danger'], ['canvas', 'ink'],
      ];
      for (const [a, b] of text) {
        assert.ok(g(a) && g(b), `missing tokens ${a}/${b} in ${id}`);
        assert.ok(ratio(g(a), g(b)) >= 4.5, `${id}: ${a} on ${b} = ${ratio(g(a), g(b)).toFixed(2)} < 4.5`);
      }
      assert.ok(ratio(g('line-2'), g('surface')) >= 3, `${id}: border line-2 < 3:1`);
    }
  }
});

/* ---------- buttons & dialogs ---------- */

test('buttons: every button id in HTML is wired in app.js; dialogs closable', () => {
  const ids = [...html.matchAll(/<button[^>]*id="([\w-]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length >= 6);
  for (const id of ids) {
    assert.ok(app.includes(`$('#${id}')`), `button #${id} not wired`);
  }
  assert.ok(app.includes("querySelectorAll('dialog')"), 'dialog close wiring missing');
  assert.ok(app.includes('e.target === dialog'), 'backdrop-click close missing');
});

/* ---------- scaling / zoom ---------- */

test('scaling: viewport allows zoom, text-scale opt-in, no fixed heights on controls, no nowrap buttons', () => {
  const viewport = html.match(/<meta name="viewport" content="([^"]*)"/)[1];
  assert.ok(!/user-scalable\s*=\s*no/.test(viewport) && !/maximum-scale/.test(viewport));
  assert.ok(html.includes('<meta name="text-scale" content="scale">'));
  const btnBlock = css.match(/\.btn \{([^}]*)\}/)[1];
  assert.ok(btnBlock.includes('min-height'), '.btn must use min-height');
  assert.ok(!btnBlock.includes('white-space: nowrap'), '.btn must not nowrap');
  assert.ok(!/(?<!min-)height:\s*var\(--control-h\)/.test(css), 'fixed control height found');
  assert.ok(css.includes('pointer: coarse'), 'coarse-pointer target bump missing');
});

/* ---------- architecture guards ---------- */

test('theme is per partner profile (server-side), never localStorage', () => {
  assert.ok(!app.includes('honeypot-theme'), 'theme must not be stored in localStorage');
  assert.ok(!app.includes('profileEditors'), 'settings must not edit all profiles');
  assert.ok(app.includes('currentProfile()'), 'settings must be scoped to current profile');
});

test('exactly one Save button in settings; plan autosaves (no savePlan)', () => {
  assert.equal([...app.matchAll(/text: t\('save'\)/g)].length, 1);
  assert.ok(!app.includes('savePlan'), 'plan Save button must be gone (autosave)');
  assert.ok(app.includes('scheduleAutosave') && app.includes('liveSummary'));
  assert.ok(server.includes('/shared/money.js') && app.includes("from '/shared/money.js'"));
});

test('personal expenses use cards (no table in narrow side panels)', () => {
  assert.ok(css.includes('.personal-item'));
  const fn = app.slice(app.indexOf('function renderPersonal'), app.indexOf('function renderPlan'));
  assert.ok(!fn.includes('itemTable'), 'renderPersonal must not use a wide table');
});

test('per-item partner share: -1 sentinel, migration, validation', () => {
  assert.ok(db.includes('BETWEEN -1 AND 100') && db.includes('plan_items_new'));
  assert.ok(api.includes('[-1,100]'));
});

test('migrations: expenses.category column guarded', () => {
  assert.ok(db.includes("ALTER TABLE expenses ADD COLUMN category"));
});
