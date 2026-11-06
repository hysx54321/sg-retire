import { FIELD_DEFS, type FieldDef } from '../types';
import type { Inputs } from '../cpf/engine';

type Props = {
  values: Inputs;
  onChange: (next: Inputs) => void;
};

function displayValue(def: FieldDef, value: number): string {
  if (def.kind === 'percent') return String(Math.round(value * 1000) / 10);
  if (def.kind === 'money') return String(Math.round(value));
  return String(value);
}

function parseValue(def: FieldDef, raw: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  if (def.kind === 'percent') return n / 100;
  return n;
}

/** Wheel must not change the number. Scroll the panel instead; typing and steppers still work. */
function bindNoWheelAdjust(el: HTMLInputElement | null) {
  if (!el || el.dataset.noWheel) return;
  el.dataset.noWheel = '1';
  el.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const scroller = el.closest('.inputs');
      if (scroller) scroller.scrollTop += event.deltaY;
    },
    { passive: false },
  );
}

export function InputPanel({ values, onChange }: Props) {
  const groups = ['You', 'Bonus', 'Savings', 'Assumptions', 'Housing'];

  return (
    <aside className="panel inputs">
      <header className="panel-header">
        <h2>Your numbers</h2>
        <p>Singapore PR · full CPF rates from 2026</p>
      </header>

      {groups.map((group) => group === 'Bonus' ? (
        <section key={group} className="field-group">
          <h3>Yearly bonus</h3>
          <div className="segment" role="group" aria-label="Bonus type">
            <button
              type="button"
              className={values.bonusMode === 'percent' ? 'active' : ''}
              onClick={() => onChange({ ...values, bonusMode: 'percent' })}
            >
              % of salary
            </button>
            <button
              type="button"
              className={values.bonusMode === 'amount' ? 'active' : ''}
              onClick={() => onChange({ ...values, bonusMode: 'amount' })}
            >
              Fixed amount
            </button>
          </div>
          {values.bonusMode === 'percent' ? (
            <label className="field">
              <span className="field-label">Bonus (% of annual salary)</span>
              <input
                type="number"
                ref={bindNoWheelAdjust}
                min={0}
                max={100}
                step={0.5}
                value={String(Math.round(values.bonusPercent * 1000) / 10)}
                onChange={(e) =>
                  onChange({
                    ...values,
                    bonusPercent: Math.max(0, Number(e.target.value) || 0) / 100,
                  })
                }
              />
              <span className="field-hint">Paid once a year while working. CPF applies up to the annual wage ceiling.</span>
            </label>
          ) : (
            <label className="field">
              <span className="field-label">Bonus (S$ per year, today)</span>
              <input
                type="number"
                ref={bindNoWheelAdjust}
                min={0}
                step={1000}
                value={String(Math.round(values.bonusAmount))}
                onChange={(e) =>
                  onChange({
                    ...values,
                    bonusAmount: Math.max(0, Number(e.target.value) || 0),
                  })
                }
              />
              <span className="field-hint">Grows with salary growth. CPF applies up to the annual wage ceiling.</span>
            </label>
          )}
        </section>
      ) : (
        <section key={group} className="field-group">
          <h3>{group}</h3>
          <div className="field-grid">
            {FIELD_DEFS.filter((f) => f.group === group).map((def) => (
              <label key={def.key} className="field">
                <span className="field-label">
                  {def.label}
                  {def.kind === 'percent' ? ' (%)' : ''}
                </span>
                <input
                  type="number"
                  ref={bindNoWheelAdjust}
                  value={displayValue(def, values[def.key])}
                  min={def.kind === 'percent' && def.min !== undefined ? def.min * 100 : def.min}
                  max={def.kind === 'percent' && def.max !== undefined ? def.max * 100 : def.max}
                  step={
                    def.kind === 'percent'
                      ? def.step !== undefined
                        ? def.step * 100
                        : 0.1
                      : def.step ?? (def.kind === 'money' ? 1000 : 1)
                  }
                  onChange={(e) =>
                    onChange({ ...values, [def.key]: parseValue(def, e.target.value) })
                  }
                />
                {def.hint ? <span className="field-hint">{def.hint}</span> : null}
              </label>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}
