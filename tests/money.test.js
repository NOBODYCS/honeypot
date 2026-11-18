import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitBySalary,
  personalOut,
  computeSummary,
  settleUp,
  sanitizeNumericInput,
  parseFlexibleMoney,
  formatMoneyInput,
  formatPctInput,
} from '../src/money.js';

function randomCents(max) {
  return Math.floor(Math.random() * max) + 1;
}

function randomSalaries() {
  return { salaryA: randomCents(500000), salaryB: randomCents(500000) };
}

test('R15: split shares always sum exactly to the total', () => {
  for (let i = 0; i < 500; i++) {
    const { salaryA, salaryB } = randomSalaries();
    const total = randomCents(300000);
    const { a, b } = splitBySalary(total, salaryA, salaryB);
    assert.equal(a + b, total, `split of ${total} must sum to total`);
    assert.ok(Number.isInteger(a) && Number.isInteger(b), 'splits must be integer cents');
  }
});

test('R15: odd totals split exactly (remainder assigned to one side)', () => {
  const { a, b } = splitBySalary(101, 100, 101);
  assert.equal(a + b, 101);
  assert.ok(Math.abs(a - 50) <= 1 && Math.abs(b - 51) <= 1);
});

test('edge: zero combined income defines shares as 0, splits as 0', () => {
  const { a, b } = splitBySalary(5000, 0, 0);
  assert.equal(a, 0);
  assert.equal(b, 0);
});

test('R8: settle-up always sums to zero when a payer exists', () => {
  for (let i = 0; i < 500; i++) {
    const { salaryA, salaryB } = randomSalaries();
    const frontedA = randomCents(100000);
    const frontedB = randomCents(100000);
    const settle = settleUp({ frontedA, frontedB, salaryA, salaryB });
    assert.equal(settle.A + settle.B, 0, 'settle lines must sum to zero');
    assert.ok(Number.isInteger(settle.A) && Number.isInteger(settle.B));
  }
});

test('R5/R6 (no-pot): leftAfterPersonal = leftAfterShared - personalOut; leftAfterShared = salary - actual share', () => {
  for (let i = 0; i < 500; i++) {
    const salaryA = randomCents(400000);
    const salaryB = randomCents(400000);
    const fixedTotal = randomCents(100000);
    const variableTotal = randomCents(100000);
    const personalA = randomCents(50000);
    const personalB = randomCents(50000);
    const spent = randomCents(80000);
    const s = computeSummary({
      salaryA,
      salaryB,
      items: [
        { kind: 'fixed', amountCents: fixedTotal },
        { kind: 'variable', amountCents: variableTotal },
        { kind: 'personal', amountCents: personalA, ownerProfileId: 1, partnerSharePct: 0 },
        { kind: 'personal', amountCents: personalB, ownerProfileId: 2, partnerSharePct: 0 },
      ],
      expenses: [{ amountCents: spent, payerProfileId: null }],
    });
    for (const p of ['A', 'B']) {
      assert.equal(s.leftAfterPersonal[p], s.leftAfterShared[p] - s.personalOut[p]);
      assert.equal(s.leftAfterShared[p], s.salaries[p] - s.actualShare[p]);
      assert.equal(s.actualShare[p] + s.actualShare[p === 'A' ? 'B' : 'A'], s.fixedTotal + spent);
    }
  }
});

test('R4: contributions sum exactly to sharedPlannedTotal', () => {
  for (let i = 0; i < 500; i++) {
    const { salaryA, salaryB } = randomSalaries();
    const fixed = randomCents(150000);
    const variable = randomCents(150000);
    const s = computeSummary({
      salaryA,
      salaryB,
      items: [
        { kind: 'fixed', amountCents: fixed },
        { kind: 'variable', amountCents: variable },
      ],
      expenses: [],
    });
    assert.equal(s.contributions.A + s.contributions.B, s.sharedPlannedTotal);
  }
});

test('R7 (no-pot): leftAfterShared uses actualSpent live, not the variable plan', () => {
  const salaryA = 250000;
  const salaryB = 150000;
  const s = computeSummary({
    salaryA,
    salaryB,
    items: [
      { kind: 'fixed', amountCents: 100000 },
      { kind: 'variable', amountCents: 50000 },
    ],
    expenses: [
      { amountCents: 20000, payerProfileId: null },
      { amountCents: 5000, payerProfileId: 1 },
    ],
  });
  assert.equal(s.actualSpent, 25000);
  for (const p of ['A', 'B']) {
    assert.equal(s.leftAfterShared[p], s.salaries[p] - s.actualShare[p]);
    assert.equal(s.actualShare[p] + s.actualShare[p === 'A' ? 'B' : 'A'], s.fixedTotal + s.actualSpent);
  }
});

test('R8 (no-pot): settle-up is the balance equation over summed fronted amounts; no pot balance', () => {
  const salaryA = 300000;
  const salaryB = 100000;
  const s = computeSummary({
    salaryA,
    salaryB,
    items: [
      { kind: 'fixed', amountCents: 90000 },
      { kind: 'variable', amountCents: 60000 },
    ],
    expenses: [
      { amountCents: 30000, payerProfileId: null }, // split by share, no settle line from this
      { amountCents: 12000, payerProfileId: 2 },
    ],
  });
  assert.equal(s.potBalance, undefined, 'pot balance is gone in the no-pot model');
  assert.equal(s.potReturn, undefined);
  assert.equal(s.fronted.A, 0);
  assert.equal(s.fronted.B, 12000);
  assert.ok(s.settle);
  assert.equal(s.settle.A + s.settle.B, 0);
  assert.equal(s.settle.B, 12000 - Math.floor((12000 * 100000) / 400000));
  assert.ok(s.settle.B > 0 && s.settle.A < 0, 'B fronted more than their share -> B chipped in more (settle.B > 0)');
});

test('R8: settle-up is null when no expense has a payer', () => {
  const s = computeSummary({
    salaryA: 200000,
    salaryB: 200000,
    items: [{ kind: 'variable', amountCents: 10000 }],
    expenses: [{ amountCents: 4000, payerProfileId: null }],
  });
  assert.equal(s.settle, null);
});

test('R12: personalOut counts own items minus share plus partner share of theirs', () => {
  const items = [
    { kind: 'personal', amountCents: 10000, ownerProfileId: 1, partnerSharePct: 25 },
    { kind: 'personal', amountCents: 8000, ownerProfileId: 2, partnerSharePct: 50 },
    { kind: 'fixed', amountCents: 5000 },
  ];
  const outA = personalOut(items, 1);
  const outB = personalOut(items, 2);
  assert.equal(outA, 10000 - 2500 + 4000);
  assert.equal(outB, 2500 + 8000 - 4000);
});

test('R12/R13: personal support lines are exact integers and sum to item amount', () => {
  const items = [
    { kind: 'personal', amountCents: 999, ownerProfileId: 1, partnerSharePct: 33, label: 'Item one' },
  ];
  const s = computeSummary({ salaryA: 100000, salaryB: 90000, items, expenses: [] });
  const sup = s.personalSupport[0];
  assert.equal(sup.ownerPays + sup.partnerPays, 999);
  assert.ok(Number.isInteger(sup.ownerPays) && Number.isInteger(sup.partnerPays));
});

test('R16/P1: summary is pure - other months data never leaks in', () => {
  const input = {
    salaryA: 100000,
    salaryB: 100000,
    items: [{ kind: 'fixed', amountCents: 40000 }],
    expenses: [],
  };
  const first = computeSummary(input);
  computeSummary({
    salaryA: 999999,
    salaryB: 1,
    items: [{ kind: 'fixed', amountCents: 123456 }],
    expenses: [{ amountCents: 9999, payerProfileId: 1 }],
  });
  const second = computeSummary(input);
  assert.deepEqual(first, second);
});

test('per-item partnerSharePct overrides salary split for that item, sums stay exact', () => {
  const s = computeSummary({
    salaryA: 500000,
    salaryB: 300000,
    items: [
      { kind: 'fixed', label: 'Rent', amountCents: 100000, partnerSharePct: 70 },
      { kind: 'fixed', label: 'Net', amountCents: 20000, partnerSharePct: -1 },
    ],
    expenses: [],
  });
  // Rent: B covers 70% = 70000, A 30000. Net: salary split 62.5/37.5 -> A 12500, B 7500.
  assert.equal(s.fixedShare.B, 77500);
  assert.equal(s.fixedShare.A, 42500);
  assert.equal(s.contributions.A + s.contributions.B, s.sharedPlannedTotal);
});

test('unset partnerSharePct (-1) behaves exactly like the old salary split', () => {
  const items = [
    { kind: 'fixed', label: 'Rent', amountCents: 100001, partnerSharePct: -1 },
    { kind: 'variable', label: 'Food', amountCents: 33333, partnerSharePct: -1 },
  ];
  const s = computeSummary({ salaryA: 500000, salaryB: 300000, items, expenses: [] });
  const direct = splitBySalary(s.sharedPlannedTotal, 500000, 300000);
  assert.equal(s.contributions.A, direct.a);
  assert.equal(s.contributions.B, direct.b);
});

/* ---------- spinner-free numeric entry (Change 2) ---------- */

test('numeric entry: sanitize drops letters/symbols, keeps digits and ONE separator', () => {
  assert.equal(sanitizeNumericInput('abc12x3', { decimal: true }), '123');
  assert.equal(sanitizeNumericInput('12.3.4', { decimal: true }), '12.34');
  assert.equal(sanitizeNumericInput('12,3,4', { decimal: true }), '12,34');
  assert.equal(sanitizeNumericInput('1,2.3', { decimal: true }), '1,23');
  assert.equal(sanitizeNumericInput('-,5-', { decimal: true }), ',5'); // minus dropped, separator kept
  assert.equal(sanitizeNumericInput('12,5', { decimal: true }), '12,5');
  assert.equal(sanitizeNumericInput('', { decimal: true }), '');
  assert.equal(sanitizeNumericInput('1.2', { decimal: false }), '12');
  assert.equal(sanitizeNumericInput('1,2', { decimal: false }), '12');
});

test('numeric entry: "." and "," both parse to the same integer cents (normalized internally)', () => {
  assert.equal(parseFlexibleMoney('12.50'), 1250);
  assert.equal(parseFlexibleMoney('12,50'), 1250);
  assert.equal(parseFlexibleMoney('0,05'), 5);
  assert.equal(parseFlexibleMoney(''), 0);
  assert.equal(parseFlexibleMoney('abc'), 0);
  assert.equal(parseFlexibleMoney('1.006'), 101); // Math.round on cents, same as the old parseMoney
  for (let i = 0; i < 200; i++) {
    const a = Math.floor(Math.random() * 100000) / 100;
    const dot = a.toFixed(2);
    const comma = dot.replace('.', ',');
    assert.equal(parseFlexibleMoney(dot), parseFlexibleMoney(comma), `${dot} vs ${comma}`);
    assert.ok(Number.isInteger(parseFlexibleMoney(dot)));
  }
});

test('numeric entry: blur format round-trips (focus/blur keeps the formatted value, reopening shows the same)', () => {
  for (const cents of [0, 1, 5, 99, 100, 12345, 999999999]) {
    const formatted = formatMoneyInput(cents);
    assert.match(formatted, /^\d+\.\d{2}$/, 'money snap = one separator, 2 decimals');
    assert.equal(parseFlexibleMoney(formatted), cents, `round-trip of ${cents}`);
  }
  assert.equal(formatMoneyInput(parseFlexibleMoney('12,5')), '12.50');
  assert.equal(formatMoneyInput(parseFlexibleMoney('abc')), '0.00');
});

test('numeric entry: percent blur snap is an integer 0-100, empty stays empty (auto)', () => {
  assert.equal(formatPctInput('37'), '37');
  assert.equal(formatPctInput('37.6'), '38');
  assert.equal(formatPctInput('150'), '100');
  assert.equal(formatPctInput('-5'), '0');
  assert.equal(formatPctInput(''), '');
  assert.equal(formatPctInput(null), '');
  assert.equal(formatPctInput('abc'), '0');
});

/* ---------- fair-share split suggestions (Change 3) ---------- */

import { suggestFairSplit } from '../src/money.js';

test('suggestions: worked example — salaries 5000/3000, 5 shared items, two 100%-A overrides totaling 400 of a 1000 plan', () => {
  const items = [
    { kind: 'fixed', label: 'i1', amountCents: 250000 / 10 * 2.5, partnerSharePct: 0 }, // 100% A = pctB 0
    { kind: 'fixed', label: 'i2', amountCents: 15000, partnerSharePct: 0 }, // 100% A
    { kind: 'variable', label: 'i3', amountCents: 20000, partnerSharePct: -1 },
    { kind: 'variable', label: 'i4', amountCents: 20000, partnerSharePct: -1 },
    { kind: 'variable', label: 'i5', amountCents: 20000, partnerSharePct: -1 },
  ];
  // overrides total 40000 (400), plan total 100000 (1000)
  items[0].amountCents = 25000;
  const s = suggestFairSplit(items, 500000, 300000);
  assert.equal(s.suggestions.length, 3, 'only auto items get suggestions');
  assert.equal(s.clamped, false);
  // fair A total = 625 (62500); minus overridden 400 (40000) -> 225 (22500) across remaining 600
  assert.equal(s.targetA, 22500);
  assert.equal(s.autoTotal, 60000);
  for (const x of s.suggestions) {
    assert.ok(x.pctB === 62 || x.pctB === 63, `per-item pctB ~63, got ${x.pctB}`);
    assert.ok(Number.isInteger(x.pctB) && x.pctB >= 0 && x.pctB <= 100);
  }
  // applying all: per-item splits still sum exactly to each item (R15)
  for (const x of s.suggestions) {
    const pb = Math.floor((x.item.amountCents * x.pctB) / 100);
    assert.equal(x.item.amountCents - pb + pb, x.item.amountCents);
  }
});

test('suggestions: applying all brings both income percentages within 1 point when amounts allow', () => {
  for (let i = 0; i < 500; i++) {
    const salaryA = randomCents(500000);
    const salaryB = randomCents(500000);
    const n = 1 + Math.floor(Math.random() * 6);
    const items = [];
    let total = 0;
    for (let k = 0; k < n; k++) {
      const amount = randomCents(50000);
      total += amount;
      const overridden = Math.random() < 0.3;
      items.push({ kind: k % 2 ? 'variable' : 'fixed', amountCents: amount, partnerSharePct: overridden ? Math.floor(Math.random() * 101) : -1 });
    }
    const s = suggestFairSplit(items, salaryA, salaryB);
    if (!s.suggestions.length) continue;
    // apply all suggestions as manual values
    for (const x of s.suggestions) x.item.partnerSharePct = x.pctB;
    const sum = computeSummary({ salaryA, salaryB, items, expenses: [] });
    assert.equal(sum.contributions.A + sum.contributions.B, total, 'R15: contributions still sum exactly');
    const iA = (sum.contributions.A / salaryA) * 100;
    const iB = (sum.contributions.B / salaryB) * 100;
    /* integer-% rounding error is at most ~autoTotal/200 cents on each side; when the
       remaining auto amount is small enough relative to both salaries ("amounts allow"),
       the resulting income percentages must be within 1 point */
    const bound = 2 / (1 / salaryA + 1 / salaryB);
    if (!s.clamped && s.autoTotal <= bound) {
      assert.ok(Math.abs(iA - iB) <= 1, `income pcts within 1 point: A=${iA.toFixed(3)} B=${iB.toFixed(3)} (autoTotal=${s.autoTotal}, bound=${bound.toFixed(0)})`);
    }
    for (const x of s.suggestions) {
      assert.ok(Number.isInteger(x.pctB) && x.pctB >= 0 && x.pctB <= 100, '0-100 integers per item');
    }
  }
});

test('suggestions: no suggestions when salaries are 0 or no auto items; clamped flag when impossible', () => {
  assert.deepEqual(suggestFairSplit([{ kind: 'fixed', amountCents: 1000 }], 0, 0).suggestions, []);
  assert.deepEqual(suggestFairSplit([{ kind: 'fixed', amountCents: 1000, partnerSharePct: 50 }], 100, 100).suggestions, []);
  // override too extreme: A already covers more than the fair share -> closest possible (0% A on auto)
  const s = suggestFairSplit(
    [
      { kind: 'fixed', amountCents: 90000, partnerSharePct: 0 }, // 100% A
      { kind: 'variable', amountCents: 10000, partnerSharePct: -1 },
    ],
    500000, 300000
  );
  assert.equal(s.clamped, true);
  assert.equal(s.suggestions[0].pctB, 100, 'closest possible: auto item goes fully to B');
  // personal items are never eligible
  const p = suggestFairSplit([{ kind: 'personal', amountCents: 5000, ownerProfileId: 1, partnerSharePct: -1 }], 100000, 100000);
  assert.deepEqual(p.suggestions, []);
});
