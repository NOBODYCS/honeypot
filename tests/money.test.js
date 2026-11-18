import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitBySalary,
  personalOut,
  computeSummary,
  settleUp,
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

test('R5/R6: plannedLeft = guaranteedLeft - variable share', () => {
  for (let i = 0; i < 500; i++) {
    const salaryA = randomCents(400000);
    const salaryB = randomCents(400000);
    const fixedTotal = randomCents(100000);
    const variableTotal = randomCents(100000);
    const personalA = randomCents(50000);
    const personalB = randomCents(50000);
    const s = computeSummary({
      salaryA,
      salaryB,
      items: [
        { kind: 'fixed', amountCents: fixedTotal },
        { kind: 'variable', amountCents: variableTotal },
        { kind: 'personal', amountCents: personalA, ownerProfileId: 1, partnerSharePct: 0 },
        { kind: 'personal', amountCents: personalB, ownerProfileId: 2, partnerSharePct: 0 },
      ],
      expenses: [],
    });
    for (const p of ['A', 'B']) {
      assert.equal(s.plannedLeft[p], s.guaranteedLeft[p] - s.variableShare[p]);
      assert.equal(
        s.guaranteedLeft[p],
        s.salaries[p] - s.fixedShare[p] - s.personalOut[p]
      );
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

test('R7: projectedLeft uses actualSpent in place of variable plan', () => {
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
    assert.equal(
      s.projectedLeft[p],
      s.salaries[p] - s.actualShare[p] - s.personalOut[p]
    );
    assert.equal(s.actualShare[p] + s.actualShare[p === 'A' ? 'B' : 'A'], s.fixedTotal + s.actualSpent);
  }
});

test('R8: pot balance and settle-up with fronted expenses', () => {
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
      { amountCents: 30000, payerProfileId: null },
      { amountCents: 12000, payerProfileId: 2 },
    ],
  });
  assert.equal(s.potBalance, 150000 - 90000 - 30000);
  assert.equal(s.fronted.A, 0);
  assert.equal(s.fronted.B, 12000);
  assert.ok(s.settle);
  assert.equal(s.settle.A + s.settle.B, 0);
  assert.equal(s.settle.B, 12000 - Math.floor((12000 * 100000) / 400000));
  assert.equal(s.potReturn.a + s.potReturn.b, s.potBalance);
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
