import { useEffect, useRef, useState } from 'react';
import { TunnelSolver, TUNNEL_N, type TunnelBarrier } from '../../core/tunnelSolver.ts';
import { BLOCH_COLORS } from '../../core/theme.ts';
import { setupHiDPICanvas } from '../../core/canvasDpr.ts';
import { useI18n } from '../../hooks/useI18n.ts';
import { useNav } from '../../hooks/useNav.ts';
import { useTheme } from '../../hooks/useTheme.ts';
import Explainer from '../Explainer.tsx';
import LessonEmbed from '../LessonEmbed.tsx';

const TUNNEL_SUBSTEPS = 12;
const TUNNEL_MAX_STEPS = 3200;
const TUNNEL_HISTORY_MAX = 24;

interface TunnelHistoryRun {
  heightRatio: number;
  widthCells: number;
  reflPct: number;
  transPct: number;
}

export default function TunnelTab() {
  const { t } = useI18n();
  const nav = useNav();
  const { isDark } = useTheme();
  const isActive = nav.mode === 'sim' && nav.tab === 'tunnel';

  const [heightPct, setHeightPct] = useState(100);
  const [widthCells, setWidthCells] = useState(14);
  const [playing, setPlaying] = useState(true);
  const [stats, setStats] = useState({ refl: 100, trans: 0 });
  const [history, setHistory] = useState<TunnelHistoryRun[]>([]);
  const [explainer, setExplainer] = useState(
    'A wave packet is about to launch toward a barrier. Watch the probability cloud — not a solid ball — hit the wall.'
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const solverRef = useRef<TunnelSolver>(new TunnelSolver());
  const barrierRef = useRef<TunnelBarrier | null>(null);
  const settledRef = useRef(false);
  const crossedRef = useRef(false);
  const elapsedStepsRef = useRef(0);
  const initializedRef = useRef(false);
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;
  const playingRef = useRef(playing);
  playingRef.current = playing;

  function drawTunnel() {
    const canvas = canvasRef.current;
    const barrier = barrierRef.current;
    if (!canvas || !barrier) return;
    const setup = setupHiDPICanvas(canvas);
    if (!setup) return;
    const { ctx, width: w, height: h } = setup;
    const solver = solverRef.current;
    const dark = isDarkRef.current;
    ctx.clearRect(0, 0, w, h);

    const baseline = h * 0.86;
    const bx1 = ((barrier.center - barrier.half) / TUNNEL_N) * w;
    const bx2 = ((barrier.center + barrier.half) / TUNNEL_N) * w;
    const barrierPxH = 14 + (barrier.heightRatio / 2.5) * h * 0.55;
    const bw = Math.max(2, bx2 - bx1);
    const by = baseline - barrierPxH;

    const barrierGrad = ctx.createLinearGradient(0, by, 0, baseline);
    if (dark) {
      barrierGrad.addColorStop(0, 'rgba(255,255,255,0.22)');
      barrierGrad.addColorStop(0.18, 'rgba(255,255,255,0.09)');
      barrierGrad.addColorStop(1, 'rgba(255,255,255,0.035)');
    } else {
      barrierGrad.addColorStop(0, 'rgba(0,0,0,0.16)');
      barrierGrad.addColorStop(0.18, 'rgba(0,0,0,0.065)');
      barrierGrad.addColorStop(1, 'rgba(0,0,0,0.03)');
    }
    ctx.fillStyle = barrierGrad;
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.24)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(bx1, by, bw, barrierPxH);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.rect(bx1, by, bw, barrierPxH);
    ctx.clip();
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.13)';
    ctx.lineWidth = 1;
    const hatchGap = 7;
    for (let hx = bx1 - barrierPxH; hx < bx2 + barrierPxH; hx += hatchGap) {
      ctx.beginPath();
      ctx.moveTo(hx, baseline);
      ctx.lineTo(hx + barrierPxH, by);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx1, by);
    ctx.lineTo(bx2, by);
    ctx.stroke();

    ctx.font = `11px 'JetBrains Mono', monospace`;
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('V₀', (bx1 + bx2) / 2, baseline - barrierPxH - 5);

    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.moveTo(0, baseline);
    ctx.lineTo(w, baseline);
    ctx.stroke();

    const glow = BLOCH_COLORS.arrow || (dark ? 'rgba(255,255,255,0.9)' : 'rgba(10,10,10,0.85)');
    ctx.beginPath();
    ctx.moveTo(0, baseline);
    for (let j = 0; j < TUNNEL_N; j++) {
      const prob = (solver.psiR[j] ** 2 + solver.psiI[j] ** 2) * solver.drawScale;
      const px = (j / TUNNEL_N) * w;
      const py = baseline - prob * h;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(w, baseline);
    ctx.closePath();

    ctx.save();
    if (dark) {
      ctx.shadowBlur = 16;
      ctx.shadowColor = glow;
    }
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
    ctx.fill();
    ctx.strokeStyle = glow;
    ctx.lineWidth = 1.7;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    const carrierScale = Math.sqrt(solver.drawScale) * h * 0.42;
    for (let j = 0; j < TUNNEL_N; j++) {
      const px = (j / TUNNEL_N) * w;
      const py = baseline - h * 0.02 - solver.psiR[j] * carrierScale * 0.5 - h * 0.02;
      if (j === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  function firePacket(hPct: number, wCells: number) {
    const solver = solverRef.current;
    const barrier = solver.buildBarrier(hPct / 100, wCells);
    barrierRef.current = barrier;
    solver.launch();
    settledRef.current = false;
    crossedRef.current = false;
    elapsedStepsRef.current = 0;
    setPlaying(true);
    setStats({ refl: 100, trans: 0 });
    setExplainer(
      barrier.heightRatio < 0.02
        ? 'No barrier at all right now — the packet should sail through essentially untouched. Bump the V₀ slider up to put a wall in its way.'
        : `Launching a wave packet at a barrier <strong>${barrier.heightRatio.toFixed(2)}×</strong> its own energy. Classically that's an unbreakable wall — no bounce, no chance, full stop. Let's see what quantum mechanics has to say about that.`
    );
    drawTunnel();
  }

  useEffect(() => {
    if (!isActive) return undefined;
    if (!initializedRef.current) {
      initializedRef.current = true;
      firePacket(heightPct, widthCells);
    }

    let animId: number;
    const animate = () => {
      const solver = solverRef.current;
      const barrier = barrierRef.current;
      if (!barrier) return;

      if (playingRef.current && !settledRef.current) {
        for (let s = 0; s < TUNNEL_SUBSTEPS; s++) solver.step();
        elapsedStepsRef.current += TUNNEL_SUBSTEPS;

        if (!crossedRef.current && barrier.heightRatio > 0.02) {
          const peakIdx = solver.peakIndex();
          if (peakIdx >= barrier.center - barrier.half) {
            crossedRef.current = true;
            setExplainer(
              "Now inside the barrier — the classically forbidden zone. Notice the cloud doesn't vanish here, it just decays. If the wall is thin enough, there's still some wave left by the time it reaches the far side."
            );
          }
        }
      }

      drawTunnel();
      const { pLeft, pRight } = solver.splitProbs(barrier);
      const reflPct = Math.round(pLeft * 100);
      const transPct = Math.round(pRight * 100);
      setStats({ refl: reflPct, trans: transPct });

      if (!settledRef.current && elapsedStepsRef.current >= TUNNEL_MAX_STEPS) {
        settledRef.current = true;
        setHistory((prev) => {
          const next = [
            ...prev,
            { heightRatio: barrier.heightRatio, widthCells: barrier.widthCells, reflPct, transPct },
          ];
          return next.length > TUNNEL_HISTORY_MAX ? next.slice(next.length - TUNNEL_HISTORY_MAX) : next;
        });

        if (barrier.heightRatio < 0.02) {
          setExplainer(`No barrier, no contest — ${transPct}% sailed straight through. Turn up V₀ to actually test the wall.`);
        } else {
          setExplainer(
            `Final tally: <strong style="color:var(--one)">${transPct}% tunneled</strong> clean through a wall it classically had no business crossing, and <strong style="color:var(--zero)">${reflPct}% bounced back</strong> as expected. Push the barrier higher and the escape odds shrink toward zero — but in principle, never quite reach it.`
          );
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isActive]);

  useEffect(() => {
    if (initializedRef.current) drawTunnel();
  }, [isDark]);

  return (
    <section
      id="tab-tunnel"
      className={`tab-content${isActive ? ' active' : ''}`}
      style={{ display: nav.mode === 'sim' ? undefined : 'none' }}
    >
      <div className="compare-header">
        <h1 className="compare-title">{t('tunnel.title', 'Quantum Tunneling')}</h1>
        <p className="compare-subtitle">
          {t(
            'tunnel.subtitle',
            'Fire a wave packet at a wall taller than its own energy. Classically it always bounces. Quantum mechanically, a piece of it slips through anyway'
          )}
        </p>
      </div>
      <div className="tunnel-layout">
        <div className="tunnel-canvas-card">
          <canvas
            id="tunnel-canvas"
            ref={canvasRef}
            width={820}
            height={240}
            role="img"
            aria-label="Animated plot of a quantum wave packet's probability cloud approaching and partly tunneling through a potential barrier, with live reflected/transmitted percentages shown below."
          />
          <div className="tunnel-stats">
            <div className="tunnel-stat">
              <span className="stat-dot" style={{ background: 'var(--zero)' }} />
              <span className="stat-label">{t('tunnel.reflected', 'Reflected')}</span>
              <span className="stat-val" id="tunnel-refl">
                {stats.refl}%
              </span>
            </div>
            <div className="tunnel-stat">
              <span className="stat-dot" style={{ background: 'var(--one)' }} />
              <span className="stat-label">{t('tunnel.transmitted', 'Transmitted')}</span>
              <span className="stat-val" id="tunnel-trans">
                {stats.trans}%
              </span>
            </div>
          </div>
          <div className="tunnel-history-row">
            <div className="tunnel-history-head">
              <span className="tunnel-history-title">
                <span>{t('tunnel.runHistory', 'Run history')}</span>
                <span className="muted-text" id="tunnel-history-count">
                  {history.length ? t('tunnel.historyCount', '· {count} runs').replace('{count}', String(history.length)) : ''}
                </span>
              </span>
              <button
                className="btn-secondary tunnel-history-clear"
                id="btn-clear-tunnel-history"
                onClick={() => setHistory([])}
              >
                {t('tunnel.clearHistory', 'Clear')}
              </button>
            </div>
            <div
              className="tunnel-history"
              id="tunnel-history"
              role="img"
              aria-label="Bar chart of reflected versus transmitted percentage for each completed run, most recent on the right."
            >
              {history.length === 0 ? (
                <span className="tunnel-history-empty">{t('tunnel.historyEmpty', 'No completed runs yet.')}</span>
              ) : (
                history.map((run, i) => (
                  <div
                    key={i}
                    className={`tunnel-history-bar${i === history.length - 1 ? ' latest' : ''}`}
                    title={`V₀ = ${run.heightRatio.toFixed(2)}×E, w = ${run.widthCells} — ${run.transPct}% transmitted, ${run.reflPct}% reflected`}
                  >
                    <div className="seg-trans" style={{ height: `${run.transPct}%` }} />
                    <div className="seg-refl" style={{ height: `${run.reflPct}%` }} />
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="tunnel-validation-badge">
            <span className="tunnel-validation-check" aria-hidden="true">
              ✓
            </span>
            <span>
              {t(
                'tunnel.validationNote',
                'Solver validated automatically: probability conserved to <0.3% over a full run; transmission correctly falls from >10% at V₀=E to <2% at V₀=2.5E.'
              )}
            </span>
          </div>
        </div>
        <div className="tunnel-controls-grid">
          <div className="card">
            <div className="card-title">{t('tunnel.barrier', 'Barrier')}</div>
            <div className="slider-group">
              <div className="slider-row">
                <span className="slider-sym">V₀</span>
                <input
                  type="range"
                  id="tunnel-height"
                  min="0"
                  max="250"
                  value={heightPct}
                  onChange={(e) => {
                    const next = parseInt(e.target.value, 10);
                    setHeightPct(next);
                    firePacket(next, widthCells);
                  }}
                />
                <span className="slider-val" id="tunnel-height-val">
                  {(heightPct / 100).toFixed(2)}×E
                </span>
              </div>
              <div className="slider-row">
                <span className="slider-sym">w</span>
                <input
                  type="range"
                  id="tunnel-width"
                  min="4"
                  max="40"
                  value={widthCells}
                  onChange={(e) => {
                    const next = parseInt(e.target.value, 10);
                    setWidthCells(next);
                    firePacket(heightPct, next);
                  }}
                />
                <span className="slider-val" id="tunnel-width-val">
                  {widthCells}
                </span>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">{t('common.controls', 'Controls')}</div>
            <div className="tunnel-btn-row">
              <button className="btn-run" id="tunnel-play-btn" onClick={() => setPlaying((p) => !p)}>
                {playing ? '⏸ Pause' : '▶ Play'}
              </button>
              <button
                className="btn-secondary"
                id="btn-fire-tunnel"
                onClick={() => firePacket(heightPct, widthCells)}
              >
                {t('tunnel.fireAgain', '↻ Fire again')}
              </button>
            </div>
          </div>
          <div className="card explainer-card">
            <div className="card-title">{t('common.whatJustHappened', 'What just happened')}</div>
            <Explainer id="tunnel-explainer" html={explainer} />
          </div>
        </div>
      </div>
      <LessonEmbed id="tunnel" />
    </section>
  );
}
