# CPF & housing assumptions (reference year 2026)

Planning model for a **Singapore Permanent Resident on full (3rd-year+) CPF rates**. Figures are estimates for personal planning — not official CPF Board / IRAS calculations or financial advice.

## Contribution rates (wages &gt; $750/mo)

| Age | Employer | Employee | Total |
| --- | --- | --- | --- |
| ≤55 | 17% | 20% | 37% |
| &gt;55–60 | 16% | 18% | 34% |
| &gt;60–65 | 12.5% | 12.5% | 25% |
| &gt;65–70 | 9% | 7.5% | 16.5% |
| &gt;70 | 7.5% | 5% | 12.5% |

- Ordinary Wage ceiling: **$8,000 / month** (from 1 Jan 2026)
- Annual wage ceiling: **$102,000**
- Salary in this app is modelled as Ordinary Wages only (no AW / bonus)

Source: [CPF contribution rates from 1 Jan 2026](https://www.cpf.gov.sg/content/dam/web/employer/employer-obligations/documents/CPFcontributionratesfrom1Jan2026.pdf)

## Allocation ratios (of total contribution)

MediSave first, then SA/RA, remainder OA.

| Age | OA | SA / RA | MA |
| --- | --- | --- | --- |
| ≤35 | 0.6217 | 0.1621 SA | 0.2162 |
| &gt;35–45 | 0.5677 | 0.1891 SA | 0.2432 |
| &gt;45–50 | 0.5136 | 0.2162 SA | 0.2702 |
| &gt;50–55 | 0.4055 | 0.3108 SA | 0.2837 |
| &gt;55–60 | 0.353 | 0.3382 RA | 0.3088 |
| &gt;60–65 | 0.14 | 0.44 RA | 0.42 |
| &gt;65–70 | 0.0607 | 0.303 RA | 0.6363 |
| &gt;70 | 0.08 | 0.08 RA | 0.84 |

From 55, SA is closed; retirement allocation goes to RA up to FRS, then OA.

Source: [CPF allocation rates from Jan 2026](https://www.cpf.gov.sg/content/dam/web/employer/employer-obligations/documents/CPFAllocationRatesfromJanuary2026.pdf)

## Interest

| Account | Base rate |
| --- | --- |
| Ordinary Account | 2.5% p.a. (floor) |
| Special / MediSave / Retirement | 4% p.a. (floor, extended through 2027) |

Extra interest:

- Below 55: +1% on first $60,000 combined (OA portion capped at $20,000)
- 55+: +2% on first $30,000 and +1% on next $30,000 (OA still capped at $20,000)
- Extra earned on OA is credited to SA/RA

Source: [CPF Board — earning interest](https://www.cpf.gov.sg/member/growing-your-savings/earning-higher-returns/earning-attractive-interest)

## Retirement sums & CPF LIFE

For members turning 55 in **2026**:

| Sum | Amount | Est. LIFE payout from 65 (Standard) |
| --- | --- | --- |
| BRS | $110,200 | ~$950 / mo |
| FRS | $220,400 | ~$1,780 / mo |
| ERS | $440,800 | ~$3,440 / mo |

- Future cohorts: FRS projected at ~**3.5% / year** from the 2026 anchors
- Payout age: choose **65–70**; each deferral year modelled at up to **+7%**
- Auto-inclusion in CPF LIFE if ≥ $60,000 in retirement savings at payout start (born 1958+)
- Before payouts, OA may transfer to RA up to FRS

Source: [What is the CPF retirement sum?](https://www.cpf.gov.sg/member/infohub/educational-resources/what-is-the-cpf-retirement-sum), [CPF LIFE payout age](https://www.cpf.gov.sg/member/infohub/educational-resources/what-is-the-cpf-life-payout-age)

## MediSave

- Basic Healthcare Sum 2026 (age ≤65): **$79,000**, grown ~4%/yr until 65 in this model
- Overflow above BHS goes to SA (before 55) or RA/OA (from 55)

## Housing (PR assumptions)

- PR first residential property **ABSD 5%** + residential **BSD** schedule (IRAS)
- PR-only household: **bank loan** (no HDB concessionary 2.6% loan / CPF housing grant in this model)
- Default LTV 75%, loan rate 3.5%, tenure 25 years (editable)

Sources: [IRAS ABSD](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyers-stamp-duty-(absd)), [MoneySense affordability](https://www.moneysense.gov.sg/buying-a-property-how-much-can-you-afford/)

## Inflation

Default planning inflation **2.0%** (near MAS / long-run mid). Living spend inflates each year; salary grows at the separate rate you set.
