import { useMemo, useState } from 'react';
import { Qubit, type BlochVec } from '../../core/qubit.ts';
import { ThreeQubitState } from '../../core/threeQubit.ts';
import { GATES } from '../../core/gates.ts';
import { delay } from '../../core/pulse.ts';
import { useI18n } from '../../hooks/useI18n.ts';
import { useNav } from '../../hooks/useNav.ts';
import BlochSphere from '../BlochSphere.tsx';
import Explainer from '../Explainer.tsx';
import LessonEmbed from '../LessonEmbed.tsx';

const TELEPORT_STEP_MS = 750;
const PRESET_MATCH_EPS = 1e-3;

interface TeleportPreset {
  label: string;
  thetaMult: number;
  phiMult: number;
}

const PRESETS: TeleportPreset[] = [
  { label: '|0⟩', thetaMult: 0, phiMult: 0 },
  { label: '|1⟩', thetaMult: 1, phiMult: 0 },
  { label: '|+⟩', thetaMult: 0.5, phiMult: 0 },
  { label: '|-⟩', thetaMult: 0.5, phiMult: 1 },
];

function isPresetMatch(p: TeleportPreset, theta: number, phi: number): boolean {
  const twoPi = 2 * Math.PI;
  const normPhi = ((phi % twoPi) + twoPi) % twoPi;
  const bTheta = p.thetaMult * Math.PI;
  const bPhi = (((p.phiMult * Math.PI) % twoPi) + twoPi) % twoPi;
  const phiDiff = Math.min(Math.abs(bPhi - normPhi), twoPi - Math.abs(bPhi - normPhi));
  return Math.abs(bTheta - theta) < PRESET_MATCH_EPS && phiDiff < PRESET_MATCH_EPS;
}

export default function TeleportTab() {
  const { t } = useI18n();
  const nav = useNav();
  const isActive = nav.mode === 'sim' && nav.tab === 'teleport';

  const [aliceAngles, setAliceAngles] = useState({ theta: 0, phi: 0 });
  const [bobBloch, setBobBloch] = useState<BlochVec>({ x: 0, y: 0, z: 0 });
  const [bobAnimate, setBobAnimate] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [counts, setCounts] = useState<Record<'00' | '01' | '10' | '11', number>>({
    '00': 0,
    '01': 0,
    '10': 0,
    '11': 0,
  });
  const [m0Val, setM0Val] = useState<string>('?');
  const [m1Val, setM1Val] = useState<string>('?');
  const [bitsSet, setBitsSet] = useState(false);
  const [gateZOn, setGateZOn] = useState(false);
  const [gateXOn, setGateXOn] = useState(false);
  const [cwiresSending, setCwiresSending] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [resultText, setResultText] = useState('—');
  const [bobDescKey, setBobDescKey] = useState<'waiting' | 'entangled' | 'wrong' | 'match'>('waiting');
  const [explainer, setExplainer] = useState(
    t(
      'teleport.explainerDefault',
      "Set Alice's message state above, then press Teleport. Watch Bob's sphere: it starts undetermined, jumps to some definite but wrong point the instant Alice measures, then snaps to match Alice's exactly once her classical bits arrive and Bob corrects for them."
    )
  );

  const aliceQubit = useMemo(() => {
    const q = new Qubit();
    q.setState(aliceAngles.theta, aliceAngles.phi);
    return q;
  }, [aliceAngles]);

  const aliceBloch = aliceQubit.getBloch();

  const bobInfo = useMemo(() => {
    const r = Math.hypot(bobBloch.x, bobBloch.y, bobBloch.z);
    if (r < 0.05) {
      return {
        label: '?',
        formula: t('teleport.bobFormulaUndetermined', '|ψ⟩ = ?'),
      };
    }
    const theta = Math.acos(Math.max(-1, Math.min(1, bobBloch.z / r)));
    const phi = ((Math.atan2(bobBloch.y, bobBloch.x) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const tmp = new Qubit();
    tmp.setState(theta, phi);
    return {
      label: tmp.getLabel(),
      formula: tmp.getFormula(),
    };
  }, [bobBloch, t]);

  function pulseStage(id: string) {
    setActiveStage(id);
    setTimeout(() => {
      setActiveStage((prev) => (prev === id ? null : prev));
    }, 700);
  }

  async function fireTeleport() {
    if (animating) return;
    setAnimating(true);
    setResultText(t('teleport.resultRunning', 'running…'));
    setM0Val('?');
    setM1Val('?');
    setBitsSet(false);
    setGateZOn(false);
    setGateXOn(false);
    setBobDescKey('entangled');

    const state = new ThreeQubitState();
    state.amps[0] = { ...aliceQubit.alpha };
    state.amps[4] = { ...aliceQubit.beta };

    pulseStage('pair');
    setExplainer(t('teleport.stepPair', 'Alice and Bob share an entangled pair, prepared before any message existed.'));
    await delay(TELEPORT_STEP_MS);
    state.applySingleQubitGate(1, GATES.H.matrix);
    state.applyCNOT(1, 2);
    setBobAnimate(true);
    setBobBloch(state.getSingleQubitBloch(2));

    pulseStage('bellmeas');
    setExplainer(
      t(
        'teleport.stepBell',
        "Alice entangles her message qubit with her half of the pair — this reads ψ out against the entanglement, it doesn't copy it."
      )
    );
    await delay(TELEPORT_STEP_MS);
    state.applyCNOT(0, 1);
    state.applySingleQubitGate(0, GATES.H.matrix);
    setBobBloch(state.getSingleQubitBloch(2));

    pulseStage('measure');
    setExplainer(
      t(
        'teleport.stepMeasure',
        "Alice measures both her qubits, collapsing them to two genuinely random classical bits — and collapsing Bob's qubit to a definite state in the same instant."
      )
    );
    await delay(TELEPORT_STEP_MS);
    const m0 = state.measureQubit(0);
    const m1 = state.measureQubit(1);
    setM0Val(String(m0));
    setM1Val(String(m1));
    setBitsSet(true);
    setBobDescKey('wrong');
    setBobBloch(state.getSingleQubitBloch(2));

    setCwiresSending(true);
    setExplainer(
      t(
        'teleport.stepSend',
        'Alice sends her two classical bits to Bob — an ordinary channel, no faster than light. He conditionally applies Z and/or X to fix his qubit up.'
      )
    );
    await delay(TELEPORT_STEP_MS);
    setCwiresSending(false);
    setGateZOn(m0 === 1);
    setGateXOn(m1 === 1);
    if (m0 === 1) state.applySingleQubitGate(2, GATES.Z.matrix);
    if (m1 === 1) state.applySingleQubitGate(2, GATES.X.matrix);
    setBobDescKey('match');
    setBobBloch(state.getSingleQubitBloch(2));

    const key = `${m0}${m1}` as '00' | '01' | '10' | '11';
    setCounts((c) => ({ ...c, [key]: c[key] + 1 }));
    setResultText(t('teleport.resultDone', 'Teleportation complete'));
    setExplainer(
      t(
        'teleport.stepDone',
        "Bob's qubit now equals Alice's original message exactly — teleported, not cloned: her own qubit was destroyed by measurement back in step 2, so the no-cloning theorem stays intact. Alice never learned ψ either; she just relayed two random bits, m₀={m0}, m₁={m1}, that happened to be exactly what Bob needed."
      )
        .replace('{m0}', String(m0))
        .replace('{m1}', String(m1))
    );

    setAnimating(false);
  }

  function resetTeleport() {
    if (animating) return;
    setCounts({ '00': 0, '01': 0, '10': 0, '11': 0 });
    setM0Val('?');
    setM1Val('?');
    setBitsSet(false);
    setGateZOn(false);
    setGateXOn(false);
    setResultText('—');
    setBobDescKey('waiting');
    setBobAnimate(false);
    setBobBloch({ x: 0, y: 0, z: 0 });
    setExplainer(
      t(
        'teleport.explainerDefault',
        "Set Alice's message state above, then press Teleport. Watch Bob's sphere: it starts undetermined, jumps to some definite but wrong point the instant Alice measures, then snaps to match Alice's exactly once her classical bits arrive and Bob corrects for them."
      )
    );
  }

  function handleAliceKeyDown(e: React.KeyboardEvent<HTMLCanvasElement>) {
    const step = e.shiftKey ? Math.PI / 6 : Math.PI / 36;
    let { theta, phi } = aliceBloch;
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
    setAliceAngles({ theta, phi });
  }

  const total = counts['00'] + counts['01'] + counts['10'] + counts['11'];
  const bobDescText =
    bobDescKey === 'entangled'
      ? t('teleport.bobDescEntangled', 'Entangled with Alice — undetermined on its own')
      : bobDescKey === 'wrong'
        ? t('teleport.bobDescWrong', "Definite now, but not yet ψ — waiting on Alice's bits")
        : bobDescKey === 'match'
          ? t('teleport.bobDescMatch', "Matches Alice's message exactly")
          : t('teleport.bobDescWaiting', 'Not entangled yet — press Teleport');

  return (
    <section
      id="tab-teleport"
      className={`tab-content${isActive ? ' active' : ''}`}
      style={{ display: nav.mode === 'sim' ? undefined : 'none' }}
    >
      <div className="compare-header">
        <h1 className="compare-title">{t('teleport.title', 'Quantum Teleportation')}</h1>
        <p className="compare-subtitle">
          {t(
            'teleport.subtitle',
            "Transferring a qubit's exact state onto a second, physically separate qubit — using a shared entangled pair and two classical bits, without ever transporting the qubit itself"
          )}
        </p>
      </div>
      <div className="teleport-layout">
        <div className="card">
          <div className="card-title">{t('teleport.definitionTitle', 'What Is Quantum Teleportation?')}</div>
          <p className="bit-explainer">
            {t(
              'teleport.definitionBody1',
              'Quantum teleportation is a protocol for transferring the exact state of one qubit onto a second, physically separate qubit, using a previously shared pair of entangled qubits together with two bits of classical communication — without the original qubit ever being physically transported or directly measured. It moves quantum information, not matter or energy, and it cannot be used to send a signal faster than light: recovering the transferred state at the receiving end requires those two classical bits to actually arrive, and they travel no faster than any ordinary signal.'
            )}
          </p>
          <p className="bit-explainer" style={{ marginTop: '10px' }}>
            {t(
              'teleport.definitionBody2',
              'Nor does it create a copy. The source qubit\'s own state is necessarily destroyed by the measurement the protocol requires, consistent with the no-cloning theorem, which forbids any procedure from duplicating an unknown quantum state while leaving the original intact. In the walkthrough below, the two parties exchanging the qubit are given the conventional labels used throughout quantum information theory — Alice for the sender, Bob for the receiver.'
            )}
          </p>
        </div>
        <div className="card teleport-circuit-card">
          <div className="card-title">{t('teleport.circuitTitle', 'The Protocol')}</div>
          <svg
            id="teleport-svg"
            viewBox="0 0 640 230"
            role="img"
            aria-label={t(
              'teleport.svgAlt',
              "Circuit diagram: Alice's message qubit and two halves of an entangled pair. A Hadamard and CNOT create the entangled pair between Alice's second qubit and Bob's qubit. A CNOT and Hadamard put Alice's message qubit and her half of the pair into the Bell basis. Both are measured, and the two classical results travel down double lines to conditionally-applied Z and X correction gates on Bob's qubit."
            )}
          >
            <defs>
              <marker id="tp-cbit-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>
            <line x1="60" y1="40" x2="580" y2="40" stroke="var(--zero)" strokeWidth="2" opacity="0.55" />
            <line x1="60" y1="115" x2="580" y2="115" stroke="var(--zero)" strokeWidth="2" opacity="0.55" />
            <line x1="60" y1="190" x2="580" y2="190" stroke="var(--one)" strokeWidth="2" opacity="0.55" />
            <text x="30" y="45" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--zero)">
              ψ
            </text>
            <text x="30" y="120" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--zero)">
              A
            </text>
            <text x="30" y="195" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--one)">
              B
            </text>
            <g id="teleport-stage-pair" className={`teleport-stage${activeStage === 'pair' ? ' active' : ''}`}>
              <rect x="90" y="95" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <text x="110" y="120" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--zero)">
                H
              </text>
              <line x1="170" y1="115" x2="170" y2="190" stroke="var(--text2)" strokeWidth="2" />
              <circle cx="170" cy="115" r="7" fill="var(--text2)" />
              <circle cx="170" cy="190" r="15" fill="none" stroke="var(--text2)" strokeWidth="2" />
              <line x1="170" y1="177" x2="170" y2="203" stroke="var(--text2)" strokeWidth="2" />
              <line x1="157" y1="190" x2="183" y2="190" stroke="var(--text2)" strokeWidth="2" />
            </g>
            <g id="teleport-stage-bellmeas" className={`teleport-stage${activeStage === 'bellmeas' ? ' active' : ''}`}>
              <line x1="250" y1="40" x2="250" y2="115" stroke="var(--text2)" strokeWidth="2" />
              <circle cx="250" cy="40" r="7" fill="var(--text2)" />
              <circle cx="250" cy="115" r="15" fill="none" stroke="var(--text2)" strokeWidth="2" />
              <line x1="250" y1="102" x2="250" y2="128" stroke="var(--text2)" strokeWidth="2" />
              <line x1="237" y1="115" x2="263" y2="115" stroke="var(--text2)" strokeWidth="2" />
              <rect x="290" y="20" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <text x="310" y="45" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--zero)">
                H
              </text>
            </g>
            <g id="teleport-stage-measure" className={`teleport-stage${activeStage === 'measure' ? ' active' : ''}`}>
              <rect x="370" y="20" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <path d="M382,48 A10,10 0 0 1 398,48" fill="none" stroke="var(--zero)" strokeWidth="1.6" />
              <line x1="390" y1="49" x2="397" y2="35" stroke="var(--zero)" strokeWidth="1.6" strokeLinecap="round" />
              <rect x="430" y="95" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <path d="M442,123 A10,10 0 0 1 458,123" fill="none" stroke="var(--zero)" strokeWidth="1.6" />
              <line x1="450" y1="124" x2="457" y2="110" stroke="var(--zero)" strokeWidth="1.6" strokeLinecap="round" />
            </g>
            <g id="teleport-stage-correct">
              <g id="teleport-cwire-0" className={`teleport-cwire${cwiresSending ? ' sending' : ''}`}>
                <line x1="388" y1="60" x2="388" y2="170" stroke="var(--text3)" strokeWidth="1.5" markerEnd="url(#tp-cbit-arr)" />
                <line x1="392" y1="60" x2="392" y2="170" stroke="var(--text3)" strokeWidth="1.5" />
              </g>
              <g id="teleport-cwire-1" className={`teleport-cwire${cwiresSending ? ' sending' : ''}`}>
                <line x1="448" y1="135" x2="448" y2="170" stroke="var(--text3)" strokeWidth="1.5" />
                <line x1="452" y1="135" x2="452" y2="170" stroke="var(--text3)" strokeWidth="1.5" markerEnd="url(#tp-cbit-arr)" />
              </g>
              <g id="teleport-gate-z" className={`circuit-gate${!gateZOn ? ' circuit-gate-off' : ''}`}>
                <rect x="370" y="170" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <text x="390" y="195" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--one)">
                  Z
                </text>
              </g>
              <g id="teleport-gate-x" className={`circuit-gate${!gateXOn ? ' circuit-gate-off' : ''}`}>
                <rect x="430" y="170" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
                <text x="450" y="195" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--one)">
                  X
                </text>
              </g>
            </g>
            <text id="teleport-final-label" x="545" y="207" textAnchor="middle" fontSize="11" fill="var(--text2)">
              {t('teleport.finalLabel', "Bob's qubit ≡ ψ")}
            </text>
          </svg>
          <div className="teleport-actions">
            <button className="btn-run" id="btn-teleport" disabled={animating} onClick={fireTeleport}>
              {t('teleport.teleportBtn', 'Teleport')}
            </button>
            <span className="muted-text" id="teleport-result">
              {resultText}
            </span>
          </div>
        </div>
        <div className="compare-layout teleport-compare">
          <div className="compare-col">
            <div className="col-label">
              <span className="col-badge quantum-badge">{t('teleport.aliceBadge', "Alice's message")}</span>
              <span className="col-desc">{t('teleport.aliceDesc', 'Set any state — this is what gets teleported')}</span>
            </div>
            <div className="bloch-wrap bloch-wrap--drag">
              <BlochSphere
                id="bloch-teleport-alice"
                width={200}
                height={200}
                vector={{ x: aliceBloch.x, y: aliceBloch.y, z: aliceBloch.z }}
                label={aliceQubit.getLabel()}
                onDrag={(theta, phi) => setAliceAngles({ theta, phi })}
                onKeyDown={handleAliceKeyDown}
                ariaLabel={`Bloch sphere for Alice's message qubit. State: ${aliceQubit.getFormula()}. Draggable, or focus and use arrow keys, to set its state.`}
              />
              <div className="state-label" id="label-teleport-alice">
                {aliceQubit.getLabel()}
              </div>
            </div>
            <div className="preset-grid preset-grid--2col" style={{ marginTop: '10px' }}>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  className={`preset-btn${isPresetMatch(p, aliceBloch.theta, aliceBloch.phi) ? ' is-active' : ''}`}
                  data-teleport-preset=""
                  onClick={() => setAliceAngles({ theta: p.thetaMult * Math.PI, phi: p.phiMult * Math.PI })}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="slider-group" style={{ marginTop: '10px' }}>
              <div className="slider-row">
                <span className="slider-sym">θ</span>
                <input
                  type="range"
                  id="sl-teleport-theta"
                  min="0"
                  max="3141"
                  value={Math.round(aliceAngles.theta * 1000)}
                  onChange={(e) =>
                    setAliceAngles((prev) => ({ ...prev, theta: parseInt(e.target.value, 10) / 1000 }))
                  }
                />
                <span className="slider-val" id="val-teleport-theta">
                  {Math.round((aliceBloch.theta * 180) / Math.PI)}°
                </span>
              </div>
              <div className="slider-row">
                <span className="slider-sym">φ</span>
                <input
                  type="range"
                  id="sl-teleport-phi"
                  min="0"
                  max="6283"
                  value={Math.round(aliceAngles.phi * 1000)}
                  onChange={(e) =>
                    setAliceAngles((prev) => ({ ...prev, phi: parseInt(e.target.value, 10) / 1000 }))
                  }
                />
                <span className="slider-val" id="val-teleport-phi">
                  {Math.round((aliceBloch.phi * 180) / Math.PI)}°
                </span>
              </div>
            </div>
            <div className="formula" id="formula-teleport-alice" style={{ marginTop: '10px', textAlign: 'center' }}>
              {aliceQubit.getFormula()}
            </div>
          </div>
          <div className="compare-divider">
            <div className="divider-line" />
            <div className="divider-vs" aria-hidden="true">
              →
            </div>
            <div className="divider-line" />
          </div>
          <div className="compare-col">
            <div className="col-label">
              <span className="col-badge teleport-bob-badge">{t('teleport.bobBadge', "Bob's qubit")}</span>
              <span className="col-desc" id="teleport-bob-desc">
                {bobDescText}
              </span>
            </div>
            <div className="bloch-wrap">
              <BlochSphere
                id="bloch-teleport-bob"
                width={200}
                height={200}
                vector={bobBloch}
                label={bobInfo.label}
                animate={bobAnimate}
                ariaLabel="Bloch sphere for Bob's qubit. Starts undetermined; ends up matching Alice's message exactly once teleportation completes."
              />
              <div className="state-label" id="label-teleport-bob">
                {bobInfo.label}
              </div>
            </div>
            <div className="formula" id="formula-teleport-bob" style={{ marginTop: '10px', textAlign: 'center' }}>
              {bobInfo.formula}
            </div>
          </div>
        </div>
        <div className="teleport-controls-grid">
          <div className="card">
            <div className="card-title">{t('teleport.classicalBitsTitle', 'Classical Bits')}</div>
            <p className="bit-explainer">
              {t(
                'teleport.classicalBitsBody',
                "Alice must physically send these two bits to Bob — by phone, radio, the postal service, anything classical. Without them, Bob's qubit is useless to him even though it's already sitting right there."
              )}
            </p>
            <div className="teleport-bits-row">
              <div className="teleport-bit-chip">
                <span className="teleport-bit-label">m₀</span>
                <span className={`teleport-bit-val${bitsSet ? ' set' : ''}`} id="teleport-m0">
                  {m0Val}
                </span>
              </div>
              <div className="teleport-bit-chip">
                <span className="teleport-bit-label">m₁</span>
                <span className={`teleport-bit-val${bitsSet ? ' set' : ''}`} id="teleport-m1">
                  {m1Val}
                </span>
              </div>
            </div>
            <div className="card-title" style={{ marginTop: '16px' }}>
              <span>{t('teleport.outcomeTally', 'Outcome Tally')}</span>
              <span className="muted-text" id="teleport-trial-count">
                {total ? t('teleport.trialCount', '· {count} runs').replace('{count}', String(total)) : ''}
              </span>
            </div>
            <div className="histogram teleport-histogram">
              {(['00', '01', '10', '11'] as const).map((k) => {
                const pct = total ? (counts[k] / total) * 100 : 0;
                const barClass = k === '00' ? 'hist-bar zero-fill' : k === '11' ? 'hist-bar one-fill' : 'hist-bar';
                const ketClass = k === '00' ? 'ket zero-color' : k === '11' ? 'ket one-color' : 'ket mid-color';
                const barStyle: React.CSSProperties =
                  k === '01' || k === '10'
                    ? { background: 'var(--text2)', height: `${pct}%` }
                    : { height: `${pct}%` };
                return (
                  <div className="hist-col" key={k}>
                    <div className="hist-track">
                      <div className={barClass} style={barStyle} id={`teleport-hist-${k}`} />
                    </div>
                    <span className={ketClass}>{k}</span>
                    <span className="pct" id={`teleport-pct-${k}`}>
                      {total ? `${Math.round(pct)}%` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
            <button className="btn-secondary" id="btn-reset-teleport" onClick={resetTeleport}>
              {t('common.reset', 'Reset')}
            </button>
          </div>
          <div className="card explainer-card">
            <div className="card-title">{t('common.whatJustHappened', 'What just happened')}</div>
            <Explainer id="teleport-explainer" html={explainer} />
          </div>
        </div>
        <div className="card mt-14">
          <div className="card-title">{t('teleport.whyNotFtlTitle', "Why This Isn't Faster-Than-Light")}</div>
          <p className="bit-explainer">
            {t(
              'teleport.whyNotFtlBody',
              "The instant Alice measures her two qubits, Bob's qubit does become a definite state — but which one is anyone's guess without Alice's two classical bits, and those can only travel at the speed of light or slower, same as a phone call. Until they arrive, Bob's qubit reads as pure noise: measuring it himself early would just give a random 50/50 result, no matter what ψ was. The entanglement makes teleportation possible; it doesn't make it instant."
            )}
          </p>
        </div>
        <div className="card mt-14">
          <div className="card-title">{t('teleport.noCloningTitle', 'Not a Copy — the No-Cloning Theorem')}</div>
          <p
            className="bit-explainer"
            dangerouslySetInnerHTML={{
              __html: t(
                'teleport.noCloningBody',
                "Alice's original message qubit doesn't survive this: her Bell-basis measurement in Step 2 collapses it along with her half of the pair, permanently erasing whatever ψ used to be on her side. That's not a limitation of this particular protocol — the no-cloning theorem proves <em>no</em> quantum procedure can ever copy an unknown state while leaving the original intact. Teleportation moves a state; it never duplicates one."
              ),
            }}
          />
        </div>
      </div>
      <LessonEmbed id="teleport" />
    </section>
  );
}
