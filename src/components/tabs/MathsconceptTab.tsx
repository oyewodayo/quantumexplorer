import { useEffect, useRef, useState } from 'react';
import { round2 } from '../../core/qubit.ts';
import { BLOCH_COLORS } from '../../core/theme.ts';
import { setupHiDPICanvas } from '../../core/canvasDpr.ts';
import { useI18n } from '../../hooks/useI18n.ts';
import { useNav } from '../../hooks/useNav.ts';
import { useTheme } from '../../hooks/useTheme.ts';
import LessonEmbed from '../LessonEmbed.tsx';

export type MathsSection = 'complex' | 'vectors' | 'matrices' | 'statevector' | 'dirac' | 'tensor';

function drawClassicalSV(canvas: HTMLCanvasElement | null, state: number, isDark: boolean) {
  if (!canvas) return;
  const setup = setupHiDPICanvas(canvas);
  if (!setup) return;
  const { ctx, width: w, height: h } = setup;
  ctx.clearRect(0, 0, w, h);

  const axisX = w / 2;
  const margin = 52;
  const topY = margin;
  const botY = h - margin;
  const midY = (topY + botY) / 2;

  const fgrd = ctx.createLinearGradient(axisX - 28, 0, axisX + 28, 0);
  fgrd.addColorStop(0, 'transparent');
  fgrd.addColorStop(0.5, isDark ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.018)');
  fgrd.addColorStop(1, 'transparent');
  ctx.fillStyle = fgrd;
  ctx.fillRect(axisX - 28, topY, 56, botY - topY);

  ctx.save();
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.055)';
  ctx.lineWidth = 1;
  for (let y = topY + 14; y < botY - 4; y += 16) {
    ctx.beginPath();
    ctx.moveTo(axisX - 24, y);
    ctx.lineTo(axisX + 24, y + 16);
    ctx.stroke();
  }
  ctx.restore();

  ctx.font = `9px 'Space Grotesk', sans-serif`;
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.60)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('forbidden', axisX, midY - 8);
  ctx.fillText('zone', axisX, midY + 8);

  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.24)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(axisX, topY - 14);
  ctx.lineTo(axisX, botY + 14);
  ctx.stroke();

  [
    { y: topY, ket: '|1⟩' },
    { y: botY, ket: '|0⟩' },
  ].forEach(({ y, ket }) => {
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(axisX - 10, y);
    ctx.lineTo(axisX + 10, y);
    ctx.stroke();
    ctx.font = `13px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.48)' : 'rgba(0,0,0,0.42)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(ket, axisX + 16, y);
  });

  const stateY = state === 1 ? topY : botY;
  ctx.beginPath();
  ctx.arc(axisX, stateY, 13, 0, 2 * Math.PI);
  ctx.fillStyle = isDark ? '#EFEFEF' : '#0B0B0B';
  ctx.fill();

  ctx.font = `bold 12px 'JetBrains Mono', monospace`;
  ctx.fillStyle = isDark ? '#0B0B0B' : '#EFEFEF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(state), axisX, stateY);
}

function drawQuantumSV(canvas: HTMLCanvasElement | null, theta: number, isDark: boolean) {
  if (!canvas) return;
  const setup = setupHiDPICanvas(canvas);
  if (!setup) return;
  const { ctx, width: w, height: h } = setup;
  ctx.clearRect(0, 0, w, h);

  const margin = 52;
  const originX = margin;
  const originY = h - margin;
  const size = Math.min(w - margin * 1.7, h - margin * 1.7);

  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);
  const tipX = originX + alpha * size;
  const tipY = originY - beta * size;

  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(originX, originY, size, -Math.PI / 2, 0, false);
  ctx.stroke();
  ctx.setLineDash([]);

  const axCol = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  ctx.strokeStyle = axCol;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(originX - 8, originY);
  ctx.lineTo(originX + size + 24, originY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(originX, originY + 8);
  ctx.lineTo(originX, originY - size - 24);
  ctx.stroke();

  const ah = 7;
  ctx.fillStyle = axCol;
  ctx.beginPath();
  ctx.moveTo(originX + size + 24, originY);
  ctx.lineTo(originX + size + 24 - ah, originY - 4);
  ctx.lineTo(originX + size + 24 - ah, originY + 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(originX, originY - size - 24);
  ctx.lineTo(originX - 4, originY - size - 24 + ah);
  ctx.lineTo(originX + 4, originY - size - 24 + ah);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = axCol;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(originX + size, originY - 5);
  ctx.lineTo(originX + size, originY + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(originX - 5, originY - size);
  ctx.lineTo(originX + 5, originY - size);
  ctx.stroke();

  ctx.font = `13px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = BLOCH_COLORS.axisZ || (isDark ? '#fff' : '#000');
  ctx.fillText('|0⟩', originX + size + 28, originY + 18);
  ctx.textBaseline = 'top';
  ctx.fillText('|1⟩', originX, originY - size - 28);

  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.13)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX, originY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(originX, tipY);
  ctx.stroke();
  ctx.setLineDash([]);

  const pdot = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.28)';
  ctx.fillStyle = pdot;
  ctx.beginPath();
  ctx.arc(tipX, originY, 3, 0, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(originX, tipY, 3, 0, 2 * Math.PI);
  ctx.fill();

  if (alpha > 0.06) {
    ctx.font = `11px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? '#5B8DEF' : '#0033A0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`α=${round2(alpha)}`, tipX, originY + 8);
  }
  if (beta > 0.06) {
    ctx.font = `11px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? '#F472B6' : '#BE185D';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`β=${round2(beta)}`, originX - 8, tipY);
  }

  if (theta > 0.05) {
    const arcR = 34;
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.26)' : 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(originX, originY, arcR, -Math.PI / 2, -(Math.PI / 2 - theta / 2), false);
    ctx.stroke();
    const midAng = -Math.PI / 2 + theta / 4;
    ctx.font = `10px 'JetBrains Mono', monospace`;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.34)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lr = arcR + 14;
    ctx.fillText('θ/2', originX + lr * Math.cos(midAng), originY + lr * Math.sin(midAng));
  }

  const arrowColor = BLOCH_COLORS.arrow || (isDark ? '#fff' : '#000');
  const tipColor = BLOCH_COLORS.tip || arrowColor;
  ctx.save();
  if (isDark) {
    ctx.shadowBlur = 14;
    ctx.shadowColor = arrowColor;
  }
  ctx.strokeStyle = arrowColor;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  const ang = Math.atan2(tipY - originY, tipX - originX);
  const as = 10;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - as * Math.cos(ang - 0.4), tipY - as * Math.sin(ang - 0.4));
  ctx.lineTo(tipX - as * Math.cos(ang + 0.4), tipY - as * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fillStyle = arrowColor;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(tipX, tipY, 5, 0, 2 * Math.PI);
  ctx.fillStyle = tipColor;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(originX, originY, 3.5, 0, 2 * Math.PI);
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.38)';
  ctx.fill();
}

export default function MathsconceptTab() {
  const { t } = useI18n();
  const nav = useNav();
  const { isDark } = useTheme();
  const isActive = nav.mode === 'sim' && nav.tab === 'mathsconcept';
  const section: MathsSection = nav.sub.mathsconcept?.mathsSection || 'complex';

  const [svMode, setSvMode] = useState<'classical' | 'quantum'>('quantum');
  const [classicalSVState, setClassicalSVState] = useState(1);
  const [svThetaRaw, setSvThetaRaw] = useState(0);

  const classicalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const quantumCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const svTheta = svThetaRaw / 1000;
  const alpha = Math.cos(svTheta / 2);
  const beta = Math.sin(svTheta / 2);
  const p0 = alpha * alpha * 100;
  const p1 = beta * beta * 100;

  useEffect(() => {
    const incomingSvMode = nav.sub.mathsconcept?.statevecMode;
    if (incomingSvMode) setSvMode(incomingSvMode);
  }, [nav.sub.mathsconcept?.statevecMode]);

  useEffect(() => {
    drawClassicalSV(classicalCanvasRef.current, classicalSVState, isDark);
    drawQuantumSV(quantumCanvasRef.current, svTheta, isDark);
  }, [classicalSVState, svTheta, isDark, section, svMode, isActive]);

  return (
    <section
      id="tab-mathsconcept"
      className={`tab-content${isActive ? ' active' : ''}`}
      style={{ display: nav.mode === 'sim' ? undefined : 'none' }}
    >
      <div className="compare-header">
        <h1 className="compare-title">{t('maths.title', 'Maths Concept')}</h1>
        <p className="compare-subtitle">
          {t(
            'maths.subtitle',
            'The mathematical language behind qubits — complex numbers, vectors, matrices, state vectors, Dirac notation, and tensor products.'
          )}
        </p>
      </div>
      <div className="intro-layout">
        <div className="maths-panel" id="maths-complex" style={{ display: section === 'complex' ? undefined : 'none' }}>
          <div className="card">
            <div className="card-title">{t('mathsTab.complexNumbers', 'Complex Numbers')}</div>
            <p className="bit-explainer">
              {t(
                'maths.complexBody1',
                "A qubit's amplitudes aren't plain real numbers — they're complex numbers, each with a real part and an imaginary part. That extra dimension is what makes phase (and interference) possible."
              )}
            </p>
            <div
              className="formula"
              style={{ marginTop: '12px' }}
              dangerouslySetInnerHTML={{ __html: t('maths.complexFormula1', 'z = a + bi, i² = −1') }}
            />
            <div className="formula">{t('maths.complexFormula2', 'Modulus: |z| = √(a² + b²)')}</div>
            <div
              className="formula"
              dangerouslySetInnerHTML={{
                __html: t('maths.complexFormula3', 'Polar form: z = r·e<sup>iθ</sup> = r(cos θ + i sin θ)'),
              }}
            />
            <p className="bit-explainer" style={{ marginTop: '12px' }}>
              {t(
                'maths.complexBody2',
                'A qubit state α|0⟩ + β|1⟩ has complex amplitudes α, β. Only their squared moduli |α|², |β|² are directly observable (as measurement probabilities) — the relative phase between them is invisible to a single measurement but drives interference.'
              )}
            </p>
          </div>
          <LessonEmbed id="maths-complex" />
        </div>
        <div className="maths-panel" id="maths-vectors" style={{ display: section === 'vectors' ? undefined : 'none' }}>
          <div className="card">
            <div className="card-title">{t('mathsTab.vectors', 'Vectors')}</div>
            <p className="bit-explainer">
              {t(
                'maths.vectorsBody1',
                "A qubit's state is a vector in a 2-dimensional complex vector space, written as a column of its two amplitudes."
              )}
            </p>
            <div
              className="formula"
              style={{ marginTop: '12px' }}
              dangerouslySetInnerHTML={{
                __html: t('maths.vectorsFormula1', '|0⟩ = [1, 0]<sup>T</sup> |1⟩ = [0, 1]<sup>T</sup>'),
              }}
            />
            <div
              className="formula"
              dangerouslySetInnerHTML={{
                __html: t('maths.vectorsFormula2', '|ψ⟩ = α|0⟩ + β|1⟩ = [α, β]<sup>T</sup>'),
              }}
            />
            <div className="formula">{t('maths.vectorsFormula3', 'Normalization: |α|² + |β|² = 1')}</div>
            <div
              className="formula"
              dangerouslySetInnerHTML={{
                __html: t('maths.vectorsFormula4', 'Inner product: ⟨φ|ψ⟩ = φ<sub>0</sub>*ψ<sub>0</sub> + φ<sub>1</sub>*ψ<sub>1</sub>'),
              }}
            />
            <p className="bit-explainer" style={{ marginTop: '12px' }}>
              {t(
                'maths.vectorsBody2',
                "Normalization keeps total probability at 100% — it's why every point you can drag to on the Bloch sphere is automatically a valid state. The inner product measures how much two states overlap; orthogonal states (like |0⟩ and |1⟩) have inner product 0."
              )}
            </p>
          </div>
          <LessonEmbed id="maths-vectors" />
        </div>
        <div className="maths-panel" id="maths-matrices" style={{ display: section === 'matrices' ? undefined : 'none' }}>
          <div className="card">
            <div className="card-title">{t('mathsTab.matrices', 'Matrices')}</div>
            <p className="bit-explainer">
              {t(
                'maths.matricesBody1',
                'Every quantum gate is a matrix. Applying a gate to a qubit is just matrix-vector multiplication — the gate matrix times the state vector gives the new state vector.'
              )}
            </p>
            <div className="formula" style={{ marginTop: '12px' }}>
              {t('maths.matricesFormula1', 'Pauli-X = [[0, 1], [1, 0]]')}
            </div>
            <div
              className="formula"
              dangerouslySetInnerHTML={{
                __html: t('maths.matricesFormula2', 'X|0⟩ = [[0,1],[1,0]]·[1,0]<sup>T</sup> = [0,1]<sup>T</sup> = |1⟩'),
              }}
            />
            <div className="formula">{t('maths.matricesFormula3', 'Unitary condition: U†U = I')}</div>
            <p className="bit-explainer" style={{ marginTop: '12px' }}>
              {t(
                'maths.matricesBody2',
                '"Unitary" is the constraint every quantum gate must satisfy — U† (the conjugate transpose) undoes U exactly. It\'s what guarantees a gate never destroys or creates probability: the output state is always normalized whenever the input was.'
              )}
            </p>
          </div>
          <LessonEmbed id="maths-matrices" />
        </div>
        <div className="maths-panel" id="maths-statevector" style={{ display: section === 'statevector' ? undefined : 'none' }}>
          <div className="card">
            <div className="card-title">{t('mathsTab.stateVector', 'State Vector')}</div>
            <p className="bit-explainer">
              {t(
                'maths.svBody1',
                'The state vector |ψ⟩ is the complete description of a qubit — everything you can ever predict about it (measurement odds, how it responds to a gate) is computed from these two amplitudes.'
              )}
            </p>
            <div className="formula" style={{ marginTop: '12px' }}>
              {t('maths.svFormula1', '|ψ⟩ = α|0⟩ + β|1⟩')}
            </div>
            <div
              className="formula"
              dangerouslySetInnerHTML={{
                __html: t('maths.svFormula2', 'Bloch form: |ψ⟩ = cos(θ/2)|0⟩ + e<sup>iφ</sup>sin(θ/2)|1⟩'),
              }}
            />
            <div
              className="formula"
              dangerouslySetInnerHTML={{
                __html: t('maths.svFormula3', 'P(0) = |α|² P(1) = |β|²'),
              }}
            />
            <p className="bit-explainer" style={{ marginTop: '12px' }}>
              {t(
                'maths.svBody2',
                'θ and φ are exactly the two sliders on the Bits & Qubits Bloch sphere — every state vector corresponds to one point on that sphere, and vice versa.'
              )}
            </p>
          </div>
          <div className="card mt-14">
            <div className="card-title">{t('maths.compareStateSpaces', 'Compare the State Spaces')}</div>
            <p className="bit-explainer">
              {t('maths.compareStateSpacesBody', 'A classical bit is a point on a line; a qubit is a vector tip on a unit arc — pick a view below.')}
            </p>
            <div className="mode-grid" style={{ gridTemplateColumns: '1fr 1fr', maxWidth: '320px', margin: '14px auto 18px' }}>
              <button
                className={`preset-btn mode-btn${svMode === 'classical' ? ' active' : ''}`}
                data-statevec-mode="classical"
                onClick={() => setSvMode('classical')}
              >
                {t('common.classical', 'Classical')}
              </button>
              <button
                className={`preset-btn mode-btn${svMode === 'quantum' ? ' active' : ''}`}
                data-statevec-mode="quantum"
                onClick={() => setSvMode('quantum')}
              >
                {t('common.quantum', 'Quantum')}
              </button>
            </div>
            <div id="statevec-classical-panel" style={{ display: svMode === 'classical' ? undefined : 'none' }}>
              <div className="compare-layout" style={{ gridTemplateColumns: '1fr', justifyItems: 'center' }}>
                <div className="compare-col classical-col">
                  <div className="col-label">
                    <span className="col-badge">{t('common.classical', 'Classical')}</span>
                    <span className="col-desc">{t('maths.svClassicalDesc', 'Two discrete endpoints only')}</span>
                  </div>
                  <div className="sv-canvas-wrap">
                    <canvas
                      id="sv-classical"
                      ref={classicalCanvasRef}
                      width={220}
                      height={300}
                      role="img"
                      aria-label="Diagram of a classical bit's state space: a vertical line with only two valid points, |0⟩ at the bottom and |1⟩ at the top, and a forbidden zone between them."
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
                    <button
                      className="btn-measure"
                      id="btn-toggle-classical-sv"
                      onClick={() => setClassicalSVState((s) => 1 - s)}
                    >
                      {t('maths.toggleBit', 'Toggle bit')}
                    </button>
                  </div>
                  <div className="card">
                    <div className="card-title">{t('maths.currentState', 'Current State')}</div>
                    <div className="formula" id="sv-classical-formula">
                      State = |{classicalSVState}⟩
                    </div>
                  </div>
                  <div className="card" style={{ marginTop: '10px' }}>
                    <div className="card-title">{t('maths.stateSpace', 'State Space')}</div>
                    <p className="bit-explainer">
                      {t(
                        'maths.stateSpaceBody',
                        'Only the two endpoints |0⟩ and |1⟩ are valid. The region between is physically forbidden — there is no "47% |1⟩" for a classical bit.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div id="statevec-quantum-panel" style={{ display: svMode === 'quantum' ? undefined : 'none' }}>
              <div className="compare-layout" style={{ gridTemplateColumns: '1fr', justifyItems: 'center' }}>
                <div className="compare-col quantum-col">
                  <div className="col-label">
                    <span className="col-badge quantum-badge">{t('common.quantum', 'Quantum')}</span>
                    <span className="col-desc">{t('maths.svQuantumDesc', 'Any point on the unit arc')}</span>
                  </div>
                  <div className="sv-canvas-wrap">
                    <canvas
                      id="sv-quantum"
                      ref={quantumCanvasRef}
                      width={300}
                      height={300}
                      role="img"
                      aria-label="Diagram of a qubit's state space: a 2D plane with a quarter-circle arc from |0⟩ to |1⟩, and a vector whose tip traces every valid superposition as theta changes."
                    />
                  </div>
                  <div className="slider-group" style={{ margin: '14px 0 10px' }}>
                    <div className="slider-row">
                      <span className="slider-sym">θ</span>
                      <input
                        type="range"
                        id="sv-theta-slider"
                        min="0"
                        max="3141"
                        value={svThetaRaw}
                        onChange={(e) => setSvThetaRaw(parseInt(e.target.value, 10))}
                      />
                      <span className="slider-val" id="sv-theta-val">
                        {Math.round((svTheta * 180) / Math.PI)}°
                      </span>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-title">{t('common.stateVector', 'State Vector')}</div>
                    <div className="formula" id="sv-quantum-formula">
                      |ψ⟩ = {round2(alpha)}|0⟩ + {round2(beta)}|1⟩
                    </div>
                    <div className="prob-rows" style={{ marginTop: '10px' }}>
                      <div className="prob-row">
                        <span className="ket zero-color">|0⟩</span>
                        <div className="track">
                          <div className="fill zero-fill" id="sv-fill0" style={{ width: `${p0}%` }} />
                        </div>
                        <span className="pct" id="sv-pct0">
                          {Math.round(p0)}%
                        </span>
                      </div>
                      <div className="prob-row">
                        <span className="ket one-color">|1⟩</span>
                        <div className="track">
                          <div className="fill one-fill" id="sv-fill1" style={{ width: `${p1}%` }} />
                        </div>
                        <span className="pct" id="sv-pct1">
                          {Math.round(p1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="card" style={{ marginTop: '10px' }}>
                    <div className="card-title">{t('maths.keyInsight', 'Key Insight')}</div>
                    <p className="bit-explainer">
                      {t(
                        'maths.keyInsightBody',
                        'The tip of the state vector must sit on the unit arc (α² + β² = 1). Every point on that arc is a distinct, valid quantum state. The classical bit only ever occupies the two corners.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <LessonEmbed id="maths-statevector" />
        </div>
        <div className="maths-panel" id="maths-dirac" style={{ display: section === 'dirac' ? undefined : 'none' }}>
          <div className="card">
            <div className="card-title">{t('mathsTab.diracNotation', 'Dirac Notation')}</div>
            <p className="bit-explainer">
              {t(
                'maths.diracBody1',
                'The |·⟩ and ⟨·| symbols used everywhere in this app are Dirac\'s "bra-ket" notation — a compact shorthand for vectors and their inner products.'
              )}
            </p>
            <div className="formula" style={{ marginTop: '12px' }}>
              {t('maths.diracFormula1', 'Ket: |ψ⟩ — a column vector (a state)')}
            </div>
            <div className="formula">{t('maths.diracFormula2', 'Bra: ⟨ψ| — the conjugate-transpose row vector')}</div>
            <div className="formula">{t('maths.diracFormula3', 'Bra-ket: ⟨φ|ψ⟩ — an inner product (a number)')}</div>
            <div
              className="formula"
              dangerouslySetInnerHTML={{
                __html: t('maths.diracFormula4', '⟨0|0⟩ = 1 ⟨0|1⟩ = 0 ⟨1|1⟩ = 1'),
              }}
            />
            <div className="formula">{t('maths.diracFormula5', 'Ket-bra: |ψ⟩⟨φ| — an outer product (a matrix/operator)')}</div>
            <p className="bit-explainer" style={{ marginTop: '12px' }}>
              {t(
                'maths.diracBody2',
                '|0⟩ and |1⟩ are orthonormal — each has unit length and zero overlap with the other — which is exactly why measuring always returns a clean 0 or 1, never something in between.'
              )}
            </p>
          </div>
          <LessonEmbed id="maths-dirac" />
        </div>
        <div className="maths-panel" id="maths-tensor" style={{ display: section === 'tensor' ? undefined : 'none' }}>
          <div className="card">
            <div className="card-title">{t('mathsTab.tensorProducts', 'Tensor Products')}</div>
            <p className="bit-explainer">
              {t(
                'maths.tensorBody1',
                'The tensor product (⊗) is how two independent vector spaces combine into one larger joint space — stack every entry of the first vector against every entry of the second, multiplying each pair. An n-dimensional vector combined with an m-dimensional one produces an n×m-dimensional vector.'
              )}
            </p>
            <div
              className="formula"
              style={{ marginTop: '12px' }}
              dangerouslySetInnerHTML={{
                __html: t('maths.tensorFormula1', '[a, b]<sup>T</sup> ⊗ [c, d]<sup>T</sup> = [ac, ad, bc, bd]<sup>T</sup>'),
              }}
            />
            <p className="bit-explainer" style={{ marginTop: '12px' }}>
              {t(
                'maths.tensorBody2',
                'Two independent qubits combine exactly this way: each is a 2-entry vector, so their joint state is a 4-entry vector — one entry for each combination of basis states, |00⟩, |01⟩, |10⟩, |11⟩.'
              )}
            </p>
            <div
              className="formula"
              dangerouslySetInnerHTML={{
                __html: t('maths.tensorFormula2', '|0⟩⊗|0⟩ = [1,0]<sup>T</sup>⊗[1,0]<sup>T</sup> = [1,0,0,0]<sup>T</sup> = |00⟩'),
              }}
            />
            <p className="bit-explainer" style={{ marginTop: '12px' }}>
              {t(
                'maths.tensorBody3',
                "Every state built by tensoring two single-qubit states can always be factored back apart into those same two qubits. Not every 4-entry vector can be factored that way, though — a joint state that can't be split back into a tensor product of two single-qubit states is exactly what's called entangled, explored hands-on on the Entangle tab."
              )}
            </p>
          </div>
          <LessonEmbed id="maths-tensor" />
        </div>
      </div>
    </section>
  );
}
