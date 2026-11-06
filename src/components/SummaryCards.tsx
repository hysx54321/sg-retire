import type { HeadroomAdvice, ShortfallAdvice } from '../cpf/advice';
import type { Inputs, ProjectionResult } from '../cpf/engine';
import { money } from '../lib/format';

type Props = {
  result: ProjectionResult;
  inputs: Inputs;
  advice: ShortfallAdvice | null;
  headroom: HeadroomAdvice | null;
  onApply: (patch: Partial<Inputs>) => void;
};

export function SummaryCards({ result, inputs, advice, headroom, onApply }: Props) {
  const { summary, rows } = result;
  const retirementAge = inputs.retirementAge;
  const retire = rows.find((r) => r.age === retirementAge) ?? rows[rows.length - 1];
  const last = rows[rows.length - 1];

  const cards = [
    {
      label: 'FRS at age 55',
      value: money(summary.frsAt55),
      sub: `RA set aside ${money(summary.raAt55)}`,
    },
    {
      label: 'CPF LIFE (est.)',
      value: `${money(summary.estimatedLifePayout)}/mo`,
      sub: 'Standard Plan estimate',
    },
    {
      label: 'Investments at retirement',
      value: money(retire?.investmentBalance ?? 0),
      sub: `Age ${retirementAge}`,
    },
    {
      label: 'Loan at retirement',
      value: money(retire?.loanBalance ?? 0),
      sub: summary.initialLoan ? `Started at ${money(summary.initialLoan)}` : 'No loan',
    },
    {
      label: 'Monthly gap at retirement',
      value: money(summary.retirementFundingGapMonthly),
      sub: 'Spend − salary − bonus − CPF LIFE (before draws)',
      warn: summary.retirementFundingGapMonthly > 0,
    },
    {
      label: 'Terminal net liquid',
      value: money((last?.investmentBalance ?? 0) + (last?.oa ?? 0)),
      sub: `Age ${last?.age} · invest + OA`,
      warn: (last?.investmentBalance ?? 0) < 0,
    },
  ];

  return (
    <div className="summary-grid">
      {cards.map((c) => (
        <div key={c.label} className={`summary-card ${c.warn ? 'warn' : ''}`}>
          <div className="summary-label">{c.label}</div>
          <div className="summary-value">{c.value}</div>
          <div className="summary-sub">{c.sub}</div>
        </div>
      ))}
      {summary.cashShortfallYears.length > 0 ? (
        <div className="summary-card warn wide">
          <div className="summary-label">Cash shortfall years</div>
          <div className="summary-value sm">{summary.cashShortfallYears.join(', ')}</div>
          <div className="summary-sub">A year that ends with investments below zero</div>
        </div>
      ) : null}
      {advice ? (
        <div className="summary-card advice wide">
          <div className="summary-label">Ways to clear the shortfall</div>
          <ul className="advice-list">
            {advice.laterRetirementAge != null ? (
              <li>
                Retire at {advice.laterRetirementAge} instead of {inputs.retirementAge}. Monthly spend stays{' '}
                {money(inputs.monthlySpend)}.
                <button type="button" className="apply" onClick={() => onApply({ retirementAge: advice.laterRetirementAge! })}>
                  Use age {advice.laterRetirementAge}
                </button>
              </li>
            ) : (
              <li>Retiring later, through age {advice.retirementSearchCap}, still leaves a shortfall at this monthly spend.</li>
            )}
            {advice.maxMonthlySpend != null ? (
              <li>
                Keep retiring at {inputs.retirementAge} and set monthly spend to {money(advice.maxMonthlySpend)} in
                today&apos;s dollars.
                <button type="button" className="apply" onClick={() => onApply({ monthlySpend: advice.maxMonthlySpend! })}>
                  Use {money(advice.maxMonthlySpend)}
                </button>
              </li>
            ) : (
              <li>Lowering monthly spend to $0 at retirement age {inputs.retirementAge} still leaves a shortfall.</li>
            )}
            {advice.combined ? (
              <li>
                Retire at {advice.combined.retirementAge} and set monthly spend to {money(advice.combined.monthlySpend)}.
                <button
                  type="button"
                  className="apply"
                  onClick={() =>
                    onApply({
                      retirementAge: advice.combined!.retirementAge,
                      monthlySpend: advice.combined!.monthlySpend,
                    })
                  }
                >
                  Use both
                </button>
              </li>
            ) : null}
            {advice.laterRetirementAge == null && advice.maxMonthlySpend == null && advice.combined == null ? (
              <li>
                Changing retirement age through {advice.retirementSearchCap}, or monthly spend, does not keep investments
                at or above zero. The lump sums for housing or the loan are larger than those two levers can fund.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
      {headroom ? (
        <div className="summary-card advice wide">
          <div className="summary-label">Room to retire earlier or spend more</div>
          <div className="summary-sub">After 65, the investment balance does not fall from one year to the next.</div>
          <ul className="advice-list">
            {headroom.earlierRetirementAge != null ? (
              <li>
                Retire at {headroom.earlierRetirementAge} instead of {inputs.retirementAge}. Monthly spend stays{' '}
                {money(inputs.monthlySpend)}.
                <button
                  type="button"
                  className="apply"
                  onClick={() => onApply({ retirementAge: headroom.earlierRetirementAge! })}
                >
                  Use age {headroom.earlierRetirementAge}
                </button>
              </li>
            ) : null}
            {headroom.higherMonthlySpend != null ? (
              <li>
                Keep retiring at {inputs.retirementAge} and raise monthly spend to {money(headroom.higherMonthlySpend)}{' '}
                in today&apos;s dollars.
                <button
                  type="button"
                  className="apply"
                  onClick={() => onApply({ monthlySpend: headroom.higherMonthlySpend! })}
                >
                  Use {money(headroom.higherMonthlySpend)}
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
