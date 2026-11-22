import { useEffect, useMemo, useRef, useState } from 'react';
import { C, type Complex } from '../../core/complex.ts';
import {
  GATES,
  ROTATION_GATES,
  rotationMatrix,
  type GateKey,
  type GateMatrix,
  type RotationAxis,
} from '../../core/gates.ts';
import { Qubit } from '../../core/qubit.ts';
import {
  CLASSICAL_GATES,
  classicalGateIconSVG,
  type ClassicalGateKey,
} from '../../core/classicalGates.ts';
import { pulseElement } from '../../core/pulse.ts';
import { useI18n } from '../../hooks/useI18n.ts';
import { useNav } from '../../hooks/useNav.ts';
import { setTabSub } from '../../state/nav.ts';
import BlochSphere from '../BlochSphere.tsx';
import Explainer from '../Explainer.tsx';
import LessonEmbed from '../LessonEmbed.tsx';

const GATES_TRYME_INTERVAL_MS = 2800;

interface MatrixView {
  name: string;
  color: string;
  cells: [string, string, string, string];
}

interface GateHistoryEntry {
  label: string;
  color: string;
  theta: number;
  phi: number;
  matrixView: MatrixView;
  explain: string;
}

function formatKetOutput(c0: Complex, c1: Complex): string {
  const parts: string[] = [];
  [c0, c1].forEach((c, k) => {
    if (C.mag(c) <= 0.0005) return;
    const coef = C.fmt(c);
    parts.push(coef === '1' ? `|${k}⟩` : `(${coef})|${k}⟩`);
  });
  return parts.length ? parts.join(' + ') : '0';
}

export default function GatesTab() {
  const { t } = useI18n();
  const nav = useNav();
  const isActive = nav.mode === 'sim' && nav.tab === 'gates';
  const domain = nav.sub.gates?.gatesDomain || 'quantum';

  // Classical gates state
  const [classicalGate, setClassicalGate] = useState<ClassicalGateKey>('AND');
  const [gcInputA, setGcInputA] = useState<0 | 1>(1);
  const [gcInputB, setGcInputB] = useState<0 | 1>(1);

  // Quantum gates state
  const [qubit, setQubit] = useState<Qubit>(() => new Qubit());
  const [rotAngle, setRotAngle] = useState(90);
  const [matrixView, setMatrixView] = useState<MatrixView | null>(null);
  const [gateExplainer, setGateExplainer] = useState(
    'Nothing yet — the qubit is parked at |0⟩, pointing straight up. Pick a gate on the left and watch where it sends the arrow.'
  );
  const [history, setHistory] = useState<GateHistoryEntry[]>([]);
  const [historyCursor, setHistoryCursor] = useState(-1);
  const [tryMeRunning, setTryMeRunning] = useState(false);

  const blochWrapRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const bloch = qubit.getBloch();
  const cGate = CLASSICAL_GATES[classicalGate];
  const cOut = cGate.inputs === 1 ? cGate.fn(gcInputA) : cGate.fn(gcInputA, gcInputB);

  const quantumTruthRows = useMemo(() => {
    const rows: Array<{ key: string; name: string; color: string; input: number; output: string }> = [];
    (Object.keys(GATES) as GateKey[]).forEach((key) => {
      const gate = GATES[key];
      [0, 1].forEach((basis) => {
        const c0 = gate.matrix[0][basis];
        const c1 = gate.matrix[1][basis];
        rows.push({
          key: `${key}-${basis}`,
          name: gate.name,
          color: gate.color,
          input: basis,
          output: formatKetOutput(c0, c1),
        });
      });
    });
    return rows;
  }, []);

  const allClassicalTruthRows = useMemo(() => {
    const rows: Array<{ key: string; name: string; inputs: string; out: number }> = [];
    (Object.keys(CLASSICAL_GATES) as ClassicalGateKey[]).forEach((key) => {
      const gate = CLASSICAL_GATES[key];
      const combos = gate.inputs === 1 ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
      combos.forEach((inp) => {
        const out = gate.inputs === 1 ? gate.fn(inp[0]) : gate.fn(inp[0], inp[1]);
        rows.push({
          key: `${key}-${inp.join(',')}`,
          name: gate.name,
          inputs: inp.join(', '),
          out,
        });
      });
    });
    return rows;
  }, []);

  function applyFixedGate(key: GateKey, btnEl?: HTMLElement | null, baseQubit?: Qubit) {
    const gate = GATES[key];
    const nextQ = (baseQubit ?? qubit).clone();
    nextQ.applyGate(gate.matrix);
    setQubit(nextQ);

    const [[a, b], [c, d]] = gate.matrixStr;
    const mv: MatrixView = { name: `${gate.name} =`, color: gate.color, cells: [a, b, c, d] };
    setMatrixView(mv);

    if (btnEl) pulseElement(btnEl, 'pulsing');
    pulseElement(blochWrapRef.current, 'pulsing', 550);

    const p0 = Math.round(nextQ.prob0() * 100);
    const p1 = Math.round(nextQ.prob1() * 100);
    const explain = `<strong style="color:${gate.color}">${gate.name} — ${gate.desc}.</strong> ${gate.explain} <br><br>New odds: ${p0}% |0⟩, ${p1}% |1⟩ — state is now <span style="font-family:'JetBrains Mono',monospace">${nextQ.getFormula()}</span>.`;
    setGateExplainer(explain);

    const nb = nextQ.getBloch();
    const entry: GateHistoryEntry = {
      label: gate.name,
      color: gate.color,
      theta: nb.theta,
      phi: nb.phi,
      matrixView: mv,
      explain,
    };
    setHistory((prev) => {
      const next = [...prev, entry];
      setHistoryCursor(next.length - 1);
      return next;
    });
  }

  function applyRotationGate(axis: RotationAxis, angleDeg: number, btnEl?: HTMLElement | null) {
    const gate = ROTATION_GATES[axis];
    const mat: GateMatrix = rotationMatrix(axis, angleDeg);
    const nextQ = qubit.clone();
    nextQ.applyGate(mat);
    setQubit(nextQ);

    const cells: [string, string, string, string] = [
      C.fmt(mat[0][0]),
      C.fmt(mat[0][1]),
      C.fmt(mat[1][0]),
      C.fmt(mat[1][1]),
    ];
    const mv: MatrixView = {
      name: `${gate.label}(${angleDeg}°) =`,
      color: gate.color,
      cells,
    };
    setMatrixView(mv);

    if (btnEl) pulseElement(btnEl, 'pulsing');
    pulseElement(blochWrapRef.current, 'pulsing', 550);

    const p0 = Math.round(nextQ.prob0() * 100);
    const p1 = Math.round(nextQ.prob1() * 100);
    const explain = `<strong style="color:${gate.color}">${gate.label}(${angleDeg}°) — ${gate.desc}.</strong> Unlike the fixed gates above, you choose exactly how far this one turns — drag the angle slider and apply it again to see the difference. <br><br>New odds: ${p0}% |0⟩, ${p1}% |1⟩ — state is now <span style="font-family:'JetBrains Mono',monospace">${nextQ.getFormula()}</span>.`;
    setGateExplainer(explain);

    const nb = nextQ.getBloch();
    const entry: GateHistoryEntry = {
      label: `${gate.label}(${angleDeg}°)`,
      color: gate.color,
      theta: nb.theta,
      phi: nb.phi,
      matrixView: mv,
      explain,
    };
    setHistory((prev) => {
      const next = [...prev, entry];
      setHistoryCursor(next.length - 1);
      return next;
    });
  }

  function restoreHistoryStep(i: number) {
    if (tryMeRunning) return;
    const entry = history[i];
    if (!entry) return;
    setHistoryCursor(i);
    const q = new Qubit();
    q.setState(entry.theta, entry.phi);
    setQubit(q);
    setMatrixView(entry.matrixView);
    setGateExplainer(entry.explain);
  }

  function resetGates() {
    if (tryMeRunning) return;
    setQubit(new Qubit());
    setHistory([]);
    setHistoryCursor(-1);
    setMatrixView(null);
    setGateExplainer('Back to |0⟩ — the qubit points straight up on the sphere, no gates applied yet. Click one to send it rotating.');
  }

  function runGatesTryMe() {
    if (tryMeRunning) return;
    setTryMeRunning(true);
    const keys = Object.keys(GATES) as GateKey[];
    let idx = 0;
    const timer = setInterval(() => {
      const key = keys[idx];
      applyFixedGate(key, null, new Qubit());
      idx++;
      if (idx >= keys.length) {
        clearInterval(timer);
        setTryMeRunning(false);
      }
    }, GATES_TRYME_INTERVAL_MS);
    timerRef.current = timer;
  }

  const referenceRows = [
    ...(Object.keys(GATES) as GateKey[]).map((key) => ({
      key,
      ns: 'gates',
      name: GATES[key].name,
      color: GATES[key].color,
      formalName: GATES[key].formalName,
      desc: GATES[key].desc,
    })),
    ...(Object.keys(ROTATION_GATES) as RotationAxis[]).map((key) => ({
      key,
      ns: 'rotationGates',
      name: ROTATION_GATES[key].label,
      color: ROTATION_GATES[key].color,
      formalName: ROTATION_GATES[key].formalName,
      desc: ROTATION_GATES[key].desc,
    })),
  ];

  const classicalTruthRows =
    cGate.inputs === 1
      ? [0, 1].map((a) => ({ a, b: undefined as number | undefined, out: cGate.fn(a) }))
      : [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ].map(([a, b]) => ({ a, b, out: cGate.fn(a, b) }));

  return (
    <section
      id="tab-gates"
      className={`tab-content${isActive ? ' active' : ''}`}
      style={{ display: nav.mode === 'sim' ? undefined : 'none' }}
    >
      <div className="compare-header">
        <h1 className="compare-title">{t('gates.title', 'Gates')}</h1>
        <p className="compare-subtitle">
          {t('gates.subtitle', 'Pick one gate and see its immediate effect — classical or quantum')}
        </p>
      </div>
      <div className="mode-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', maxWidth: '460px', margin: '0 auto 18px' }}>
        <button
          className={`preset-btn mode-btn${domain === 'classical' ? ' active' : ''}`}
          data-gates-domain="classical"
          onClick={() => setTabSub('gates', { gatesDomain: 'classical' })}
        >
          {t('gates.classicalGates', 'Classical Gates')}
        </button>
        <button
          className={`preset-btn mode-btn${domain === 'quantum' ? ' active' : ''}`}
          data-gates-domain="quantum"
          onClick={() => setTabSub('gates', { gatesDomain: 'quantum' })}
        >
          {t('gates.quantumGates', 'Quantum Gates')}
        </button>
        <button
          className={`preset-btn mode-btn${domain === 'compare' ? ' active' : ''}`}
          data-gates-domain="compare"
          onClick={() => setTabSub('gates', { gatesDomain: 'compare' })}
        >
          {t('gates.compareGates', 'Compare')}
        </button>
      </div>
      <div id="gates-classical-panel" style={{ display: domain === 'classical' ? undefined : 'none' }}>
        <div className="layout-two gates-layout">
          <div className="circuit-left" style={{ maxWidth: '320px' }}>
            <div className="section-label">{t('gates.pickGate', 'Gate — click to choose')}</div>
            <div className="circuit-palette" id="gc-gate-palette">
              {(Object.keys(CLASSICAL_GATES) as ClassicalGateKey[]).map((key) => {
                const g = CLASSICAL_GATES[key];
                return (
                  <button
                    key={key}
                    className={`circuit-gate-btn classical-gate-btn classical-gate-palette-btn${classicalGate === key ? ' active-gate' : ''}`}
                    title={g.desc}
                    data-gate={key}
                    onClick={() => setClassicalGate(key)}
                    dangerouslySetInnerHTML={{
                      __html: `${classicalGateIconSVG(key)}<span class="circuit-gate-btn-label">${g.name}</span>`,
                    }}
                  />
                );
              })}
            </div>
            <div className="switch-area" style={{ marginTop: '16px' }}>
              <span className={`bit-label${gcInputA === 0 ? ' active' : ''}`} id="gc-lbl-a0">
                0
              </span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  id="gc-input-a"
                  checked={gcInputA === 1}
                  onChange={(e) => setGcInputA(e.target.checked ? 1 : 0)}
                />
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </label>
              <span className={`bit-label${gcInputA === 1 ? ' active' : ''}`} id="gc-lbl-a1">
                1
              </span>
              <span className="muted-text" style={{ marginLeft: '10px' }}>
                {t('gates.inputA', 'Input A')}
              </span>
            </div>
            <div className="switch-area" id="gc-input-b-wrap" style={{ display: cGate.inputs === 1 ? 'none' : undefined }}>
              <span className={`bit-label${gcInputB === 0 ? ' active' : ''}`} id="gc-lbl-b0">
                0
              </span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  id="gc-input-b"
                  checked={gcInputB === 1}
                  onChange={(e) => setGcInputB(e.target.checked ? 1 : 0)}
                />
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </label>
              <span className={`bit-label${gcInputB === 1 ? ' active' : ''}`} id="gc-lbl-b1">
                1
              </span>
              <span className="muted-text" style={{ marginLeft: '10px' }}>
                {t('gates.inputB', 'Input B')}
              </span>
            </div>
          </div>
          <div className="right-panel">
            <div className="card">
              <div className="card-title">{t('common.output', 'Output')}</div>
              <div className="classical-display-wrap">
                <div className={`classical-display${cOut === 0 ? ' is-zero' : ''}`} id="gc-output-display">
                  {cOut}
                </div>
                <div className="classical-label" id="gc-output-label">
                  {cGate.inputs === 1 ? 'NOT A' : `A ${cGate.name} B`}
                </div>
              </div>
            </div>
            <div className="card explainer-card">
              <div className="card-title">{t('common.whatJustHappened', 'What just happened')}</div>
              <Explainer id="gc-explainer" html={cGate.explain} />
            </div>
            <div className="card">
              <div className="card-title">{t('common.truthTable', 'Truth Table')}</div>
              <table className="truth-table" id="gc-truth-table">
                <tbody>
                  <tr>
                    <th>A</th>
                    {cGate.inputs === 2 && <th>B</th>}
                    <th>Out</th>
                  </tr>
                  {classicalTruthRows.map((r, i) => {
                    const isCurrent = cGate.inputs === 1 ? r.a === gcInputA : r.a === gcInputA && r.b === gcInputB;
                    return (
                      <tr key={i} className={isCurrent ? 'truth-row-active' : ''}>
                        <td>{r.a}</td>
                        {cGate.inputs === 2 && <td>{r.b}</td>}
                        <td>{r.out}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div id="gates-quantum-panel" style={{ display: domain === 'quantum' ? undefined : 'none' }}>
        <div className="layout-two gates-layout">
          <div className="gates-left-panel">
            <div className="bloch-wrap" ref={blochWrapRef}>
              <BlochSphere
                id="bloch-gates"
                width={360}
                height={360}
                vector={{ x: bloch.x, y: bloch.y, z: bloch.z }}
                label={qubit.getLabel()}
                ariaLabel={`Bloch sphere. State: ${qubit.getFormula()}.`}
              />
              <div className="state-label" id="label-gates">
                {qubit.getLabel()}
              </div>
            </div>
            <div className="card explainer-card">
              <div className="card-title">{t('common.whatJustHappened', 'What just happened')}</div>
              <Explainer id="gate-explainer" html={gateExplainer} />
            </div>
            <div className="card">
              <div className="card-title">{t('common.appliedSequence', 'Applied Sequence')}</div>
              <div className="history-row" id="gate-history">
                {history.length === 0 ? (
                  <span className="muted-text">—</span>
                ) : (
                  history.map((entry, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`hist-tag${i === historyCursor ? ' is-current' : ''}`}
                      style={{ color: entry.color, borderColor: `${entry.color}44` }}
                      title="Click to revisit this step and re-read its explanation"
                      onClick={() => restoreHistoryStep(i)}
                    >
                      {entry.label}
                    </button>
                  ))
                )}
              </div>
              <div style={{ marginTop: '10px' }}>
                <button className="btn-secondary" id="btn-reset-gates" disabled={tryMeRunning} onClick={resetGates}>
                  {t('gates.resetToZero', 'Reset to |0⟩')}
                </button>
              </div>
            </div>
          </div>
          <div className="right-panel">
            <div className="card">
              <div className="card-title">{t('gates.applyGate', 'Apply Gate')}</div>
              <div className="gate-grid" id="gate-grid">
                {(Object.keys(GATES) as GateKey[]).map((key) => {
                  const gate = GATES[key];
                  return (
                    <button
                      key={key}
                      className="gate-btn"
                      data-gate-key={key}
                      disabled={tryMeRunning}
                      style={{ color: gate.color, borderColor: `${gate.color}44` }}
                      onClick={(e) => applyFixedGate(key, e.currentTarget)}
                    >
                      {gate.name}
                      <span className="gate-sub">{t(`gates.${key}.desc`, gate.desc)}</span>
                    </button>
                  );
                })}
              </div>
              <button
                className="btn-secondary"
                id="btn-gates-tryme"
                style={{ marginTop: '10px' }}
                disabled={tryMeRunning}
                onClick={runGatesTryMe}
              >
                {t('common.tryMe', 'Try me')}
              </button>
            </div>
            <div className="card">
              <div className="card-title">{t('gates.gateReference', 'Gate Reference')}</div>
              <div className="gate-reference-list" id="gate-reference-list">
                {referenceRows.map((g) => (
                  <div className="gate-reference-row" key={g.name}>
                    <span className="gate-reference-symbol" style={{ color: g.color }}>
                      {g.name}
                    </span>
                    <span className="gate-reference-formal">{t(`${g.ns}.${g.key}.formalName`, g.formalName)}</span>
                    <span className="gate-reference-nick">{t(`${g.ns}.${g.key}.desc`, g.desc)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-title">{t('gates.rotationGates', 'Rotation Gates')}</div>
              <div className="slider-group">
                <div className="slider-row">
                  <span className="slider-sym">θ</span>
                  <input
                    type="range"
                    id="rotation-angle"
                    min="0"
                    max="360"
                    disabled={tryMeRunning}
                    value={rotAngle}
                    onChange={(e) => setRotAngle(parseInt(e.target.value, 10))}
                  />
                  <span className="slider-val" id="rotation-angle-val">
                    {rotAngle}°
                  </span>
                </div>
              </div>
              <div className="gate-grid" id="rotation-gate-grid" style={{ marginTop: '10px' }}>
                {(Object.keys(ROTATION_GATES) as RotationAxis[]).map((axis) => {
                  const gate = ROTATION_GATES[axis];
                  return (
                    <button
                      key={axis}
                      className="gate-btn"
                      disabled={tryMeRunning}
                      style={{ color: gate.color, borderColor: `${gate.color}44` }}
                      onClick={(e) => applyRotationGate(axis, rotAngle, e.currentTarget)}
                    >
                      {gate.label}
                      <span className="gate-sub">{t(`rotationGates.${axis}.desc`, gate.desc)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="card">
              <div className="card-title">{t('gates.gateMatrix', 'Gate Matrix')}</div>
              <div className="matrix-display" id="matrix-display">
                {!matrixView ? (
                  <span className="muted-text">{t('gates.selectAGate', '← select a gate')}</span>
                ) : (
                  <>
                    <div className="matrix-name">{matrixView.name}</div>
                    <div className="matrix-body">
                      <span className="matrix-bracket">[</span>
                      <div className="matrix-cells">
                        {matrixView.cells.map((cell, idx) => (
                          <span key={idx} className="matrix-cell" style={{ color: matrixView.color }}>
                            {cell}
                          </span>
                        ))}
                      </div>
                      <span className="matrix-bracket">]</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card-title">{t('common.truthTable', 'Truth Table')}</div>
              <p className="bit-explainer">
                {t(
                  'gates.quantumTruthTableNote',
                  "Each fixed gate's action on the two basis states — rotation gates (Rx/Ry/Rz) aren't included since their output depends on a runtime angle, not a fixed table."
                )}
              </p>
              <table className="truth-table" id="gates-truth-table" style={{ marginTop: '8px' }}>
                <tbody>
                  <tr>
                    <th>{t('common.gate', 'Gate')}</th>
                    <th>{t('common.input', 'Input')}</th>
                    <th>{t('common.output', 'Output')}</th>
                  </tr>
                  {quantumTruthRows.map((r) => (
                    <tr key={r.key}>
                      <td style={{ color: r.color, fontWeight: 700 }}>{r.name}</td>
                      <td>|{r.input}⟩</td>
                      <td>{r.output}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card">
              <div className="card-title">{t('gates.whyReversibleTitle', 'Why Every Gate Is Reversible')}</div>
              <p className="bit-explainer">
                {t(
                  'gates.whyReversibleBody',
                  "Every gate on the left is a unitary matrix (U†U = I) — not by convention, but because a gate is really just the qubit's own Schrödinger-equation time evolution, which always preserves total probability. One direct consequence: quantum gates never destroy information. Apply any gate, then its conjugate transpose, and the qubit lands back exactly where it started — there's no quantum equivalent of a classical AND gate quietly throwing a bit away."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div id="gates-compare-panel" style={{ display: domain === 'compare' ? undefined : 'none' }}>
        <div className="compare-layout" style={{ gridTemplateColumns: '1fr 40px 1fr', maxWidth: '1080px' }}>
          <div className="compare-col classical-col">
            <div className="col-label">
              <span className="col-badge">{t('common.classical', 'Classical')}</span>
              <span className="col-desc">
                {t('gates.compareClassicalDesc', 'NOT/AND/OR/XOR and their negations — strict, destructive rules')}
              </span>
            </div>
            <table className="truth-table" id="gates-compare-classical-table">
              <tbody>
                <tr>
                  <th>{t('common.gate', 'Gate')}</th>
                  <th>{t('common.input', 'Input')}</th>
                  <th>{t('common.output', 'Output')}</th>
                </tr>
                {allClassicalTruthRows.map((r) => (
                  <tr key={r.key}>
                    <td style={{ fontWeight: 700 }}>{r.name}</td>
                    <td>{r.inputs}</td>
                    <td>{r.out}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="compare-divider">
            <div className="divider-line" />
            <div className="divider-vs">vs</div>
            <div className="divider-line" />
          </div>
          <div className="compare-col quantum-col">
            <div className="col-label">
              <span className="col-badge quantum-badge">{t('common.quantum', 'Quantum')}</span>
              <span className="col-desc">
                {t('gates.compareQuantumDesc', 'H/X/Y/Z/S/T — always reversible, can create superposition')}
              </span>
            </div>
            <table className="truth-table" id="gates-compare-quantum-table">
              <tbody>
                <tr>
                  <th>{t('common.gate', 'Gate')}</th>
                  <th>{t('common.input', 'Input')}</th>
                  <th>{t('common.output', 'Output')}</th>
                </tr>
                {quantumTruthRows.map((r) => (
                  <tr key={r.key}>
                    <td style={{ color: r.color, fontWeight: 700 }}>{r.name}</td>
                    <td>|{r.input}⟩</td>
                    <td>{r.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card mt-14" style={{ maxWidth: '1080px', marginLeft: 'auto', marginRight: 'auto' }}>
          <div className="card-title">{t('gates.compareInsightTitle', 'The Key Difference')}</div>
          <p className="bit-explainer">
            {t(
              'gates.compareInsightBody',
              "Every classical row above collapses information — AND, OR, and friends all map multiple input combinations onto the same output, so there's no way back to the input from the output alone. Every quantum row is reversible: each is a unitary matrix, so running its own conjugate transpose afterward always recovers the exact input. Classical gates can also only ever output a definite 0 or 1; quantum gates like H can output a genuine superposition of both."
            )}
          </p>
        </div>
      </div>
      <LessonEmbed id="gates" />
    </section>
  );
}
