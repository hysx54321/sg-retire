import { project, type Inputs } from './engine';
import { FIELD_DEFS } from '../types';

export type ShortfallAdvice = {
  years: number[];
  /** Highest retirement age searched. */
  retirementSearchCap: number;
  /** Smallest retirement age that clears the shortfall without changing spend. */
  laterRetirementAge: number | null;
  /** Highest today's-dollar monthly spend that clears the shortfall at the planned retirement age. */
  maxMonthlySpend: number | null;
  /** Used when working longer still requires a lower spend. Null when retiring later alone is enough. */
  combined: { retirementAge: number; monthlySpend: number } | null;
};

function clears(inputs: Inputs): boolean {
  return project(inputs).summary.cashShortfallYears.length === 0;
}

function retirementCap(inputs: Inputs): number {
  return Math.min(80, Math.max(inputs.retirementAge, inputs.projectionEndAge));
}

/** Largest monthly spend, rounded down to $10, that keeps investments at or above zero. */
function maxMonthlySpend(inputs: Inputs): number | null {
  if (!clears({ ...inputs, monthlySpend: 0 })) return null;
  if (clears(inputs)) return inputs.monthlySpend;
  let lo = 0;
  let hi = Math.max(0, inputs.monthlySpend);
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (clears({ ...inputs, monthlySpend: mid })) lo = mid;
    else hi = mid;
  }
  let spend = Math.floor(lo / 10) * 10;
  while (spend > 0 && !clears({ ...inputs, monthlySpend: spend })) spend -= 10;
  return spend;
}

export function suggestShortfallFixes(inputs: Inputs): ShortfallAdvice | null {
  const base = project(inputs);
  const years = base.summary.cashShortfallYears;
  if (years.length === 0) return null;

  const firstShortfallAge = base.rows.find((row) => years.includes(row.year))?.age ?? inputs.retirementAge;
  // Years before retirement are already working years. A later retirement age does not change them.
  const retirementCanHelp = firstShortfallAge >= inputs.retirementAge;

  const cap = retirementCap(inputs);
  let laterRetirementAge: number | null = null;
  if (retirementCanHelp) {
    for (let age = inputs.retirementAge + 1; age <= cap; age++) {
      if (clears({ ...inputs, retirementAge: age })) {
        laterRetirementAge = age;
        break;
      }
    }
  }

  const maxSpend = maxMonthlySpend(inputs);
  let combined: ShortfallAdvice['combined'] = null;
  if (retirementCanHelp && laterRetirementAge == null) {
    let bestAge = inputs.retirementAge;
    let bestSpend = maxSpend;
    for (let age = inputs.retirementAge + 1; age <= cap; age++) {
      const spend = maxMonthlySpend({ ...inputs, retirementAge: age });
      if (spend == null) continue;
      if (bestSpend == null || spend > bestSpend + 9) {
        bestSpend = spend;
        bestAge = age;
      }
    }
    if (bestSpend != null && bestAge !== inputs.retirementAge) {
      combined = { retirementAge: bestAge, monthlySpend: bestSpend };
    }
  }

  return {
    years,
    retirementSearchCap: cap,
    laterRetirementAge,
    maxMonthlySpend: maxSpend != null && maxSpend < inputs.monthlySpend ? maxSpend : null,
    combined,
  };
}

export type HeadroomAdvice = {
  /** Earliest retirement age that keeps investments from falling after 65, at the current monthly spend. */
  earlierRetirementAge: number | null;
  /** Highest today's-dollar monthly spend that keeps investments from falling after 65, at the planned retirement age. */
  higherMonthlySpend: number | null;
};

/** From the year after 65, each year-end investment balance is at least the year before. Earlier years may fall. */
function preservesCapitalAfter65(candidate: Inputs): boolean {
  const rows = project(candidate).rows;
  let previous: number | null = null;
  let checked = false;
  for (const row of rows) {
    if (row.age > 65) {
      if (previous == null || row.investmentBalance < previous - 1) return false;
      checked = true;
    }
    previous = row.investmentBalance;
  }
  return checked;
}

function earliestRetirementAge(inputs: Inputs): number | null {
  const formMin = FIELD_DEFS.find((field) => field.key === 'retirementAge')?.min ?? inputs.currentAge;
  const floor = Math.max(inputs.currentAge, formMin);
  if (inputs.retirementAge <= floor) return null;
  if (!preservesCapitalAfter65(inputs)) return null;
  let earliest: number | null = null;
  for (let age = floor; age < inputs.retirementAge; age++) {
    if (preservesCapitalAfter65({ ...inputs, retirementAge: age })) {
      earliest = age;
      break;
    }
  }
  return earliest;
}

function higherMonthlySpend(inputs: Inputs): number | null {
  if (!preservesCapitalAfter65(inputs)) return null;
  const accepts = (monthlySpend: number) => preservesCapitalAfter65({ ...inputs, monthlySpend });
  if (!accepts(inputs.monthlySpend + 10)) return null;
  let lo = inputs.monthlySpend;
  let hi = Math.max(inputs.monthlySpend + 1_000, inputs.monthlySpend * 2);
  const ceiling = 200_000;
  while (hi < ceiling && accepts(hi)) {
    lo = hi;
    hi = Math.min(ceiling, hi * 2);
  }
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (accepts(mid)) lo = mid;
    else hi = mid;
  }
  let spend = Math.floor(lo / 10) * 10;
  while (spend > inputs.monthlySpend && !accepts(spend)) spend -= 10;
  return spend > inputs.monthlySpend ? spend : null;
}

/** How much earlier you can retire, or how much more you can spend, without investments falling after 65. */
export function suggestHeadroom(inputs: Inputs): HeadroomAdvice | null {
  const earlierRetirementAgeResult = earliestRetirementAge(inputs);
  const higherMonthlySpendResult = higherMonthlySpend(inputs);
  if (earlierRetirementAgeResult == null && higherMonthlySpendResult == null) return null;
  return {
    earlierRetirementAge: earlierRetirementAgeResult,
    higherMonthlySpend: higherMonthlySpendResult,
  };
}
