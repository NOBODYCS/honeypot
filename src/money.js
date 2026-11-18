export function combinedIncome(salaryA, salaryB) {
  return salaryA + salaryB;
}

/* ---------- fair-share split suggestions (advisory only, never applied silently) ----------
   Eligible items: shared fixed/variable items whose partnerSharePct is unset (< 0 = auto).
   Items with a manual % are never touched. Target: if all suggestions were accepted, both
   partners contribute the same % of their own salary, i.e. contribution(P) = share(P) ×
   sharedTotal (equal % of own salary ⟺ salary-proportional split of the whole plan).
   One shared integer % for all auto items = proportional per item with exact cent sums
   (R15: each item still splits as amount − floor(amount × pctB / 100)). */
export function suggestFairSplit(items, salaryA, salaryB) {
  const combined = combinedIncome(salaryA, salaryB);
  const shared = items.filter((i) => i.kind === 'fixed' || i.kind === 'variable');
  if (combined <= 0 || shared.length === 0) return { suggestions: [], exact: false, clamped: false };
  const total = shared.reduce((s, i) => s + i.amountCents, 0);
  const fair = splitBySalary(total, salaryA, salaryB);
  let manualA = 0;
  const auto = [];
  for (const item of shared) {
    const pct = item.partnerSharePct;
    if (pct != null && pct >= 0) {
      manualA += item.amountCents - Math.floor((item.amountCents * pct) / 100);
    } else {
      auto.push(item);
    }
  }
  const autoTotal = auto.reduce((s, i) => s + i.amountCents, 0);
  if (autoTotal <= 0 && manualA === fair.a) return { suggestions: [], adjustments: [], exact: true, clamped: false };
  let targetA = fair.a - manualA;
  const clamped = targetA < 0 || targetA > autoTotal;
  targetA = Math.max(0, Math.min(autoTotal, targetA));
  const pctA = autoTotal > 0 ? Math.max(0, Math.min(100, Math.round((targetA * 100) / autoTotal))) : 0;
  const suggestions = auto.map((item) => ({ item, pctB: 100 - pctA, adjust: false }));
  /* Impossible to equalize with auto items alone: also suggest changing the custom
     (manual) values — distribute the remaining correction over them, proportional to
     amount, each kept within 0-100. Still only a suggestion, never auto-applied. */
  const adjustments = [];
  if (clamped) {
    const manual = shared.filter((i) => i.partnerSharePct != null && i.partnerSharePct >= 0);
    const manualTotal = manual.reduce((s, i) => s + i.amountCents, 0);
    const residual = fair.a - targetA - manualA; /* A-amount still off after pinning auto items */
    if (manualTotal > 0 && residual !== 0) {
      let assigned = 0;
      manual.forEach((item, k) => {
        const curA = item.amountCents - Math.floor((item.amountCents * item.partnerSharePct) / 100);
        let newA = k === manual.length - 1
          ? Math.max(0, Math.min(item.amountCents, curA + residual - assigned))
          : Math.max(0, Math.min(item.amountCents, Math.round(curA + (residual * item.amountCents) / manualTotal)));
        assigned += newA - curA;
        const pctB = Math.max(0, Math.min(100, Math.round(((item.amountCents - newA) * 100) / item.amountCents)));
        if (pctB !== item.partnerSharePct) adjustments.push({ item, pctB, adjust: true });
      });
    }
  }
  return { suggestions, adjustments, exact: !clamped, clamped, pctA, targetA, autoTotal };
}

/* ---------- spinner-free numeric entry (pure, shared client/server) ----------
   Fields are plain text inputs (inputmode decimal/numeric). Live filtering keeps only
   digits and at most one decimal separator ('.' or ',' — normalized on parse). */
export function sanitizeNumericInput(raw, { decimal = true } = {}) {
  let s = String(raw ?? '').replace(/[^0-9.,]/g, '');
  if (!decimal) return s.replace(/[.,]/g, '');
  const first = s.search(/[.,]/);
  if (first !== -1) s = s.slice(0, first + 1) + s.slice(first + 1).replace(/[.,]/g, '');
  return s;
}

/* '.' and ',' are both accepted as the decimal separator; result is integer cents. */
export function parseFlexibleMoney(str) {
  const n = Number.parseFloat(String(str ?? '').replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/* blur snap: money fields show one separator and exactly 2 decimals */
export function formatMoneyInput(cents) {
  return ((cents ?? 0) / 100).toFixed(2);
}

/* blur snap: percent fields show an integer 0-100 ('' stays empty = auto) */
export function formatPctInput(value) {
  if (value == null || value === '') return '';
  return String(Math.max(0, Math.min(100, Math.round(Number(value) || 0))));
}

export function splitBySalary(totalCents, salaryA, salaryB) {
  const combined = combinedIncome(salaryA, salaryB);
  if (combined <= 0 || totalCents <= 0) {
    return { a: 0, b: 0 };
  }
  const a = Math.floor((totalCents * salaryA) / combined);
  return { a, b: totalCents - a };
}

export function settleUp({ frontedA, frontedB, salaryA, salaryB }) {
  const frontedTotal = frontedA + frontedB;
  if (frontedTotal === 0) {
    return null;
  }
  const share = splitBySalary(frontedTotal, salaryA, salaryB);
  return { A: frontedA - share.a, B: frontedB - share.b };
}

function personalPct(item) {
  return item.partnerSharePct != null && item.partnerSharePct >= 0 ? item.partnerSharePct : 0;
}

/* Shared items: partnerSharePct >= 0 overrides the salary split for that item
   (pct = share covered by partner B, remainder to A). pct < 0 (unset) = salary split. */
export function splitShared(items, salaryA, salaryB) {
  let a = 0;
  let b = 0;
  const rest = [];
  for (const item of items) {
    const pct = item.partnerSharePct;
    if (pct != null && pct >= 0) {
      const pb = Math.floor((item.amountCents * pct) / 100);
      a += item.amountCents - pb;
      b += pb;
    } else {
      rest.push(item);
    }
  }
  const restTotal = rest.reduce((sum, i) => sum + i.amountCents, 0);
  const rs = splitBySalary(restTotal, salaryA, salaryB);
  return { a: a + rs.a, b: b + rs.b };
}

export function personalOut(items, profileId) {
  let out = 0;
  for (const item of items) {
    if (item.kind !== 'personal') continue;
    const pct = personalPct(item);
    const amount = item.amountCents;
    if (item.ownerProfileId === profileId) {
      out += amount - Math.floor((amount * pct) / 100);
    } else {
      out += Math.floor((amount * pct) / 100);
    }
  }
  return out;
}

export function personalSupport(items) {
  const lines = [];
  for (const item of items) {
    const pct = personalPct(item);
    if (item.kind !== 'personal' || pct <= 0) continue;
    const partnerPays = Math.floor((item.amountCents * pct) / 100);
    lines.push({
      label: item.label,
      ownerProfileId: item.ownerProfileId,
      partnerSharePct: pct,
      ownerPays: item.amountCents - partnerPays,
      partnerPays,
    });
  }
  return lines;
}

export function computeSummary({ salaryA, salaryB, items, expenses }) {
  const fixedItems = items.filter((i) => i.kind === 'fixed');
  const variableItems = items.filter((i) => i.kind === 'variable');
  const fixedTotal = fixedItems.reduce((s, i) => s + i.amountCents, 0);
  const variablePlannedTotal = variableItems.reduce((s, i) => s + i.amountCents, 0);
  const sharedPlannedTotal = fixedTotal + variablePlannedTotal;

  const combined = combinedIncome(salaryA, salaryB);
  const shares =
    combined > 0 ? { A: salaryA / combined, B: salaryB / combined } : { A: 0, B: 0 };

  const fixedShare = splitShared(fixedItems, salaryA, salaryB);
  const variableShare = splitShared(variableItems, salaryA, salaryB);
  const contribution = { a: fixedShare.a + variableShare.a, b: fixedShare.b + variableShare.b };

  const outA = personalOut(items, 1);
  const outB = personalOut(items, 2);

  /* No-pot model: partners pay shared costs from their own salaries. Leftovers are
     computed live from what was actually spent so far (fixed costs are assumed paid). */
  const actualSpent = expenses.reduce((s, e) => s + e.amountCents, 0);
  const actualVariable = splitBySalary(actualSpent, salaryA, salaryB);
  const actualShare = { a: fixedShare.a + actualVariable.a, b: fixedShare.b + actualVariable.b };
  const leftAfterShared = { A: salaryA - actualShare.a, B: salaryB - actualShare.b };
  const leftAfterPersonal = { A: leftAfterShared.A - outA, B: leftAfterShared.B - outB };

  /* Settle-up is the balance equation over the SUM of what each partner fronted:
     settle(P) = fronted(P) − share(P) × Σ fronted. Positive: chipped in more, gets
     paid back; negative: owes. The two lines always sum to zero. */
  const fronted = { A: 0, B: 0 };
  for (const e of expenses) {
    if (e.payerProfileId === 1) fronted.A += e.amountCents;
    else if (e.payerProfileId === 2) fronted.B += e.amountCents;
  }
  const settle = settleUp({ frontedA: fronted.A, frontedB: fronted.B, salaryA, salaryB });

  const linked = new Map();
  let unplanned = 0;
  for (const e of expenses) {
    if (e.planItemId != null) {
      linked.set(e.planItemId, (linked.get(e.planItemId) ?? 0) + e.amountCents);
    } else {
      unplanned += e.amountCents;
    }
  }
  const planVsActual = variableItems.map((i) => ({
    id: i.id,
    label: i.label,
    planned: i.amountCents,
    actual: linked.get(i.id) ?? 0,
  }));

  return {
    combinedIncome: combined,
    salaries: { A: salaryA, B: salaryB },
    shares,
    fixedTotal,
    variablePlannedTotal,
    sharedPlannedTotal,
    contributions: { A: contribution.a, B: contribution.b },
    fixedShare: { A: fixedShare.a, B: fixedShare.b },
    variableShare: { A: variableShare.a, B: variableShare.b },
    actualShare: { A: actualShare.a, B: actualShare.b },
    personalOut: { A: outA, B: outB },
    leftAfterShared,
    leftAfterPersonal,
    actualSpent,
    fronted,
    settle,
    personalSupport: personalSupport(items),
    planVsActual,
    unplannedTotal: unplanned,
  };
}
