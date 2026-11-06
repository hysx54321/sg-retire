import type { Inputs } from './cpf/engine';

export const DEFAULT_INPUTS: Inputs = {
  currentAge: 32,
  cashSavings: 80_000,
  monthlySalary: 7_000,
  oa: 40_000,
  sa: 35_000,
  ma: 25_000,
  housePrice: 800_000,
  housePurchaseAge: 35,
  investmentReturn: 0.05,
  monthlySpend: 3_500,
  retirementAge: 65,
  inflation: 0.02,
  salaryGrowth: 0.03,
  loanRate: 0.035,
  loanTenureYears: 25,
  ltv: 0.75,
  cpfLifeStartAge: 65,
  projectionEndAge: 95,
  loanPayoffAge: 0,
  bonusMode: 'percent',
  bonusPercent: 0,
  bonusAmount: 0,
};

export type FieldDef = {
  key: Exclude<keyof Inputs, 'bonusMode'>;
  label: string;
  group: string;
  kind: 'money' | 'age' | 'percent' | 'number' | 'years';
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
};

export const FIELD_DEFS: FieldDef[] = [
  { key: 'currentAge', label: 'Current age', group: 'You', kind: 'age', min: 18, max: 70 },
  { key: 'retirementAge', label: 'Planned retirement age', group: 'You', kind: 'age', min: 45, max: 80 },
  { key: 'monthlySalary', label: 'Monthly salary (gross)', group: 'You', kind: 'money', hint: 'Treated as Ordinary Wages' },
  { key: 'monthlySpend', label: 'Monthly spend (today)', group: 'You', kind: 'money', hint: 'Inflates each year' },
  { key: 'cashSavings', label: 'Cash / investments now', group: 'Savings', kind: 'money' },
  { key: 'oa', label: 'CPF Ordinary Account', group: 'Savings', kind: 'money' },
  { key: 'sa', label: 'CPF Special Account', group: 'Savings', kind: 'money' },
  { key: 'ma', label: 'CPF MediSave Account', group: 'Savings', kind: 'money' },
  { key: 'investmentReturn', label: 'Expected investment return', group: 'Assumptions', kind: 'percent', min: -0.05, max: 0.15, step: 0.005 },
  { key: 'inflation', label: 'Inflation', group: 'Assumptions', kind: 'percent', min: 0, max: 0.08, step: 0.005 },
  { key: 'salaryGrowth', label: 'Salary growth (nominal)', group: 'Assumptions', kind: 'percent', min: 0, max: 0.1, step: 0.005 },
  { key: 'cpfLifeStartAge', label: 'CPF LIFE start age', group: 'Assumptions', kind: 'age', min: 65, max: 70, hint: '65–70; later ≈ +7%/yr' },
  { key: 'projectionEndAge', label: 'Project until age', group: 'Assumptions', kind: 'age', min: 70, max: 100 },
  { key: 'housePrice', label: 'Expected house price', group: 'Housing', kind: 'money', hint: '0 = skip housing' },
  { key: 'housePurchaseAge', label: 'House purchase age', group: 'Housing', kind: 'age', min: 21, max: 65 },
  { key: 'ltv', label: 'Loan-to-value', group: 'Housing', kind: 'percent', min: 0, max: 0.75, step: 0.05 },
  { key: 'loanRate', label: 'Loan interest rate', group: 'Housing', kind: 'percent', min: 0.01, max: 0.08, step: 0.001, hint: 'Bank loan (PR)' },
  { key: 'loanTenureYears', label: 'Loan tenure (years)', group: 'Housing', kind: 'years', min: 5, max: 35 },
  {
    key: 'loanPayoffAge',
    label: 'Pay off loan at age',
    group: 'Housing',
    kind: 'age',
    min: 0,
    max: 80,
    hint: '0 keeps the original tenure. Paid from OA, then investments.',
  },
];
