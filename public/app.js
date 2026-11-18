/* Honeypot frontend — vanilla JS, no build step. One screen + slide-over dialogs. */

const I18N = {
  en: {
    profileLabel: 'Current profile',
    monthLabel: 'Month',
    settings: 'Settings',
    history: 'History',
    leftoverLog: 'Leftover log',
    closeMonth: 'Close month',
    personalObligatory: 'Personal expenses',
    noMonthTitle: 'No month open',
    noMonthText: 'Create the current month to start planning.',
    createMonth: 'Create month',
    monthPlan: 'Month plan',
    liveFigures: 'Live figures',
    spendingLog: 'Spending log',
    whoAreYou: 'Which one are you?',
    whoAreYouHint: 'This only prefills forms and picks your theme. Both partners can edit everything.',
    close: 'Close',
    monthSummary: 'Month summary',
    salaries: 'Salaries',
    salaryFor: 'Salary of {name}',
    fixedShared: 'Fixed shared costs',
    variableShared: 'Variable shared costs',
    personalList: 'Personal obligatory list',
    label: 'Name',
    amount: 'Amount',
    partnerShare: 'Partner shares %',
    add: 'Add',
    remove: 'Remove',
    save: 'Save',
    saved: 'Saved.',
    transferAfterPayday: 'Transfer after payday',
    guaranteedLeft: 'Guaranteed leftover',
    plannedLeft: 'Planned leftover',
    projectedLeft: 'Projected leftover',
    potBalance: 'Pot balance',
    settleUp: 'Settle-up',
    actualSpent: 'Spent so far',
    vsPlan: 'vs plan',
    unplanned: 'Unplanned',
    planned: 'Planned',
    actual: 'Actual',
    date: 'Date',
    description: 'Description',
    payer: 'Paid by (fronted)',
    potPaid: 'Pot (no payer)',
    linkItem: 'Planned item',
    none: '\u2014',
    addExpense: 'Add expense',
    open: 'open',
    closed: 'closed',
    monthClosed: 'This month is closed and read-only.',
    confirmClose: 'Close this month? Plan and expenses will lock.',
    personalSupport: 'Personal support',
    contributions: 'Contributions',
    paid: 'Actually paid (fronted)',
    potReturn: 'Pot returned',
    profileNames: 'Profile names',
    themeColors: 'Theme',
    accent: 'Accent',
    background: 'Background',
    surface: 'Surface',
    text: 'Text color',
    mode: 'Mode',
    light: 'light',
    dark: 'dark',
    currency: 'Currency (ISO 4217)',
    categories: 'Expense categories',
    language: 'Language',
    leftoverEntries: 'Leftover entries',
    category: 'Category',
    note: 'Note',
    addEntry: 'Add entry',
    noLeftoverMonth: 'No closed month yet \u2014 the leftover log opens after the first close.',
    readOnly: 'Read-only',
    editHint: 'Editable only for the most recently closed month.',
    historyEmpty: 'No closed months yet.',
    guaranteed: 'Guaranteed',
    plannedWord: 'Planned',
    error: 'Error',
    cancel: 'Cancel',
    confirm: 'Confirm',
    noItems: 'Nothing planned yet.',
    noExpenses: 'No spending logged yet.',
    nothingYet: 'Nothing here yet.',
    balance: 'Balance',
    pot: 'Pot',
    paidByStrip: 'Paid by {name}',
    resetTheme: 'Reset to default',
    presetPaper: 'Paper',
    presetInk: 'Ink',
    presetSunrise: 'Sunrise',
    presetBerry: 'Berry',
    presetOcean: 'Ocean',
    presetContrast: 'High contrast',
    splitOfPlan: 'Split of the shared plan (by salary)',
    ofPlan: 'of the shared plan',
    coversSpending: 'Who covers spending so far',
    ofIncome: '% of own income',
    fairIncome: 'Fair share = equal % of own income — both pay {pct}%',
    tipSplit: "The bar shows each side's share of the shared plan, proportional to salary — not a share of the pot. The pot only pays; it owns nothing.",
    tipCoverage: 'Of the money spent so far: who fronted it personally vs what the pot paid.',
    tipIncome: 'Fair share means both partners spend the same % of their own income on shared costs.',
  },
  pl: {
    profileLabel: 'Aktualny profil',
    monthLabel: 'Miesi\u0105c',
    settings: 'Ustawienia',
    history: 'Historia',
    leftoverLog: 'Wolne \u015brodki',
    closeMonth: 'Zamknij miesi\u0105c',
    personalObligatory: 'Wydatki osobiste',
    noMonthTitle: 'Nie otwarto miesi\u0105ca',
    noMonthText: 'Utw\u00f3rz bie\u017c\u0105cy miesi\u0105c, \u017ceby zacz\u0105\u0107 planowanie.',
    createMonth: 'Utw\u00f3rz miesi\u0105c',
    monthPlan: 'Plan miesi\u0105ca',
    liveFigures: 'Na bie\u017c\u0105co',
    spendingLog: 'Rejestr wydatk\u00f3w',
    whoAreYou: 'Kim jeste\u015b?',
    whoAreYouHint: 'To tylko wst\u0119pnie wype\u0142nia formularze i wybiera Tw\u00f3j motyw. Oboje mo\u017cecie edytowa\u0107 wszystko.',
    close: 'Zamknij',
    monthSummary: 'Podsumowanie miesi\u0105ca',
    salaries: 'Pensje',
    salaryFor: 'Pensja: {name}',
    fixedShared: 'Sta\u0142e koszty wsp\u00f3lne',
    variableShared: 'Zmienne koszty wsp\u00f3lne',
    personalList: 'Lista zobowi\u0105za\u0144 osobistych',
    label: 'Nazwa',
    amount: 'Kwota',
    partnerShare: 'Udzia\u0142 partnera (%)',
    add: 'Dodaj',
    remove: 'Usu\u0144',
    save: 'Zapisz',
    saved: 'Zapisano.',
    transferAfterPayday: 'Przelew po wyp\u0142acie',
    guaranteedLeft: 'Wolne \u015brodki \u2014 gwarantowane',
    plannedLeft: 'Wolne \u015brodki \u2014 planowane',
    projectedLeft: 'Wolne \u015brodki \u2014 prognozowane',
    potBalance: 'Stan puli',
    settleUp: 'Rozliczenie',
    actualSpent: 'Wydane dot\u0105d',
    vsPlan: 'vs plan',
    unplanned: 'Pozaplanowe',
    planned: 'Plan',
    actual: 'Rzeczywi\u015bcie',
    date: 'Data',
    description: 'Opis',
    payer: 'Zap\u0142aci\u0142(a) z w\u0142asnej kieszeni',
    potPaid: 'Pula (bez p\u0142atnika)',
    linkItem: 'Zaplanowana pozycja',
    none: '\u2014',
    addExpense: 'Dodaj wydatek',
    open: 'otwarty',
    closed: 'zamkni\u0119ty',
    monthClosed: 'Ten miesi\u0105c jest zamkni\u0119ty \u2014 tylko do odczytu.',
    confirmClose: 'Zamkn\u0105\u0107 ten miesi\u0105c? Plan i wydatki zostan\u0105 zablokowane.',
    personalSupport: 'Wsparcie partnera',
    contributions: 'Sk\u0142adki',
    paid: 'Zap\u0142acone z w\u0142asnej kieszeni',
    potReturn: 'Zwrot z puli',
    profileNames: 'Dane profilu',
    themeColors: 'Motyw',
    accent: 'Kolor akcentu',
    background: 'T\u0142o',
    surface: 'Powierzchnia',
    text: 'Kolor tekstu',
    mode: 'Tryb',
    light: 'jasny',
    dark: 'ciemny',
    currency: 'Waluta (ISO 4217)',
    categories: 'Kategorie wydatk\u00f3w',
    language: 'J\u0119zyk',
    leftoverEntries: 'Wpisy',
    category: 'Kategoria',
    note: 'Notatka',
    addEntry: 'Dodaj wpis',
    noLeftoverMonth: 'Nie ma jeszcze zamkni\u0119tego miesi\u0105ca \u2014 dziennik otworzy si\u0119 po pierwszym zamkni\u0119ciu.',
    readOnly: 'Tylko do odczytu',
    editHint: 'Edytowalne tylko w ostatnio zamkni\u0119tym miesi\u0105cu.',
    historyEmpty: 'Nie zamkni\u0119to jeszcze \u017cadnego miesi\u0105ca.',
    guaranteed: 'Gwarantowane',
    plannedWord: 'Planowane',
    error: 'B\u0142\u0105d',
    cancel: 'Anuluj',
    confirm: 'Potwierd\u017a',
    noItems: 'Jeszcze nic nie zaplanowano.',
    noExpenses: 'Nie zapisano jeszcze \u017cadnych wydatk\u00f3w.',
    nothingYet: 'Jeszcze nic tu nie ma.',
    balance: 'Bilans',
    pot: 'Pula',
    paidByStrip: 'Zapłacił(a): {name}',
    resetTheme: 'Przywróć domyślne',
    presetPaper: 'Papier',
    presetInk: 'Atrament',
    presetSunrise: 'Wschód słońca',
    presetBerry: 'Jagoda',
    presetOcean: 'Ocean',
    presetContrast: 'Wysoki kontrast',
    splitOfPlan: 'Podział planu wspólnego (wg pensji)',
    ofPlan: 'planu wspólnego',
    coversSpending: 'Kto pokrywa wydatki do tej pory',
    ofIncome: '% własnego dochodu',
    fairIncome: 'Uczciwy podział = równy % własnego dochodu — obie strony płacą po {pct}%',
    tipSplit: 'Pasek pokazuje udział każdej strony w planie wspólnym, proporcjonalny do pensji — nie udział w puli. Pula tylko płaci, nic nie posiada.',
    tipCoverage: 'Z już wydanych pieniędzy: kto zapłacił osobiście, a co zapłaciła pula.',
    tipIncome: 'Uczciwy podział oznacza, że obie osoby przeznaczają taki sam % własnej pensji na koszty wspólne.',
  },
};

const state = {
  profiles: [],
  settings: { currencyCode: 'EUR', language: 'en', categories: [] },
  currentYm: null,
  openMonth: null,
  months: [],
  month: null,
  profileId: Number(localStorage.getItem('honeypot-profile')) || null,
};

const $ = (sel) => document.querySelector(sel);
const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const child of children) {
    if (child == null) continue;
    node.append(child.nodeType ? child : document.createTextNode(child));
  }
  return node;
};

function t(key, params) {
  let str = I18N[state.settings.language]?.[key] ?? I18N.en[key] ?? key;
  for (const [k, v] of Object.entries(params ?? {})) {
    str = str.replaceAll(`{${k}}`, v);
  }
  return str;
}

function applyI18n() {
  document.documentElement.lang = state.settings.language;
  for (const node of document.querySelectorAll('[data-i18n]')) {
    node.textContent = t(node.dataset.i18n);
  }
}

let numberFormatter;
let numberFormatterKey;
function fmtMoney(cents) {
  const key = `${state.settings.language}|${state.settings.currencyCode}`;
  if (numberFormatterKey !== key) {
    numberFormatterKey = key;
    numberFormatter = new Intl.NumberFormat(state.settings.language, {
      style: 'currency',
      currency: state.settings.currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return numberFormatter.format((cents ?? 0) / 100);
}

const dateFormatter = () =>
  new Intl.DateTimeFormat(state.settings.language, { day: 'numeric', month: 'short' });

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return dateFormatter().format(new Date(Date.UTC(y, m - 1, d)));
}

const THEME_PROPS = [
  '--accent', '--accent-ink', '--bg', '--canvas', '--fg', '--ink', '--ink-2', '--ink-3',
  '--line', '--line-2', '--paper', '--surface', '--surface-1', '--surface-2',
];

const PRESET_IDS = ['paper', 'ink', 'sunrise', 'berry', 'ocean', 'contrast'];

const PRESETS = [
  { id: 'paper', key: 'presetPaper', dots: ['#faf6ef', '#ffffff', '#1f5f5b'] },
  { id: 'ink', key: 'presetInk', dots: ['#f2f3f5', '#ffffff', '#b45309'] },
  { id: 'sunrise', key: 'presetSunrise', dots: ['#fdf3ec', '#fffaf6', '#c2410c'] },
  { id: 'berry', key: 'presetBerry', dots: ['#fbf5f7', '#ffffff', '#9d174d'] },
  { id: 'ocean', key: 'presetOcean', dots: ['#eef6fa', '#ffffff', '#0369a1'] },
  { id: 'contrast', key: 'presetContrast', dots: ['#ffffff', '#f2f2f2', '#0b3d91'] },
];

function applyTheme(profile) {
  const root = document.documentElement;
  for (const prop of THEME_PROPS) root.style.removeProperty(prop);
  root.dataset.theme = PRESET_IDS.includes(profile?.theme?.preset) ? profile.theme.preset : 'paper';
  root.dataset.mode = profile?.theme?.mode === 'dark' ? 'dark' : 'light';
}

async function withBusy(btn, fn) {
  if (!btn) return fn();
  btn.disabled = true;
  btn.setAttribute('aria-busy', 'true');
  try {
    return await fn();
  } finally {
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
  }
}

function currentProfile() {
  return state.profiles.find((p) => p.id === state.profileId) ?? null;
}

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `${method} ${path} failed`);
  return data;
}

function showProfilePick() {
  const box = $('#pick-buttons');
  box.replaceChildren();
  for (const p of state.profiles) {
    box.append(
      el('button', {
        type: 'button',
        class: 'btn btn-primary',
        text: p.name,
        onclick: () => {
          setProfile(p.id);
          $('#dlg-pick').close();
        },
      })
    );
  }
  $('#dlg-pick').showModal();
}

function setProfile(id) {
  state.profileId = id;
  localStorage.setItem('honeypot-profile', String(id));
  renderHeader();
  const profile = currentProfile();
  if (profile) applyTheme(profile);
}

function renderHeader() {
  const switchEl = $('#profile-switch');
  switchEl.replaceChildren();
  for (const p of state.profiles) {
    switchEl.append(el('option', { value: p.id, text: p.name }));
  }
  if (state.profileId) switchEl.value = String(state.profileId);
  $('#name-a').textContent = state.profiles[0]?.name ?? 'Partner A';
  $('#name-b').textContent = state.profiles[1]?.name ?? 'Partner B';
  const status = $('#month-status');
  const month = state.month ?? state.openMonth;
  if (month) {
    status.hidden = false;
    status.textContent = month.status === 'open' ? t('open') : t('closed');
  } else {
    status.hidden = true;
  }
  const balance = $('#balance-badge');
  const settle = state.month?.summary?.settle ?? null;
  if (state.month && settle) {
    const offset = Math.abs(settle.A);
    balance.hidden = false;
    balance.textContent = offset === 0
      ? `${t('balance')} ${fmtMoney(0)}`
      : `${t('balance')} ${fmtMoney(offset)}`;
  } else {
    balance.hidden = true;
  }
}

async function refreshState() {
  const s = await api('GET', '/api/state');
  state.profiles = s.profiles;
  state.settings = s.settings;
  state.currentYm = s.currentYm;
  state.openMonth = s.openMonth;
  state.mostRecentClosedYm = s.mostRecentClosedYm ?? null;
  applyI18n();
  renderHeader();
  if (!state.profileId || !state.profiles.some((p) => p.id === state.profileId)) {
    showProfilePick();
  } else {
    const profile = currentProfile();
    if (profile) applyTheme(profile);
  }
}

state.mostRecentClosedYm = null;

/* ---------- month view ---------- */

function parseMoney(str) {
  const n = Number.parseFloat(str);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function moneyInput(cents, oninput, { disabled = false } = {}) {
  return el('input', {
    type: 'number',
    step: '0.01',
    min: '0',
    inputmode: 'decimal',
    'aria-label': 'amount',
    value: ((cents ?? 0) / 100).toFixed(2),
    disabled,
    oninput: (e) => oninput(parseMoney(e.target.value)),
  });
}

function textInput(value, oninput, { disabled = false } = {}) {
  return el('input', {
    type: 'text',
    value: value ?? '',
    disabled,
    oninput: (e) => oninput(e.target.value),
  });
}

let toastTimer;
function notify(kind, message) {
  const toast = $('#toast');
  if (!toast) return alert(message);
  toast.dataset.kind = kind;
  toast.textContent = message;
  toast.title = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 4000);
}

function notifyError(err) {
  notify('error', err.message);
}

function cloneDraft(month) {
  return {
    salaries: { 1: month.salaries['1'] ?? 0, 2: month.salaries['2'] ?? 0 },
    items: month.items.map((i) => ({ ...i })),
  };
}

async function loadMonths() {
  const { months } = await api('GET', '/api/months');
  state.months = months;
  const select = $('#month-switch');
  select.replaceChildren();
  for (const m of months) {
    select.append(el('option', { value: m.ym, text: `${m.ym} (${t(m.status)})` }));
  }
  const target = state.openMonth?.ym ?? state.mostRecentClosedYm ?? state.currentYm;
  if (months.some((m) => m.ym === target)) {
    select.value = target;
    await loadMonth(target);
  } else {
    select.replaceChildren(el('option', { value: '', text: state.currentYm }));
    state.month = null;
    renderMonth();
  }
}

async function loadMonth(ym) {
  state.month = await api('GET', `/api/months/${ym}`);
  state.draft = cloneDraft(state.month);
  renderMonth();
}

function editable() {
  return state.month?.status === 'open';
}

function renderMonth() {
  const month = state.month;
  const missing = $('#month-missing');
  const body = $('#month-body');
  if (!month) {
    missing.hidden = false;
    body.hidden = true;
    $('#btn-create-month').disabled = state.openMonth != null;
    $('#btn-close-month').disabled = true;
    renderHeader();
    return;
  }
  missing.hidden = true;
  body.hidden = false;
  renderHeader();
  renderPlan();
  renderFigures();
  renderExpenses();
  renderPersonal(1, $('#personal-list-a'));
  renderPersonal(2, $('#personal-list-b'));
  $('#btn-close-month').disabled = !editable();
}

function itemRows(kind, owner, listEl) {
  const canEdit = editable();
  return state.draft.items
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) =>
      kind === 'personal' ? item.kind === 'personal' && item.ownerProfileId === owner : item.kind === kind
    )
    .map(({ item, idx }) => {
      const cells = [
        textInput(item.label, (v) => (item.label = v), { disabled: !canEdit }),
        moneyInput(item.amountCents, (v) => (item.amountCents = v), { disabled: !canEdit }),
      ];
      if (kind === 'personal') {
        cells.push(
          el('input', {
            type: 'number',
            min: '0',
            max: '100',
            value: item.partnerSharePct ?? 0,
            disabled: !canEdit,
            oninput: (e) => (item.partnerSharePct = Math.max(0, Math.min(100, Number(e.target.value) || 0))),
          })
        );
      }
      cells.push(
        el('button', {
          type: 'button',
          class: 'btn btn-danger',
          text: t('remove'),
          disabled: !canEdit,
          onclick: () => {
            state.draft.items.splice(idx, 1);
            renderPlan();
            renderPersonal(1, $('#personal-list-a'));
            renderPersonal(2, $('#personal-list-b'));
          },
        })
      );
      return el('tr', {}, ...cells.map((c) => el('td', {}, c)));
    });
}

function itemTable(headCells, rows, closedText, emptyText) {
  const table = el('table', {});
  const headRow = el('tr', {}, ...headCells.map((h) => el('th', { text: h })));
  table.append(el('thead', {}, headRow), el('tbody', {}, ...rows));
  const wrap = el('div', { class: 'table-wrap' });
  wrap.append(table);
  if (!rows.length) {
    wrap.append(el('p', { class: 'empty-row', text: emptyText ?? t('noItems') }));
  }
  if (closedText) {
    wrap.append(el('p', { class: 'empty-row', text: closedText }));
  }
  return wrap;
}

function addItem(kind, owner) {
  const item = { kind, label: '', amountCents: 0 };
  if (kind === 'personal') {
    item.ownerProfileId = owner;
    item.partnerSharePct = 0;
  }
  state.draft.items.push(item);
  renderPlan();
  renderPersonal(1, $('#personal-list-a'));
  renderPersonal(2, $('#personal-list-b'));
}

function field(labelText, control) {
  return el('div', { class: 'field' },
    el('label', { class: 'field-label', text: labelText }),
    control
  );
}

function renderPlan() {
  const canEdit = editable();
  const box = $('#plan-salaries');
  box.replaceChildren(
    el('h3', { text: t('salaries') }),
    el('div', { class: 'form-grid' },
      ...[1, 2].map((pid) =>
        field(t('salaryFor', { name: state.profiles.find((p) => p.id === pid)?.name ?? pid }),
          moneyInput(state.draft.salaries[pid], (v) => (state.draft.salaries[pid] = v), { disabled: !canEdit }))
      ),
      el('button', {
        type: 'button',
        class: 'btn btn-primary',
        text: t('save'),
        disabled: !canEdit,
        onclick: (e) => withBusy(e.currentTarget, savePlan),
      })
    ),
    el('p', { class: 'hint', text: shareHint() })
  );

  const fixed = $('#plan-fixed');
  fixed.replaceChildren(
    el('h3', { text: t('fixedShared') }),
    itemTable([t('label'), t('amount')], itemRows('fixed'), canEdit ? null : t('monthClosed'), t('noItems')),
    canEdit
      ? el('button', { type: 'button', class: 'btn', text: t('add'), onclick: () => addItem('fixed') })
      : el('p', { class: 'hint', text: t('monthClosed') })
  );

  const variable = $('#plan-variable');
  variable.replaceChildren(
    el('h3', { text: t('variableShared') }),
    itemTable([t('label'), t('amount')], itemRows('variable'), canEdit ? null : t('monthClosed'), t('noItems')),
    canEdit ? el('button', { type: 'button', class: 'btn', text: t('add'), onclick: () => addItem('variable') }) : null
  );
}

async function savePlan() {
  const items = state.draft.items
    .filter((i) => i.label.trim() && i.amountCents > 0)
    .map((i) => ({
      kind: i.kind,
      label: i.label,
      amountCents: i.amountCents,
      ownerProfileId: i.ownerProfileId,
      partnerSharePct: i.partnerSharePct ?? 0,
    }));
  try {
    state.month = await api('PUT', `/api/months/${state.month.ym}/plan`, {
      salaries: state.draft.salaries,
      items,
    });
    state.draft = cloneDraft(state.month);
    renderMonth();
  } catch (err) {
    notifyError(err);
  }
}

function renderPersonal(owner, box) {
  const canEdit = editable();
  box.replaceChildren(
    itemTable([t('label'), t('amount'), t('partnerShare')], itemRows('personal', owner), canEdit ? null : t('monthClosed')),
    canEdit
      ? el('button', { type: 'button', class: 'btn', text: t('add'), onclick: () => addItem('personal', owner) })
      : null
  );
}

/* ---------- live figures (US3) ---------- */

function fig(caption, value) {
  return el('figure', { class: 'fig' },
    el('figcaption', { text: caption }),
    el('span', { class: 'money', text: value })
  );
}

function pct(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

const CATEGORY_COLORS = ['#2e7d32', '#b26a00', '#6a4fb3', '#0b6fa4', '#a63d2f', '#1f5f5b', '#8a6d00', '#595959'];

function colorForCategory(name) {
  let h = 0;
  for (const ch of name ?? '') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CATEGORY_COLORS[h % CATEGORY_COLORS.length];
}

function splitBar(segments, label) {
  const bar = el('div', { class: 'split-bar', role: 'img', 'aria-label': label });
  for (const [cls, w] of segments) {
    if (w > 0) bar.append(el('span', { class: `seg ${cls}`, style: `width:${w}%` }));
  }
  return bar;
}

function legendItem(cls, text) {
  return el('span', { class: 'legend-item' }, el('i', { class: `dot ${cls}`, 'aria-hidden': 'true' }), text);
}

function figRow(label, value) {
  return el('div', { class: 'fig-row' },
    el('span', { class: 'fig-label', text: label }),
    el('span', { class: 'money', text: value })
  );
}

function shareHint() {
  const sal = state.draft?.salaries ?? { 1: 0, 2: 0 };
  const combined = (sal[1] ?? 0) + (sal[2] ?? 0);
  const nameA = state.profiles[0]?.name ?? 'A';
  const nameB = state.profiles[1]?.name ?? 'B';
  if (combined <= 0) return t('noItems');
  const incomePct = pct(state.month?.summary?.sharedPlannedTotal ?? 0, combined);
  return `${nameA} ${pct(sal[1], combined)}% · ${nameB} ${pct(sal[2], combined)}% ${t('ofPlan')} — ${t('fairIncome', { pct: incomePct })}`;
}

function infoTip(text) {
  return el('span', { class: 'info-tip', tabindex: '0' },
    el('i', { class: 'info-icon', 'aria-hidden': 'true', text: 'i' }),
    el('span', { class: 'tip', role: 'note', text }));
}

function renderFigures() {
  const s = state.month.summary;
  const box = $('#figures');
  const names = { A: state.profiles[0]?.name ?? 'A', B: state.profiles[1]?.name ?? 'B' };
  box.replaceChildren();

  const pA = pct(s.shares.A * 100, 100);
  const pB = pct(s.shares.B * 100, 100);
  const incomePct = s.combinedIncome > 0 ? pct(s.sharedPlannedTotal, s.combinedIncome) : null;
  const planBlock = el('div', { class: 'split-block' },
    el('div', { class: 'block-head' },
      el('h3', { text: t('splitOfPlan') }),
      infoTip(t('tipSplit'))),
    splitBar([['seg-a', s.shares.A * 100], ['seg-b', s.shares.B * 100]], `${names.A} ${pA}%, ${names.B} ${pB}%`),
    el('p', { class: 'split-legend' },
      legendItem('seg-a', `${names.A} — ${pA}%`),
      legendItem('seg-b', `${names.B} — ${pB}%`)),
    el('div', { class: 'block-head' },
      el('p', { class: 'hint', text: incomePct != null ? t('fairIncome', { pct: incomePct }) : t('noItems') }),
      infoTip(t('tipIncome')))
  );

  const potPaid = s.actualSpent - s.fronted.A - s.fronted.B;
  const fA = pct(s.fronted.A, s.actualSpent);
  const fB = pct(s.fronted.B, s.actualSpent);
  const fPot = pct(potPaid, s.actualSpent);
  const covBlock = el('div', { class: 'split-block' },
    el('div', { class: 'block-head' },
      el('h3', { text: `${t('coversSpending')} — ${fmtMoney(s.actualSpent)}` }),
      infoTip(t('tipCoverage'))),
    splitBar([['seg-a', fA], ['seg-b', fB], ['seg-pot', fPot]], `${names.A} ${fA}%, ${names.B} ${fB}%, ${t('pot')} ${fPot}%`),
    el('p', { class: 'split-legend' },
      legendItem('seg-a', `${names.A} ${fA}%`),
      legendItem('seg-b', `${names.B} ${fB}%`),
      legendItem('seg-pot', `${t('pot')} ${fPot}%`))
  );

  const cols = el('div', { class: 'partner-cols' },
    ...['A', 'B'].map((p) =>
      el('section', { class: 'partner-col' },
        el('h3', { class: p === 'A' ? 'who-a' : 'who-b', text: `${names[p]} — ${p === 'A' ? pA : pB}% ${t('ofPlan')}` }),
        figRow(t('transferAfterPayday'), fmtMoney(s.contributions[p])),
        figRow(t('ofIncome'), incomePct != null ? `${incomePct}%` : t('none')),
        figRow(t('guaranteedLeft'), fmtMoney(s.guaranteedLeft[p])),
        figRow(t('plannedLeft'), fmtMoney(s.plannedLeft[p])),
        figRow(t('projectedLeft'), fmtMoney(s.projectedLeft[p]))
      )
    )
  );

  let settleLine = figRow(t('settleUp'), t('none'));
  if (s.settle && (s.settle.A !== 0 || s.settle.B !== 0)) {
    const [p, other] = s.settle.A > 0 ? ['A', 'B'] : ['B', 'A'];
    settleLine = el('p', { class: 'settle', text: `${t('settleUp')}: ${names[other]} → ${names[p]} ${fmtMoney(Math.abs(s.settle[p]))}` });
  }
  box.append(
    planBlock,
    covBlock,
    cols,
    el('div', { class: 'split-block' },
      figRow(t('potBalance'), fmtMoney(s.potBalance)),
      settleLine
    )
  );
}

/* ---------- spending log (US4) ---------- */

function renderExpenses() {
  const s = state.month.summary;
  const canEdit = editable();
  const form = $('#expense-form');
  form.replaceChildren();
  if (canEdit) {
    const [yr, mo] = state.month.ym.split('-').map(Number);
    const lastDay = new Date(Date.UTC(yr, mo, 0)).getUTCDate();
    const lastD2 = String(lastDay).padStart(2, '0');
    const dateInput = el('input', { type: 'date', value: `${state.month.ym}-01`, min: `${state.month.ym}-01`, max: `${state.month.ym}-${lastD2}` });
    const descInput = el('input', { type: 'text', placeholder: t('description') });
    const amountInput = el('input', { type: 'number', step: '0.01', min: '0.01', inputmode: 'decimal', placeholder: t('amount') });
    const itemSelect = el('select', {},
      el('option', { value: '', text: `${t('linkItem')}: ${t('unplanned')}` }),
      ...state.month.items
        .filter((i) => i.kind === 'variable')
        .map((i) => el('option', { value: i.id, text: i.label }))
    );
    const payerSelect = el('select', {},
      el('option', { value: '', text: `${t('payer')}: ${t('potPaid')}` }),
      ...state.profiles.map((p) => el('option', { value: p.id, text: p.name }))
    );
    const categorySelect = el('select', {},
      ...state.settings.categories.map((c) => el('option', { value: c, text: c }))
    );
    form.append(
      el('div', { class: 'form-grid' },
        field(t('date'), dateInput),
        field(t('category'), categorySelect),
        field(t('description'), descInput),
        field(t('amount'), amountInput),
        field(t('linkItem'), itemSelect),
        field(t('payer'), payerSelect),
        el('button', {
          type: 'button',
          class: 'btn btn-primary',
          text: t('addExpense'),
          onclick: (e) => withBusy(e.currentTarget, async () => {
            try {
              state.month = await api('POST', `/api/months/${state.month.ym}/expenses`, {
                date: dateInput.value,
                category: categorySelect.value,
                description: descInput.value,
                amountCents: parseMoney(amountInput.value),
                planItemId: itemSelect.value ? Number(itemSelect.value) : null,
                payerProfileId: payerSelect.value ? Number(payerSelect.value) : null,
              });
              renderMonth();
            } catch (err) {
              notifyError(err);
            }
          }),
        })
      )
    );
  }

  const totals = { A: 0, B: 0, pot: 0 };
  for (const e of state.month.expenses) {
    if (e.payerProfileId === 1) totals.A += e.amountCents;
    else if (e.payerProfileId === 2) totals.B += e.amountCents;
    else totals.pot += e.amountCents;
  }
  const strip = el('div', { class: 'paid-strip' },
    el('span', { class: 'paid-chip' },
      el('span', { text: t('paidByStrip', { name: state.profiles[0]?.name ?? 'A' }) }),
      el('span', { class: 'money', text: fmtMoney(totals.A) })),
    el('span', { class: 'paid-chip' },
      el('span', { text: t('paidByStrip', { name: state.profiles[1]?.name ?? 'B' }) }),
      el('span', { class: 'money', text: fmtMoney(totals.B) })),
    el('span', { class: 'paid-chip' },
      el('span', { text: t('pot') }),
      el('span', { class: 'money', text: fmtMoney(totals.pot) }))
  );

  const list = $('#expense-list');
  list.replaceChildren(
    strip,
    itemTable(
      [t('date'), t('category'), t('description'), t('amount'), t('linkItem'), t('payer'), ''],
      state.month.expenses.map((e) => {
        const linked = state.month.items.find((i) => i.id === e.planItemId);
        const payer = state.profiles.find((p) => p.id === e.payerProfileId);
        return el('tr', {},
          el('td', { text: fmtDate(e.date) }),
          el('td', {}, el('span', { class: 'cat-chip' },
            el('i', { class: 'cat-dot', style: `background:${colorForCategory(e.category)}`, 'aria-hidden': 'true' }),
            e.category || t('none'))),
          el('td', { text: e.description }),
          el('td', { class: 'num money', text: fmtMoney(e.amountCents) }),
          el('td', { text: linked?.label ?? t('unplanned') }),
          el('td', { text: payer?.name ?? t('potPaid') }),
          el('td', {},
            canEdit
              ? el('button', {
                  type: 'button',
                  class: 'btn btn-danger',
                  text: t('remove'),
                  onclick: (e) => withBusy(e.currentTarget, async () => {
                    try {
                      state.month = await api('DELETE', `/api/expenses/${e.id}`);
                      renderMonth();
                    } catch (err) {
                      notifyError(err);
                    }
                  }),
                })
              : null
          )
        );
      }), null, t('noExpenses')
    ),
    el('h3', { text: `${t('planned')} / ${t('actual')}` }),
    itemTable(
      [t('label'), t('planned'), t('actual'), t('unplanned')],
      [
        ...s.planVsActual.map((i) =>
          el('tr', {},
            el('td', { text: i.label }),
            el('td', { class: 'num money', text: fmtMoney(i.planned) }),
            el('td', { class: 'num money', text: fmtMoney(i.actual) }),
            el('td', {})
          )
        ),
        el('tr', {},
          el('td', { text: t('unplanned') }),
          el('td', {}),
          el('td', { class: 'num money', text: fmtMoney(s.unplannedTotal) }),
          el('td', {})
        ),
      ]
    )
  );
}

/* ---------- month close (US5) ---------- */

function renderSummaryBody(box, snapshot, month) {
  const names = { A: state.profiles[0]?.name, B: state.profiles[1]?.name };
  const rows = [];
  for (const p of ['A', 'B']) {
    rows.push(el('tr', {},
      el('td', { text: names[p] }),
      el('td', { class: 'num money', text: fmtMoney(snapshot.contributions[p]) }),
      el('td', { class: 'num money', text: fmtMoney(snapshot.fronted[p]) }),
      el('td', { class: 'num money', text: fmtMoney(snapshot.guaranteedLeft[p]) }),
      el('td', { class: 'num money', text: fmtMoney(snapshot.plannedLeft[p]) }),
      el('td', { class: 'num money', text: fmtMoney(snapshot.projectedLeft[p]) })
    ));
  }
  const parts = [
    el('h3', { text: `${month.ym} — ${t('contributions')}` }),
    itemTable(
      [t('label'), t('contributions'), t('paid'), t('guaranteedLeft'), t('plannedLeft'), t('projectedLeft')],
      rows
    ),
    fig(t('potBalance'), fmtMoney(snapshot.potBalance)),
  ];
  if (snapshot.settle && (snapshot.settle.A !== 0 || snapshot.settle.B !== 0)) {
    const [p, other] = snapshot.settle.A > 0 ? ['A', 'B'] : ['B', 'A'];
    parts.push(el('p', { class: 'settle' },
      `${t('settleUp')}: ${names[other]} → ${names[p]} ${fmtMoney(Math.abs(snapshot.settle[p]))}`));
  }
  if (snapshot.personalSupport.length) {
    parts.push(el('h3', { text: t('personalSupport') }));
    parts.push(itemTable(
      [t('label'), t('amount')],
      snapshot.personalSupport.map((s) =>
        el('tr', {},
          el('td', { text: s.label }),
          el('td', {
            class: 'num money',
            text: `${state.profiles.find((p) => p.id === s.ownerProfileId)?.name}: ${fmtMoney(s.ownerPays)} + ${
              state.profiles.find((p) => p.id !== s.ownerProfileId)?.name
            }: ${fmtMoney(s.partnerPays)}`,
          })
        )
      )
    ));
  }
  box.replaceChildren(...parts);
}

let confirmAction = null;

function showConfirm(message, action) {
  confirmAction = action;
  $('#dlg-confirm-msg').textContent = message;
  $('#dlg-confirm').showModal();
}

async function closeMonth() {
  if (!state.month || state.month.status !== 'open') return;
  showConfirm(t('confirmClose'), async () => {
    try {
      const closed = await api('POST', `/api/months/${state.month.ym}/close`);
      renderSummaryBody($('#summary-body'), closed.summary, closed);
      $('#dlg-summary').showModal();
      await refreshState();
      await loadMonths();
    } catch (err) {
      notifyError(err);
    }
  });
}

/* ---------- settings (US6) ---------- */

function segmented(name, options, current) {
  return el('div', { class: 'segmented', role: 'radiogroup' },
    ...options.map(([value, label]) =>
      el('label', {},
        el('input', { type: 'radio', name, value, checked: value === current || null }),
        el('span', { text: label })
      )
    )
  );
}

function renderSettings() {
  const box = $('#settings-body');
  box.replaceChildren();

  const profileEditors = [];
  for (const p of state.profiles) {
    const nameInput = textInput(p.name, () => {});
    let selected = PRESET_IDS.includes(p.theme?.preset) ? p.theme.preset : 'paper';
    let mode = p.theme?.mode === 'dark' ? 'dark' : 'light';
    const presetGrid = el('div', { class: 'preset-grid', role: 'radiogroup', 'aria-label': t('themeColors') });
    const presetButtons = PRESETS.map((pr) => {
      const btn = el('button', {
        type: 'button',
        class: `preset-btn${pr.id === selected ? ' is-selected' : ''}`,
        role: 'radio',
        'aria-checked': pr.id === selected ? 'true' : 'false',
        onclick: () => updateSelection(pr.id),
      },
        el('span', { class: 'preset-dots' }, ...pr.dots.map((c) => el('i', { style: `background:${c}` }))),
        el('span', { class: 'preset-name', text: t(pr.key) })
      );
      return btn;
    });
    const updateSelection = (id) => {
      selected = id;
      presetButtons.forEach((b, i) => {
        const on = PRESETS[i].id === id;
        b.classList.toggle('is-selected', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      applyTheme({ theme: { preset: id, mode } });
    };
    presetGrid.append(...presetButtons);
    const modeGroup = segmented(`mode-${p.id}`, [['light', t('light')], ['dark', t('dark')]], mode);
    modeGroup.addEventListener('change', (e) => {
      mode = e.target.value;
      applyTheme({ theme: { preset: selected, mode } });
    });
    profileEditors.push({ id: p.id, nameInput, getTheme: () => ({ preset: selected, mode }) });
    box.append(
      el('div', { class: 'stack' },
        el('h3', { text: p.name }),
        field(t('label'), nameInput),
        field(t('themeColors'), presetGrid),
        field(t('mode'), modeGroup),
        el('div', { class: 'form-grid' },
          el('button', {
            type: 'button',
            class: 'btn',
            text: t('resetTheme'),
            onclick: () => {
              updateSelection('paper');
              mode = 'light';
              modeGroup.querySelector('input[value="light"]').checked = true;
              applyTheme({ theme: { preset: 'paper', mode: 'light' } });
            },
          })
        )
      )
    );
  }

  const currencyInput = el('input', { type: 'text', value: state.settings.currencyCode, maxlength: '3' });
  const langGroup = segmented('lang', [['en', 'English'], ['pl', 'Polski']], state.settings.language);
  const catBox = el('div', { class: 'stack' });
  const renderCats = () => {
    catBox.replaceChildren(
      ...state.settings.categories.map((cat, idx) =>
        el('div', { class: 'form-grid cat-row' },
          el('span', { class: 'cat-dot', style: `background:${colorForCategory(cat)}`, 'aria-hidden': 'true' }),
          field(t('label'), textInput(cat, (v) => (state.settings.categories[idx] = v))),
          el('button', {
            type: 'button',
            class: 'btn btn-danger',
            text: t('remove'),
            onclick: () => {
              state.settings.categories.splice(idx, 1);
              renderCats();
            },
          })
        )
      ),
      el('button', {
        type: 'button',
        class: 'btn',
        text: t('add'),
        onclick: () => {
          state.settings.categories.push('');
          renderCats();
        },
      })
    );
  };
  renderCats();
  box.append(
    el('div', { class: 'stack' },
      el('h3', { text: t('currency') }),
      el('div', { class: 'form-grid' },
        field(t('currency'), currencyInput),
        field(t('language'), langGroup)
      ),
      el('h3', { text: t('categories') }),
      catBox
    ),
    el('div', { class: 'form-grid' },
      el('button', {
        type: 'button',
        class: 'btn btn-primary btn-lg',
        text: t('save'),
        onclick: (e) => withBusy(e.currentTarget, async () => {
          try {
            for (const p of profileEditors) {
              await api('PUT', `/api/profiles/${p.id}`, { name: p.nameInput.value, theme: p.getTheme() });
            }
            await api('PUT', '/api/settings', {
              currencyCode: currencyInput.value.toUpperCase(),
              language: langGroup.querySelector('input:checked')?.value ?? 'en',
              categories: state.settings.categories.filter((c) => c.trim()),
            });
            await refreshState();
            renderSettings();
            renderMonth();
            notify('ok', t('saved'));
          } catch (err) {
            notifyError(err);
          }
        }),
      })
    )
  );
}

/* ---------- leftover log (US7) ---------- */

async function renderLeftovers(historyData) {
  const box = $('#leftovers-body');
  const ym = state.mostRecentClosedYm;
  if (!ym) {
    box.replaceChildren(el('p', { class: 'hint', text: t('noLeftoverMonth') }));
    return;
  }
  let data = historyData;
  if (!data) {
    try {
      data = await api('GET', `/api/months/${ym}/history`);
    } catch (err) {
      showErrorMessage(err);
      return;
    }
  }
  const editableMonth = ym === state.mostRecentClosedYm;
  const amountInput = el('input', { type: 'number', step: '0.01', min: '0.01', inputmode: 'decimal', placeholder: t('amount') });
  const noteInput = el('input', { type: 'text', placeholder: t('note') });
  const profileSelect = el('select', {},
    ...state.profiles.map((p) => el('option', { value: p.id, text: p.name }))
  );
  const categorySelect = el('select', {},
    ...state.settings.categories.map((c) => el('option', { value: c, text: c }))
  );
  box.replaceChildren(
    el('p', { class: 'hint', text: `${ym} — ${editableMonth ? t('editHint') : t('readOnly')}` }),
    editableMonth
      ? el('div', { class: 'form-grid' },
          field(t('profileLabel'), profileSelect),
          field(t('amount'), amountInput),
          field(t('category'), categorySelect),
          field(t('note'), noteInput),
          el('button', {
            type: 'button',
            class: 'btn btn-primary',
            text: t('addEntry'),
            onclick: (e) => withBusy(e.currentTarget, async () => {
              try {
                const { leftovers } = await api('POST', `/api/months/${ym}/leftovers`, {
                  profileId: Number(profileSelect.value),
                  amountCents: parseMoney(amountInput.value),
                  category: categorySelect.value,
                  note: noteInput.value,
                });
                renderLeftovers({ ...data, leftovers });
              } catch (err) {
                notifyError(err);
              }
            }),
          })
        )
      : null,
    itemTable(
      [t('profileLabel') || 'Profile', t('amount'), t('category'), t('note'), ''],
      data.leftovers.map((entry) =>
        el('tr', {},
          el('td', { text: state.profiles.find((p) => p.id === entry.profileId)?.name }),
          el('td', { class: 'num money', text: fmtMoney(entry.amountCents) }),
          el('td', { text: entry.category }),
          el('td', { text: entry.note }),
          el('td', {},
            editableMonth
              ? el('button', {
                  type: 'button',
                  class: 'btn btn-danger',
                  text: t('remove'),
                  onclick: (e) => withBusy(e.currentTarget, async () => {
                    try {
                      const { leftovers } = await api('DELETE', `/api/leftovers/${entry.id}`);
                      renderLeftovers({ ...data, leftovers });
                    } catch (err) {
                      notifyError(err);
                    }
                  }),
                })
              : null
          )
        )
      )
    ), null, t('nothingYet')
  );
}

/* ---------- history (US8) ---------- */

async function renderHistory() {
  const box = $('#history-body');
  const closed = state.months.filter((m) => m.status === 'closed');
  if (!closed.length) {
    box.replaceChildren(el('p', { class: 'hint', text: t('historyEmpty') }));
    return;
  }
  box.replaceChildren();
  try {
    const histories = await Promise.all(
      closed.map((m) => api('GET', `/api/months/${m.ym}/history`))
    );
    for (const data of histories) {
      const section = el('section', { class: 'card' });
      renderSummaryBody(section, data.snapshot, data);
      box.append(el('h3', { text: data.ym }), section);
    }
  } catch (err) {
    showErrorMessage(err);
  }
}

/* ---------- wiring ---------- */

function showErrorMessage(err) {
  console.error(err);
  notify('error', `${t('error')}: ${err.message}`);
}

async function init() {
  $('#profile-switch').addEventListener('change', (e) => setProfile(Number(e.target.value)));
  $('#month-switch').addEventListener('change', (e) => e.target.value && loadMonth(e.target.value));
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.querySelector('.panel-close')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog && dialog.id !== 'dlg-pick') dialog.close();
    });
  }
  $('#dlg-confirm-cancel').addEventListener('click', () => {
    confirmAction = null;
    $('#dlg-confirm').close();
  });
  $('#dlg-confirm-ok').addEventListener('click', async (e) => {
    const action = confirmAction;
    confirmAction = null;
    $('#dlg-confirm').close();
    if (action) await withBusy(e.currentTarget, action);
  });
  $('#btn-create-month').addEventListener('click', (e) => withBusy(e.currentTarget, async () => {
    try {
      state.month = await api('POST', '/api/months', { ym: state.currentYm });
      await refreshState();
      await loadMonths();
    } catch (err) {
      showErrorMessage(err);
    }
  }));
  $('#btn-close-month').addEventListener('click', closeMonth);
  $('#btn-settings').addEventListener('click', () => {
    renderSettings();
    $('#dlg-settings').showModal();
  });
  $('#btn-history').addEventListener('click', () => {
    renderHistory();
    $('#dlg-history').showModal();
  });
  $('#btn-leftovers').addEventListener('click', () => {
    renderLeftovers();
    $('#dlg-leftovers').showModal();
  });
  refreshState()
    .then(loadMonths)
    .catch(showErrorMessage)
    .finally(() => document.getElementById('boot')?.remove());
}

init();
