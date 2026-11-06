import { useMemo, useState } from 'react';
import type { YearRow } from '../cpf/engine';
import { money } from '../lib/format';

type Props = {
  rows: YearRow[];
  retirementAge: number;
};

type Col = {
  id: string;
  group: string;
  label: string;
  align?: 'left' | 'right';
  render: (r: YearRow) => string;
  className?: (r: YearRow) => string;
};

const COLS: Col[] = [
  { id: 'year', group: '', label: 'Year', align: 'left', render: (r) => String(r.year) },
  { id: 'age', group: '', label: 'Age', render: (r) => String(r.age) },
  {
    id: 'salary',
    group: 'Monthly income',
    label: 'Net salary',
    render: (r) => money(r.salaryNet),
    className: (r) => (r.salaryNet > 0 ? 'pos' : 'muted'),
  },
  {
    id: 'bonus',
    group: 'Monthly income',
    label: 'Bonus',
    render: (r) => money(r.bonus),
    className: (r) => (r.bonus > 0 ? 'pos' : 'muted'),
  },
  {
    id: 'life',
    group: 'Monthly income',
    label: 'CPF LIFE',
    render: (r) => money(r.cpfLife),
    className: (r) => (r.cpfLife > 0 ? 'pos' : 'muted'),
  },
  {
    id: 'draw',
    group: 'Monthly income',
    label: 'Invest. draw',
    render: (r) => money(r.investmentDraw),
    className: (r) => (r.investmentDraw > 0 ? 'pos' : 'muted'),
  },
  {
    id: 'incTotal',
    group: 'Monthly income',
    label: 'Total',
    render: (r) => money(r.incomeTotal),
    className: () => 'total',
  },
  {
    id: 'living',
    group: 'Monthly expenditure',
    label: 'Living',
    render: (r) => money(r.livingSpend),
  },
  {
    id: 'tax',
    group: 'Monthly expenditure',
    label: 'Tax',
    render: (r) => money(r.incomeTax),
    className: (r) => (r.incomeTax > 0 ? '' : 'muted'),
  },
  {
    id: 'mortgage',
    group: 'Monthly expenditure',
    label: 'Mortgage',
    render: (r) => money(r.mortgage),
    className: (r) => (r.mortgage > 0 ? '' : 'muted'),
  },
  {
    id: 'expTotal',
    group: 'Monthly expenditure',
    label: 'Total',
    render: (r) => money(r.expenditureTotal),
    className: () => 'total',
  },
  {
    id: 'invest',
    group: 'Balances (year-end)',
    label: 'Investments',
    render: (r) => money(r.investmentBalance),
    className: (r) => (r.investmentBalance < 0 ? 'neg' : ''),
  },
  {
    id: 'loan',
    group: 'Balances (year-end)',
    label: 'Loan',
    render: (r) => money(r.loanBalance),
    className: (r) => (r.loanBalance > 0 ? '' : 'muted'),
  },
  {
    id: 'cpf',
    group: 'Balances (year-end)',
    label: 'CPF total',
    render: (r) => money(r.cpfTotal),
  },
  {
    id: 'oa',
    group: 'CPF detail',
    label: 'OA',
    render: (r) => money(r.oa),
  },
  {
    id: 'sa',
    group: 'CPF detail',
    label: 'SA',
    render: (r) => money(r.sa),
  },
  {
    id: 'ra',
    group: 'CPF detail',
    label: 'RA',
    render: (r) => money(r.ra),
  },
  {
    id: 'ma',
    group: 'CPF detail',
    label: 'MA',
    render: (r) => money(r.ma),
  },
  {
    id: 'net',
    group: '',
    label: 'Annual net CF',
    render: (r) => money(r.netCashflow),
    className: (r) => (r.netCashflow >= 0 ? 'pos' : 'neg'),
  },
];

export function ProjectionTable({ rows, retirementAge }: Props) {
  const [showCpfDetail, setShowCpfDetail] = useState(false);
  const [onlyMilestones, setOnlyMilestones] = useState(false);

  const visibleCols = useMemo(
    () => COLS.filter((c) => showCpfDetail || c.group !== 'CPF detail'),
    [showCpfDetail],
  );

  const visibleRows = useMemo(() => {
    if (!onlyMilestones) return rows;
    return rows.filter((r, i) => {
      if (i === 0 || i === rows.length - 1) return true;
      if (r.age === retirementAge || r.age === 55 || r.age === 65 || r.age === 70) return true;
      if (r.notes.length > 0) return true;
      if (r.age % 5 === 0) return true;
      return false;
    });
  }, [rows, onlyMilestones, retirementAge]);

  const groupHeaders = useMemo(() => {
    const groups: { name: string; span: number }[] = [];
    for (const col of visibleCols) {
      const last = groups[groups.length - 1];
      if (col.group && last && last.name === col.group) last.span += 1;
      else if (col.group) groups.push({ name: col.group, span: 1 });
      else groups.push({ name: '', span: 1 });
    }
    return groups;
  }, [visibleCols]);

  return (
    <div className="sheet-wrap">
      <div className="sheet-toolbar">
        <div className="sheet-title">
          <span className="sheet-badge">Sheet</span>
          <strong>Year-by-year projection</strong>
          <span className="muted">{visibleRows.length} rows</span>
        </div>
        <div className="sheet-actions">
          <label className="toggle">
            <input
              type="checkbox"
              checked={onlyMilestones}
              onChange={(e) => setOnlyMilestones(e.target.checked)}
            />
            Milestones only
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={showCpfDetail}
              onChange={(e) => setShowCpfDetail(e.target.checked)}
            />
            CPF OA/SA/RA/MA
          </label>
        </div>
      </div>

      <div className="sheet-scroll">
        <table className="sheet">
          <thead>
            <tr className="group-row">
              {groupHeaders.map((g, i) => (
                <th
                  key={`${g.name}-${i}`}
                  colSpan={g.span}
                  className={g.name ? 'group-cell' : 'group-empty'}
                >
                  {g.name}
                </th>
              ))}
            </tr>
            <tr className="col-row">
              {visibleCols.map((c) => (
                <th key={c.id} className={c.align === 'left' ? 'left' : 'right'}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r) => {
              const isRetire = r.age === retirementAge;
              const is55 = r.age === 55;
              const isLife = r.cpfLife > 0 && rows.find((x) => x.age === r.age - 1)?.cpfLife === 0;
              return (
                <tr
                  key={r.year}
                  className={[
                    r.phase === 'retired' ? 'retired' : '',
                    isRetire ? 'milestone retire' : '',
                    is55 ? 'milestone age55' : '',
                    isLife ? 'milestone life' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  title={r.notes.join(' · ')}
                >
                  {visibleCols.map((c) => (
                    <td
                      key={c.id}
                      className={[c.align === 'left' ? 'left' : 'right', c.className?.(r) ?? '']
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {c.render(r)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sheet-legend">
        <span className="swatch retire" /> Retirement age
        <span className="swatch age55" /> Age 55 (RA)
        <span className="swatch life" /> CPF LIFE starts
        <span className="swatch retired-band" /> Retired years
        <span className="hint">Hover a row for event notes</span>
      </div>
    </div>
  );
}
