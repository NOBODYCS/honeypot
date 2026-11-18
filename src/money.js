export function combinedIncome(salaryA, salaryB) {
  return salaryA + salaryB;
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

export function personalOut(items, profileId) {
  let out = 0;
  for (const item of items) {
    if (item.kind !== 'personal') continue;
    const pct = item.partnerSharePct ?? 0;
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
    const pct = item.partnerSharePct ?? 0;
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

  const contribution = splitBySalary(sharedPlannedTotal, salaryA, salaryB);
  const fixedShare = splitBySalary(fixedTotal, salaryA, salaryB);
  const variableShare = splitBySalary(variablePlannedTotal, salaryA, salaryB);

  const outA = personalOut(items, 1);
  const outB = personalOut(items, 2);

  const guaranteedLeft = {
    A: salaryA - fixedShare.a - outA,
    B: salaryB - fixedShare.b - outB,
  };
  const plannedLeft = {
    A: guaranteedLeft.A - variableShare.a,
    B: guaranteedLeft.B - variableShare.b,
  };

  const actualSpent = expenses.reduce((s, e) => s + e.amountCents, 0);
  const actualShare = splitBySalary(fixedTotal + actualSpent, salaryA, salaryB);
  const projectedLeft = {
    A: salaryA - actualShare.a - outA,
    B: salaryB - actualShare.b - outB,
  };

  const fronted = { A: 0, B: 0 };
  let potPaid = 0;
  for (const e of expenses) {
    if (e.payerProfileId === 1) fronted.A += e.amountCents;
    else if (e.payerProfileId === 2) fronted.B += e.amountCents;
    else potPaid += e.amountCents;
  }
  const settle = settleUp({ frontedA: fronted.A, frontedB: fronted.B, salaryA, salaryB });

  const potBalance = sharedPlannedTotal - fixedTotal - potPaid;
  const potReturn = splitBySalary(potBalance, salaryA, salaryB);

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
    guaranteedLeft,
    plannedLeft,
    actualSpent,
    projectedLeft,
    fronted,
    settle,
    potBalance,
    potReturn,
    personalSupport: personalSupport(items),
    planVsActual,
    unplannedTotal: unplanned,
  };
}
