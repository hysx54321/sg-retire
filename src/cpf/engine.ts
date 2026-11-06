import {
  ANNUAL_WAGE_CEILING,
  BHS_2026,
  BHS_GROWTH,
  CPF_LIFE_AUTO_START_AGE,
  CPF_LIFE_DEFER_UPLIFT,
  CPF_LIFE_START_AGE,
  CURRENT_YEAR,
  EXTRA_INTEREST_55_FIRST_30K,
  EXTRA_INTEREST_55_NEXT_30K,
  EXTRA_INTEREST_BELOW_55,
  EXTRA_INTEREST_COMBINED_CAP,
  EXTRA_INTEREST_OA_CAP,
  LIFE_PAYOUT_AT_65,
  OA_INTEREST,
  OW_CEILING,
  SA_MA_RA_INTEREST,
  allocationForAge,
  brsForCohortTurning55In,
  computeAbsdPrFirst,
  computeBsd,
  contributionRatesForAge,
  earnedIncomeRelief,
  frsForCohortTurning55In,
  PERSONAL_RELIEF_CAP,
  residentIncomeTax,
} from './constants';

export type Inputs = {
  currentAge: number;
  cashSavings: number;
  monthlySalary: number;
  oa: number;
  sa: number;
  ma: number;
  housePrice: number;
  housePurchaseAge: number;
  investmentReturn: number;
  monthlySpend: number;
  retirementAge: number;
  inflation: number;
  salaryGrowth: number;
  loanRate: number;
  loanTenureYears: number;
  ltv: number;
  cpfLifeStartAge: number;
  projectionEndAge: number;
  /** 0 keeps the original tenure. Otherwise the outstanding loan is paid from OA, then investments, at this age. */
  loanPayoffAge: number;
  bonusMode: 'percent' | 'amount';
  /** Share of that year's annual salary. Used when bonusMode is percent. */
  bonusPercent: number;
  /** Annual bonus in today's dollars. Grows with salary growth. Used when bonusMode is amount. */
  bonusAmount: number;
};

export type YearRow = {
  year: number;
  age: number;
  phase: 'working' | 'retired';
  salaryNet: number;
  bonus: number;
  cpfLife: number;
  investmentDraw: number;
  incomeTotal: number;
  livingSpend: number;
  /** Monthly resident income tax on that year's salary and bonus. */
  incomeTax: number;
  mortgage: number;
  expenditureTotal: number;
  investmentBalance: number;
  loanBalance: number;
  oa: number;
  sa: number;
  ma: number;
  ra: number;
  cpfTotal: number;
  annualCpfEmployee: number;
  annualCpfEmployer: number;
  annualInvested: number;
  annualMortgagePaid: number;
  netCashflow: number;
  notes: string[];
};

export type ProjectionResult = {
  rows: YearRow[];
  summary: {
    frsAt55: number;
    brsAt55: number;
    raAt55: number;
    withdrawableAt55: number;
    estimatedLifePayout: number;
    houseStampDuty: number;
    initialLoan: number;
    cashShortfallYears: number[];
    retirementFundingGapMonthly: number;
  };
  assumptions: string[];
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function pmt(rateMonthly: number, nPeriods: number, principal: number): number {
  if (principal <= 0 || nPeriods <= 0) return 0;
  if (Math.abs(rateMonthly) < 1e-12) return principal / nPeriods;
  const f = Math.pow(1 + rateMonthly, nPeriods);
  return (principal * rateMonthly * f) / (f - 1);
}

function extraInterestAmount(age: number, oa: number, sa: number, ma: number, ra: number): number {
  const oaEligible = Math.min(Math.max(oa, 0), EXTRA_INTEREST_OA_CAP);
  const combined = oaEligible + Math.max(sa, 0) + Math.max(ma, 0) + Math.max(ra, 0);
  if (age < 55) {
    return Math.min(combined, EXTRA_INTEREST_COMBINED_CAP) * EXTRA_INTEREST_BELOW_55;
  }
  const first = Math.min(combined, 30_000) * EXTRA_INTEREST_55_FIRST_30K;
  const next = Math.min(Math.max(combined - 30_000, 0), 30_000) * EXTRA_INTEREST_55_NEXT_30K;
  return first + next;
}

/**
 * Map RA balance at payout start → monthly Standard Plan estimate.
 * CPF Board quotes assume the sum is set aside at 55 and then compounds to 65,
 * so we deflate the published $/sum ratio by ~10y of RA interest when applying
 * it to the balance observed at payout age (avoids double-counting growth).
 */
function estimateLifePayout(raAtPayoutStart: number, startAge: number, cohortTurn55Year: number): number {
  const frs = frsForCohortTurning55In(cohortTurn55Year);
  const brs = frs / 2;
  const ers = frs * 2;
  const growthYears = Math.max(0, CPF_LIFE_START_AGE - 55);
  const grown = (sumAt55: number) => sumAt55 * Math.pow(1 + SA_MA_RA_INTEREST, growthYears);

  const scale = frs / 220_400;
  const pBrs = LIFE_PAYOUT_AT_65.brs * scale;
  const pFrs = LIFE_PAYOUT_AT_65.frs * scale;
  const pErs = LIFE_PAYOUT_AT_65.ers * scale;

  const gBrs = grown(brs);
  const gFrs = grown(frs);
  const gErs = grown(ers);

  let base = 0;
  if (raAtPayoutStart <= 0) base = 0;
  else if (raAtPayoutStart <= gBrs) base = (raAtPayoutStart / gBrs) * pBrs;
  else if (raAtPayoutStart <= gFrs) base = pBrs + ((raAtPayoutStart - gBrs) / (gFrs - gBrs)) * (pFrs - pBrs);
  else if (raAtPayoutStart <= gErs) base = pFrs + ((raAtPayoutStart - gFrs) / (gErs - gFrs)) * (pErs - pFrs);
  else base = pErs * (raAtPayoutStart / gErs);

  const deferYears = clamp(startAge - CPF_LIFE_START_AGE, 0, CPF_LIFE_AUTO_START_AGE - CPF_LIFE_START_AGE);
  return base * Math.pow(1 + CPF_LIFE_DEFER_UPLIFT, deferYears);
}

function yearlyBonus(inputs: Inputs, salaryGrossMonthly: number, yearsFromNow: number): number {
  if (inputs.bonusMode === 'amount') {
    return Math.max(0, inputs.bonusAmount) * Math.pow(1 + inputs.salaryGrowth, yearsFromNow);
  }
  return Math.max(0, salaryGrossMonthly) * 12 * Math.max(0, inputs.bonusPercent);
}

function bhsCeiling(age: number, yearsFromNow: number, ageNow: number): number {
  if (age >= 65) {
    const yearsUntil65FromToday = 65 - ageNow;
    return BHS_2026 * Math.pow(1 + BHS_GROWTH, Math.max(0, yearsUntil65FromToday));
  }
  return BHS_2026 * Math.pow(1 + BHS_GROWTH, yearsFromNow);
}

function creditMaOverflow(
  ma: number,
  overflow: number,
  age: number,
  sa: number,
  oa: number,
  ra: number,
  frs: number,
): { ma: number; sa: number; oa: number; ra: number } {
  ma = Math.max(0, ma - overflow);
  if (age < 55) {
    return { ma, sa: sa + overflow, oa, ra };
  }
  const room = Math.max(0, frs - ra);
  const toRa = Math.min(overflow, room);
  return { ma, sa, oa: oa + (overflow - toRa), ra: ra + toRa };
}

export function project(inputs: Inputs): ProjectionResult {
  let oa = Math.max(0, inputs.oa);
  let sa = Math.max(0, inputs.sa);
  let ma = Math.max(0, inputs.ma);
  let ra = 0;
  let invest = inputs.cashSavings;
  let loan = 0;
  let monthsLeft = 0;
  let mortgageMonthly = 0;
  let lifePayout = 0;
  let lifeStarted = false;
  let houseBought = false;
  let raAt55 = 0;
  let withdrawableAt55 = 0;
  let stampDutyTotal = 0;
  let initialLoan = 0;
  let estimatedLifePayout = 0;
  const cashShortfallYears: number[] = [];

  const turn55Year = CURRENT_YEAR + Math.max(0, 55 - inputs.currentAge);
  const frsAt55 = frsForCohortTurning55In(turn55Year);
  const brsAt55 = brsForCohortTurning55In(turn55Year);
  const lifeStart = clamp(inputs.cpfLifeStartAge, CPF_LIFE_START_AGE, CPF_LIFE_AUTO_START_AGE);
  const endAge = Math.max(inputs.projectionEndAge, inputs.retirementAge + 5, lifeStart + 5, 90);

  const rows: YearRow[] = [];

  // If already past 55, seed RA as if the age-55 transfer already happened.
  if (inputs.currentAge > 55) {
    let need = frsAt55;
    const fromSa = Math.min(sa, need);
    sa -= fromSa;
    need -= fromSa;
    const fromOa = Math.min(oa, need);
    oa -= fromOa;
    ra = fromSa + fromOa + sa;
    sa = 0;
    raAt55 = ra;
    withdrawableAt55 = oa;
  }

  if (inputs.currentAge > lifeStart) {
    lifePayout = estimateLifePayout(ra, lifeStart, turn55Year);
    estimatedLifePayout = lifePayout;
    lifeStarted = true;
  }

  for (let age = inputs.currentAge; age <= endAge; age++) {
    const yearsFromNow = age - inputs.currentAge;
    const year = CURRENT_YEAR + yearsFromNow;
    const notes: string[] = [];
    const working = age < inputs.retirementAge;

    const livingMonthly = inputs.monthlySpend * Math.pow(1 + inputs.inflation, yearsFromNow);
    const salaryGross = working
      ? inputs.monthlySalary * Math.pow(1 + inputs.salaryGrowth, yearsFromNow)
      : 0;

    // House purchase at the configured age
    if (!houseBought && age === inputs.housePurchaseAge && inputs.housePrice > 0) {
      const bsd = computeBsd(inputs.housePrice);
      const absd = computeAbsdPrFirst(inputs.housePrice);
      stampDutyTotal = bsd + absd;
      const loanAmt = inputs.housePrice * inputs.ltv;
      const downpayment = inputs.housePrice - loanAmt;
      // ABSD cannot be paid from CPF. A bank loan also requires a minimum cash downpayment:
      // 5% of price at the 75% LTV, 10% when LTV is 55% or below. OA pays the rest, then cash.
      const cashMinRate = inputs.ltv <= 0.55 ? 0.1 : 0.05;
      const cashMinDown = Math.min(downpayment, inputs.housePrice * cashMinRate);
      const oaEligible = Math.max(0, downpayment - cashMinDown) + bsd;
      const oaUse = Math.min(oa, oaEligible);
      oa -= oaUse;
      const cashUse = absd + cashMinDown + (oaEligible - oaUse);
      invest -= cashUse;
      loan = loanAmt;
      initialLoan = loanAmt;
      monthsLeft = inputs.loanTenureYears * 12;
      mortgageMonthly = pmt(inputs.loanRate / 12, monthsLeft, loan);
      houseBought = true;
      notes.push(
        `Home purchase $${Math.round(inputs.housePrice).toLocaleString()} · BSD $${bsd.toLocaleString()} + PR ABSD $${absd.toLocaleString()} · loan $${Math.round(loanAmt).toLocaleString()} · OA $${Math.round(oaUse).toLocaleString()} · cash $${Math.round(cashUse).toLocaleString()}`,
      );
    }

    // Age 55: create RA from SA then OA up to FRS; close SA
    if (age === 55) {
      let need = frsAt55;
      const fromSa = Math.min(sa, need);
      sa -= fromSa;
      need -= fromSa;
      const fromOa = Math.min(oa, need);
      oa -= fromOa;
      ra = fromSa + fromOa;
      if (sa > 0) {
        ra += sa;
        sa = 0;
        notes.push('Leftover SA moved into RA (SA closed from 55)');
      }
      raAt55 = ra;
      withdrawableAt55 = oa;
      if (ra >= frsAt55) {
        notes.push(
          `FRS met ($${Math.round(frsAt55).toLocaleString()}) · withdrawable OA $${Math.round(oa).toLocaleString()}`,
        );
      } else {
        notes.push(
          `RA $${Math.round(ra).toLocaleString()} < FRS $${Math.round(frsAt55).toLocaleString()} (BRS $${Math.round(brsAt55).toLocaleString()})`,
        );
      }
    }

    // CPF LIFE
    if (!lifeStarted && age === lifeStart) {
      if (ra < frsAt55) {
        const top = Math.min(oa, frsAt55 - ra);
        oa -= top;
        ra += top;
        if (top > 0) notes.push(`OA→RA $${Math.round(top).toLocaleString()} before payouts`);
      }
      lifePayout = estimateLifePayout(ra, lifeStart, turn55Year);
      estimatedLifePayout = lifePayout;
      lifeStarted = true;
      notes.push(`CPF LIFE starts · ~$${Math.round(lifePayout).toLocaleString()}/mo (Standard Plan estimate)`);
    }

    // Employment CPF for the year, including additional wages from the yearly bonus.
    let annualEmployee = 0;
    let annualEmployer = 0;
    let employeeOnOrdinary = 0;
    let annualBonusNet = 0;
    const bonusGross = working ? yearlyBonus(inputs, salaryGross, yearsFromNow) : 0;
    if (working && (salaryGross > 750 || bonusGross > 0)) {
      const rates = contributionRatesForAge(age);
      const monthlyOw = Math.min(Math.max(salaryGross, 0), OW_CEILING);
      const owAnnual = salaryGross > 750 ? Math.min(monthlyOw * 12, ANNUAL_WAGE_CEILING) : 0;
      const awRoom = Math.max(0, ANNUAL_WAGE_CEILING - owAnnual);
      const awSubject = Math.min(bonusGross, awRoom);
      const yearTotal = (owAnnual + awSubject) * rates.total;
      employeeOnOrdinary = owAnnual * rates.employee;
      const employeeOnBonus = awSubject * rates.employee;
      annualEmployee = employeeOnOrdinary + employeeOnBonus;
      annualEmployer = (owAnnual + awSubject) * rates.employer;
      annualBonusNet = bonusGross - employeeOnBonus;
      addCpfContribution(yearTotal, age, yearsFromNow);
    }

    function addCpfContribution(total: number, contribAge: number, yearOffset: number) {
      if (total <= 0) return;
      const alloc = allocationForAge(contribAge);
      const maAdd = total * alloc.ma;
      const saRaAdd = total * alloc.saOrRa;
      const oaAdd = total - maAdd - saRaAdd;
      ma += maAdd;
      const bhs = bhsCeiling(contribAge, yearOffset, inputs.currentAge);
      if (ma > bhs) {
        const overflow = ma - bhs;
        const next = creditMaOverflow(ma, overflow, contribAge, sa, oa, ra, frsAt55);
        ma = next.ma;
        sa = next.sa;
        oa = next.oa;
        ra = next.ra;
      }
      if (contribAge < 55) {
        sa += saRaAdd;
        oa += oaAdd;
      } else {
        const room = Math.max(0, frsAt55 - ra);
        const toRa = Math.min(saRaAdd, room);
        ra += toRa;
        oa += oaAdd + (saRaAdd - toRa);
      }
    }

    // Interest on CPF
    const oaInt = oa * OA_INTEREST;
    const saInt = sa * SA_MA_RA_INTEREST;
    const maInt = ma * SA_MA_RA_INTEREST;
    const raInt = lifeStarted ? 0 : ra * SA_MA_RA_INTEREST;
    const extra = extraInterestAmount(age, oa, sa, ma, lifeStarted ? 0 : ra);

    oa += oaInt;
    sa += saInt;
    ma += maInt;
    if (!lifeStarted) ra += raInt;

    if (age < 55) sa += extra;
    else if (!lifeStarted) ra += extra;
    // After LIFE starts, extra on remaining OA/MA still boosts retirement — credit to OA as residual liquid CPF
    else oa += extra;

    // Optional lump-sum repayment at the start of the chosen age, OA first.
    let mortgagePaid = 0;
    let mortgageThisMonth = 0;
    if (
      inputs.loanPayoffAge >= inputs.currentAge &&
      age === inputs.loanPayoffAge &&
      loan > 1 &&
      age >= inputs.housePurchaseAge
    ) {
      const payoff = loan;
      const fromOa = Math.min(oa, payoff);
      oa -= fromOa;
      invest -= payoff - fromOa;
      loan = 0;
      monthsLeft = 0;
      mortgageMonthly = 0;
      notes.push(
        `Loan paid off: $${Math.round(fromOa).toLocaleString()} from OA, $${Math.round(payoff - fromOa).toLocaleString()} from investments`,
      );
    }

    let mortgageFromOa = 0;
    if (loan > 0 && monthsLeft > 0) {
      mortgageThisMonth = mortgageMonthly;
      for (let m = 0; m < 12 && monthsLeft > 0; m++) {
        const interest = loan * (inputs.loanRate / 12);
        const principal = Math.min(loan, mortgageMonthly - interest);
        const payment = principal + interest;
        const fromOa = Math.min(oa, payment);
        oa -= fromOa;
        mortgageFromOa += fromOa;
        loan = Math.max(0, loan - principal);
        mortgagePaid += payment;
        monthsLeft -= 1;
      }
      if (loan <= 1) {
        loan = 0;
        monthsLeft = 0;
        mortgageThisMonth = 0;
        notes.push('Housing loan fully repaid');
      }
    }

    // Cash account: take-home, bonus, tax, spend, mortgage, invest remainder / draw.
    // Employee CPF on the bonus is taken from the bonus, not from monthly salary.
    // Tax is resident income tax on salary + bonus, after compulsory employee CPF and Earned Income Relief.
    const employmentIncome = working ? Math.max(0, salaryGross) * 12 + bonusGross : 0;
    const reliefs = Math.min(PERSONAL_RELIEF_CAP, annualEmployee + earnedIncomeRelief(age, employmentIncome));
    const annualTax = residentIncomeTax(Math.max(0, employmentIncome - reliefs));
    const taxMonthly = annualTax / 12;
    const takeHomeMonthly = salaryGross > 0 ? salaryGross - employeeOnOrdinary / 12 : 0;
    const bonusMonthly = annualBonusNet / 12;
    const cpfLifeMonthly = lifeStarted ? lifePayout : 0;
    const mortgageCashMonthly = Math.max(0, mortgagePaid - mortgageFromOa) / 12;
    const incomeBeforeDraw = takeHomeMonthly + bonusMonthly + cpfLifeMonthly;
    const monthlyGap = livingMonthly + mortgageCashMonthly + taxMonthly - incomeBeforeDraw;

    let investmentDrawMonthly = 0;
    let annualInvested = 0;

    if (monthlyGap > 0) {
      investmentDrawMonthly = monthlyGap;
      invest -= monthlyGap * 12;
    } else {
      annualInvested = -monthlyGap * 12;
      invest += annualInvested;
    }

    invest *= 1 + inputs.investmentReturn;

    if (invest < -1 && !cashShortfallYears.includes(year)) {
      cashShortfallYears.push(year);
      notes.push('Investments are below zero');
    }

    const incomeTotal = takeHomeMonthly + bonusMonthly + cpfLifeMonthly + investmentDrawMonthly;
    const expenditureTotal = livingMonthly + taxMonthly + mortgageThisMonth;
    const netCashflow =
      (incomeBeforeDraw + investmentDrawMonthly - livingMonthly - mortgageCashMonthly - taxMonthly) * 12;

    rows.push({
      year,
      age,
      phase: working ? 'working' : 'retired',
      salaryNet: takeHomeMonthly,
      bonus: bonusMonthly,
      cpfLife: cpfLifeMonthly,
      investmentDraw: investmentDrawMonthly,
      incomeTotal,
      livingSpend: livingMonthly,
      incomeTax: taxMonthly,
      mortgage: mortgageThisMonth,
      expenditureTotal,
      investmentBalance: invest,
      loanBalance: loan,
      oa,
      sa,
      ma,
      ra: lifeStarted ? 0 : ra, // premium consumed into LIFE
      cpfTotal: oa + sa + ma + (lifeStarted ? 0 : ra),
      annualCpfEmployee: annualEmployee,
      annualCpfEmployer: annualEmployer,
      annualInvested,
      annualMortgagePaid: mortgagePaid,
      netCashflow,
      notes,
    });
  }

  const retireRow = rows.find((r) => r.age === inputs.retirementAge);
  const retirementFundingGapMonthly = retireRow
    ? Math.max(0, retireRow.expenditureTotal - (retireRow.salaryNet + retireRow.bonus + retireRow.cpfLife))
    : 0;

  return {
    rows,
    summary: {
      frsAt55,
      brsAt55,
      raAt55,
      withdrawableAt55,
      estimatedLifePayout,
      houseStampDuty: stampDutyTotal,
      initialLoan,
      cashShortfallYears,
      retirementFundingGapMonthly,
    },
    assumptions: [
      'Modelled as Singapore PR on full (3rd-year+) CPF rates from 1 Jan 2026.',
      `OW ceiling $${OW_CEILING.toLocaleString()}/mo · annual wage ceiling $${ANNUAL_WAGE_CEILING.toLocaleString()}.`,
      `OA ${OA_INTEREST * 100}% · SA/MA/RA ${SA_MA_RA_INTEREST * 100}% + extra interest on first $60k (OA cap $20k).`,
      `Cohort FRS at 55: $${Math.round(frsAt55).toLocaleString()} (grown ~3.5%/yr from 2026 FRS $${(220_400).toLocaleString()}).`,
      'CPF LIFE payout estimated from published BRS/FRS/ERS Standard Plan anchors; not an official quote.',
      'Yearly bonus is additional wages. CPF applies until the $102,000 annual wage ceiling is used up.',
      'Income tax uses the resident scale from YA 2024, unchanged for YA 2026. Salary and bonus are taxed after compulsory employee CPF and Earned Income Relief, with reliefs capped at $80,000. CPF LIFE and investment returns are not taxed. Brackets stay at 2026 levels.',
      'Housing is paid from OA first, then cash. ABSD, and the minimum cash downpayment (5% of price, or 10% when LTV is 55% or below), cannot come from OA. Monthly instalments and an early payoff use the same order.',
      'A cash shortfall is a year that ends with investments below zero.',
      'PR-only buyer: bank loan, 5% ABSD on first home, no HDB concessionary 2.6% loan / housing grant.',
      'Inflation applied to living spend; salary grows at the rate you set; investments compound annually.',
      'Figures are planning estimates only — not financial advice.',
    ],
  };
}
