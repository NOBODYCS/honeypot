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
const money = read('src/money.js');

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
  for (const m of app.matchAll(/\btipWrap\('([\w-]+)',\s*'([\w-]+)'/g)) { used.add(m[1]); used.add(m[2]); }
  for (const m of app.matchAll(/\bfield\('([\w-]+)',[\s\S]{0,400}?,\s*'([\w-]+)'/g)) { used.add(m[1]); used.add(m[2]); }
  for (const m of app.matchAll(/\battachTip\([^,]+,\s*'([\w-]+)'/g)) used.add(m[1]);
  for (const m of app.matchAll(/\bfigRow\('([\w-]+)',[\s\S]{0,300}?,\s*'([\w-]+)'/g)) { used.add(m[1]); used.add(m[2]); }
  for (const m of app.matchAll(/\bfig\('([\w-]+)',[\s\S]{0,200}?,\s*'([\w-]+)'/g)) { used.add(m[1]); used.add(m[2]); }
  for (const m of html.matchAll(/data-i18n(?:-aria)?="([\w-]+)"/g)) used.add(m[1]);
  for (const pr of ['presetPaper', 'presetInk', 'presetSunrise', 'presetBerry', 'presetOcean', 'presetContrast']) used.add(pr);
  for (const k of ['fixedShared', 'variableShared', 'tipFixedShared', 'tipVariableShared', 'editHint', 'readOnly', 'tipEditHint', 'tipReadOnly', 'tipClosed', 'tipSuggestion', 'tipSuggestNotExact']) used.add(k);
  /* attachChromeTips() builds these keys dynamically from the chrome label list */
  for (const k of ['monthPlan', 'liveFigures', 'spendingLog', 'personalObligatory', 'noMonthTitle', 'noMonthText', 'whoAreYou', 'settings', 'history', 'leftoverLog', 'closeMonth', 'newMonth', 'createMonth', 'open', 'balance']) {
    used.add(k);
    used.add(`tip${k[0].toUpperCase()}${k.slice(1)}`);
  }
  for (const k of used) assert.ok(k in en, `used but missing key: ${k}`);
  for (const k of Object.keys(en)) assert.ok(used.has(k) || k.startsWith('err_'), `dead key: ${k}`);
});

test('i18n: no hardcoded user-facing strings outside the dictionary', () => {
  const allowed = new Set(['i', '/']);
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
  const rsStart = app.indexOf('function renderSettings');
  const rs = app.slice(rsStart, app.indexOf('\nfunction ', rsStart + 1));
  assert.equal([...rs.matchAll(/text: t\('save'\)/g)].length, 1, 'settings must have exactly one Save');
  assert.ok(!app.includes('savePlan'), 'plan Save button must be gone (autosave)');
  assert.ok(app.includes('scheduleAutosave') && app.includes('liveSummary'));
  assert.ok(server.includes('/shared/money.js') && app.includes("from '/shared/money.js'"));
});

test('personal expenses use cards (no table in narrow side panels)', () => {
  assert.ok(css.includes('.personal-item'));
  const start = app.indexOf('function renderPersonal');
  const fn = app.slice(start, app.indexOf('\nfunction ', start + 1));
  assert.ok(fn.includes('itemCard'), 'renderPersonal must render item cards');
  assert.ok(!fn.includes('itemTable'), 'renderPersonal must not use a wide table');
});

test('dom: replaceChildren never receives raw null/false (kids filter)', () => {
  assert.ok(app.includes('const kids ='), 'kids() filter helper missing');
  let i = 0;
  while ((i = app.indexOf('replaceChildren(', i)) !== -1) {
    let depth = 0;
    let j = i + 'replaceChildren('.length;
    for (; j < app.length; j++) {
      if (app[j] === '(') depth++;
      else if (app[j] === ')') {
        if (depth === 0) break;
        depth--;
      }
    }
    const call = app.slice(i, j + 1);
    let d = 0;
    let k = 'replaceChildren('.length;
    for (; k < call.length - 1; k++) {
      if (call[k] === '(') d++;
      else if (call[k] === ')') d--;
      else if (d === 0 && (call.startsWith(': null', k) || call.startsWith(': false', k))) {
        assert.ok(false, `raw null/false as a direct replaceChildren argument: ${call.slice(0, 100)}`);
      }
    }
    i = j + 1;
  }
});

test('plan items are cards with a two-sided split editor (both partners visible)', () => {
  const start = app.indexOf('function renderPlan');
  const fn = app.slice(start, app.indexOf('\nfunction ', start + 1));
  assert.ok(fn.includes('itemCard'), 'renderPlan must render item cards');
  assert.ok(!fn.includes('itemTable'), 'renderPlan must not render plan rows as a table');
  assert.ok(app.includes("side: 'a'") && app.includes("side: 'b'"), 'split editor needs A% and B% inputs');
  assert.ok(app.includes("'data-side': side"), 'split inputs must be marked data-side');
  assert.ok(app.includes("class: 'btn btn-mini'"), 'auto (salary split) reset button missing');
});

test('every dynamically created button has a wired onclick', () => {
  let i = 0;
  let n = 0;
  while ((i = app.indexOf("el('button'", i)) !== -1) {
    const chunk = app.slice(i, i + 400);
    assert.ok(chunk.includes('onclick'), `button without onclick near: ${chunk.slice(0, 90)}`);
    n++;
    i += 10;
  }
  assert.ok(n >= 10, 'expected at least 10 dynamic buttons');
});

test('layout: rows wrap, table headers never nowrap, grid children can shrink (no horizontal scroll)', () => {
  assert.ok(/\.personal-row\s*\{[^}]*flex-wrap:\s*wrap/.test(css), '.personal-row must wrap');
  assert.ok(!/thead th\s*\{[^}]*white-space:\s*nowrap/.test(css), 'thead th must not nowrap');
  assert.ok(/\.screen\s*>\s*\*\s*\{[^}]*min-width:\s*0/.test(css), '.screen children must be shrinkable');
  assert.ok(css.includes('.settings-section'), 'settings sections missing');
});

test('csp: inline styles go through CSSOM setProperty, never setAttribute (style-src self blocks the style attribute)', () => {
  assert.ok(server.includes("style-src 'self'"), 'CSP must not allow unsafe-inline styles');
  assert.ok(app.includes('node.style.setProperty'), 'el() must apply style via CSSOM');
  assert.ok(!app.includes("setAttribute('style'"), 'setAttribute(style) would be blocked by CSP');
});

test('a11y/i18n: no hardcoded aria-labels; % never renders as "null%"', () => {
  assert.ok(!/aria-label':\s*'[a-z]+'/.test(app), 'hardcoded aria-label found');
  assert.ok(app.includes('function pctStr'), 'pctStr helper missing (null % guard)');
  assert.ok(!app.includes('${iA}%'), 'raw iA% interpolation can render null%');
});

test('chrome: sticky side panels track measured topbar height; profile pick cannot be dismissed; unsaved theme preview reverts', () => {
  assert.ok(css.includes('var(--topbar-h'), 'side panel top must use measured --topbar-h');
  assert.ok(app.includes("setProperty('--topbar-h'"), 'topbar height must be measured');
  assert.ok(app.includes("'cancel'") && app.includes('dlg-pick'), 'profile pick must block Escape until chosen');
  assert.ok(app.includes("$('#dlg-settings').addEventListener('close'"), 'settings close must re-apply saved theme');
});

test('server: static path traversal is contained to PUBLIC_DIR', () => {
  assert.ok(server.includes('PUBLIC_DIR + path.sep'), 'path check must require a separator boundary');
});

test('per-item partner share: -1 sentinel, migration, validation', () => {
  assert.ok(db.includes('BETWEEN -1 AND 100') && db.includes('plan_items_new'));
  assert.ok(api.includes('[-1,100]'));
});

test('migrations: expenses.category column guarded', () => {
  assert.ok(db.includes("ALTER TABLE expenses ADD COLUMN category"));
});

/* ---------- tooltips: delayed mechanism + label/tip key parity ---------- */

test('tooltips: mechanism (label-text trigger, 2s hover, focus/tap, Escape, aria-describedby, role=tooltip, rem sizing)', () => {
  assert.ok(app.includes('const TIP_HOVER_MS = 2000'), '2s hover delay constant missing');
  assert.ok(app.includes('function initTip') && app.includes('function tipWrap') && app.includes('function attachTip'), 'tooltip helpers missing');
  assert.ok(app.includes("role: 'tooltip'"), 'tooltip must have role=tooltip');
  assert.ok(app.includes("'aria-describedby'"), 'tip must be associated via aria-describedby');
  assert.ok(app.includes("e.key === 'Escape'"), 'tooltip must be dismissible with Escape');
  assert.ok(!app.includes('infoTip'), 'old instant infoTip must be gone');
  assert.ok(css.includes('.tooltip') && css.includes('.tip-trigger'), 'tooltip CSS classes missing');
  assert.ok(/\.tooltip\s*\{[^}]*max-width:\s*min\(20rem/.test(css), 'tooltip width must be rem-based for 200% text scaling');
});

test('tooltips: every field-label i18n key has a matching tip<Key> key in BOTH en and pl', () => {
  const { en, pl } = i18n();
  const labelKeys = [
    'salaries', 'salaryFor', 'fixedShared', 'variableShared', 'personalObligatory',
    'monthPlan', 'liveFigures', 'spendingLog', 'label', 'amount', 'partnerShare', 'splitLabel',
    'date', 'category', 'description', 'linkItem', 'payer', 'profile', 'note',
    'currency', 'language', 'categories', 'themeColors', 'mode', 'sectionProfile', 'sectionApp',
    'settings', 'history', 'leftoverLog', 'closeMonth', 'newMonth', 'createMonth',
    'noMonthTitle', 'noMonthText', 'noItems', 'noExpenses', 'nothingYet', 'historyEmpty',
    'noLeftoverMonth', 'open', 'closed', 'balance',
    'transferAfterPayday', 'leftAfterShared', 'leftAfterPersonal',
    'settleUp', 'ofIncome', 'splitOfPlan', 'fairIncome',
    'editHint', 'readOnly', 'monthClosed', 'contributions', 'paid', 'whoAreYou',
  ];
  for (const k of labelKeys) {
    const tipKey = `tip${k[0].toUpperCase()}${k.slice(1)}`;
    assert.ok(tipKey in en, `missing en key ${tipKey} for label ${k}`);
    assert.ok(tipKey in pl, `missing pl key ${tipKey} for label ${k}`);
  }
});

/* ---------- spinner-free numeric entry ---------- */

test('numeric entry: no type=number anywhere, text inputs with inputmode, live filtering, blur snap', () => {
  assert.ok(!/type:\s*'number'/.test(app), 'type:number found in app.js (spinner arrows)');
  assert.ok(!/type="number"/.test(html), 'type=number found in index.html');
  assert.ok(!/\bstep:\s*'/.test(app), 'step attribute on a numeric input found');
  assert.ok(app.includes("inputmode: 'decimal'") && app.includes("inputmode: 'numeric'"), 'inputmode decimal/numeric missing');
  assert.ok(app.includes('sanitizeNumericInput') && app.includes('onblur'), 'live filtering + blur snap missing');
  assert.ok(money.includes('export function sanitizeNumericInput') && money.includes('export function parseFlexibleMoney') && money.includes('export function formatMoneyInput') && money.includes('export function formatPctInput'), 'money.js numeric helpers missing');
  assert.ok(!css.includes("input[type='number']"), 'spinner selector left in styles.css');
});

/* ---------- fair-share split suggestions (Change 3) ---------- */

test('suggestions: UI cannot silently disappear (chips, apply-all, tips in en+pl, money.js fn)', () => {
  assert.ok(money.includes('export function suggestFairSplit'), 'suggestFairSplit missing in money.js');
  assert.ok(app.includes('sug-chip') && app.includes("id: 'btn-apply-suggestions'"), 'suggestion chip / apply-all button missing');
  assert.ok(app.includes('function updateSuggestions') && app.includes('updateSuggestions();'), 'suggestions must recompute on draft changes');
  assert.ok(css.includes('.sug-chip'), 'suggestion chip style missing');
  const { en, pl } = i18n();
  for (const k of ['applyAll', 'tipApplyAll', 'suggestionChip', 'tipSuggestion', 'tipSuggestNotExact']) {
    assert.ok(k in en && k in pl, `suggestion key ${k} missing in en/pl`);
  }
  /* applying a suggestion writes a normal manual value (never silent) */
  assert.ok(/item\.partnerSharePct = mine\.pctB/.test(app), 'apply must set partnerSharePct as a manual value');
  assert.ok(/x\.item\.partnerSharePct = x\.pctB/.test(app), 'apply-all must set manual values');
});

test('tooltips: every live-figure caption key has a matching tooltip key in BOTH en and pl, with live-example placeholders', () => {
  const { en, pl } = i18n();
  const figureKeys = [
    'transferAfterPayday', 'ofIncome', 'leftAfterShared', 'leftAfterPersonal',
    'settleUp', 'splitOfPlan', 'fairIncome', 'contributions', 'paid',
  ];
  for (const k of figureKeys) {
    const tipKey = `tip${k[0].toUpperCase()}${k.slice(1)}`;
    assert.ok(tipKey in en && tipKey in pl, `figure caption ${k} needs ${tipKey} in en+pl`);
    /* worked mini example: the tip must carry at least one numeric placeholder */
    assert.ok(/\{(salary|plan|amount|left|balance|spent|fixed|ia|ib|pct|ca|cb|fa|fb|fp)\}/.test(en[tipKey]), `${tipKey} (en) lacks a live-number placeholder`);
    assert.ok(/\{(salary|plan|amount|left|balance|spent|fixed|ia|ib|pct|ca|cb|fa|fb|fp)\}/.test(pl[tipKey]), `${tipKey} (pl) lacks a live-number placeholder`);
  }
  /* live figures must actually feed the params (not static text) */
  assert.ok(app.includes('function figTipParams'), 'figure tooltips must compute live example params');
  assert.ok(app.includes("figRow('leftAfterShared'") && app.includes("tipWrap('splitOfPlan', 'tipSplitOfPlan', {"), 'figures must pass live params to their tips');
});

/* ---------- no-pot model rework (2.0) ---------- */

test('no-pot model: pot balance, coverage bar and old leftover figures are gone everywhere', () => {
  assert.ok(!money.includes('potBalance') && !money.includes('potReturn'), 'money.js must not compute a pot balance');
  assert.ok(!app.includes('potBalance') && !app.includes('coversSpending'), 'app.js must not render pot balance / coverage bar');
  for (const old of ['guaranteedLeft', 'plannedLeft', 'projectedLeft']) {
    assert.ok(!app.includes(`figRow('${old}'`) && !app.includes(`tipWrap('${old}'`), `old figure ${old} must not be rendered (legacy snapshot fallback only)`);
  }
  assert.ok(money.includes('leftAfterShared') && money.includes('leftAfterPersonal'), 'new leftover figures missing in money.js');
  assert.ok(app.includes('leftAfterShared') && app.includes('leftAfterPersonal'), 'new leftover figures missing in app.js');
  const { en, pl } = i18n();
  for (const k of ['leftAfterShared', 'leftAfterPersonal', 'tipLeftAfterShared', 'tipLeftAfterPersonal', 'settleEven', 'settleLine']) {
    assert.ok(k in en && k in pl, `no-pot key ${k} missing in en/pl`);
  }
  assert.ok(!('potBalance' in en) && !('coversSpending' in en) && !('guaranteedLeft' in en), 'old keys must be removed from i18n');
  /* settle-up is the summed balance equation, phrased as chipped-in, and says so when even */
  assert.ok(/chipped in/.test(en.settleLine) && /do\u0142o\u017cy\u0142/.test(pl.settleLine), 'settle line must use the chipped-in balance phrasing');
  assert.ok(app.includes("t('settleEven')"), 'equal balance must say so explicitly');
  /* no pot wording left in user-facing strings */
  for (const k of Object.keys(en)) {
    assert.ok(!/\bpot\b/i.test(String(en[k])), `en key ${k} still mentions pot`);
    assert.ok(!/\bpula\b|\bpuli\b/i.test(String(pl[k])), `pl key ${k} still mentions pot (pula)`);
  }
});

/* ---------- round 7 guards: audit fixes ---------- */

test('create-month: header New month button wired, next-free ym picker, no fake month option', () => {
  assert.ok(html.includes('id="btn-new-month"') && app.includes("$('#btn-new-month')"), 'New month button must exist and be wired');
  assert.ok(app.includes('function nextYm') && app.includes('while (taken.has(ym))'), 'createMonth must skip existing ym values');
  assert.ok(app.includes("t('noMonthsYet')"), 'empty month list must show a disabled placeholder option');
  const lm = app.slice(app.indexOf('function loadMonths'), app.indexOf('\nfunction ', app.indexOf('function loadMonths') + 1));
  assert.ok(lm.includes('state.openMonth?.ym ?? null'), 'main view must target the open month only');
  assert.ok(app.includes('function renderMonthOptions'), 'month options must be re-renderable (language switch)');
});

test('autosave: flush on month switch/close, item ids preserved, skipped rows reported', () => {
  assert.ok(app.includes('async function flushAutosave'), 'flushAutosave missing');
  assert.ok((app.match(/await flushAutosave\(\);/g) ?? []).length >= 2, 'month switch and close must flush pending autosave');
  assert.ok(app.includes('id: i.id ?? null'), 'autosave must send item ids so the server can upsert');
  assert.ok(app.includes("t('savedSkipped'"), 'skipped empty/zero rows must be reported, not silently "Saved."');
  assert.ok(api.includes('UPDATE plan_items SET') && api.includes('plan_item_id = NULL'), 'server must upsert by id and orphan links instead of FK-failing');
});

test('api errors carry codes and map to i18n; expense edit endpoint exists', () => {
  assert.ok(api.includes('this.code = code'), 'ApiError must carry a machine code');
  assert.ok(server.includes('code: err.code') && server.includes("code: 'internal'"), 'server must send error codes');
  assert.ok(app.includes('err_${data.code}'), 'client must map codes to i18n strings');
  assert.ok(api.includes("route('PUT', '/api/expenses/:id'"), 'expense edit endpoint missing');
  assert.ok(app.includes("PUT', `/api/expenses/"), 'client expense PUT missing');
  assert.ok(app.includes('editingExpenseId') && app.includes('id: \'ef-date\''), 'expense form must support edit-in-place and preserved fields');
});

test('destructive + settings: confirms on delete, dirty-guard on settings close', () => {
  assert.ok((app.match(/showConfirm\(t\('confirmDelete'\)/g) ?? []).length >= 3, 'plan/expense/leftover deletes need confirm');
  assert.ok(app.includes('settingsDirty') && app.includes("t('discardChanges')") && app.includes('function requestClose'), 'settings close must ask before discarding edits');
});

test('chrome/a11y: header save indicator, balance hidden at zero, label-wrapped fields, grouped cards, no leading % in ofIncome', () => {
  assert.ok(html.includes('save-state'), 'header save indicator missing');
  assert.ok((app.match(/querySelectorAll\('\.save-state'\)/g) ?? []).length === 1, 'setSaveState must update all .save-state nodes');
  const rh = app.slice(app.indexOf('function renderHeader'), app.indexOf('\nfunction ', app.indexOf('function renderHeader') + 1));
  assert.ok(rh.includes('offset !== 0'), 'balance badge must hide when there is nothing to settle');
  const f = app.slice(app.indexOf('function field('), app.indexOf('\nfunction ', app.indexOf('function field(') + 1));
  assert.ok(f.includes("el('label', { class: 'field'"), 'field() must wrap the control in a real <label>');
  assert.ok(app.includes("role: 'group'") && app.includes("t('newItem')"), 'item cards need group aria-labels');
  const { en, pl } = i18n();
  assert.ok(!/%\s*\$\{[^}]*\}\s*.*t\('ofIncome'\)/.test(app) && !app.includes("% ${t('ofIncome')}"), 'ofIncome must not be used as a suffix after a raw % (doubled %%)');
  assert.ok(/\.dialog-panel\s*\{[^}]*min\(640px/.test(css), 'dialog panels should be wider for summary tables');
  assert.ok(/\.personal-row input\.num-input\s*\{[^}]*min-width/.test(css), 'money inputs must be able to grow (no clipped amounts)');
  assert.ok(api.includes('seenCats'), 'categories must be deduped server-side');
});
