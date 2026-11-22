import { useState } from 'react';
import { TwoQubitState } from '../../core/twoQubit.ts';
import { ThreeQubitState } from '../../core/threeQubit.ts';
import { GATES } from '../../core/gates.ts';
import { delay } from '../../core/pulse.ts';
import { useI18n } from '../../hooks/useI18n.ts';
import { useNav } from '../../hooks/useNav.ts';
import Explainer from '../Explainer.tsx';
import LessonEmbed from '../LessonEmbed.tsx';

export type GroverMode = 'n4' | 'n8';

const GROVER_MODES: Record<GroverMode, { qubits: number; N: number; iterations: number }> = {
  n4: { qubits: 2, N: 4, iterations: 1 },
  n8: { qubits: 3, N: 8, iterations: 2 },
};

const GROVER_STEP_MS = 750;
const ITEMS_N4 = ['00', '01', '10', '11'];
const ITEMS_N8 = ['000', '001', '010', '011', '100', '101', '110', '111'];

interface BarData {
  prob: number;
  negative: boolean;
}

function getInitialBars(n: number): BarData[] {
  return Array.from({ length: n }, (_, i) => ({ prob: i === 0 ? 100 : 0, negative: false }));
}

function extractBars(state: TwoQubitState | ThreeQubitState, n: number): BarData[] {
  return Array.from({ length: n }, (_, i) => ({
    prob: state.prob(i) * 100,
    negative: state.amps[i].r < -1e-9,
  }));
}

export default function GroverTab() {
  const { t } = useI18n();
  const nav = useNav();
  const isActive = nav.mode === 'sim' && nav.tab === 'grover';

  const [mode, setMode] = useState<GroverMode>('n4');
  const [target, setTarget] = useState('00');
  const [animating, setAnimating] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [foundVal, setFoundVal] = useState('?');
  const [foundSet, setFoundSet] = useState(false);
  const [resultText, setResultText] = useState('—');
  const [iterBadge, setIterBadge] = useState('');
  const [circuitOuts, setCircuitOuts] = useState<string[]>(['?', '?', '?']);
  const [barsN4, setBarsN4] = useState<BarData[]>(() => getInitialBars(4));
  const [barsN8, setBarsN8] = useState<BarData[]>(() => getInitialBars(8));
  const [activeStages, setActiveStages] = useState<Set<string>>(() => new Set());
  const [explainer, setExplainer] = useState(
    t(
      'grover.explainerDefault',
      'Pick an item on the left, then press Search. Watch the amplitude bars at each step — the oracle changes a sign nothing here can see, and diffusion is what turns that invisible flip into a visible answer.'
    )
  );

  function pulseStage(id: string) {
    setActiveStages((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      setActiveStages((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 700);
  }

  function pulseDiffuser(qubits: number, suffix: string) {
    for (let q = 0; q < qubits; q++) pulseStage(`grover-gate-diffuse-h${q}a${suffix}`);
    setTimeout(() => pulseStage(`grover-gate-reflect${suffix}`), 200);
    setTimeout(() => {
      for (let q = 0; q < qubits; q++) pulseStage(`grover-gate-diffuse-h${q}b${suffix}`);
    }, 400);
  }

  function selectTarget(key: string) {
    if (animating) return;
    setTarget(key);
    setFoundVal('?');
    setFoundSet(false);
    setCircuitOuts(['?', '?', '?']);
    if (mode === 'n8') setBarsN8(getInitialBars(8));
    else setBarsN4(getInitialBars(4));
  }

  function selectMode(nextMode: GroverMode) {
    if (animating || nextMode === mode) return;
    setMode(nextMode);
    setSearchCount(0);
    setFoundCount(0);
    const defaultTarget = '0'.repeat(GROVER_MODES[nextMode].qubits);
    setTarget(defaultTarget);
    setFoundVal('?');
    setFoundSet(false);
    setResultText('—');
    setIterBadge('');
    setCircuitOuts(['?', '?', '?']);
    setBarsN4(getInitialBars(4));
    setBarsN8(getInitialBars(8));
    setExplainer(
      t(
        'grover.explainerDefault',
        'Pick an item on the left, then press Search. Watch the amplitude bars at each step — the oracle changes a sign nothing here can see, and diffusion is what turns that invisible flip into a visible answer.'
      )
    );
  }

  async function runGrover() {
    if (animating) return;
    setAnimating(true);
    setResultText(t('grover.resultRunning', 'running…'));
    setFoundVal('?');
    setFoundSet(false);
    setCircuitOuts(['?', '?', '?']);
    setIterBadge('');

    const { qubits, N, iterations } = GROVER_MODES[mode];
    const suffix = mode === 'n8' ? '-n8' : '';
    const targetIdx = parseInt(target, 2);
    const state = mode === 'n8' ? new ThreeQubitState() : new TwoQubitState();
    const updateBars = () => {
      if (mode === 'n8') setBarsN8(extractBars(state, 8));
      else setBarsN4(extractBars(state, 4));
    };

    setExplainer(
      t(
        'grover.stepStart',
        "Every search starts at a definite, uninteresting state — all zeros, exactly like a classical register before you've looked at anything."
      )
    );
    updateBars();
    await delay(GROVER_STEP_MS);

    for (let q = 0; q < qubits; q++) {
      pulseStage(`grover-gate-h${q}${suffix}`);
      state.applySingleQubitGate(q, GATES.H.matrix);
    }
    setExplainer(
      t(
        'grover.stepSuperpose',
        'A Hadamard on each qubit spreads the amplitude equally across all {n} items at once — every candidate is "live" simultaneously, not checked one at a time.'
      ).replace('{n}', String(N))
    );
    updateBars();
    await delay(GROVER_STEP_MS);

    for (let iter = 1; iter <= iterations; iter++) {
      if (iterations > 1) {
        setIterBadge(
          t('grover.iterationBadge', 'Iteration {iter} of {total}')
            .replace('{iter}', String(iter))
            .replace('{total}', String(iterations))
        );
      }

      pulseStage(`grover-gate-oracle${suffix}`);
      state.applyPhaseFlip(targetIdx);
      setExplainer(
        t(
          'grover.stepOracle',
          'The oracle recognizes the marked item and flips the sign of its amplitude alone. Look closely: none of the bars moved — a probability is the squared size of an amplitude, and a negative amplitude squares to exactly the same probability as a positive one the same size. This step is completely invisible to any measurement taken right now.'
        )
      );
      updateBars();
      await delay(GROVER_STEP_MS);

      pulseDiffuser(qubits, suffix);
      for (let q = 0; q < qubits; q++) state.applySingleQubitGate(q, GATES.H.matrix);
      state.applyDiffusionReflect();
      for (let q = 0; q < qubits; q++) state.applySingleQubitGate(q, GATES.H.matrix);

      let diffuseMsg: string;
      if (iterations === 1) {
        diffuseMsg = t(
          'grover.stepDiffuse',
          'Diffusion reflects every amplitude about their shared average. The other amplitudes, already near that average, collapse toward zero; the marked one, sitting on the far side after its sign flipped, gets thrown past the average by twice the gap — turning that invisible phase flip into a visible answer.'
        );
      } else {
        const pctNow = Math.round(state.prob(targetIdx) * 1000) / 10;
        diffuseMsg = t(
          'grover.stepDiffuseIteration',
          "Diffusion reflects every amplitude about their shared average, the same rule as always. Iteration {iter} of {total} complete: the marked item's probability is now {pct}%."
        )
          .replace('{iter}', String(iter))
          .replace('{total}', String(iterations))
          .replace('{pct}', String(pctNow));
        if (iter === iterations) {
          diffuseMsg +=
            ' ' +
            t(
              'grover.overshootNote',
              "That's the peak for N=8 — a third iteration would overshoot past it, dropping the probability back down to about 33%, not up."
            );
        }
      }
      setExplainer(diffuseMsg);
      updateBars();
      await delay(GROVER_STEP_MS);
    }

    for (let q = 0; q < qubits; q++) pulseStage(`grover-meter-${q}${suffix}`);
    const bits: number[] = [];
    for (let q = 0; q < qubits; q++) bits.push(state.measureQubit(q));
    const found = bits.join('');
    const match = found === target;

    setCircuitOuts([String(bits[0]), String(bits[1]), bits[2] !== undefined ? String(bits[2]) : '?']);
    setFoundVal(found);
    setFoundSet(true);
    setSearchCount((c) => c + 1);
    if (match) setFoundCount((c) => c + 1);

    if (iterations === 1) {
      setResultText(
        match
          ? t('grover.resultMatch', 'Found on the first query')
          : t('grover.resultMismatch', 'Missed — check the console, this should never happen for N=4')
      );
      setExplainer(
        t(
          'grover.stepMeasure',
          'One query, one measurement, done: {found} — for {n} items with 1 marked, exactly one Grover iteration gives the marked item probability 1, a real measurement over a distribution with no actual uncertainty left in it.'
        )
          .replace('{found}', found)
          .replace('{n}', String(N))
      );
    } else {
      setResultText(
        match
          ? t('grover.resultMatchN8', 'Found after 2 queries')
          : t('grover.resultMismatchN8', 'Missed this time — genuinely possible about 1 time in 20 for N=8, not a bug')
      );
      setExplainer(
        t(
          'grover.stepMeasureApprox',
          "2 queries, one measurement, done: {found} — for 8 items with 1 marked, 2 Grover iterations bring the marked item's probability to about 94.5%, not exactly 1 this time; measured this way, that's still a real Born-rule draw, just one where a small, genuine chance of missing remains."
        ).replace('{found}', found)
      );
    }

    setAnimating(false);
  }

  function resetGrover() {
    if (animating) return;
    setSearchCount(0);
    setFoundCount(0);
    setFoundVal('?');
    setFoundSet(false);
    setResultText('—');
    setIterBadge('');
    setCircuitOuts(['?', '?', '?']);
    setBarsN4(getInitialBars(4));
    setBarsN8(getInitialBars(8));
    setExplainer(
      t(
        'grover.explainerDefault',
        'Pick an item on the left, then press Search. Watch the amplitude bars at each step — the oracle changes a sign nothing here can see, and diffusion is what turns that invisible flip into a visible answer.'
      )
    );
  }

  const tallyKey = mode === 'n8' ? 'grover.tallyN8' : 'grover.tally';
  const tallyFallback =
    mode === 'n8'
      ? '{n} searches · {found}/{n} found after 2 queries'
      : '{n} searches · {found}/{n} found on the first query';
  const tallyText = searchCount
    ? t(tallyKey, tallyFallback)
        .replace('{n}', String(searchCount))
        .replace('{found}', String(foundCount))
        .replace('{n}', String(searchCount))
    : '';

  const stageCls = (id: string, base = 'circuit-gate teleport-stage') =>
    `${base}${activeStages.has(id) ? ' active' : ''}`;

  return (
    <section
      id="tab-grover"
      className={`tab-content${isActive ? ' active' : ''}`}
      style={{ display: nav.mode === 'sim' ? undefined : 'none' }}
    >
      <div className="compare-header">
        <h1 className="compare-title">{t('grover.title', "Grover's Search")}</h1>
        <p className="compare-subtitle">
          {t(
            'grover.subtitle',
            'Finding one marked item among four with a single query, by amplifying its amplitude rather than checking items one at a time'
          )}
        </p>
      </div>
      <div className="superdense-layout">
        <div className="card">
          <div className="card-title">{t('grover.definitionTitle', "What Is Grover's Search?")}</div>
          <p className="bit-explainer">
            {t(
              'grover.definitionBody1',
              'Grover\'s algorithm searches an unsorted list of N items for one marked entry using roughly √N oracle queries, instead of the up to N a classical search needs in the worst case. It works by amplitude amplification: start every item in equal superposition, use an oracle to flip the sign of the marked item\'s amplitude alone, then use a fixed "diffusion" step to turn that invisible sign flip into a visible boost in measurement probability.'
            )}
          </p>
          <p className="bit-explainer" style={{ marginTop: '10px' }}>
            {t(
              'grover.definitionBody2',
              'Toggle below between two concrete cases. N = 4 (2 qubits) is the smallest case where the result is exact: a single query brings the marked item\'s probability to exactly 1. N = 8 (3 qubits) is the smallest case where it visibly isn\'t: it takes two queries to reach a peak of only about 94.5%, and — proof this isn\'t just "not enough queries yet" — a third query would overshoot past that peak rather than improving on it.'
            )}
          </p>
        </div>
        <div className="card">
          <div className="card-title">{t('grover.circuitTitle', 'The Circuit')}</div>
          <div id="grover-circuit-n4-wrap" style={{ display: mode === 'n4' ? undefined : 'none' }}>
            <svg
              id="grover-circuit"
              viewBox="0 0 600 180"
              role="img"
              aria-label="Circuit diagram: a Hadamard on each of two qubits, then an Oracle gate spanning both qubits, then the Grover diffusion operator — a Hadamard on each qubit, a reflection about the zero state spanning both qubits, and a Hadamard on each qubit again — then a measurement on each qubit."
              style={{ width: '100%', maxWidth: '620px', display: 'block', margin: '8px auto 0' }}
            >
              <defs>
                <linearGradient id="grover-metal-sheen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.38" />
                  <stop offset="14%" stopColor="#fff" stopOpacity="0.1" />
                  <stop offset="55%" stopColor="#000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
                </linearGradient>
              </defs>
              <line x1="50" y1="57" x2="530" y2="57" stroke="var(--border2)" strokeWidth="2" />
              <line x1="50" y1="117" x2="530" y2="117" stroke="var(--border2)" strokeWidth="2" />
              <text x="26" y="63" fontSize="14" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                q₀
              </text>
              <text x="26" y="123" fontSize="14" fontWeight="700" fill="var(--one)" textAnchor="middle">
                q₁
              </text>
              <text x="26" y="92" fontSize="13" fill="var(--text2)" textAnchor="middle">
                |00⟩
              </text>
              <g id="grover-gate-h0" className={stageCls('grover-gate-h0')}>
                <rect x="90" y="37" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <rect x="90" y="37" width="40" height="40" rx="6" fill="url(#grover-metal-sheen)" pointerEvents="none" />
                <text x="110" y="63" fontSize="16" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-h1" className={stageCls('grover-gate-h1')}>
                <rect x="90" y="97" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <rect x="90" y="97" width="40" height="40" rx="6" fill="url(#grover-metal-sheen)" pointerEvents="none" />
                <text x="110" y="123" fontSize="16" fontWeight="700" fill="var(--one)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-oracle" className={stageCls('grover-gate-oracle')}>
                <rect x="170" y="30" width="70" height="114" rx="8" fill="var(--surface2)" stroke="var(--text2)" strokeWidth="1.5" />
                <rect x="170" y="30" width="70" height="114" rx="8" fill="url(#grover-metal-sheen)" pointerEvents="none" />
                <text x="205" y="82" fontSize="13" fontWeight="700" fill="var(--text)" textAnchor="middle">
                  {t('grover.oracleGateLabel', 'Oracle')}
                </text>
                <text id="grover-oracle-gate-target" x="205" y="98" fontSize="11" fill="var(--text2)" textAnchor="middle">
                  {t('grover.oracleMarks', 'marks {t}').replace('{t}', mode === 'n4' ? target : '00')}
                </text>
              </g>
              <path d="M 270,24 V 16 H 450 V 24" fill="none" stroke="var(--text3)" strokeWidth="1.2" />
              <text x="360" y="12" fontSize="12" fontWeight="700" fill="var(--text2)" textAnchor="middle">
                {t('grover.diffuserGateLabel', 'Diffuser')}
              </text>
              <g id="grover-gate-diffuse-h0a" className={stageCls('grover-gate-diffuse-h0a')}>
                <rect x="270" y="37" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <rect x="270" y="37" width="34" height="40" rx="6" fill="url(#grover-metal-sheen)" pointerEvents="none" />
                <text x="287" y="63" fontSize="16" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-diffuse-h1a" className={stageCls('grover-gate-diffuse-h1a')}>
                <rect x="270" y="97" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <rect x="270" y="97" width="34" height="40" rx="6" fill="url(#grover-metal-sheen)" pointerEvents="none" />
                <text x="287" y="123" fontSize="16" fontWeight="700" fill="var(--one)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-reflect" className={stageCls('grover-gate-reflect')}>
                <rect x="324" y="30" width="72" height="114" rx="8" fill="var(--surface2)" stroke="var(--text2)" strokeWidth="1.5" />
                <rect x="324" y="30" width="72" height="114" rx="8" fill="url(#grover-metal-sheen)" pointerEvents="none" />
                <text x="360" y="82" fontSize="11.5" fontWeight="700" fill="var(--text)" textAnchor="middle">
                  2|00⟩⟨00|
                </text>
                <text x="360" y="98" fontSize="11.5" fontWeight="700" fill="var(--text)" textAnchor="middle">
                  − I
                </text>
              </g>
              <g id="grover-gate-diffuse-h0b" className={stageCls('grover-gate-diffuse-h0b')}>
                <rect x="416" y="37" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <rect x="416" y="37" width="34" height="40" rx="6" fill="url(#grover-metal-sheen)" pointerEvents="none" />
                <text x="433" y="63" fontSize="16" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-diffuse-h1b" className={stageCls('grover-gate-diffuse-h1b')}>
                <rect x="416" y="97" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <rect x="416" y="97" width="34" height="40" rx="6" fill="url(#grover-metal-sheen)" pointerEvents="none" />
                <text x="433" y="123" fontSize="16" fontWeight="700" fill="var(--one)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-meter-0" className={stageCls('grover-meter-0', 'teleport-stage')}>
                <rect x="480" y="37" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <path d="M492,65 A10,10 0 0 1 508,65" fill="none" stroke="var(--zero)" strokeWidth="1.6" />
                <line x1="500" y1="66" x2="507" y2="52" stroke="var(--zero)" strokeWidth="1.6" strokeLinecap="round" />
              </g>
              <g id="grover-meter-1" className={stageCls('grover-meter-1', 'teleport-stage')}>
                <rect x="480" y="97" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <path d="M492,125 A10,10 0 0 1 508,125" fill="none" stroke="var(--one)" strokeWidth="1.6" />
                <line x1="500" y1="126" x2="507" y2="112" stroke="var(--one)" strokeWidth="1.6" strokeLinecap="round" />
              </g>
              <text id="grover-circuit-out0" x="552" y="63" fontSize="14" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                {mode === 'n4' ? circuitOuts[0] : '?'}
              </text>
              <text id="grover-circuit-out1" x="552" y="123" fontSize="14" fontWeight="700" fill="var(--one)" textAnchor="middle">
                {mode === 'n4' ? circuitOuts[1] : '?'}
              </text>
            </svg>
          </div>
          <div id="grover-circuit-n8-wrap" style={{ display: mode === 'n8' ? undefined : 'none' }}>
            <svg
              id="grover-circuit-n8"
              viewBox="0 0 640 260"
              role="img"
              aria-label="Circuit diagram: a Hadamard on each of three qubits, then an Oracle gate and the Grover diffusion operator spanning all three qubits, repeated twice, then a measurement on each qubit."
              style={{ width: '100%', maxWidth: '660px', display: 'block', margin: '8px auto 0' }}
            >
              <defs>
                <linearGradient id="grover-metal-sheen-n8" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.38" />
                  <stop offset="14%" stopColor="#fff" stopOpacity="0.1" />
                  <stop offset="55%" stopColor="#000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
                </linearGradient>
              </defs>
              <line x1="50" y1="80" x2="534" y2="80" stroke="var(--border2)" strokeWidth="2" />
              <line x1="50" y1="140" x2="534" y2="140" stroke="var(--border2)" strokeWidth="2" />
              <line x1="50" y1="200" x2="534" y2="200" stroke="var(--border2)" strokeWidth="2" />
              <text x="26" y="86" fontSize="14" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                q₀
              </text>
              <text x="26" y="146" fontSize="14" fontWeight="700" fill="var(--text)" textAnchor="middle">
                q₁
              </text>
              <text x="26" y="206" fontSize="14" fontWeight="700" fill="var(--one)" textAnchor="middle">
                q₂
              </text>
              <text x="26" y="48" fontSize="12" fill="var(--text2)" textAnchor="middle">
                |000⟩
              </text>
              <path d="M 170,28 V 16 H 454 V 28" fill="none" stroke="var(--text3)" strokeWidth="1.2" />
              <text id="grover-repeat-label-n8" x="312" y="10" fontSize="12" fontWeight="700" fill="var(--text2)" textAnchor="middle">
                {t('grover.repeatBracketLabel', 'repeat ×2')}
              </text>
              <g id="grover-gate-h0-n8" className={stageCls('grover-gate-h0-n8')}>
                <rect x="90" y="60" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <rect x="90" y="60" width="40" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="110" y="86" fontSize="16" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-h1-n8" className={stageCls('grover-gate-h1-n8')}>
                <rect x="90" y="120" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--text)" strokeWidth="1.5" />
                <rect x="90" y="120" width="40" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="110" y="146" fontSize="16" fontWeight="700" fill="var(--text)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-h2-n8" className={stageCls('grover-gate-h2-n8')}>
                <rect x="90" y="180" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <rect x="90" y="180" width="40" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="110" y="206" fontSize="16" fontWeight="700" fill="var(--one)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-oracle-n8" className={stageCls('grover-gate-oracle-n8')}>
                <rect x="170" y="60" width="70" height="160" rx="8" fill="var(--surface2)" stroke="var(--text2)" strokeWidth="1.5" />
                <rect x="170" y="60" width="70" height="160" rx="8" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="205" y="132" fontSize="13" fontWeight="700" fill="var(--text)" textAnchor="middle">
                  {t('grover.oracleGateLabel', 'Oracle')}
                </text>
                <text id="grover-oracle-gate-target-n8" x="205" y="148" fontSize="11" fill="var(--text2)" textAnchor="middle">
                  {t('grover.oracleMarks', 'marks {t}').replace('{t}', mode === 'n8' ? target : '000')}
                </text>
              </g>
              <path d="M 270,54 V 42 H 454 V 54" fill="none" stroke="var(--text3)" strokeWidth="1.2" />
              <text x="362" y="36" fontSize="12" fontWeight="700" fill="var(--text2)" textAnchor="middle">
                {t('grover.diffuserGateLabel', 'Diffuser')}
              </text>
              <g id="grover-gate-diffuse-h0a-n8" className={stageCls('grover-gate-diffuse-h0a-n8')}>
                <rect x="270" y="60" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <rect x="270" y="60" width="34" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="287" y="86" fontSize="16" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-diffuse-h1a-n8" className={stageCls('grover-gate-diffuse-h1a-n8')}>
                <rect x="270" y="120" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--text)" strokeWidth="1.5" />
                <rect x="270" y="120" width="34" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="287" y="146" fontSize="16" fontWeight="700" fill="var(--text)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-diffuse-h2a-n8" className={stageCls('grover-gate-diffuse-h2a-n8')}>
                <rect x="270" y="180" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <rect x="270" y="180" width="34" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="287" y="206" fontSize="16" fontWeight="700" fill="var(--one)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-reflect-n8" className={stageCls('grover-gate-reflect-n8')}>
                <rect x="319" y="60" width="86" height="160" rx="8" fill="var(--surface2)" stroke="var(--text2)" strokeWidth="1.5" />
                <rect x="319" y="60" width="86" height="160" rx="8" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="362" y="134" fontSize="11" fontWeight="700" fill="var(--text)" textAnchor="middle">
                  2|000⟩⟨000|
                </text>
                <text x="362" y="150" fontSize="11" fontWeight="700" fill="var(--text)" textAnchor="middle">
                  − I
                </text>
              </g>
              <g id="grover-gate-diffuse-h0b-n8" className={stageCls('grover-gate-diffuse-h0b-n8')}>
                <rect x="420" y="60" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <rect x="420" y="60" width="34" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="437" y="86" fontSize="16" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-diffuse-h1b-n8" className={stageCls('grover-gate-diffuse-h1b-n8')}>
                <rect x="420" y="120" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--text)" strokeWidth="1.5" />
                <rect x="420" y="120" width="34" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="437" y="146" fontSize="16" fontWeight="700" fill="var(--text)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-gate-diffuse-h2b-n8" className={stageCls('grover-gate-diffuse-h2b-n8')}>
                <rect x="420" y="180" width="34" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <rect x="420" y="180" width="34" height="40" rx="6" fill="url(#grover-metal-sheen-n8)" pointerEvents="none" />
                <text x="437" y="206" fontSize="16" fontWeight="700" fill="var(--one)" textAnchor="middle">
                  H
                </text>
              </g>
              <g id="grover-meter-0-n8" className={stageCls('grover-meter-0-n8', 'teleport-stage')}>
                <rect x="484" y="60" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <path d="M496,88 A10,10 0 0 1 512,88" fill="none" stroke="var(--zero)" strokeWidth="1.6" />
                <line x1="504" y1="89" x2="511" y2="75" stroke="var(--zero)" strokeWidth="1.6" strokeLinecap="round" />
              </g>
              <g id="grover-meter-1-n8" className={stageCls('grover-meter-1-n8', 'teleport-stage')}>
                <rect x="484" y="120" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--text)" strokeWidth="1.5" />
                <path d="M496,148 A10,10 0 0 1 512,148" fill="none" stroke="var(--text)" strokeWidth="1.6" />
                <line x1="504" y1="149" x2="511" y2="135" stroke="var(--text)" strokeWidth="1.6" strokeLinecap="round" />
              </g>
              <g id="grover-meter-2-n8" className={stageCls('grover-meter-2-n8', 'teleport-stage')}>
                <rect x="484" y="180" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <path d="M496,208 A10,10 0 0 1 512,208" fill="none" stroke="var(--one)" strokeWidth="1.6" />
                <line x1="504" y1="209" x2="511" y2="195" stroke="var(--one)" strokeWidth="1.6" strokeLinecap="round" />
              </g>
              <text id="grover-circuit-out0-n8" x="558" y="86" fontSize="14" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                {mode === 'n8' ? circuitOuts[0] : '?'}
              </text>
              <text id="grover-circuit-out1-n8" x="558" y="146" fontSize="14" fontWeight="700" fill="var(--text)" textAnchor="middle">
                {mode === 'n8' ? circuitOuts[1] : '?'}
              </text>
              <text id="grover-circuit-out2-n8" x="558" y="206" fontSize="14" fontWeight="700" fill="var(--one)" textAnchor="middle">
                {mode === 'n8' ? circuitOuts[2] : '?'}
              </text>
            </svg>
          </div>
          <div className="mode-grid" id="grover-mode-toggle" style={{ gridTemplateColumns: 'repeat(2,1fr)', maxWidth: '420px', margin: '14px auto 0' }}>
            <button
              className={`preset-btn mode-btn${mode === 'n4' ? ' active' : ''}`}
              data-grover-mode="n4"
              onClick={() => selectMode('n4')}
            >
              {t('grover.modeN4Btn', 'N = 4 (exact)')}
            </button>
            <button
              className={`preset-btn mode-btn${mode === 'n8' ? ' active' : ''}`}
              data-grover-mode="n8"
              onClick={() => selectMode('n8')}
            >
              {t('grover.modeN8Btn', 'N = 8 (2 iterations)')}
            </button>
          </div>
          <p className="bit-explainer" id="grover-mode-desc" style={{ marginTop: '8px', textAlign: 'center', fontSize: '0.85rem' }}>
            {mode === 'n8'
              ? t('grover.modeN8Desc', '3 qubits, 1 marked item — needs 2 queries, and even then peaks below 100%.')
              : t('grover.modeN4Desc', '2 qubits, 1 marked item — a single query is exact.')}
          </p>
          <p className="muted-text" id="grover-iteration-badge" style={{ textAlign: 'center', marginTop: '6px', minHeight: '1.2em' }}>
            {iterBadge}
          </p>
        </div>
        <div className="grover-controls-grid">
          <div className="card">
            <div className="card-title">{t('grover.targetTitle', 'Item to Find')}</div>
            <p className="bit-explainer">
              {t('grover.targetBody', 'Pick which item is "marked" — this is what the oracle recognizes, and what the search below should find.')}
            </p>
            <div
              className="mode-grid"
              id="grover-target-picker"
              style={{
                display: mode === 'n4' ? undefined : 'none',
                gridTemplateColumns: 'repeat(4,1fr)',
                maxWidth: '340px',
                margin: '12px auto 0',
              }}
            >
              {ITEMS_N4.map((item) => (
                <button
                  key={item}
                  className={`preset-btn mode-btn${target === item ? ' active' : ''}`}
                  data-grover-target={item}
                  onClick={() => selectTarget(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div
              className="mode-grid"
              id="grover-target-picker-n8"
              style={{
                display: mode === 'n8' ? undefined : 'none',
                gridTemplateColumns: 'repeat(4,1fr)',
                maxWidth: '340px',
                margin: '12px auto 0',
                gap: '7px',
              }}
            >
              {ITEMS_N8.map((item) => (
                <button
                  key={item}
                  className={`preset-btn mode-btn${target === item ? ' active' : ''}`}
                  data-grover-target={item}
                  style={{ fontSize: '0.82rem', padding: '8px 4px' }}
                  onClick={() => selectTarget(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="teleport-bits-row" style={{ marginTop: '14px' }}>
              <div className="teleport-bit-chip">
                <span className="teleport-bit-label">{t('grover.targetLabel', 'Marked item')}</span>
                <span className="teleport-bit-val" id="grover-target-val">
                  {target}
                </span>
              </div>
              <div className="teleport-bit-chip">
                <span className="teleport-bit-label">{t('grover.foundLabel', 'Found')}</span>
                <span className={`teleport-bit-val${foundSet ? ' set' : ''}`} id="grover-found-val">
                  {foundVal}
                </span>
              </div>
            </div>
            <p className="muted-text" id="grover-tally-text" style={{ marginTop: '10px', textAlign: 'center' }}>
              {tallyText}
            </p>
            <button
              className="btn-secondary"
              id="btn-reset-grover"
              disabled={animating}
              style={{ marginTop: '6px' }}
              onClick={resetGrover}
            >
              {t('common.reset', 'Reset')}
            </button>
          </div>
          <div className="card">
            <div className="card-title">{t('grover.chartTitle', 'Amplitudes Through the Search')}</div>
            <div className="histogram teleport-histogram" id="grover-chart-n4" style={{ display: mode === 'n4' ? undefined : 'none' }}>
              {ITEMS_N4.map((key, idx) => {
                const b = barsN4[idx];
                const barCls = idx === 0 ? 'hist-bar zero-fill' : idx === 3 ? 'hist-bar one-fill' : 'hist-bar';
                const barStyle: React.CSSProperties =
                  idx === 1 || idx === 2
                    ? { background: 'var(--text2)', height: `${b.prob}%` }
                    : { height: `${b.prob}%` };
                return (
                  <div className="hist-col" key={key}>
                    <div className="hist-track">
                      <div className={barCls} style={barStyle} id={`grover-hist-${key}`} />
                    </div>
                    <span className={`grover-sign${b.negative ? ' grover-sign-neg' : ''}`} id={`grover-sign-${key}`}>
                      {b.negative ? '−' : '+'}
                    </span>
                    <span className="ket">{key}</span>
                    <span className="pct" id={`grover-pct-${key}`}>
                      {Math.round(b.prob)}%
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="histogram grover-histogram-n8" id="grover-chart-n8" style={{ display: mode === 'n8' ? undefined : 'none' }}>
              {ITEMS_N8.map((key, idx) => {
                const b = barsN8[idx];
                const barCls = idx === 0 ? 'hist-bar zero-fill' : idx === 7 ? 'hist-bar one-fill' : 'hist-bar';
                const barStyle: React.CSSProperties =
                  idx > 0 && idx < 7
                    ? { background: 'var(--text2)', height: `${b.prob}%` }
                    : { height: `${b.prob}%` };
                return (
                  <div className="hist-col" key={key}>
                    <div className="hist-track">
                      <div className={barCls} style={barStyle} id={`grover-hist-${key}`} />
                    </div>
                    <span className={`grover-sign${b.negative ? ' grover-sign-neg' : ''}`} id={`grover-sign-${key}`}>
                      {b.negative ? '−' : '+'}
                    </span>
                    <span className="ket">{key}</span>
                    <span className="pct" id={`grover-pct-${key}`}>
                      {Math.round(b.prob)}%
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="superdense-actions">
              <button className="btn-run" id="btn-grover-search" disabled={animating} onClick={runGrover}>
                {t('grover.searchBtn', 'Search')}
              </button>
              <span className="muted-text" id="grover-result">
                {resultText}
              </span>
            </div>
            <Explainer id="grover-explainer" style={{ marginTop: '14px' }} html={explainer} />
          </div>
        </div>
        <div className="card">
          <div className="card-title">{t('grover.whyFasterTitle', 'Why One Query Is Genuinely Faster')}</div>
          <p className="bit-explainer">
            {t(
              'grover.whyFasterBody',
              "Classically, finding one marked item among 4 by checking them one at a time takes up to 3 actual look-ups in the worst case — if the first 3 you check aren't it, you only know the 4th is the answer by elimination, but you still needed those 3 real queries to get there. Grover's algorithm needs exactly 1 oracle call for this same N = 4 case. The gap widens, not narrows, as the list grows: for N items, classical search needs on the order of N queries in the worst case, while Grover's algorithm needs only on the order of √N — the same quadratic speedup already described in this app's own Algorithms overview."
            )}
          </p>
          <p className="bit-explainer" style={{ marginTop: '10px' }}>
            {t(
              'grover.whyFasterBodyN8',
              "The N = 8 mode above is what that general pattern actually looks like: 2 queries instead of up to 7, a real quadratic head start — but Grover's algorithm doesn't promise certainty in general, only that head start. Its own probability peaks at about 94.5% and would fall if pushed further; N = 4 is the special, smaller case where 1 query happens to land exactly on that peak instead of merely near it."
            )}
          </p>
        </div>
      </div>
      <LessonEmbed id="grover" />
    </section>
  );
}
