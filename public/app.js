/* Honeypot frontend — vanilla JS, no build step. One screen + slide-over dialogs. */

const I18N = {
  en: {
    profileLabel: 'Current profile',
    monthLabel: 'Month',
    settings: 'Settings',
    history: 'History',
    leftoverLog: 'Leftover log',
    closeMonth: 'Close month',
    personalObligatory: 'Personal obligatory',
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
    none: '—',
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
    noLeftoverMonth: 'No closed month yet — the leftover log opens after the first close.',
    readOnly: 'Read-only',
    editHint: 'Editable only for the most recently closed month.',
    historyEmpty: 'No closed months yet.',
    guaranteed: 'Guaranteed',
    plannedWord: 'Planned',
    error: 'Error',
    cancel: 'Cancel',
    confirm: 'Confirm',
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
    else node.setAttribute(k, v);
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
function fmtMoney(cents) {
  if (!numberFormatter || numberFormatter.resolvedOptions().currency !== state.settings.currencyCode) {
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

function applyTheme(profile) {
  const theme = profile?.theme ?? {};
  const root = document.documentElement;
  root.dataset.mode = theme.mode ?? 'light';
  const map = {
    '--accent': theme.accent,
    '--bg': theme.background,
    '--surface': theme.surface,
    '--fg': theme.text,
    '--ink': theme.text,
    '--paper': theme.background,
  };
  for (const [prop, value] of Object.entries(map)) {
    if (value) root.style.setProperty(prop, value);
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
        class: 'primary',
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
}

async function refreshState() {
  const s = await api('GET', '/api/state');
  state.profiles = s.profiles;
  state.settings = s.settings;
  state.currentYm = s.currentYm;
  state.openMonth = s.openMonth;
  applyI18n();
  renderHeader();
  if (!state.profileId || !state.profiles.some((p) => p.id === state.profileId)) {
    showProfilePick();
  } else {
    const profile = currentProfile();
    if (profile) applyTheme(profile);
  }
}

function init() {
  $('#profile-switch').addEventListener('change', (e) => setProfile(Number(e.target.value)));
  for (const dialog of document.querySelectorAll('dialog.panel')) {
    dialog.querySelector('.panel-close')?.addEventListener('click', () => dialog.close());
  }
  refreshState().catch((err) => console.error(err));
}

init();
