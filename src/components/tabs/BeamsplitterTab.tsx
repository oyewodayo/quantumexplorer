import { useEffect, useRef, useState } from 'react';
import { pulseElement } from '../../core/pulse.ts';
import { useI18n } from '../../hooks/useI18n.ts';
import { useNav } from '../../hooks/useNav.ts';
import Explainer from '../Explainer.tsx';
import LessonEmbed from '../LessonEmbed.tsx';

const BS_SOURCE = { x: 115, y: 280 };
const BS_SPLIT  = { x: 380, y: 280 };
const BS_DET_A  = { x: 380, y: 82  };
const BS_DET_B  = { x: 587, y: 280 };
const BS_MARK_MAX = 140;

interface ScreenMark {
  id: number;
  cx: number;
  cy: number;
  r: number;
  opacity: number;
}

function bsJitter(spread: number): number {
  return ((Math.random() + Math.random() + Math.random()) / 3 - 0.5) * 2 * spread;
}

function bsLerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function bsAnimateMove(
  el: SVGGElement | null,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  op0: number,
  op1: number,
  duration: number,
  cb: () => void
) {
  if (!el) {
    cb();
    return;
  }
  const start = performance.now();
  function step(now: number) {
    if (!el) return;
    const t = Math.min(1, (now - start) / duration);
    el.setAttribute('transform', `translate(${bsLerp(x0, x1, t)},${bsLerp(y0, y1, t)})`);
    el.setAttribute('opacity', String(bsLerp(op0, op1, t)));
    if (t < 1) requestAnimationFrame(step);
    else cb();
  }
  requestAnimationFrame(step);
}

export default function BeamsplitterTab() {
  const { t } = useI18n();
  const nav = useNav();
  const isActive = nav.mode === 'sim' && nav.tab === 'beamsplitter';

  const [countA, setCountA] = useState(0);
  const [countB, setCountB] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [resultText, setResultText] = useState('—');
  const [marksA, setMarksA] = useState<ScreenMark[]>([]);
  const [marksB, setMarksB] = useState<ScreenMark[]>([]);
  const [explainer, setExplainer] = useState(
    'A photon is about to launch toward the beam splitter. Fire it and watch which detector clicks.'
  );

  const photonRef = useRef<SVGGElement | null>(null);
  const ghostRef = useRef<SVGGElement | null>(null);
  const pingARef = useRef<SVGCircleElement | null>(null);
  const pingBRef = useRef<SVGCircleElement | null>(null);
  const flashARef = useRef<SVGRectElement | null>(null);
  const flashBRef = useRef<SVGRectElement | null>(null);
  const markIdRef = useRef(0);

  useEffect(() => {
    if (isActive) {
      photonRef.current?.setAttribute('opacity', '0');
      ghostRef.current?.setAttribute('opacity', '0');
      setAnimating(false);
    }
  }, [isActive]);

  function addScreenMark(isA: boolean) {
    const center = isA ? BS_DET_A : BS_DET_B;
    const mark: ScreenMark = {
      id: ++markIdRef.current,
      cx: center.x + bsJitter(24),
      cy: center.y + bsJitter(18),
      r: 1.5 + Math.random() * 1.2,
      opacity: 0.4 + Math.random() * 0.25,
    };
    if (isA) {
      setMarksA((prev) => (prev.length >= BS_MARK_MAX ? [...prev.slice(1), mark] : [...prev, mark]));
    } else {
      setMarksB((prev) => (prev.length >= BS_MARK_MAX ? [...prev.slice(1), mark] : [...prev, mark]));
    }
  }

  function firePhoton() {
    if (animating) return;
    setAnimating(true);
    setResultText('traveling…');

    const photon = photonRef.current;
    const ghost = ghostRef.current;

    bsAnimateMove(photon, BS_SOURCE.x, BS_SOURCE.y, BS_SPLIT.x, BS_SPLIT.y, 1, 1, 450, () => {
      const isA = Math.random() < 0.5;
      const winTarget = isA ? BS_DET_A : BS_DET_B;
      const loseTarget = isA ? BS_DET_B : BS_DET_A;

      bsAnimateMove(ghost, BS_SPLIT.x, BS_SPLIT.y, loseTarget.x, loseTarget.y, 0.55, 0, 450, () => {
        ghost?.setAttribute('opacity', '0');
      });

      bsAnimateMove(photon, BS_SPLIT.x, BS_SPLIT.y, winTarget.x, winTarget.y, 1, 1, 450, () => {
        photon?.setAttribute('opacity', '0');
        const ping = isA ? pingARef.current : pingBRef.current;
        const flash = isA ? flashARef.current : flashBRef.current;
        pulseElement(ping, 'active', 650);
        if (flash) {
          flash.setAttribute('opacity', '0.5');
          setTimeout(() => flash.setAttribute('opacity', '0'), 400);
        }
        addScreenMark(isA);

        if (isA) setCountA((c) => c + 1);
        else setCountB((c) => c + 1);

        setResultText(isA ? 'Detector A clicked' : 'Detector B clicked');
        setExplainer(
          isA
            ? "Detector A clicked — the photon reflected. Fire again and it could just as easily transmit through to B; each photon's path is decided fresh, not by any pattern in what came before."
            : "Detector B clicked — the photon transmitted straight through. Fire again and it could just as easily reflect to A; each photon's path is decided fresh, not by any pattern in what came before."
        );

        setAnimating(false);
      });
    });
  }

  function resetBeamSplitter() {
    setCountA(0);
    setCountB(0);
    setMarksA([]);
    setMarksB([]);
    setResultText('—');
    setExplainer('A photon is about to launch toward the beam splitter. Fire it and watch which detector clicks.');
  }

  const total = countA + countB;
  const pA = total ? (countA / total) * 100 : 0;
  const pB = total ? (countB / total) * 100 : 0;

  return (
    <section
      id="tab-beamsplitter"
      className={`tab-content${isActive ? ' active' : ''}`}
      style={{ display: nav.mode === 'sim' ? undefined : 'none' }}
    >
      <div className="compare-header">
        <h1 className="compare-title">{t('beamsplitter.title', 'Beam Splitter')}</h1>
        <p className="compare-subtitle">
          {t(
            'beamsplitter.subtitle',
            'A single photon hits a 50/50 beam splitter and is randomly reflected to detector A or transmitted to detector B — one photon, one random outcome, never a photon split in half'
          )}
        </p>
      </div>
      <div className="beamsplitter-layout">
        <div className="beamsplitter-canvas-card">
          <svg
            id="beamsplitter-svg"
            viewBox="0 0 680 380"
            role="img"
            aria-label={t(
              'beamsplitter.svgAlt',
              'Diagram of a photon source firing at a 50/50 beam splitter, randomly reflected up to detector A or transmitted right to detector B. A faint duplicate briefly appears on the path not taken, illustrating the superposition that existed before the photon was detected.'
            )}
          >
            <defs>
              <marker id="bs-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
              <radialGradient id="bs-photon-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F5A623" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="bs-glass" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--text2)" stopOpacity="0.18" />
                <stop offset="45%" stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="55%" stopColor="#ffffff" stopOpacity="0.12" />
                <stop offset="100%" stopColor="var(--text2)" stopOpacity="0.18" />
              </linearGradient>
              <filter id="bs-soft-blur" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
              <linearGradient id="bs-glass-sheen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
                <stop offset="25%" stopColor="#fff" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
              </linearGradient>
              <radialGradient id="bs-emit-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F5A623" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
              </radialGradient>
              <clipPath id="bs-clip-a">
                <rect x="345" y="55" width="70" height="55" rx="16" />
              </clipPath>
              <clipPath id="bs-clip-b">
                <rect x="555" y="253" width="65" height="55" rx="16" />
              </clipPath>
            </defs>
            <circle className="bs-emit-glow" cx="115" cy="280" r="60" fill="url(#bs-emit-glow)" pointerEvents="none" />
            <rect x="40" y="255" width="150" height="50" rx="8" fill="var(--surface2)" stroke="var(--border2)" strokeWidth="1" />
            <rect x="40" y="255" width="150" height="50" rx="8" fill="url(#bs-glass-sheen)" pointerEvents="none" />
            <text x="115" y="280" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="500" fill="var(--text)">
              {t('beamsplitter.photonSource', 'Photon source')}
            </text>
            <line
              className="bs-beam"
              x1="190"
              y1="280"
              x2="352"
              y2="280"
              stroke="#F5A623"
              strokeWidth="3"
              strokeLinecap="round"
              markerEnd="url(#bs-arr)"
              opacity="0.7"
            />
            <g className="bs-particle-stream">
              <circle className="bs-particle" cx="190" cy="280" r="1.6" fill="#F5A623" style={{ '--dx': '162px', animationDelay: '0s' } as React.CSSProperties} />
              <circle className="bs-particle" cx="190" cy="280" r="1.6" fill="#F5A623" style={{ '--dx': '162px', animationDelay: '-0.5s' } as React.CSSProperties} />
              <circle className="bs-particle" cx="190" cy="280" r="1.6" fill="#F5A623" style={{ '--dx': '162px', animationDelay: '-1s' } as React.CSSProperties} />
            </g>
            <line
              className="bs-path-ghost"
              x1="380"
              y1="272"
              x2="380"
              y2="118"
              stroke="var(--zero)"
              strokeWidth="2"
              strokeDasharray="6 6"
              opacity="0.4"
              markerEnd="url(#bs-arr)"
            />
            <text x="300" y="195" textAnchor="middle" fontSize="12" fill="var(--text2)">
              {t('beamsplitter.reflected', 'reflected')}
            </text>
            <line
              className="bs-path-ghost"
              x1="388"
              y1="280"
              x2="552"
              y2="280"
              stroke="var(--one)"
              strokeWidth="2"
              strokeDasharray="6 6"
              opacity="0.4"
              markerEnd="url(#bs-arr)"
            />
            <text x="470" y="265" textAnchor="middle" fontSize="12" fill="var(--text2)">
              {t('beamsplitter.transmitted', 'transmitted')}
            </text>
            <rect
              x="358"
              y="271"
              width="60"
              height="18"
              rx="4"
              fill="url(#bs-glass)"
              transform="rotate(45 380 280)"
              filter="url(#bs-soft-blur)"
              opacity="0.8"
            />
            <rect
              x="358"
              y="271"
              width="60"
              height="18"
              rx="4"
              fill="url(#bs-glass)"
              stroke="var(--border2)"
              strokeWidth="1.2"
              transform="rotate(45 380 280)"
            />
            <text x="380" y="325" textAnchor="middle" fontSize="12" fill="var(--text2)">
              {t('beamsplitter.beamSplitterLabel', 'Beam splitter')}
            </text>
            <rect x="345" y="55" width="70" height="55" rx="16" fill="var(--zero-dim)" stroke="var(--zero)" strokeWidth="1" />
            <rect x="345" y="55" width="70" height="55" rx="16" fill="url(#bs-glass-sheen)" pointerEvents="none" />
            <g id="bs-marks-a" clipPath="url(#bs-clip-a)">
              {marksA.map((m) => (
                <circle key={m.id} className="bs-mark" cx={m.cx} cy={m.cy} r={m.r} fill="var(--zero)" opacity={m.opacity} />
              ))}
            </g>
            <circle
              id="bs-ping-a"
              ref={pingARef}
              className="bs-ping"
              cx="380"
              cy="82"
              r="26"
              fill="none"
              stroke="var(--zero)"
              strokeWidth="2"
              opacity="0"
            />
            <rect id="bs-flashA" ref={flashARef} x="345" y="55" width="70" height="55" rx="16" fill="var(--zero)" opacity="0" />
            <text x="380" y="82" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="500" fill="var(--zero)">
              A
            </text>
            <text x="380" y="35" textAnchor="middle" fontSize="12" fill="var(--text2)">
              {t('beamsplitter.detectorA', 'Photon detector A')}
            </text>
            <rect x="555" y="253" width="65" height="55" rx="16" fill="var(--one-dim)" stroke="var(--one)" strokeWidth="1" />
            <rect x="555" y="253" width="65" height="55" rx="16" fill="url(#bs-glass-sheen)" pointerEvents="none" />
            <g id="bs-marks-b" clipPath="url(#bs-clip-b)">
              {marksB.map((m) => (
                <circle key={m.id} className="bs-mark" cx={m.cx} cy={m.cy} r={m.r} fill="var(--one)" opacity={m.opacity} />
              ))}
            </g>
            <circle
              id="bs-ping-b"
              ref={pingBRef}
              className="bs-ping"
              cx="587"
              cy="280"
              r="26"
              fill="none"
              stroke="var(--one)"
              strokeWidth="2"
              opacity="0"
            />
            <rect id="bs-flashB" ref={flashBRef} x="555" y="253" width="65" height="55" rx="16" fill="var(--one)" opacity="0" />
            <text x="587" y="280" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="500" fill="var(--one)">
              B
            </text>
            <text x="587" y="325" textAnchor="middle" fontSize="12" fill="var(--text2)">
              {t('beamsplitter.detectorB', 'Photon detector B')}
            </text>
            <g id="bs-photon-ghost" ref={ghostRef} opacity="0">
              <circle r="10" fill="url(#bs-photon-glow)" />
              <circle r="3.5" fill="#F5A623" />
            </g>
            <g id="bs-photon" ref={photonRef} opacity="0">
              <circle r="14" fill="url(#bs-photon-glow)" />
              <circle r="5.5" fill="#F5A623" />
            </g>
          </svg>
          <div className="beamsplitter-actions">
            <button className="btn-run" id="btn-fire-photon" disabled={animating} onClick={firePhoton}>
              {t('beamsplitter.firePhoton', 'Fire photon')}
            </button>
            <span className="muted-text" id="beamsplitter-result">
              {resultText}
            </span>
          </div>
        </div>
        <div className="beamsplitter-controls-grid">
          <div className="card">
            <div className="card-title">
              <span>{t('beamsplitter.detectorTally', 'Detector Tally')}</span>
              <span className="muted-text" id="beamsplitter-trial-count">
                {total ? `· ${total} photons` : ''}
              </span>
            </div>
            <div className="histogram">
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar zero-fill" id="bs-hist-a" style={{ height: `${pA}%` }} />
                </div>
                <span className="ket zero-color">A</span>
                <span className="pct" id="bs-pct-a">
                  {total ? `${Math.round(pA)}%` : '—'}
                </span>
              </div>
              <div className="hist-col">
                <div className="hist-track">
                  <div className="hist-bar one-fill" id="bs-hist-b" style={{ height: `${pB}%` }} />
                </div>
                <span className="ket one-color">B</span>
                <span className="pct" id="bs-pct-b">
                  {total ? `${Math.round(pB)}%` : '—'}
                </span>
              </div>
            </div>
            <button className="btn-secondary" id="btn-reset-beamsplitter" onClick={resetBeamSplitter}>
              {t('common.reset', 'Reset')}
            </button>
          </div>
          <div className="card explainer-card">
            <div className="card-title">{t('common.whatJustHappened', 'What just happened')}</div>
            <Explainer id="beamsplitter-explainer" html={explainer} />
          </div>
        </div>
      </div>
      <LessonEmbed id="beamsplitter" />
    </section>
  );
}
