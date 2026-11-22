import { useEffect, useMemo, useRef, useState } from 'react';
import { C } from '../../core/complex.ts';
import { Qubit, blochVectorLabel } from '../../core/qubit.ts';
import { noiseCompute, noiseT2Eff } from '../../core/noise.ts';
import { useI18n } from '../../hooks/useI18n.ts';
import { useNav } from '../../hooks/useNav.ts';
import BlochSphere from '../BlochSphere.tsx';
import Explainer from '../Explainer.tsx';
import LessonEmbed from '../LessonEmbed.tsx';

const NOISE_US_PER_SEC = 40;
const PRESET_MATCH_EPS = 1e-3;

interface NoisePreset {
  label: string;
  thetaMult: number;
  phiMult: number;
}

const PRESETS: NoisePreset[] = [
  { label: '|0⟩', thetaMult: 0, phiMult: 0 },
  { label: '|1⟩', thetaMult: 1, phiMult: 0 },
  { label: '|+⟩', thetaMult: 0.5, phiMult: 0 },
  { label: '|-⟩', thetaMult: 0.5, phiMult: 1 },
];

function isPresetMatch(p: NoisePreset, theta: number, phi: number): boolean {
  const twoPi = 2 * Math.PI;
  const normPhi = ((phi % twoPi) + twoPi) % twoPi;
  const bTheta = p.thetaMult * Math.PI;
  const bPhi = (((p.phiMult * Math.PI) % twoPi) + twoPi) % twoPi;
  const phiDiff = Math.min(Math.abs(bPhi - normPhi), twoPi - Math.abs(bPhi - normPhi));
  return Math.abs(bTheta - theta) < PRESET_MATCH_EPS && phiDiff < PRESET_MATCH_EPS;
}

export default function NoiseTab() {
  const { t } = useI18n();
  const nav = useNav();
  const isActive = nav.mode === 'sim' && nav.tab === 'noise';

  const [angles, setAngles] = useState({ theta: Math.PI / 2, phi: 0 });
  const [t1, setT1] = useState(80);
  const [t2, setT2] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [settled, setSettled] = useState(false);

  const initialBloch = useMemo(() => {
    const q = new Qubit();
    q.setState(angles.theta, angles.phi);
    return q.getBloch();
  }, [angles]);

  const elapsedRef = useRef(0);
  const settledRef = useRef(false);
  const lastFrameRef = useRef<number | null>(null);

  const t2Eff = noiseT2Eff(t1, t2);
  const horizon = 5 * Math.max(t1, t2Eff);

  function restart() {
    elapsedRef.current = 0;
    settledRef.current = false;
    lastFrameRef.current = null;
    setElapsed(0);
    setSettled(false);
    setPlaying(true);
  }

  function updateInitialAngles(theta: number, phi: number) {
    setAngles({ theta, phi });
    restart();
  }

  function updateT1(val: number) {
    setT1(val);
    restart();
  }

  function updateT2(val: number) {
    setT2(val);
    restart();
  }

  useEffect(() => {
    if (!isActive || !playing || settled) {
      lastFrameRef.current = null;
      return undefined;
    }
    let animId: number;
    const step = (now: number) => {
      if (lastFrameRef.current === null) lastFrameRef.current = now;
      const dtReal = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;

      let nextElapsed = elapsedRef.current + dtReal * NOISE_US_PER_SEC;
      if (nextElapsed >= horizon) {
        nextElapsed = horizon;
        elapsedRef.current = nextElapsed;
        settledRef.current = true;
        setElapsed(nextElapsed);
        setSettled(true);
        return;
      }
      elapsedRef.current = nextElapsed;
      setElapsed(nextElapsed);
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isActive, playing, settled, horizon]);

  const cur = noiseCompute(elapsed, {
    x0: initialBloch.x,
    y0: initialBloch.y,
    z0: initialBloch.z,
    t1,
    t2,
  });
  const r = Math.hypot(cur.x, cur.y, cur.z);
  const purity = (1 + r * r) / 2;
  const label = blochVectorLabel(cur.x, cur.y, cur.z);

  const rho00 = C.fmt({ r: (1 + cur.z) / 2, i: 0 });
  const rho01 = C.fmt({ r: cur.x / 2, i: -cur.y / 2 });
  const rho10 = C.fmt({ r: cur.x / 2, i: cur.y / 2 });
  const rho11 = C.fmt({ r: (1 - cur.z) / 2, i: 0 });

  const capNote =
    t2Eff < t2
      ? t('noise.t2CapNote', "T₂ capped to {eff} μs (2×T₁) — dephasing can't outrun relaxation.").replace(
          '{eff}',
          String(t2Eff)
        )
      : '';

  const explainerHtml = settled
    ? t(
        'noise.explainerSettled',
        "Settled at |0⟩ — and purity has actually climbed back near 100%, not bottomed out. That's not a rescue: T1 relaxation pulls a qubit toward its ground state, so given enough time it always ends up pure again, just pure and uninformative. A qubit sitting at |0⟩ looks identical whether it started as |+⟩, |−⟩, or anything else — the phase information T2 erased along the way never comes back, purity or no purity."
      )
    : t(
        'noise.explainerDefault',
        'Watch the Bloch vector shrink and drift toward the north pole — that shrinkage is real information loss, not just a visual effect. A shorter vector means the qubit\'s state is genuinely less certain, exactly the same "mixed state" idea already used for entangled qubits elsewhere in this app.'
      );

  return (
    <section
      id="tab-noise"
      className={`tab-content${isActive ? ' active' : ''}`}
      style={{ display: nav.mode === 'sim' ? undefined : 'none' }}
    >
      <div className="compare-header">
        <h1 className="compare-title">{t('noise.title', 'Noise & Decoherence')}</h1>
        <p className="compare-subtitle">
          {t(
            'noise.subtitle',
            'The loss of quantum coherence through unwanted interaction with the environment — the dominant practical obstacle to building reliable, large-scale quantum computers'
          )}
        </p>
      </div>
      <div className="noise-layout">
        <div className="card">
          <div className="card-title">{t('noise.definitionTitle', 'What Is Quantum Decoherence?')}</div>
          <p className="bit-explainer">
            {t(
              'noise.definitionBody1',
              "Quantum decoherence is the loss of quantum coherence: the process by which a system's phase information leaks into its surrounding environment through unwanted interaction, so that a state genuinely in superposition comes to behave, for all practical purposes, like a definite classical mixture. A system that is perfectly isolated stays in a pure state — one exactly described by a single state vector |ψ⟩ — indefinitely. Once it interacts with an uncontrolled environment, that guarantee no longer holds: the system becomes entangled with the environment's own many degrees of freedom, and tracing out everything except the system itself leaves a mixed state, described by a density matrix ρ rather than a single vector. Every other tab in this app treats gates and qubits as perfectly isolated in exactly that first sense; this one models what happens once they aren't."
            )}
          </p>
          <p className="bit-explainer" style={{ marginTop: '10px' }}>
            {t(
              'noise.definitionBody2',
              "On the Bloch sphere already used throughout this app, that loss of purity shows up as a shrinking vector — the same signature already seen for a qubit entangled with another (see the Entangle and Circuits tabs' reduced Bloch spheres), just caused here by an uncontrolled environment instead of a deliberate second qubit. Decoherence is the dominant practical obstacle to building large-scale, reliable quantum computers: every gate in a real circuit has to complete before the coherence it depends on has leaked away. The simulation below models two of its standard phenomenological channels, T₁ (relaxation) and T₂ (dephasing), evolving a single qubit's Bloch vector in real time."
            )}
          </p>
        </div>
        <div className="compare-layout noise-compare">
          <div className="compare-col">
            <div className="col-label">
              <span className="col-badge quantum-badge">{t('noise.qubitBadge', 'Decohering qubit')}</span>
              <span className="col-desc" id="noise-state-desc">
                {label}
              </span>
            </div>
            <div className="bloch-wrap">
              <BlochSphere
                id="bloch-noise"
                width={240}
                height={240}
                vector={cur}
                label={label}
                animate={false}
                ariaLabel={`Bloch sphere for a decohering qubit. Elapsed ${elapsed.toFixed(1)} microseconds, vector length ${r.toFixed(2)}, label ${label}.`}
              />
              <div className="state-label" id="label-noise">
                {label}
              </div>
            </div>
          </div>
          <div className="compare-divider">
            <div className="divider-line" />
            <div className="divider-vs" aria-hidden="true">
              ⏱
            </div>
            <div className="divider-line" />
          </div>
          <div className="compare-col">
            <div className="card-title">{t('noise.statsTitle', 'Live Readout')}</div>
            <div className="noise-stats">
              <div className="noise-stat">
                <span className="noise-stat-label">{t('noise.elapsed', 'Elapsed time')}</span>
                <span className="noise-stat-val" id="noise-elapsed-val">
                  {elapsed.toFixed(1)} μs
                </span>
              </div>
              <div className="noise-stat">
                <span className="noise-stat-label">{t('noise.vectorLength', 'Bloch vector length')}</span>
                <span className="noise-stat-val" id="noise-r-val">
                  {r.toFixed(2)}
                </span>
              </div>
              <div className="noise-stat">
                <span className="noise-stat-label">{t('noise.purity', 'Purity Tr(ρ²)')}</span>
                <span className="noise-stat-val" id="noise-purity-val">
                  {Math.round(purity * 100)}%
                </span>
              </div>
            </div>
            <div className="track noise-purity-track">
              <div className="fill zero-fill" id="noise-purity-fill" style={{ width: `${purity * 100}%` }} />
            </div>
            <div className="card-title" style={{ marginTop: '16px' }}>
              {t('noise.densityMatrix', 'Density Matrix ρ')}
            </div>
            <div
              className="noise-matrix"
              id="noise-matrix"
              role="img"
              aria-label="2 by 2 density matrix of the qubit, updating live as it decoheres."
            >
              <span id="noise-rho-00">{rho00}</span>
              <span id="noise-rho-01">{rho01}</span>
              <span id="noise-rho-10">{rho10}</span>
              <span id="noise-rho-11">{rho11}</span>
            </div>
          </div>
        </div>
        <div className="noise-controls-grid">
          <div className="card">
            <div className="card-title">{t('noise.initialStateTitle', 'Initial State')}</div>
            <div className="preset-grid preset-grid--2col">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  className={`preset-btn${isPresetMatch(p, angles.theta, angles.phi) ? ' is-active' : ''}`}
                  data-noise-preset=""
                  onClick={() => updateInitialAngles(p.thetaMult * Math.PI, p.phiMult * Math.PI)}
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
                  id="sl-noise-theta"
                  min="0"
                  max="3141"
                  value={Math.round(angles.theta * 1000)}
                  onChange={(e) => updateInitialAngles(parseInt(e.target.value, 10) / 1000, angles.phi)}
                />
                <span className="slider-val" id="val-noise-theta">
                  {Math.round((angles.theta * 180) / Math.PI)}°
                </span>
              </div>
              <div className="slider-row">
                <span className="slider-sym">φ</span>
                <input
                  type="range"
                  id="sl-noise-phi"
                  min="0"
                  max="6283"
                  value={Math.round(angles.phi * 1000)}
                  onChange={(e) => updateInitialAngles(angles.theta, parseInt(e.target.value, 10) / 1000)}
                />
                <span className="slider-val" id="val-noise-phi">
                  {Math.round((angles.phi * 180) / Math.PI)}°
                </span>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">{t('noise.decayTimesTitle', 'Decay Times')}</div>
            <div className="slider-group">
              <div className="slider-row">
                <span className="slider-sym">T₁</span>
                <input
                  type="range"
                  id="sl-noise-t1"
                  min="5"
                  max="200"
                  value={t1}
                  onChange={(e) => updateT1(parseInt(e.target.value, 10))}
                />
                <span className="slider-val" id="val-noise-t1">
                  {t1} μs
                </span>
              </div>
              <div className="slider-row">
                <span className="slider-sym">T₂</span>
                <input
                  type="range"
                  id="sl-noise-t2"
                  min="5"
                  max="200"
                  value={t2}
                  onChange={(e) => updateT2(parseInt(e.target.value, 10))}
                />
                <span className="slider-val" id="val-noise-t2">
                  {t2} μs
                </span>
              </div>
            </div>
            <p className="muted-text" id="noise-t2-cap-note" style={{ marginTop: '6px' }}>
              {capNote}
            </p>
            <div className="noise-btn-row">
              <button className="btn-run" id="noise-play-btn" onClick={() => setPlaying((p) => !p)}>
                {playing ? t('noise.pauseBtn', '⏸ Pause') : t('noise.playBtn', '▶ Play')}
              </button>
              <button className="btn-secondary" id="btn-noise-restart" onClick={restart}>
                {t('noise.restartBtn', '↻ Restart')}
              </button>
            </div>
          </div>
          <div className="card explainer-card">
            <div className="card-title">{t('common.whatJustHappened', 'What just happened')}</div>
            <Explainer id="noise-explainer" html={explainerHtml} />
          </div>
        </div>
        <div className="card mt-14">
          <div className="card-title">{t('noise.t1t2Title', 'T₁ vs. T₂ — Two Different Ways to Forget')}</div>
          <p className="bit-explainer">
            {t(
              'noise.t1t2Body',
              "T₁ (relaxation) is how long the qubit takes to leak energy into its environment and settle toward |0⟩ — it's why the z-component of the Bloch vector drifts toward the north pole. T₂ (dephasing) is how long the qubit keeps track of the relative phase between |0⟩ and |1⟩ — it's why the x/y components, the part that actually carries superposition information, shrink away. Losing T₂ is often the bigger practical problem: a qubit can still \"mostly\" be |0⟩ or |1⟩ long after it's lost every trace of being in a genuine superposition."
            )}
          </p>
          <div
            className="formula"
            style={{ marginTop: '10px' }}
            dangerouslySetInnerHTML={{
              __html: t('noise.t1t2Formula', 'T₂ ≤ 2×T₁ (dephasing can never be slower than relaxation allows)'),
            }}
          />
        </div>
        <div className="card mt-14">
          <div className="card-title">{t('noise.whyMattersTitle', 'Why This Fight Never Stops on Real Hardware')}</div>
          <p className="bit-explainer">
            {t(
              'noise.whyMattersBody',
              "Every other simulation in this app runs gates and measurements as mathematically perfect operations, because that's the right way to learn the ideas first. Real quantum processors — including the superconducting and trapped-ion devices CERN's own Quantum Technology Initiative experiments with for particle-physics simulation — only stay coherent for a limited window measured in exactly these T₁/T₂ numbers, typically tens to hundreds of microseconds. Every gate in a real circuit has to finish well inside that window, which is the entire reason quantum error correction and hardware-aware circuit design are active engineering problems, not solved ones."
            )}
          </p>
        </div>
      </div>
      <LessonEmbed id="noise" />
    </section>
  );
}
