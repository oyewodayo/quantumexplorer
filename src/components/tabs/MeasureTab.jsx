import { useMemo, useRef, useState } from 'react';
import { Qubit } from '../../core/qubit.js';
import { animateCoinFlip } from '../../core/coin.js';
import { pulseElement, delay } from '../../core/pulse.js';
import { useI18n } from '../../hooks/useI18n.js';
import CoinCanvas from '../CoinCanvas.jsx';
import Explainer from '../Explainer.jsx';
import LessonEmbed from '../LessonEmbed.jsx';

const OPENERS = [
  'The universe rolled its dice —',
  'No more hedging —',
  'The coin finally landed —',
  'Asked, and answered —',
  'The blur snapped into focus —',
];
const PRESETS = [
  { label: '|0⟩', theta: 0, phi: 0 },
  { label: '|1⟩', theta: 1, phi: 0 },
  { label: '|+⟩', theta: 0.5, phi: 0 },
  { label: '|-⟩', theta: 0.5, phi: 1 },
];
const BATCH_STEPS = 10;
const BATCH_STEP_MS = 130;

const INTRO_EXPLAINER = 'Right now the qubit hasn\'t committed to anything — it genuinely holds both |0⟩ and |1⟩ at once, weighted by the bars above. Hit MEASURE and you\'re forcing it to answer a yes/no question it was actively avoiding.';
const PREPARED_EXPLAINER = 'Right now the qubit hasn\'t committed to anything — it genuinely holds both |0⟩ and |1⟩ at once, weighted by the bars on the left. Hit MEASURE and you\'re forcing it to answer a yes/no question it was actively avoiding.';

export default function MeasureTab() {
  const { t } = useI18n();
  const [prep, setPrep] = useState({ theta: 0, phi: 0 });
  const [coin, setCoin] = useState(null);                 // null = unmeasured, else 0 / 1
  const [label, setLabel] = useState(null);               // overrides the coin caption while set
  const [result, setResult] = useState({ text: '', color: '' });
  const [counts, setCounts] = useState({ 0: 0, 1: 0 });
  const [busy, setBusy] = useState(false);
  const [explainer, setExplainer] = useState(INTRO_EXPLAINER);

  const coinRef = useRef(null);
  const resultRef = useRef(null);
  const measureBtnRef = useRef(null);
  const trackRefs = [useRef(null), useRef(null)];

  const qubit = useMemo(() => {
    const q = new Qubit();
    q.setState(prep.theta * Math.PI, prep.phi * Math.PI);
    return q;
  }, [prep]);

  const p0 = qubit.prob0() * 100;
  const p1 = qubit.prob1() * 100;
  const total = counts[0] + counts[1];
  const hist = (n) => (total ? (n / total) * 100 : 0);

  const clearOutcome = () => {
    setCounts({ 0: 0, 1: 0 });
    setCoin(null);
    setLabel(null);
    setResult({ text: '', color: '' });
  };

  const prepare = (preset) => {
    if (busy) return;
    setPrep({ theta: preset.theta, phi: preset.phi });
    clearOutcome();
    setExplainer(PREPARED_EXPLAINER);
  };

  const reset = () => { if (!busy) clearOutcome(); };

  async function measureOnce() {
    if (busy) return;
    setBusy(true);
    const before0 = Math.round(p0);
    const before1 = Math.round(p1);
    setResult({ text: '', color: '' });
    setLabel(t('measure.measuring', 'Measuring…'));

    await animateCoinFlip(coinRef.current, 9, 55);

    const outcome = qubit.measure();
    setCoin(outcome);
    setCounts((c) => ({ ...c, [outcome]: c[outcome] + 1 }));
    setLabel(outcome === 0 ? '|0⟩' : '|1⟩');
    const color = outcome === 0 ? 'var(--zero)' : 'var(--one)';
    setResult({ text: outcome === 0 ? '|0⟩' : '|1⟩', color });

    pulseElement(coinRef.current, 'collapsing');
    pulseElement(resultRef.current, 'collapsing', 500);
    // The bars deliberately don't move (they show the prepared odds); a flash
    // on the matching bar ties the percentages to what just happened.
    const track = trackRefs[outcome].current;
    if (track) { track.style.color = color; pulseElement(track, 'collapsing', 600); }
    pulseElement(measureBtnRef.current, 'pulsing');

    const opener = OPENERS[Math.floor(Math.random() * OPENERS.length)];
    setExplainer(`${opener} <strong style="color:${color}">|${outcome}⟩</strong>. A split second ago the odds were ${before0}% / ${before1}%, and both were equally real possibilities — not "secretly already |${outcome}⟩ and we just didn't know." The click is what forced a choice; the superposition is gone for good. Want to see it happen again? You'll need to re-prepare the exact same state from scratch.`);
    setBusy(false);
  }

  // Runs n genuine measurements in paced chunks so the histogram visibly
  // converges instead of jumping to its final split.
  async function measureMany(n) {
    if (busy) return;
    setBusy(true);
    setResult({ text: '', color: 'var(--text2)' });
    const steps = Math.min(n, BATCH_STEPS);
    const base = Math.floor(n / steps);
    let remainder = n - base * steps;
    const running = { ...counts };

    for (let s = 0; s < steps; s++) {
      const stepCount = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
      for (let i = 0; i < stepCount; i++) running[qubit.measure()]++;
      setCounts({ ...running });
      setResult({ text: `${running[0] + running[1]} total`, color: 'var(--text2)' });
      if (s < steps - 1) await delay(BATCH_STEP_MS);
    }

    const all = running[0] + running[1];
    const a = Math.round((running[0] / all) * 100);
    const b = Math.round((running[1] / all) * 100);
    setExplainer(`Just sent ${n} identical, freshly-prepared qubits through the same measurement — think of it as asking ${n} exact copies of the same question. None of them talk to each other or "remember" the last answer; each collapses on its own. Across ${all} trials so far the split landed near ${a}% / ${b}%, and it'll keep creeping toward the true odds the more you run.`);
    setBusy(false);
  }

  return (
    <section id="tab-measure" className="tab-content">
      <div className="compare-header">
        <h1 className="compare-title">{t('measure.title', 'Measurement')}</h1>
        <p className="compare-subtitle">{t('measure.subtitle', 'The bars below are odds, not a preview — measuring forces the qubit to answer a question it was genuinely undecided about, and there\'s no taking it back')}</p>
      </div>
      <div className="measure-layout">
        <div className="card measure-main-card">
          <div className="measure-state-col">
            <div className="card-title">{t('measure.quantumState', 'Quantum State')}</div>
            <div className="formula" id="formula-measure">{qubit.getFormula()}</div>
            <div className="vertical-bars">
              {[[0, p0, 'zero'], [1, p1, 'one']].map(([k, p, tone]) => (
                <div className="vbar-wrap" key={k}>
                  <div className="vbar-track" ref={trackRefs[k]}>
                    <div className={`vbar ${tone}-fill`} id={`vbar${k}`} style={{ height: `${p}%` }} />
                  </div>
                  <span className={`ket ${tone}-color`}>|{k}⟩</span>
                  <span className={`pct ${tone}-color`} id={`vpct${k}`}>{Math.round(p)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="measure-action-col">
            <div className="coin-wrap">
              <CoinCanvas
                id="coin-measure"
                ref={coinRef}
                state={coin}
              />
              <div className="coin-label-bottom" id="coin-measure-label">
                {label ?? t('measure.unmeasured', 'Unmeasured')}
              </div>
            </div>
            <button className="btn-measure" id="btn-measure" ref={measureBtnRef} disabled={busy} onClick={measureOnce}>
              {t('measure.measureButton', 'MEASURE')}
            </button>
            <div className="measure-result" id="measure-result" ref={resultRef} style={{ color: result.color, opacity: result.text ? 1 : undefined }}>
              {result.text}
            </div>
            <div className="preset-grid preset-grid--2col mt-14">
              {PRESETS.map((p) => (
                <button key={p.label} className="preset-btn" onClick={() => prepare(p)}>{p.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="card explainer-card">
          <div className="card-title">{t('common.whatJustHappened', 'What just happened')}</div>
          <Explainer id="measure-explainer" html={explainer} />
        </div>
        <div className="card">
          <div className="card-title">{t('measure.postulateTitle', 'The Measurement Postulate')}</div>
          <p className="bit-explainer">{t('measure.postulateBody1', 'This isn\'t just an app simplification — it\'s one of the axioms of quantum mechanics. Measuring a qubit |ψ⟩ = α|0⟩ + β|1⟩ returns 0 with probability |α|² and 1 with probability |β|² (the Born rule), and immediately afterward the state has collapsed to whichever outcome came up — the other possibility is simply gone, not just hidden.')}</p>
          <div className="formula" style={{ marginTop: 10 }} dangerouslySetInnerHTML={{ __html: t('measure.postulateFormula', 'P(0) = |α|² &nbsp;&nbsp; P(1) = |β|² &nbsp;&nbsp; α|0⟩ + β|1⟩ → |0⟩ or |1⟩') }} />
          <p className="bit-explainer" style={{ marginTop: 10 }}>{t('measure.postulateBody2', 'Note what\'s absent: nothing in this rule says which outcome you\'ll get on any single run — only the odds across many identical qubits, which is exactly what the histogram below is for.')}</p>
        </div>
        <div className="card">
          <div className="card-title">
            <span>{t('measure.measurementStatistics', 'Measurement Statistics')}</span>
            <span className="muted-text" id="trial-count">{total ? `· ${total} trials` : ''}</span>
          </div>
          <div className="histogram">
            {[[0, 'zero'], [1, 'one']].map(([k, tone]) => (
              <div className="hist-col" key={k}>
                <div className="hist-track">
                  <div className={`hist-bar ${tone}-fill`} id={`hist${k}`} style={{ height: `${hist(counts[k])}%` }} />
                </div>
                <span className={`ket ${tone}-color`}>|{k}⟩</span>
                <span className="pct" id={`hpct${k}`}>{total ? `${Math.round(hist(counts[k]))}%` : '—'}</span>
              </div>
            ))}
          </div>
          <div className="measure-actions">
            {[10, 100, 1000].map((n) => (
              <button key={n} className="btn-secondary" disabled={busy} onClick={() => measureMany(n)}>×{n}</button>
            ))}
            <button className="btn-secondary" id="btn-reset-stats" disabled={busy} onClick={reset}>{t('common.reset', 'Reset')}</button>
          </div>
          <div className="convergence-note" id="convergence-note">
            {total >= 20 ? `Quantum prediction: |0⟩ → ${Math.round(p0)}%  |1⟩ → ${Math.round(p1)}%` : ''}
          </div>
          <p className="bit-explainer" style={{ marginTop: 10 }}>{t('measure.confirmOddsBody', 'This is the only way to actually confirm those odds — ask the same question of many identical qubits and watch the histogram settle into the predicted split. A single qubit only ever gives you one answer; the pattern only shows up across a crowd.')}</p>
        </div>
      </div>
      <LessonEmbed id="measure" />
    </section>
  );
}
