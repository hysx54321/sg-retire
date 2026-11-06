import { useMemo, useState } from 'react';
import { suggestHeadroom, suggestShortfallFixes } from './cpf/advice';
import { project } from './cpf/engine';
import { InputPanel } from './components/InputPanel';
import { SummaryCards } from './components/SummaryCards';
import { ProjectionTable } from './components/ProjectionTable';
import { BalanceChart } from './components/BalanceChart';
import { DEFAULT_INPUTS } from './types';
import { downloadPagePdf } from './lib/exportPage';
import './App.css';

export default function App() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [showAssumptions, setShowAssumptions] = useState(false);

  const result = useMemo(() => project(inputs), [inputs]);
  const advice = useMemo(() => suggestShortfallFixes(inputs), [inputs]);
  const headroom = useMemo(() => suggestHeadroom(inputs), [inputs]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo">SG</div>
          <div>
            <h1>sg-retire</h1>
            <p>Singapore PR retirement &amp; cashflow planner</p>
          </div>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className="ghost export"
            onClick={() => {
              void downloadPagePdf().catch(() => {
                window.alert('Could not export this page. Try again.');
              });
            }}
          >
            Export PDF
          </button>
          <button type="button" className="ghost" onClick={() => setInputs(DEFAULT_INPUTS)}>
            Reset defaults
          </button>
          <button type="button" className="ghost" onClick={() => setShowAssumptions((v) => !v)}>
            {showAssumptions ? 'Hide' : 'Show'} assumptions
          </button>
        </div>
      </header>

      <div className="layout">
        <InputPanel values={inputs} onChange={setInputs} />

        <main className="main">
          <SummaryCards
            result={result}
            inputs={inputs}
            advice={advice}
            headroom={headroom}
            onApply={(patch) => setInputs((prev) => ({ ...prev, ...patch }))}
          />
          <BalanceChart rows={result.rows} retirementAge={inputs.retirementAge} />
          <ProjectionTable rows={result.rows} retirementAge={inputs.retirementAge} />

          {showAssumptions ? (
            <section className="assumptions">
              <h3>Model assumptions (2026 reference)</h3>
              <ul>
                {result.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <p className="fineprint">
                Sources: CPF Board contribution / allocation / interest / retirement sum pages, IRAS BSD &amp; ABSD,
                MAS inflation outlook. This is a planning tool, not financial advice.
              </p>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
