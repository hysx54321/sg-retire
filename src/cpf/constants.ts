/**
 * CPF / housing / inflation reference data for Singapore (as of 2026).
 * Sources: CPF Board, IRAS, MAS, MoneySense. Assumptions are documented in ASSUMPTIONS.md.
 */

export const CURRENT_YEAR = 2026;

/** Ordinary Wage monthly ceiling from 1 Jan 2026 */
export const OW_CEILING = 8_000;

/** Annual wage ceiling (OW subject to CPF + AW subject to CPF) */
export const ANNUAL_WAGE_CEILING = 102_000;

/** Base interest rates (p.a.) — floors currently binding */
export const OA_INTEREST = 0.025;
export const SA_MA_RA_INTEREST = 0.04;

/** Extra interest on combined balances (OA portion capped at $20k) */
export const EXTRA_INTEREST_OA_CAP = 20_000;
export const EXTRA_INTEREST_COMBINED_CAP = 60_000;
export const EXTRA_INTEREST_BELOW_55 = 0.01;
export const EXTRA_INTEREST_55_FIRST_30K = 0.02;
export const EXTRA_INTEREST_55_NEXT_30K = 0.01;

/** Basic Healthcare Sum 2026 for members aged ≤65 */
export const BHS_2026 = 79_000;
/** Approximate annual growth of BHS for members under 65 */
export const BHS_GROWTH = 0.04;

/** Retirement sums for members who turn 55 in 2026 */
export const BRS_2026 = 110_200;
export const FRS_2026 = 220_400;
export const ERS_2026 = 440_800;
/** Historical / announced ~3.5% annual uplift used to project future cohort FRS */
export const RETIREMENT_SUM_GROWTH = 0.035;

/**
 * Estimated CPF LIFE Standard Plan monthly payout at age 65
 * for the 2026 cohort who set aside the sum at 55 (CPF Board published estimates).
 */
export const LIFE_PAYOUT_AT_65 = {
  brs: 950,
  frs: 1_780,
  ers: 3_440,
} as const;

/** CPF LIFE payout eligibility age; default start if user does not defer */
export const CPF_LIFE_START_AGE = 65;
export const CPF_LIFE_AUTO_START_AGE = 70;
/** Approx payout uplift per year of deferral (CPF: up to 7%) */
export const CPF_LIFE_DEFER_UPLIFT = 0.07;

/** Full contribution rates (citizen / PR 3rd year+) from 1 Jan 2026, wages > $750 */
export type ContributionBand = {
  maxAge: number; // inclusive upper bound of "above X – Y" style; use Infinity for last
  minAgeExclusive: number;
  employer: number;
  employee: number;
};

export const CONTRIBUTION_RATES: ContributionBand[] = [
  { minAgeExclusive: -Infinity, maxAge: 55, employer: 0.17, employee: 0.2 },
  { minAgeExclusive: 55, maxAge: 60, employer: 0.16, employee: 0.18 },
  { minAgeExclusive: 60, maxAge: 65, employer: 0.125, employee: 0.125 },
  { minAgeExclusive: 65, maxAge: 70, employer: 0.09, employee: 0.075 },
  { minAgeExclusive: 70, maxAge: Infinity, employer: 0.075, employee: 0.05 },
];

/** Allocation ratios of total contribution (MA first, then SA/RA, remainder OA) */
export type AllocationBand = {
  minAgeExclusive: number;
  maxAge: number;
  oa: number;
  saOrRa: number;
  ma: number;
};

export const ALLOCATION_RATES: AllocationBand[] = [
  { minAgeExclusive: -Infinity, maxAge: 35, oa: 0.6217, saOrRa: 0.1621, ma: 0.2162 },
  { minAgeExclusive: 35, maxAge: 45, oa: 0.5677, saOrRa: 0.1891, ma: 0.2432 },
  { minAgeExclusive: 45, maxAge: 50, oa: 0.5136, saOrRa: 0.2162, ma: 0.2702 },
  { minAgeExclusive: 50, maxAge: 55, oa: 0.4055, saOrRa: 0.3108, ma: 0.2837 },
  { minAgeExclusive: 55, maxAge: 60, oa: 0.353, saOrRa: 0.3382, ma: 0.3088 },
  { minAgeExclusive: 60, maxAge: 65, oa: 0.14, saOrRa: 0.44, ma: 0.42 },
  { minAgeExclusive: 65, maxAge: 70, oa: 0.0607, saOrRa: 0.303, ma: 0.6363 },
  { minAgeExclusive: 70, maxAge: Infinity, oa: 0.08, saOrRa: 0.08, ma: 0.84 },
];

/** Default long-run inflation planning assumption (~MAS / historical mid) */
export const DEFAULT_INFLATION = 0.02;

/** Default salary real growth (on top of inflation when salaryGrowthMode = real) */
export const DEFAULT_SALARY_GROWTH = 0.02;

/** Bank housing loan assumptions for a PR-only buyer (no HDB concessionary loan) */
export const DEFAULT_LTV = 0.75;
export const DEFAULT_LOAN_RATE = 0.035;
export const DEFAULT_LOAN_TENURE_YEARS = 25;
export const PR_ABSD_FIRST = 0.05;

/** Buyer's Stamp Duty residential brackets (from 15 Feb 2023) */
export const BSD_BRACKETS: { upTo: number; rate: number }[] = [
  { upTo: 180_000, rate: 0.01 },
  { upTo: 360_000, rate: 0.02 },
  { upTo: 1_000_000, rate: 0.03 },
  { upTo: 1_500_000, rate: 0.04 },
  { upTo: 3_000_000, rate: 0.05 },
  { upTo: Infinity, rate: 0.06 },
];

export function contributionRatesForAge(age: number): { employer: number; employee: number; total: number } {
  const band = CONTRIBUTION_RATES.find((b) => age > b.minAgeExclusive && age <= b.maxAge)!;
  return { employer: band.employer, employee: band.employee, total: band.employer + band.employee };
}

export function allocationForAge(age: number): AllocationBand {
  return ALLOCATION_RATES.find((b) => age > b.minAgeExclusive && age <= b.maxAge)!;
}

export function frsForCohortTurning55In(year: number): number {
  const yearsFrom2026 = year - 2026;
  return FRS_2026 * Math.pow(1 + RETIREMENT_SUM_GROWTH, yearsFrom2026);
}

export function brsForCohortTurning55In(year: number): number {
  return frsForCohortTurning55In(year) / 2;
}

export function computeBsd(price: number): number {
  let remaining = price;
  let prev = 0;
  let duty = 0;
  for (const bracket of BSD_BRACKETS) {
    const slice = Math.min(remaining, bracket.upTo - prev);
    if (slice <= 0) break;
    duty += slice * bracket.rate;
    remaining -= slice;
    prev = bracket.upTo;
  }
  return Math.floor(duty);
}

export function computeAbsdPrFirst(price: number): number {
  return Math.floor(price * PR_ABSD_FIRST);
}

/**
 * Resident tax on chargeable income, from YA 2024 onwards.
 * IRAS left this scale unchanged for YA 2026 and YA 2027. No rebate in those years.
 * Each rate applies only inside its band.
 */
const RESIDENT_TAX_BANDS: { upTo: number; rate: number }[] = [
  { upTo: 20_000, rate: 0 },
  { upTo: 30_000, rate: 0.02 },
  { upTo: 40_000, rate: 0.035 },
  { upTo: 80_000, rate: 0.07 },
  { upTo: 120_000, rate: 0.115 },
  { upTo: 160_000, rate: 0.15 },
  { upTo: 200_000, rate: 0.18 },
  { upTo: 240_000, rate: 0.19 },
  { upTo: 280_000, rate: 0.195 },
  { upTo: 320_000, rate: 0.2 },
  { upTo: 500_000, rate: 0.22 },
  { upTo: 1_000_000, rate: 0.23 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.24 },
];

/** Cap on the total of all personal reliefs, including CPF relief. */
export const PERSONAL_RELIEF_CAP = 80_000;

/** Earned Income Relief by age on 31 Dec of the income year. Capped at taxable earned income. */
export function earnedIncomeRelief(age: number, taxableEarnedIncome: number): number {
  const cap = age < 55 ? 1_000 : age < 60 ? 6_000 : 8_000;
  return Math.min(cap, Math.max(0, taxableEarnedIncome));
}

export function residentIncomeTax(chargeableIncome: number): number {
  let remaining = Math.max(0, chargeableIncome);
  let floor = 0;
  let tax = 0;
  for (const band of RESIDENT_TAX_BANDS) {
    const slice = Math.min(remaining, band.upTo - floor);
    tax += slice * band.rate;
    remaining -= slice;
    floor = band.upTo;
    if (remaining <= 0) break;
  }
  return tax;
}
