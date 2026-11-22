import { useEffect, useMemo, useRef, useState } from 'react';
import { Qubit } from '../../core/qubit.ts';
import { useI18n } from '../../hooks/useI18n.ts';
import { useNav } from '../../hooks/useNav.ts';
import { setTabSub } from '../../state/nav.ts';
import BlochSphere from '../BlochSphere.tsx';
import Explainer from '../Explainer.tsx';
import LessonEmbed from '../LessonEmbed.tsx';

const CLASSICAL_TRYME_FLIPS = 5;
const CLASSICAL_TRYME_INTERVAL_MS = 2600;
const QUBIT_TRYME_INTERVAL_MS = 2800;
const PRESET_MATCH_EPS = 1e-3;
const QUBIT3_KETS = ['000', '001', '010', '011', '100', '101', '110', '111'];

interface AnglePair {
  theta: number;
  phi: number;
}

interface PresetBtnDef {
  label: string;
  thetaMult: number;
  phiMult: number;
}

const BASIS_PRESETS_6: PresetBtnDef[] = [
  { label: '|0⟩', thetaMult: 0, phiMult: 0 },
  { label: '|1⟩', thetaMult: 1, phiMult: 0 },
  { label: '|+⟩', thetaMult: 0.5, phiMult: 0 },
  { label: '|-⟩', thetaMult: 0.5, phiMult: 1 },
  { label: '|i⟩', thetaMult: 0.5, phiMult: 0.5 },
  { label: '|-i⟩', thetaMult: 0.5, phiMult: 1.5 },
];

const BASIS_PRESETS_4: PresetBtnDef[] = BASIS_PRESETS_6.slice(0, 4);

const QUBIT_TRYME_STATES: AnglePair[] = BASIS_PRESETS_6.map((p) => ({
  theta: p.thetaMult * Math.PI,
  phi: p.phiMult * Math.PI,
}));

const QUBIT_TRYME_LABELS = ['|0⟩', '|1⟩', '|+⟩', '|-⟩', '|i⟩', '|-i⟩'];
const QUBIT_TRYME_DETAILS = [
  'the north pole of the Bloch sphere — the qubit\'s definite "off" state, with zero superposition at all.',
  'the south pole of the Bloch sphere — the definite "on" state, the exact opposite pole from |0⟩.',
  "sitting on the equator at phase φ=0° — an equal superposition. A measurement here is a genuine coin flip: before you measure, the qubit isn't secretly one value or the other, it truly holds both at once.",
  "also on the equator (the same 50/50 odds as |+⟩) but at phase φ=180°, so the |1⟩ amplitude points the opposite way. A single measurement can't tell |+⟩ and |-⟩ apart — only a Hadamard gate or an interference experiment reveals that hidden phase.",
  'on the equator at phase φ=90° — 50/50 odds again, but now with an imaginary relative phase between the amplitudes. This is a state a classical bit could never represent — the extra "twist" comes from the complex numbers underlying quantum amplitudes.',
  'on the equator at phase φ=270°, the mirror image of |i⟩ — same 50/50 measurement odds, opposite imaginary phase.',
];

interface TryMeHistoryStep<T> {
  state: T;
  explain: string;
  historyLabel: string;
  historyColor: string;
}

function isPresetMatch(p: PresetBtnDef, theta: number, phi: number): boolean {
  const twoPi = 2 * Math.PI;
  const normPhi = ((phi % twoPi) + twoPi) % twoPi;
  const bTheta = p.thetaMult * Math.PI;
  const bPhi = (((p.phiMult * Math.PI) % twoPi) + twoPi) % twoPi;
  const phiDiff = Math.min(Math.abs(bPhi - normPhi), twoPi - Math.abs(bPhi - normPhi));
  return Math.abs(bTheta - theta) < PRESET_MATCH_EPS && phiDiff < PRESET_MATCH_EPS;
}

function makeQubit(a: AnglePair): Qubit {
  const q = new Qubit();
  q.setState(a.theta, a.phi);
  return q;
}

export default function QubitTab() {
  const { t } = useI18n();
  const nav = useNav();
  const isActive = nav.mode === 'sim' && nav.tab === 'qubit';

  const mode = nav.sub.qubit?.qubitMode || 'quantum';
  const submode = nav.sub.qubit?.qubitSubmode ?? null;

  // Classical state
  const [classicalBit, setClassicalBit] = useState<0 | 1>(1);
  const [classicalRunning, setClassicalRunning] = useState(false);
  const [classicalExplainer, setClassicalExplainer] = useState(
    t('qubitTab.classicalTryMeIdle', 'Click Try me to watch the bit flip back and forth.')
  );
  const [classicalHistory, setClassicalHistory] = useState<Array<TryMeHistoryStep<0 | 1>>>([]);
  const [classicalCursor, setClassicalCursor] = useState<number>(-1);

  // 1Q state
  const [mainAngles, setMainAngles] = useState<AnglePair>({ theta: 0, phi: 0 });
  const [shareText, setShareText] = useState<string | null>(null);
  const [q1Running, setQ1Running] = useState(false);
  const [q1Explainer, setQ1Explainer] = useState(
    t('qubitTab.oneQubitTryMeIdle', 'Click Try me to cycle through the six basis states.')
  );
  const [q1History, setQ1History] = useState<Array<TryMeHistoryStep<AnglePair>>>([]);
  const [q1Cursor, setQ1Cursor] = useState<number>(-1);

  // 2Q state
  const [q2AAngles, setQ2AAngles] = useState<AnglePair>({ theta: 0, phi: 0 });
  const [q2BAngles, setQ2BAngles] = useState<AnglePair>({ theta: 0, phi: 0 });
  const [q2Running, setQ2Running] = useState(false);
  const [q2Explainer, setQ2Explainer] = useState(
    t('qubitTab.twoQubitTryMeIdle', 'Click Try me to move both qubits together through the four basis states.')
  );
  const [q2History, setQ2History] = useState<Array<TryMeHistoryStep<AnglePair>>>([]);
  const [q2Cursor, setQ2Cursor] = useState<number>(-1);

  // 3Q state
  const [q3AAngles, setQ3AAngles] = useState<AnglePair>({ theta: 0, phi: 0 });
  const [q3BAngles, setQ3BAngles] = useState<AnglePair>({ theta: 0, phi: 0 });
  const [q3CAngles, setQ3CAngles] = useState<AnglePair>({ theta: 0, phi: 0 });
  const [q3Running, setQ3Running] = useState(false);
  const [q3Explainer, setQ3Explainer] = useState(
    t('qubitTab.threeQubitTryMeIdle', 'Click Try me to move all three qubits together through the four basis states.')
  );
  const [q3History, setQ3History] = useState<Array<TryMeHistoryStep<AnglePair>>>([]);
  const [q3Cursor, setQ3Cursor] = useState<number>(-1);

  const timersRef = useRef<Array<ReturnType<typeof setInterval>>>([]);

  useEffect(() => {
    if (nav.sharedQubitState) {
      setMainAngles(nav.sharedQubitState);
    }
  }, [nav.sharedQubitState]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearInterval);
    };
  }, []);

  const qubitMain = useMemo(() => makeQubit(mainAngles), [mainAngles]);
  const mainBloch = qubitMain.getBloch();
  const mainP0 = qubitMain.prob0() * 100;
  const mainP1 = qubitMain.prob1() * 100;

  const qubit2A = useMemo(() => makeQubit(q2AAngles), [q2AAngles]);
  const qubit2B = useMemo(() => makeQubit(q2BAngles), [q2BAngles]);
  const b2A = qubit2A.getBloch();
  const b2B = qubit2B.getBloch();
  const q2Joint = {
    '00': qubit2A.prob0() * qubit2B.prob0() * 100,
    '01': qubit2A.prob0() * qubit2B.prob1() * 100,
    '10': qubit2A.prob1() * qubit2B.prob0() * 100,
    '11': qubit2A.prob1() * qubit2B.prob1() * 100,
  };

  const qubit3A = useMemo(() => makeQubit(q3AAngles), [q3AAngles]);
  const qubit3B = useMemo(() => makeQubit(q3BAngles), [q3BAngles]);
  const qubit3C = useMemo(() => makeQubit(q3CAngles), [q3CAngles]);
  const b3A = qubit3A.getBloch();
  const b3B = qubit3B.getBloch();
  const b3C = qubit3C.getBloch();
  const p3A = [qubit3A.prob0(), qubit3A.prob1()];
  const p3B = [qubit3B.prob0(), qubit3B.prob1()];
  const p3C = [qubit3C.prob0(), qubit3C.prob1()];

  function selectQubitMode(nextMode: 'classical' | 'quantum') {
    if (nextMode === 'quantum') {
      setTabSub('qubit', { qubitMode: 'quantum', qubitSubmode: null });
    } else {
      setTabSub('qubit', { qubitMode: 'classical', qubitSubmode: undefined });
    }
  }

  function selectQubitSubmode(nextSub: '1q' | '2q' | '3q' | null) {
    setTabSub('qubit', { qubitMode: 'quantum', qubitSubmode: nextSub });
  }

  function handleSphereKeyDown(current: AnglePair, setter: (a: AnglePair) => void) {
    return (e: React.KeyboardEvent<HTMLCanvasElement>) => {
      const step = e.shiftKey ? Math.PI / 6 : Math.PI / 36;
      let { theta, phi } = current;
      switch (e.key) {
        case 'ArrowUp':
          theta = Math.max(0, theta - step);
          break;
        case 'ArrowDown':
          theta = Math.min(Math.PI, theta + step);
          break;
        case 'ArrowLeft':
          phi -= step;
          break;
        case 'ArrowRight':
          phi += step;
          break;
        default:
          return;
      }
      phi = ((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      e.preventDefault();
      setter({ theta, phi });
    };
  }

  async function copyShareQubit() {
    const params = new URLSearchParams({
      tab: 'qubit',
      theta: mainBloch.theta.toFixed(4),
      phi: mainBloch.phi.toFixed(4),
    });
    const url = `${location.origin}${location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareText('Copied!');
    } catch {
      setShareText('Copy failed');
    }
    setTimeout(() => setShareText(null), 1400);
  }

  function runClassicalTryMe() {
    if (classicalRunning) return;
    setClassicalRunning(true);
    setClassicalHistory([]);
    setClassicalCursor(-1);

    const steps: Array<TryMeHistoryStep<0 | 1>> = [];
    let bit = classicalBit;
    for (let i = 0; i < CLASSICAL_TRYME_FLIPS; i++) {
      bit = bit === 0 ? 1 : 0;
      steps.push({
        state: bit,
        explain:
          `Step ${i + 1}: the bit is now <strong>${bit}</strong>. A classical bit is a real physical switch — a transistor either ` +
          `conducting or not, a magnetic domain pointing one way or the other — so it always holds one definite value at every instant. ` +
          `There's no "47% chance it's 1" reading for a classical bit the way there is for a qubit's superposition; it's cleanly ` +
          `${bit} — full stop — until something flips it again.`,
        historyLabel: String(bit),
        historyColor: bit === 0 ? 'var(--zero)' : 'var(--one)',
      });
    }

    let idx = 0;
    const timer = setInterval(() => {
      const step = steps[idx];
      setClassicalBit(step.state);
      setClassicalExplainer(step.explain);
      setClassicalHistory(steps.slice(0, idx + 1));
      setClassicalCursor(idx);
      idx++;
      if (idx >= steps.length) {
        clearInterval(timer);
        setClassicalRunning(false);
      }
    }, CLASSICAL_TRYME_INTERVAL_MS);
    timersRef.current.push(timer);
  }

  function runQ1TryMe() {
    if (q1Running) return;
    setQ1Running(true);
    setQ1History([]);
    setQ1Cursor(-1);

    const steps: Array<TryMeHistoryStep<AnglePair>> = QUBIT_TRYME_STATES.map((s, i) => {
      const q = makeQubit(s);
      const label = QUBIT_TRYME_LABELS[i];
      const detail = QUBIT_TRYME_DETAILS[i];
      const p0 = Math.round(q.prob0() * 100);
      const p1 = Math.round(q.prob1() * 100);
      return {
        state: s,
        explain: `<strong>${label}</strong> — ${detail} Right now that's ${p0}% |0⟩, ${p1}% |1⟩.`,
        historyLabel: label,
        historyColor: 'var(--zero)',
      };
    });

    let idx = 0;
    const timer = setInterval(() => {
      const step = steps[idx];
      setMainAngles(step.state);
      setQ1Explainer(step.explain);
      setQ1History(steps.slice(0, idx + 1));
      setQ1Cursor(idx);
      idx++;
      if (idx >= steps.length) {
        clearInterval(timer);
        setQ1Running(false);
      }
    }, QUBIT_TRYME_INTERVAL_MS);
    timersRef.current.push(timer);
  }

  function runQ2TryMe() {
    if (q2Running) return;
    setQ2Running(true);
    setQ2History([]);
    setQ2Cursor(-1);

    const steps: Array<TryMeHistoryStep<AnglePair>> = QUBIT_TRYME_STATES.slice(0, 4).map((s, i) => {
      const q = makeQubit(s);
      const label = QUBIT_TRYME_LABELS[i];
      const detail = QUBIT_TRYME_DETAILS[i];
      const p0 = q.prob0();
      const p1 = q.prob1();
      const pct = (x: number) => Math.round(x * 100);
      return {
        state: s,
        explain:
          `Both qubits set to <strong>${label}</strong> — ${detail} Since the two qubits are completely independent (not entangled), ` +
          `the joint state is the tensor product ${label}⊗${label}: ${pct(p0 * p0)}% |00⟩, ${pct(p0 * p1)}% |01⟩, ${pct(p1 * p0)}% |10⟩, ${pct(p1 * p1)}% |11⟩ — ` +
          `exactly P(ab) = P(a) × P(b).`,
        historyLabel: label,
        historyColor: 'var(--one)',
      };
    });

    let idx = 0;
    const timer = setInterval(() => {
      const step = steps[idx];
      setQ2AAngles(step.state);
      setQ2BAngles(step.state);
      setQ2Explainer(step.explain);
      setQ2History(steps.slice(0, idx + 1));
      setQ2Cursor(idx);
      idx++;
      if (idx >= steps.length) {
        clearInterval(timer);
        setQ2Running(false);
      }
    }, QUBIT_TRYME_INTERVAL_MS);
    timersRef.current.push(timer);
  }

  function runQ3TryMe() {
    if (q3Running) return;
    setQ3Running(true);
    setQ3History([]);
    setQ3Cursor(-1);

    const steps: Array<TryMeHistoryStep<AnglePair>> = QUBIT_TRYME_STATES.slice(0, 4).map((s, i) => {
      const q = makeQubit(s);
      const label = QUBIT_TRYME_LABELS[i];
      const detail = QUBIT_TRYME_DETAILS[i];
      const p0 = q.prob0();
      const p1 = q.prob1();
      const jointDesc =
        p0 > 0.999
          ? 'always |000⟩ — 100% certain, zero superposition anywhere in the joint state'
          : p1 > 0.999
            ? 'always |111⟩ — 100% certain, zero superposition anywhere in the joint state'
            : 'a flat 12.5% across all eight outcomes |000⟩ through |111⟩';
      return {
        state: s,
        explain:
          `All three qubits set to <strong>${label}</strong> — ${detail} Since all three are independent (not entangled), ` +
          `the joint state is the triple tensor product ${label}⊗${label}⊗${label}: ${jointDesc} — exactly P(abc) = P(a) × P(b) × P(c).`,
        historyLabel: label,
        historyColor: 'var(--zero)',
      };
    });

    let idx = 0;
    const timer = setInterval(() => {
      const step = steps[idx];
      setQ3AAngles(step.state);
      setQ3BAngles(step.state);
      setQ3CAngles(step.state);
      setQ3Explainer(step.explain);
      setQ3History(steps.slice(0, idx + 1));
      setQ3Cursor(idx);
      idx++;
      if (idx >= steps.length) {
        clearInterval(timer);
        setQ3Running(false);
      }
    }, QUBIT_TRYME_INTERVAL_MS);
    timersRef.current.push(timer);
  }

  return (
    <section
      id="tab-qubit"
      className={`tab-content${isActive ? ' active' : ''}`}
      style={{ display: nav.mode === 'sim' ? undefined : 'none' }}
    >
      <div className="compare-header">
        <h1 className="compare-title">{t('qubitTab.pageTitle', 'Bits & Qubits')}</h1>
        <p className="compare-subtitle">
          {t('qubitTab.pageSubtitle', 'Learn classical and quantum information by exploring a bit, a single qubit, or a two-qubit system.')}
        </p>
      </div>
      <div className="mode-grid" style={{ gridTemplateColumns: '1fr 1fr', maxWidth: '280px', margin: '0 auto 18px' }}>
        <button
          className={`preset-btn mode-btn${mode === 'classical' ? ' active' : ''}`}
          data-qubit-mode="classical"
          onClick={() => selectQubitMode('classical')}
        >
          {t('common.classical', 'Classical')}
        </button>
        <button
          className={`preset-btn mode-btn${mode === 'quantum' ? ' active' : ''}`}
          data-qubit-mode="quantum"
          onClick={() => selectQubitMode('quantum')}
        >
          {t('common.quantum', 'Quantum')}
        </button>
      </div>
      <div id="qubit-classical-panel" style={{ display: mode === 'classical' ? undefined : 'none' }}>
        <div className="compare-layout" style={{ gridTemplateColumns: '1fr', justifyItems: 'center' }}>
          <div className="compare-col classical-col">
            <div className="col-label">
              <span className="col-badge">{t('qubitTab.classicalBitBadge', 'Classical Bit')}</span>
              <span className="col-desc">
                {t(
                  'qubitTab.classicalBitDesc',
                  'A bit is the smallest unit of information in a classical computer. Unlike a qubit, a classical bit never exists in both states simultaneously.'
                )}
              </span>
            </div>
            <div className="classical-display-wrap">
              <div className={`classical-display${classicalBit === 0 ? ' is-zero' : ''}`} id="classical-display">
                {classicalBit}
              </div>
              <div className="classical-label">{t('qubitTab.currentBit', 'Current bit')}</div>
            </div>
            <div className="switch-area">
              <span className={`bit-label${classicalBit === 0 ? ' active' : ''}`} id="lbl-zero">
                0
              </span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  id="bit-toggle"
                  checked={classicalBit === 1}
                  disabled={classicalRunning}
                  onChange={(e) => setClassicalBit(e.target.checked ? 1 : 0)}
                />
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </label>
              <span className={`bit-label${classicalBit === 1 ? ' active' : ''}`} id="lbl-one">
                1
              </span>
            </div>
            <div className="classical-info">
              <div className="info-row">
                <span className="info-key">{t('qubitTab.possibleValues', 'Possible values')}</span>
                <span className="info-val mono">0 or 1</span>
              </div>
            </div>
            <button
              className="btn-secondary"
              id="btn-classical-tryme"
              style={{ marginBottom: '14px' }}
              disabled={classicalRunning}
              onClick={runClassicalTryMe}
            >
              {t('common.tryMe', 'Try me')}
            </button>
            <p className="bit-explainer">
              {t('qubitTab.classicalExplainer', 'Toggle the switch to change the bit. Notice it is always either 0 or 1, never both.')}
            </p>
            <div className="card explainer-card mt-14">
              <div className="card-title">{t('common.whatJustHappened', 'What just happened')}</div>
              <Explainer id="classical-tryme-explainer" html={classicalExplainer} />
            </div>
            <div className="card mt-14">
              <div className="card-title">{t('common.appliedSequence', 'Applied Sequence')}</div>
              <div className="history-row" id="classical-tryme-history">
                {classicalHistory.map((step, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`hist-tag${i === classicalCursor ? ' is-current' : ''}`}
                    style={{ color: step.historyColor, borderColor: `${step.historyColor}44` }}
                    title="Click to revisit this step and re-read its explanation"
                    disabled={classicalRunning}
                    onClick={() => {
                      setClassicalBit(step.state);
                      setClassicalExplainer(step.explain);
                      setClassicalCursor(i);
                    }}
                  >
                    {step.historyLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="qubit-quantum-panel" style={{ display: mode === 'quantum' ? undefined : 'none' }}>
        <div id="qubit-quantum-intro" style={{ display: submode ? 'none' : undefined }}>
          <div className="compare-layout" style={{ gridTemplateColumns: '1fr', justifyItems: 'center' }}>
            <div className="compare-col quantum-col">
              <div className="col-label">
                <span className="col-badge quantum-badge">{t('qubitTab.qubitBadge', 'Qubit')}</span>
                <span className="col-desc">
                  {t(
                    'qubitTab.qubitDesc',
                    "A qubit is the fundamental unit of quantum information. Unlike a classical bit, it can exist in a superposition of both 0 and 1 at once — its state is described by two complex amplitudes, α and β, until the moment it's measured."
                  )}
                </span>
              </div>
              <p className="bit-explainer">
                {t(
                  'qubitTab.qubitIntroExplainer',
                  "Pick a mode below: explore a single qubit's superposition on the Bloch sphere, or see how two independent qubits combine into a joint state."
                )}
              </p>
              <p
                className="bit-explainer mt-14"
                dangerouslySetInnerHTML={{
                  __html: t(
                    'qubitTab.whatIsQubitBody',
                    'A qubit is often described as "0 and 1 at the same time," but that\'s shorthand for something more precise: its state is a <span class="key-term">superposition</span> — a weighted combination — of the two basis outcomes |0⟩ and |1⟩, set by two <span class="key-term">complex amplitudes</span> α and β. Squaring the size of each amplitude gives the probability of that outcome when measured — but before measurement, the qubit genuinely hasn\'t picked one. A classical bit has exactly two states. A qubit has infinitely many: every point on the surface of the Bloch sphere below is a valid state, not just its two poles.'
                  ),
                }}
              />
            </div>
          </div>
        </div>
        <div className="mode-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', maxWidth: '400px', margin: '0 auto 18px' }}>
          <button
            className={`preset-btn mode-btn${submode === '1q' ? ' active' : ''}`}
            data-qubit-submode="1q"
            onClick={() => selectQubitSubmode('1q')}
          >
            {t('qubitTab.oneQubit', 'One Qubit')}
          </button>
          <button
            className={`preset-btn mode-btn${submode === '2q' ? ' active' : ''}`}
            data-qubit-submode="2q"
            onClick={() => selectQubitSubmode('2q')}
          >
            {t('qubitTab.twoQubit', 'Two Qubit')}
          </button>
          <button
            className={`preset-btn mode-btn${submode === '3q' ? ' active' : ''}`}
            data-qubit-submode="3q"
            onClick={() => selectQubitSubmode('3q')}
          >
            {t('qubitTab.threeQubit', 'Three Qubit')}
          </button>
        </div>
        <div id="qubit-1q-panel" style={{ display: submode === '1q' ? undefined : 'none' }}>
          <div className="compare-layout" style={{ gridTemplateColumns: '1fr', justifyItems: 'center' }}>
            <div className="compare-col quantum-col">
              <div className="col-label">
                <span className="col-badge quantum-badge">{t('common.quantum', 'Quantum')}</span>
                <span className="col-desc">{t('qubitTab.oneQubitDesc', 'A superposition of both 0 and 1')}</span>
              </div>
              <div className="layout-two">
                <div className="bloch-wrap bloch-wrap--drag">
                  <BlochSphere
                    id="bloch-main"
                    width={260}
                    height={260}
                    vector={{ x: mainBloch.x, y: mainBloch.y, z: mainBloch.z }}
                    label={qubitMain.getLabel()}
                    onDrag={(theta, phi) => setMainAngles({ theta, phi })}
                    onKeyDown={handleSphereKeyDown(mainAngles, setMainAngles)}
                    ariaLabel={`Bloch sphere. State: ${qubitMain.getFormula()}. Draggable, or focus and use arrow keys, to set the qubit's state.`}
                  />
                  <div className="state-label" id="label-main">
                    {qubitMain.getLabel()}
                  </div>
                </div>
                <div className="right-panel">
                  <div className="card">
                    <div className="card-title">{t('common.stateVector', 'State Vector')}</div>
                    <div className="formula" id="formula-main">
                      {qubitMain.getFormula()}
                    </div>
                    <div className="prob-rows">
                      <div className="prob-row">
                        <span className="ket zero-color">|0⟩</span>
                        <div className="track">
                          <div className="fill zero-fill" id="fill0-main" style={{ width: `${mainP0}%` }} />
                        </div>
                        <span className="pct" id="pct0-main">
                          {Math.round(mainP0)}%
                        </span>
                      </div>
                      <div className="prob-row">
                        <span className="ket one-color">|1⟩</span>
                        <div className="track">
                          <div className="fill one-fill" id="fill1-main" style={{ width: `${mainP1}%` }} />
                        </div>
                        <span className="pct" id="pct1-main">
                          {Math.round(mainP1)}%
                        </span>
                      </div>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      <button className="btn-secondary" id="btn-share-qubit" onClick={copyShareQubit}>
                        {shareText ?? t('common.copyShareableLink', 'Copy shareable link')}
                      </button>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-title">{t('common.basisStates', 'Basis States')}</div>
                    <div className="preset-grid">
                      {BASIS_PRESETS_6.map((p) => (
                        <button
                          key={p.label}
                          className={`preset-btn${isPresetMatch(p, mainBloch.theta, mainBloch.phi) ? ' is-active' : ''}`}
                          disabled={q1Running}
                          onClick={() => setMainAngles({ theta: p.thetaMult * Math.PI, phi: p.phiMult * Math.PI })}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-title">{t('qubitTab.exploreBlochSphere', 'Explore the Bloch Sphere')}</div>
                    <div className="slider-group">
                      <div className="slider-row">
                        <span className="slider-sym">θ</span>
                        <input
                          type="range"
                          id="sl-theta"
                          min="0"
                          max="3141"
                          disabled={q1Running}
                          value={Math.round(mainAngles.theta * 1000)}
                          onChange={(e) =>
                            setMainAngles((prev) => ({ ...prev, theta: parseInt(e.target.value, 10) / 1000 }))
                          }
                        />
                        <span className="slider-val" id="val-theta">
                          {Math.round((mainBloch.theta * 180) / Math.PI)}°
                        </span>
                      </div>
                      <div className="slider-row">
                        <span className="slider-sym">φ</span>
                        <input
                          type="range"
                          id="sl-phi"
                          min="0"
                          max="6283"
                          disabled={q1Running}
                          value={Math.round(mainAngles.phi * 1000)}
                          onChange={(e) =>
                            setMainAngles((prev) => ({ ...prev, phi: parseInt(e.target.value, 10) / 1000 }))
                          }
                        />
                        <span className="slider-val" id="val-phi">
                          {Math.round((mainBloch.phi * 180) / Math.PI)}°
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-title">{t('qubitTab.blochEarthTitle', 'The Bloch Sphere — Think of Planet Earth')}</div>
                    <p
                      className="bit-explainer"
                      dangerouslySetInnerHTML={{
                        __html: t(
                          'qubitTab.blochEarthBody',
                          'The sphere your qubit lives on works like a globe. The <span class="key-term">north pole</span> is |0⟩ and the <span class="key-term">south pole</span> is |1⟩ — θ (theta) is "latitude," how far the qubit has tilted from the |0⟩ pole toward |1⟩. Sitting right on the <span class="key-term">equator</span> (θ = 90°) means an equal 50/50 <span class="key-term">superposition</span> of both. φ (phi) is "longitude" — it never changes the measurement odds, only the relative <span class="key-term">phase</span> between the two amplitudes, which is invisible to a single measurement but is exactly what drives interference elsewhere in this app.'
                        ),
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="quantum-info">
                <div className="info-row">
                  <span className="info-key">{t('common.possibleStates', 'Possible states')}</span>
                  <span className="info-val mono">∞ — any point on Bloch sphere</span>
                </div>
                <div className="info-row">
                  <span className="info-key">{t('common.uncertainty', 'Uncertainty')}</span>
                  <span className="info-val mono">{t('common.uncertaintyFundamental', 'Fundamental — until measured')}</span>
                </div>
                <div className="info-row">
                  <span className="info-key">{t('common.representation', 'Representation')}</span>
                  <span className="info-val mono">α|0⟩ + β|1⟩, |α|² + |β|² = 1</span>
                </div>
              </div>
              <button
                className="btn-secondary mt-14"
                id="btn-qubit-tryme"
                disabled={q1Running}
                onClick={runQ1TryMe}
              >
                {t('common.tryMe', 'Try me')}
              </button>
              <p className="bit-explainer mt-14">
                {t(
                  'qubitTab.oneQubitExplainer',
                  'A qubit can be in a superposition of |0⟩ and |1⟩ simultaneously. Drag the sliders to explore every possible state on the Bloch sphere — each point is a valid qubit state inaccessible to any classical bit.'
                )}
              </p>
              <div className="card explainer-card mt-14">
                <div className="card-title">{t('common.whatJustHappened', 'What just happened')}</div>
                <Explainer id="qubit-tryme-explainer" html={q1Explainer} />
              </div>
              <div className="card mt-14">
                <div className="card-title">{t('common.appliedSequence', 'Applied Sequence')}</div>
                <div className="history-row" id="qubit-tryme-history">
                  {q1History.map((step, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`hist-tag${i === q1Cursor ? ' is-current' : ''}`}
                      style={{ color: step.historyColor, borderColor: `${step.historyColor}44` }}
                      title="Click to revisit this step and re-read its explanation"
                      disabled={q1Running}
                      onClick={() => {
                        setMainAngles(step.state);
                        setQ1Explainer(step.explain);
                        setQ1Cursor(i);
                      }}
                    >
                      {step.historyLabel}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="qubit-2q-panel" style={{ display: submode === '2q' ? undefined : 'none' }}>
          <div className="compare-layout" style={{ gridTemplateColumns: '1fr 40px 1fr' }}>
            <div className="compare-col">
              <div className="col-label">
                <span className="col-badge quantum-badge">{t('qubitTab.qubitABadge', 'Qubit A')}</span>
                <span className="col-desc">{t('qubitTab.qubitADesc', 'Independent — not entangled with B')}</span>
              </div>
              <div className="bloch-wrap bloch-wrap--drag">
                <BlochSphere
                  id="bloch-2q-a"
                  width={220}
                  height={220}
                  vector={{ x: b2A.x, y: b2A.y, z: b2A.z }}
                  label={qubit2A.getLabel()}
                  onDrag={(theta, phi) => setQ2AAngles({ theta, phi })}
                  onKeyDown={handleSphereKeyDown(q2AAngles, setQ2AAngles)}
                  ariaLabel={`Bloch sphere for Qubit A. State: ${qubit2A.getFormula()}. Draggable, or focus and use arrow keys, to set the qubit's state.`}
                />
                <div className="state-label" id="label-2q-a">
                  {qubit2A.getLabel()}
                </div>
              </div>
              <div className="preset-grid preset-grid--2col" style={{ marginTop: '10px' }}>
                {BASIS_PRESETS_4.map((p) => (
                  <button
                    key={p.label}
                    className={`preset-btn${isPresetMatch(p, b2A.theta, b2A.phi) ? ' is-active' : ''}`}
                    data-qubit2="a"
                    disabled={q2Running}
                    onClick={() => setQ2AAngles({ theta: p.thetaMult * Math.PI, phi: p.phiMult * Math.PI })}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="formula" id="formula-2q-a" style={{ marginTop: '10px', textAlign: 'center' }}>
                {qubit2A.getFormula()}
              </div>
            </div>
            <div className="compare-divider">
              <div className="divider-line" />
              <div className="divider-vs">⊗</div>
              <div className="divider-line" />
            </div>
            <div className="compare-col">
              <div className="col-label">
                <span className="col-badge quantum-badge">{t('qubitTab.qubitBBadge', 'Qubit B')}</span>
                <span className="col-desc">{t('qubitTab.qubitBDesc', 'Independent — not entangled with A')}</span>
              </div>
              <div className="bloch-wrap bloch-wrap--drag">
                <BlochSphere
                  id="bloch-2q-b"
                  width={220}
                  height={220}
                  vector={{ x: b2B.x, y: b2B.y, z: b2B.z }}
                  label={qubit2B.getLabel()}
                  onDrag={(theta, phi) => setQ2BAngles({ theta, phi })}
                  onKeyDown={handleSphereKeyDown(q2BAngles, setQ2BAngles)}
                  ariaLabel={`Bloch sphere for Qubit B. State: ${qubit2B.getFormula()}. Draggable, or focus and use arrow keys, to set the qubit's state.`}
                />
                <div className="state-label" id="label-2q-b">
                  {qubit2B.getLabel()}
                </div>
              </div>
              <div className="preset-grid preset-grid--2col" style={{ marginTop: '10px' }}>
                {BASIS_PRESETS_4.map((p) => (
                  <button
                    key={p.label}
                    className={`preset-btn${isPresetMatch(p, b2B.theta, b2B.phi) ? ' is-active' : ''}`}
                    data-qubit2="b"
                    disabled={q2Running}
                    onClick={() => setQ2BAngles({ theta: p.thetaMult * Math.PI, phi: p.phiMult * Math.PI })}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="formula" id="formula-2q-b" style={{ marginTop: '10px', textAlign: 'center' }}>
                {qubit2B.getFormula()}
              </div>
            </div>
          </div>
          <div className="card" style={{ maxWidth: '520px', margin: '20px auto 0' }}>
            <div className="card-title">{t('qubitTab.jointState', 'Joint State — |ψ_A⟩ ⊗ |ψ_B⟩')}</div>
            <div className="prob-rows">
              {(['00', '01', '10', '11'] as const).map((ket) => {
                const pct = q2Joint[ket];
                const isZero = ket === '00';
                const isOne = ket === '11';
                return (
                  <div className="prob-row" key={ket}>
                    <span
                      className={`ket${!isZero && !isOne ? ' mid-color' : ''}`}
                      style={isZero ? { color: 'var(--zero)' } : isOne ? { color: 'var(--one)' } : undefined}
                    >
                      |{ket}⟩
                    </span>
                    <div className="track">
                      <div
                        className={`fill${isZero ? ' zero-fill' : isOne ? ' one-fill' : ''}`}
                        id={`q2-fill-${ket}`}
                        style={{
                          width: `${pct}%`,
                          background: !isZero && !isOne ? 'var(--text2)' : undefined,
                        }}
                      />
                    </div>
                    <span className="pct" id={`q2-pct-${ket}`}>
                      {Math.round(pct)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ maxWidth: '520px', margin: '14px auto 0', textAlign: 'center' }}>
            <button className="btn-secondary" id="btn-qubit2-tryme" disabled={q2Running} onClick={runQ2TryMe}>
              {t('common.tryMe', 'Try me')}
            </button>
          </div>
          <p className="bit-explainer" style={{ maxWidth: '520px', margin: '14px auto 0' }}>
            {t(
              'qubitTab.twoQubitExplainer',
              "Two qubits, each dragged independently — the joint state above is just the product of their individual odds, P(ab) = P(a) × P(b). Nothing here is correlated yet; that's exactly the ingredient the Entangle tab adds with a CNOT."
            )}
          </p>
          <div className="card explainer-card" style={{ maxWidth: '520px', margin: '14px auto 0' }}>
            <div className="card-title">{t('common.whatJustHappened', 'What just happened')}</div>
            <Explainer id="qubit2-tryme-explainer" html={q2Explainer} />
          </div>
          <div className="card" style={{ maxWidth: '520px', margin: '10px auto 0' }}>
            <div className="card-title">{t('common.appliedSequence', 'Applied Sequence')}</div>
            <div className="history-row" id="qubit2-tryme-history">
              {q2History.map((step, i) => (
                <button
                  key={i}
                  type="button"
                  className={`hist-tag${i === q2Cursor ? ' is-current' : ''}`}
                  style={{ color: step.historyColor, borderColor: `${step.historyColor}44` }}
                  title="Click to revisit this step and re-read its explanation"
                  disabled={q2Running}
                  onClick={() => {
                    setQ2AAngles(step.state);
                    setQ2BAngles(step.state);
                    setQ2Explainer(step.explain);
                    setQ2Cursor(i);
                  }}
                >
                  {step.historyLabel}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div id="qubit-3q-panel" style={{ display: submode === '3q' ? undefined : 'none' }}>
          <div className="qubit3-layout">
            {(
              [
                ['a', 'qubitABadge', 'Qubit A', 'qubitA3Desc', 'Independent — not entangled with B or C', qubit3A, b3A, q3AAngles, setQ3AAngles],
                ['b', 'qubitBBadge', 'Qubit B', 'qubitB3Desc', 'Independent — not entangled with A or C', qubit3B, b3B, q3BAngles, setQ3BAngles],
                ['c', 'qubitCBadge', 'Qubit C', 'qubitC3Desc', 'Independent — not entangled with A or B', qubit3C, b3C, q3CAngles, setQ3CAngles],
              ] as const
            ).map(([letter, badgeKey, badgeDef, descKey, descDef, qObj, bObj, angles, setAngles]) => (
              <div className="compare-col" key={letter}>
                <div className="col-label">
                  <span className="col-badge quantum-badge">{t(`qubitTab.${badgeKey}`, badgeDef)}</span>
                  <span className="col-desc">{t(`qubitTab.${descKey}`, descDef)}</span>
                </div>
                <div className="bloch-wrap bloch-wrap--drag">
                  <BlochSphere
                    id={`bloch-3q-${letter}`}
                    width={190}
                    height={190}
                    vector={{ x: bObj.x, y: bObj.y, z: bObj.z }}
                    label={qObj.getLabel()}
                    onDrag={(theta, phi) => setAngles({ theta, phi })}
                    onKeyDown={handleSphereKeyDown(angles, setAngles)}
                    ariaLabel={`Bloch sphere for ${badgeDef}. State: ${qObj.getFormula()}. Draggable, or focus and use arrow keys, to set the qubit's state.`}
                  />
                  <div className="state-label" id={`label-3q-${letter}`}>
                    {qObj.getLabel()}
                  </div>
                </div>
                <div className="preset-grid preset-grid--2col" style={{ marginTop: '10px' }}>
                  {BASIS_PRESETS_4.map((p) => (
                    <button
                      key={p.label}
                      className={`preset-btn${isPresetMatch(p, bObj.theta, bObj.phi) ? ' is-active' : ''}`}
                      data-qubit3={letter}
                      disabled={q3Running}
                      onClick={() => setAngles({ theta: p.thetaMult * Math.PI, phi: p.phiMult * Math.PI })}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="formula" id={`formula-3q-${letter}`} style={{ marginTop: '10px', textAlign: 'center' }}>
                  {qObj.getFormula()}
                </div>
              </div>
            ))}
          </div>
          <div className="card" style={{ maxWidth: '640px', margin: '20px auto 0' }}>
            <div className="card-title">{t('qubitTab.jointState3', 'Joint State — |ψ_A⟩ ⊗ |ψ_B⟩ ⊗ |ψ_C⟩')}</div>
            <div className="prob-rows" id="qubit3-prob-rows">
              {QUBIT3_KETS.map((ket, i) => {
                const bits = [(i >> 2) & 1, (i >> 1) & 1, i & 1];
                const p = p3A[bits[0]] * p3B[bits[1]] * p3C[bits[2]];
                const pct = p * 100;
                const last = QUBIT3_KETS.length - 1;
                const color = i === 0 ? 'var(--zero)' : i === last ? 'var(--one)' : 'var(--text2)';
                const fillClass = i === 0 ? 'zero-fill' : i === last ? 'one-fill' : '';
                return (
                  <div className="prob-row" key={ket}>
                    <span className="ket" style={{ color }}>
                      |{ket}⟩
                    </span>
                    <div className="track">
                      <div
                        className={`fill ${fillClass}`}
                        style={{
                          width: `${pct}%`,
                          background: fillClass ? undefined : 'var(--text2)',
                        }}
                      />
                    </div>
                    <span className="pct">{Math.round(pct)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ maxWidth: '640px', margin: '14px auto 0', textAlign: 'center' }}>
            <button className="btn-secondary" id="btn-qubit3-tryme" disabled={q3Running} onClick={runQ3TryMe}>
              {t('common.tryMe', 'Try me')}
            </button>
          </div>
          <p className="bit-explainer" style={{ maxWidth: '640px', margin: '14px auto 0' }}>
            {t(
              'qubitTab.threeQubitExplainer',
              "Three qubits, each dragged independently — the joint state above is just the product of all three individual odds, P(abc) = P(a) × P(b) × P(c). Still nothing correlated here; scale this same idea up with a CNOT and you get the GHZ states in the Circuit tab's 3-qubit builder."
            )}
          </p>
          <div className="card explainer-card" style={{ maxWidth: '640px', margin: '14px auto 0' }}>
            <div className="card-title">{t('common.whatJustHappened', 'What just happened')}</div>
            <Explainer id="qubit3-tryme-explainer" html={q3Explainer} />
          </div>
          <div className="card" style={{ maxWidth: '640px', margin: '10px auto 0' }}>
            <div className="card-title">{t('common.appliedSequence', 'Applied Sequence')}</div>
            <div className="history-row" id="qubit3-tryme-history">
              {q3History.map((step, i) => (
                <button
                  key={i}
                  type="button"
                  className={`hist-tag${i === q3Cursor ? ' is-current' : ''}`}
                  style={{ color: step.historyColor, borderColor: `${step.historyColor}44` }}
                  title="Click to revisit this step and re-read its explanation"
                  disabled={q3Running}
                  onClick={() => {
                    setQ3AAngles(step.state);
                    setQ3BAngles(step.state);
                    setQ3CAngles(step.state);
                    setQ3Explainer(step.explain);
                    setQ3Cursor(i);
                  }}
                >
                  {step.historyLabel}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <LessonEmbed id="qubit" />
    </section>
  );
}
