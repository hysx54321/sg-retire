# sg-retire

Single-page retirement & cashflow planner for a **Singapore PR**, with 2026 CPF ceilings, contribution / allocation rates, interest, retirement sums, and CPF LIFE payout estimates baked in.

## Run

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## What you enter

- Current age, planned retirement age
- Gross monthly salary, monthly living spend (today’s dollars)
- Cash / investment balance
- CPF OA, SA, MA balances
- Expected house price & purchase age (set price to `0` to skip)
- Expected investment return, inflation, salary growth
- Loan rate / LTV / tenure, CPF LIFE start age (65–70)

## What you get

- Summary cards (FRS, CPF LIFE estimate, balances at retirement, funding gap)
- Chart of investments, CPF, loan, and net liquid over time
- Excel-style year-by-year sheet with:
  - **Monthly income** — net salary, CPF LIFE, investment draw, total
  - **Monthly expenditure** — living (inflated), mortgage, total
  - **Balances** — investments, loan, CPF (optional OA/SA/RA/MA detail)

Milestone rows (retirement, age 55, CPF LIFE start) are highlighted. Hover a row for event notes.

## Reference data

See [`ASSUMPTIONS.md`](./ASSUMPTIONS.md) for the CPF Board / IRAS / MAS figures used (OW ceiling $8,000, rates from 1 Jan 2026, BRS/FRS/ERS, interest floors, PR ABSD 5%, etc.).

This is a planning aid only — not financial advice and not an official CPF calculator.
