import { useEffect, useRef, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { YearRow } from '../cpf/engine';
import { moneyCompact } from '../lib/format';

type Props = {
  rows: YearRow[];
  retirementAge: number;
};

function axisTicks(ages: number[]): number[] {
  if (ages.length === 0) return [];
  const last = ages[ages.length - 1];
  const ticks = ages.filter((age, index) => index === 0 || age === last || age % 5 === 0);
  return [...new Set(ticks)];
}

export function BalanceChart({ rows, retirementAge }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const update = () => {
      const style = getComputedStyle(el);
      const pad = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      setWidth(Math.max(0, Math.floor(el.clientWidth - pad)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const data = rows.map((r) => ({
    age: r.age,
    Investments: Math.round(r.investmentBalance),
    CPF: Math.round(r.cpfTotal),
    Loan: Math.round(r.loanBalance),
    'Net liquid': Math.round(r.investmentBalance + r.oa - r.loanBalance),
  }));

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Balances over time</h3>
        <p>Investments, CPF, loan outstanding · vertical line at retirement ({retirementAge})</p>
      </div>
      <div className="chart-body" ref={bodyRef}>
        {width > 0 ? (
          <ComposedChart width={width} height={280} data={data} margin={{ top: 8, right: 28, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="age" ticks={axisTicks(data.map((d) => d.age))} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => moneyCompact(Number(v))} tick={{ fontSize: 11 }} width={64} />
            <Tooltip
              formatter={(value) => moneyCompact(Number(value ?? 0))}
              labelFormatter={(age) => `Age ${age}`}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="Investments"
              stroke="#0f766e"
              fill="#99f6e4"
              fillOpacity={0.45}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="CPF"
              stroke="#1d4ed8"
              fill="#bfdbfe"
              fillOpacity={0.4}
              strokeWidth={2}
            />
            <Line type="monotone" dataKey="Loan" stroke="#b45309" strokeWidth={2} dot={false} />
            <Line
              type="monotone"
              dataKey="Net liquid"
              stroke="#111827"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        ) : null}
      </div>
    </div>
  );
}
