import { useState } from 'react';
import { delay } from '../../core/pulse.ts';
import { useI18n } from '../../hooks/useI18n.ts';
import { useNav } from '../../hooks/useNav.ts';
import LessonEmbed from '../LessonEmbed.tsx';

export type BellStateKey = 'phiplus' | 'phiminus' | 'psiplus' | 'psiminus';

interface BellStateDef {
  symbol: string;
  ketA: string;
  ketB: string;
  correlation: 'same' | 'opposite';
  formula: string;
  needsXA: boolean;
  needsXB: boolean;
}

const BELL_STATES: Record<BellStateKey, BellStateDef> = {
  phiplus:  { symbol: 'Φ⁺', ketA: '00', ketB: '11', correlation: 'same',
              formula: '|Φ⁺⟩ = (|00⟩ + |11⟩) / √2', needsXA: false, needsXB: false },
  phiminus: { symbol: 'Φ⁻', ketA: '00', ketB: '11', correlation: 'same',
              formula: '|Φ⁻⟩ = (|00⟩ − |11⟩) / √2', needsXA: true,  needsXB: false },
  psiplus:  { symbol: 'Ψ⁺', ketA: '01', ketB: '10', correlation: 'opposite',
              formula: '|Ψ⁺⟩ = (|01⟩ + |10⟩) / √2', needsXA: false, needsXB: true },
  psiminus: { symbol: 'Ψ⁻', ketA: '01', ketB: '10', correlation: 'opposite',
              formula: '|Ψ⁻⟩ = (|01⟩ − |10⟩) / √2', needsXA: true,  needsXB: true },
};

const BELL_RECIPE_FALLBACK: Record<BellStateKey, string> = {
  phiplus:  'Start at |00⟩, apply H to qubit A, then CNOT (A → B).',
  phiminus: 'Start at |00⟩, apply X to qubit A, then H to qubit A, then CNOT (A → B).',
  psiplus:  'Start at |00⟩, apply X to qubit B, then H to qubit A, then CNOT (A → B).',
  psiminus: 'Start at |00⟩, apply X to both qubits, then H to qubit A, then CNOT (A → B).',
};

const BELL_ANIM_STEP_MS = 700;
const BELL_TOKEN_BASE_X = 70;

interface TokenState {
  hidden: boolean;
  x: number;
  label: string;
  superposed: boolean;
  entangled: boolean;
  pulse: boolean;
}

const INITIAL_TOKEN: TokenState = {
  hidden: true,
  x: BELL_TOKEN_BASE_X,
  label: '0',
  superposed: false,
  entangled: false,
  pulse: false,
};

export default function BellstatesTab() {
  const { t } = useI18n();
  const nav = useNav();
  const isActive = nav.mode === 'sim' && nav.tab === 'bellstates';

  const [currentBell, setCurrentBell] = useState<BellStateKey>('phiplus');
  const [animating, setAnimating] = useState(false);
  const [animStatus, setAnimStatus] = useState('');
  const [narration, setNarration] = useState('');
  const [tokenA, setTokenA] = useState<TokenState>(INITIAL_TOKEN);
  const [tokenB, setTokenB] = useState<TokenState>(INITIAL_TOKEN);
  const [linkShown, setLinkShown] = useState(false);

  const s = BELL_STATES[currentBell];

  function selectBellState(key: BellStateKey) {
    if (animating) return;
    setCurrentBell(key);
    setTokenA(INITIAL_TOKEN);
    setTokenB(INITIAL_TOKEN);
    setLinkShown(false);
  }

  async function runBellStateCircuit() {
    if (animating) return;
    setAnimating(true);
    setAnimStatus(t('common.running', 'running…'));

    setTokenA({ ...INITIAL_TOKEN, hidden: false });
    setTokenB({ ...INITIAL_TOKEN, hidden: false });
    setLinkShown(false);
    setNarration(t('bellstates.animStart', 'Both qubits start at |0⟩ — watch the value on each wire as it moves through the gates.'));
    await delay(BELL_ANIM_STEP_MS);

    setTokenA((prev) => ({ ...prev, x: 110 }));
    setTokenB((prev) => ({ ...prev, x: 110 }));
    await delay(BELL_ANIM_STEP_MS);

    if (s.needsXA) {
      setTokenA((prev) => ({ ...prev, label: '1', pulse: true }));
      setNarration(t('bellstates.animFlipA', 'X flips qubit A: 0 → 1.'));
      await delay(500);
      setTokenA((prev) => ({ ...prev, pulse: false }));
    }
    if (s.needsXB) {
      setTokenB((prev) => ({ ...prev, label: '1', pulse: true }));
      setNarration(t('bellstates.animFlipB', 'X flips qubit B: 0 → 1.'));
      await delay(500);
      setTokenB((prev) => ({ ...prev, pulse: false }));
    }
    if (!s.needsXA && !s.needsXB) {
      setNarration(t('bellstates.animNoFlip', 'This state needs no X gate — both qubits stay at |0⟩ so far.'));
      await delay(400);
    }

    setTokenA((prev) => ({ ...prev, x: 220 }));
    setTokenB((prev) => ({ ...prev, x: 220 }));
    await delay(BELL_ANIM_STEP_MS);
    setTokenA((prev) => ({ ...prev, superposed: true, label: '0∕1' }));
    setNarration(t('bellstates.animSuperpose', 'H puts qubit A into a genuine superposition — no longer a definite 0 or 1, both at once.'));
    await delay(BELL_ANIM_STEP_MS);

    setTokenA((prev) => ({ ...prev, x: 320 }));
    setTokenB((prev) => ({ ...prev, x: 320 }));
    await delay(BELL_ANIM_STEP_MS);
    setTokenA((prev) => ({ ...prev, entangled: true }));
    setTokenB((prev) => ({ ...prev, superposed: true, entangled: true, label: '0∕1' }));
    setNarration(t('bellstates.animEntangle', "CNOT entangles B with A — B is now correlated with A's superposition, not independently random."));
    await delay(BELL_ANIM_STEP_MS);

    setTokenA((prev) => ({ ...prev, x: 420 }));
    setTokenB((prev) => ({ ...prev, x: 420 }));
    await delay(BELL_ANIM_STEP_MS);
    setLinkShown(true);
    setNarration(
      t('bellstates.animDone', 'Final state: {formula} — A and B are perfectly correlated: measuring one instantly tells you the other.').replace(
        '{formula}',
        s.formula
      )
    );
    setAnimStatus('');
    setAnimating(false);
  }

  const tokenClass = (tk: TokenState) => {
    const cls = ['bellstate-token'];
    if (tk.hidden) cls.push('token-hidden');
    if (tk.superposed) cls.push('superposed');
    if (tk.entangled) cls.push('entangled');
    if (tk.pulse) cls.push('token-pulse');
    return cls.join(' ');
  };

  return (
    <section
      id="tab-bellstates"
      className={`tab-content${isActive ? ' active' : ''}`}
      style={{ display: nav.mode === 'sim' ? undefined : 'none' }}
    >
      <div className="compare-header">
        <h1 className="compare-title">{t('bellstates.title', 'Bell States')}</h1>
        <p className="compare-subtitle">
          {t(
            'bellstates.subtitle',
            'The four maximally entangled two-qubit states — pick one, prepare it, and watch its signature correlation appear across repeated measurements'
          )}
        </p>
      </div>
      <div className="bellstates-layout">
        <div className="card">
          <div className="card-title">{t('bellstates.pickTitle', 'Choose a Bell State')}</div>
          <div className="mode-grid" id="bellstate-picker" style={{ gridTemplateColumns: 'repeat(4,1fr)', maxWidth: '420px', margin: '0 auto 18px' }}>
            {(['phiplus', 'phiminus', 'psiplus', 'psiminus'] as const).map((k) => (
              <button
                key={k}
                className={`preset-btn mode-btn${currentBell === k ? ' active' : ''}`}
                data-bell={k}
                disabled={animating}
                onClick={() => selectBellState(k)}
              >
                {BELL_STATES[k].symbol}
              </button>
            ))}
          </div>
          <div className="formula" id="bellstate-formula">
            {s.formula}
          </div>
          <p className="bit-explainer" style={{ marginTop: '10px' }} id="bellstate-recipe">
            {t(`bellstates.recipe.${currentBell}`, BELL_RECIPE_FALLBACK[currentBell])}
          </p>
          <div className="card-title" style={{ marginTop: '18px' }}>
            {t('bellstates.circuitTitle', 'Circuit Diagram')}
          </div>
          <svg
            id="bellstate-circuit"
            viewBox="0 0 460 150"
            role="img"
            aria-label="Circuit diagram: an X gate optionally on qubit A and/or B, then a Hadamard on qubit A, then a CNOT controlled by A targeting B."
            style={{ width: '100%', maxWidth: '460px', display: 'block', margin: '8px auto 0' }}
          >
            <defs>
              <linearGradient id="bellstate-metal-sheen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.38" />
                <stop offset="14%" stopColor="#fff" stopOpacity="0.1" />
                <stop offset="55%" stopColor="#000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
              </linearGradient>
            </defs>
            <line x1="50" y1="45" x2="430" y2="45" stroke="var(--border2)" strokeWidth="2" />
            <line x1="50" y1="105" x2="430" y2="105" stroke="var(--border2)" strokeWidth="2" />
            <text x="26" y="51" fontSize="15" fontWeight="700" fill="var(--zero)" textAnchor="middle">
              A
            </text>
            <text x="26" y="111" fontSize="15" fontWeight="700" fill="var(--one)" textAnchor="middle">
              B
            </text>
            <g id="bellstate-gate-xa" className={`circuit-gate${!s.needsXA ? ' circuit-gate-off' : ''}`}>
              <rect x="90" y="25" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <rect x="90" y="25" width="40" height="40" rx="6" fill="url(#bellstate-metal-sheen)" pointerEvents="none" />
              <text x="110" y="51" fontSize="16" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                X
              </text>
            </g>
            <g id="bellstate-gate-xb" className={`circuit-gate${!s.needsXB ? ' circuit-gate-off' : ''}`}>
              <rect x="90" y="85" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
              <rect x="90" y="85" width="40" height="40" rx="6" fill="url(#bellstate-metal-sheen)" pointerEvents="none" />
              <text x="110" y="111" fontSize="16" fontWeight="700" fill="var(--one)" textAnchor="middle">
                X
              </text>
            </g>
            <g id="bellstate-gate-h" className="circuit-gate">
              <rect x="200" y="25" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <rect x="200" y="25" width="40" height="40" rx="6" fill="url(#bellstate-metal-sheen)" pointerEvents="none" />
              <text x="220" y="51" fontSize="16" fontWeight="700" fill="var(--zero)" textAnchor="middle">
                H
              </text>
            </g>
            <g id="bellstate-gate-cnot" className="circuit-gate">
              <line x1="320" y1="45" x2="320" y2="105" stroke="var(--text2)" strokeWidth="2" />
              <circle cx="320" cy="45" r="7" fill="var(--text2)" />
              <circle cx="320" cy="45" r="7" fill="url(#bellstate-metal-sheen)" pointerEvents="none" />
              <circle cx="320" cy="105" r="15" fill="var(--surface)" stroke="var(--text2)" strokeWidth="2" />
              <circle cx="320" cy="105" r="15" fill="url(#bellstate-metal-sheen)" pointerEvents="none" />
              <line x1="320" y1="92" x2="320" y2="118" stroke="var(--text2)" strokeWidth="2" />
              <line x1="307" y1="105" x2="333" y2="105" stroke="var(--text2)" strokeWidth="2" />
            </g>
            <path
              id="bellstate-entangle-link"
              className={`bellstate-entangle-link${linkShown ? ' shown' : ''}`}
              d="M 420,45 Q 452,75 420,105"
            />
            <g
              id="bellstate-token-a"
              className={tokenClass(tokenA)}
              style={{ transform: `translateX(${tokenA.x - BELL_TOKEN_BASE_X}px)` }}
            >
              <circle className="token-dot" cx="70" cy="45" r="12" fill="var(--zero)" />
              <text className="token-label" x="70" y="49">
                {tokenA.label}
              </text>
            </g>
            <g
              id="bellstate-token-b"
              className={tokenClass(tokenB)}
              style={{ transform: `translateX(${tokenB.x - BELL_TOKEN_BASE_X}px)` }}
            >
              <circle className="token-dot" cx="70" cy="105" r="12" fill="var(--one)" />
              <text className="token-label" x="70" y="109">
                {tokenB.label}
              </text>
            </g>
          </svg>
          <div className="circuit-actions" style={{ marginTop: '10px', justifyContent: 'center' }}>
            <button className="btn-run" id="btn-run-bellstate" disabled={animating} onClick={runBellStateCircuit}>
              {t('common.run', '▶ Run')}
            </button>
            <span className="muted-text" id="bellstate-anim-status">
              {animStatus}
            </span>
          </div>
          <p className="bit-explainer mt-14" id="bellstate-anim-explainer">
            {narration}
          </p>
        </div>
        <div className="card mt-14">
          <div className="card-title">{t('bellstates.familyTitle', 'The Bell Family')}</div>
          <p className="bit-explainer">
            {t(
              'bellstates.familyBody',
              'Every Bell state sits at one of four corners, set by two independent choices: which row (same or opposite measurement outcomes) and which column (a + or − relative phase). Click any corner to prepare it.'
            )}
          </p>
          <div className="bell-family-grid" id="bellstate-family" style={{ marginTop: '14px' }}>
            <div className="bell-family-corner" />
            <div className="bell-family-colhead">{t('bellstates.plusPhase', '+ phase')}</div>
            <div className="bell-family-colhead">{t('bellstates.minusPhase', '− phase')}</div>
            <div className="bell-family-rowhead">{t('bellstates.sameRow', 'Same')}</div>
            <button
              className={`bell-family-cell${currentBell === 'phiplus' ? ' active' : ''}`}
              data-bell="phiplus"
              disabled={animating}
              onClick={() => selectBellState('phiplus')}
            >
              Φ⁺
            </button>
            <button
              className={`bell-family-cell${currentBell === 'phiminus' ? ' active' : ''}`}
              data-bell="phiminus"
              disabled={animating}
              onClick={() => selectBellState('phiminus')}
            >
              Φ⁻
            </button>
            <div className="bell-family-rowhead">{t('bellstates.oppositeRow', 'Opposite')}</div>
            <button
              className={`bell-family-cell${currentBell === 'psiplus' ? ' active' : ''}`}
              data-bell="psiplus"
              disabled={animating}
              onClick={() => selectBellState('psiplus')}
            >
              Ψ⁺
            </button>
            <button
              className={`bell-family-cell${currentBell === 'psiminus' ? ' active' : ''}`}
              data-bell="psiminus"
              disabled={animating}
              onClick={() => selectBellState('psiminus')}
            >
              Ψ⁻
            </button>
          </div>
        </div>
        <div className="card mt-14">
          <div className="card-title">{t('bellstates.distributionTitle', 'Probability Distribution')}</div>
          <p className="bit-explainer" id="bellstate-distribution-note" style={{ marginBottom: '14px' }}>
            {t(
              'bellstates.distributionNote',
              'Exact Born-rule probabilities for {symbol} — no sampling needed, these follow directly from squaring each amplitude.'
            ).replace('{symbol}', `|${s.symbol}⟩`)}
          </p>
          <div className="entangle-stats" id="bell-stats-rows">
            {([
              ['00', 'zero'],
              ['01', 'mid'],
              ['10', 'mid'],
              ['11', 'one'],
            ] as const).map(([k, tone]) => {
              const possible = k === s.ketA || k === s.ketB;
              const pct = possible ? 50 : 0;
              return (
                <div key={k} className={`prob-row${!possible ? ' bell-impossible' : ''}`} data-ket={k}>
                  <span className={`ket ${tone}-color`} style={{ minWidth: '34px' }}>
                    |{k}⟩
                  </span>
                  <div className="track">
                    <div className={`fill ${tone}-fill`} id={`bstat-fill-${k}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="pct" id={`bstat-pct-${k}`}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card mt-14">
          <div className="card-title">{t('bellstates.definitionsTitle', 'The Four Bell States')}</div>
          <div
            className="bit-explainer"
            dangerouslySetInnerHTML={{
              __html: t(
                'bellstates.definitionsBody',
                'All four are built from the same |00⟩ starting point with the same two-gate recipe — a Hadamard on qubit A, then a CNOT controlled by it — just preceded by an X gate on whichever qubit(s) need flipping first: <ul class="quantum-list"><li><b>Φ⁺ = (|00⟩ + |11⟩)/√2</b> — no X gates. Outcomes always match.</li><li><b>Φ⁻ = (|00⟩ − |11⟩)/√2</b> — X on qubit A first. Outcomes always match.</li><li><b>Ψ⁺ = (|01⟩ + |10⟩)/√2</b> — X on qubit B first. Outcomes always opposite.</li><li><b>Ψ⁻ = (|01⟩ − |10⟩)/√2</b> — X on both qubits first. Outcomes always opposite.</li></ul> Together they form a complete orthonormal basis for two qubits — the core resource behind quantum teleportation and superdense coding.'
              ),
            }}
          />
        </div>
        <div className="card mt-14">
          <div className="card-title">{t('bellstates.phaseNoteTitle', "Why Doesn't the Minus Sign Show Up?")}</div>
          <p className="bit-explainer">
            {t(
              'bellstates.phaseNoteBody',
              "Φ⁺ and Φ⁻ (and likewise Ψ⁺ and Ψ⁻) give identical probability distributions above, because a relative phase — the − sign — doesn't change any computational-basis probability, only |amplitude|² does. The two states are still physically distinct: the phase becomes visible the moment you interfere the qubits with each other, for example by applying a Hadamard to each qubit before measuring — that's exactly the extra step Bell-inequality tests and superdense coding rely on to tell all four states apart."
            )}
          </p>
        </div>
      </div>
      <LessonEmbed id="bellstates" />
    </section>
  );
}
