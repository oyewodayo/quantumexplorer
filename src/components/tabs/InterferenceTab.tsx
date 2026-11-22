import { useEffect, useRef, useState } from 'react';
import {
  interferenceIntensity,
  interferenceMaxIntensity,
  type InterferenceGeometry,
  type InterferenceMode,
} from '../../core/interference.ts';
import { useI18n } from '../../hooks/useI18n.ts';
import { useNav } from '../../hooks/useNav.ts';
import { useTheme } from '../../hooks/useTheme.ts';
import Explainer from '../Explainer.tsx';
import LessonEmbed from '../LessonEmbed.tsx';

const INTERFERENCE_WAVE_SPEED = 70;
const INTERFERENCE_DT = 0.045;
const INTERFERENCE_HITS_PER_FRAME = 3;
const INTERFERENCE_SOURCE_X = 26;
const INTERFERENCE_GAP_HALF = 6;

const INTERFERENCE_MODE_COPY: Record<'double' | 'single' | 'which-path', string> = {
  double:
    'Both slits are open and the paths are indistinguishable. Watch the dots pile up — one at a time, at random-looking positions — and slowly reveal stripes. That pattern is only possible because each particle had two paths available.',
  single:
    'Only one path exists now — no partner wave to interfere with. The dots pile into a single soft blob, no stripes, exactly like tossing pebbles at a wall with one hole.',
  'which-path':
    'Both slits are still open, but a detector at each one is now tagging which path every particle took. The stripes vanish, replaced by a plain double-humped pile — knowing the path, even in principle, is enough to destroy the interference.',
};

export default function InterferenceTab() {
  const { t } = useI18n();
  const nav = useNav();
  const { isDark } = useTheme();
  const isActive = nav.mode === 'sim' && nav.tab === 'interference';

  const [mode, setMode] = useState<'double' | 'single' | 'which-path'>('double');
  const [slitSep, setSlitSep] = useState(46);
  const [wavelength, setWavelength] = useState(18);
  const [hitCount, setHitCount] = useState(0);
  const [explainer, setExplainer] = useState(
    'Both slits are open and the paths are indistinguishable. Watch the dots pile up one at a time — and slowly reveal stripes.'
  );

  const rippleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rippleImageDataRef = useRef<ImageData | null>(null);
  const timeRef = useRef(0);
  const hitCountRef = useRef(0);

  const modeRef = useRef(mode);
  modeRef.current = mode;
  const slitSepRef = useRef(slitSep);
  slitSepRef.current = slitSep;
  const wavelengthRef = useRef(wavelength);
  wavelengthRef.current = wavelength;
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  function resetScreen() {
    const screenCanvas = screenCanvasRef.current;
    if (screenCanvas) {
      const ctx = screenCanvas.getContext('2d');
      ctx?.clearRect(0, 0, screenCanvas.width, screenCanvas.height);
    }
    hitCountRef.current = 0;
    setHitCount(0);
  }

  function changeMode(nextMode: 'double' | 'single' | 'which-path') {
    setMode(nextMode);
    resetScreen();
    setExplainer(INTERFERENCE_MODE_COPY[nextMode]);
  }

  function changeSlitSep(val: number) {
    setSlitSep(val);
    resetScreen();
  }

  function changeWavelength(val: number) {
    setWavelength(val);
    resetScreen();
  }

  useEffect(() => {
    if (!isActive) return undefined;

    let animId: number;
    const animate = () => {
      const rippleCanvas = rippleCanvasRef.current;
      const screenCanvas = screenCanvasRef.current;
      if (!rippleCanvas || !screenCanvas) return;
      const rippleCtx = rippleCanvas.getContext('2d');
      const screenCtx = screenCanvas.getContext('2d');
      if (!rippleCtx || !screenCtx) return;

      timeRef.current += INTERFERENCE_DT;
      const w = rippleCanvas.width;
      const h = rippleCanvas.height;
      const centerY = h / 2;
      const sep = slitSepRef.current;
      const wlen = wavelengthRef.current;
      const curMode: InterferenceMode = modeRef.current;
      const dark = isDarkRef.current;

      const geo: InterferenceGeometry = {
        centerY,
        y1: centerY - sep / 2,
        y2: centerY + sep / 2,
        sourceX: INTERFERENCE_SOURCE_X,
        screenX: w - 4,
      };

      if (
        !rippleImageDataRef.current ||
        rippleImageDataRef.current.width !== w ||
        rippleImageDataRef.current.height !== h
      ) {
        rippleImageDataRef.current = rippleCtx.createImageData(w, h);
      }
      const data = rippleImageDataRef.current.data;
      data.fill(0);

      const k = (2 * Math.PI) / wlen;
      const w_ = k * INTERFERENCE_WAVE_SPEED;
      const rgb = dark ? [96, 165, 250] : [29, 78, 216];
      const step = 1;

      for (let py = 0; py < h; py += step) {
        for (let px = geo.sourceX; px < w; px += step) {
          const r1 = Math.hypot(px - geo.sourceX, py - geo.y1);
          let val = Math.sin(k * r1 - w_ * timeRef.current);
          let maxAmp = 1;
          if (curMode !== 'single') {
            const r2 = Math.hypot(px - geo.sourceX, py - geo.y2);
            val += Math.sin(k * r2 - w_ * timeRef.current);
            maxAmp = 2;
          }
          const bright = Math.max(0, (val + maxAmp) / (2 * maxAmp));
          const alpha = Math.floor(Math.pow(bright, 1.6) * 235);

          for (let yy = 0; yy < step && py + yy < h; yy++) {
            for (let xx = 0; xx < step && px + xx < w; xx++) {
              const idx = ((py + yy) * w + (px + xx)) * 4;
              data[idx] = rgb[0];
              data[idx + 1] = rgb[1];
              data[idx + 2] = rgb[2];
              data[idx + 3] = alpha;
            }
          }
        }
      }
      rippleCtx.putImageData(rippleImageDataRef.current, 0, 0);

      // Draw slit plate
      rippleCtx.save();
      rippleCtx.strokeStyle = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
      rippleCtx.lineWidth = 4;
      rippleCtx.lineCap = 'butt';
      rippleCtx.beginPath();
      rippleCtx.moveTo(geo.sourceX, 0);
      rippleCtx.lineTo(geo.sourceX, geo.y1 - INTERFERENCE_GAP_HALF);
      if (curMode === 'single') {
        rippleCtx.moveTo(geo.sourceX, geo.y1 + INTERFERENCE_GAP_HALF);
        rippleCtx.lineTo(geo.sourceX, h);
      } else {
        rippleCtx.moveTo(geo.sourceX, geo.y1 + INTERFERENCE_GAP_HALF);
        rippleCtx.lineTo(geo.sourceX, geo.y2 - INTERFERENCE_GAP_HALF);
        rippleCtx.moveTo(geo.sourceX, geo.y2 + INTERFERENCE_GAP_HALF);
        rippleCtx.lineTo(geo.sourceX, h);
      }
      rippleCtx.stroke();

      if (curMode === 'which-path') {
        rippleCtx.fillStyle = dark ? '#F472B6' : '#BE185D';
        [geo.y1, geo.y2].forEach((y) => {
          rippleCtx.beginPath();
          rippleCtx.arc(geo.sourceX - 10, y, 3, 0, 2 * Math.PI);
          rippleCtx.fill();
        });
      }
      rippleCtx.restore();

      // Add hits
      const Imax = interferenceMaxIntensity(curMode);
      screenCtx.fillStyle = dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
      for (let i = 0; i < INTERFERENCE_HITS_PER_FRAME; i++) {
        let y = 0;
        let accepted = false;
        let tries = 0;
        while (!accepted && tries < 12) {
          y = Math.random() * h;
          const I = interferenceIntensity(y, geo, curMode, wlen);
          if (Math.random() * Imax < I) accepted = true;
          tries++;
        }
        if (!accepted) continue;
        const x = screenCanvas.width / 2 + (Math.random() - 0.5) * (screenCanvas.width * 0.5);
        screenCtx.beginPath();
        screenCtx.arc(x, y, 1.1, 0, 2 * Math.PI);
        screenCtx.fill();
        hitCountRef.current++;
      }
      if (hitCountRef.current % 15 < INTERFERENCE_HITS_PER_FRAME) {
        setHitCount(hitCountRef.current);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isActive]);

  return (
    <section
      id="tab-interference"
      className={`tab-content${isActive ? ' active' : ''}`}
      style={{ display: nav.mode === 'sim' ? undefined : 'none' }}
    >
      <div className="compare-header">
        <h1 className="compare-title">{t('interference.title', 'Wave Interference')}</h1>
        <p className="compare-subtitle">
          {t(
            'interference.subtitle',
            'Two open paths and a screen keeping score. Every dot on the right is one particle landing — yet together they paint a wave'
          )}
        </p>
      </div>
      <div className="interference-layout">
        <div className="interference-main">
          <div className="ripple-wrap">
            <canvas
              id="ripple-canvas"
              ref={rippleCanvasRef}
              width={360}
              height={260}
              role="img"
              aria-label="Animated ripple simulation of waves passing through one or two slits, showing the resulting interference pattern."
            />
          </div>
          <div className="screen-wrap">
            <canvas
              id="screen-canvas"
              ref={screenCanvasRef}
              width={86}
              height={260}
              role="img"
              aria-label="Detector screen accumulating individual particle-hit dots over time, building up the interference or single-slit pattern."
            />
            <div className="screen-label">{t('interference.screen', 'Screen')}</div>
          </div>
        </div>
        <div className="right-panel">
          <div className="card">
            <div className="card-title">{t('interference.setup', 'Setup')}</div>
            <div className="mode-grid">
              <button
                className={`preset-btn mode-btn${mode === 'double' ? ' active' : ''}`}
                data-mode="double"
                onClick={() => changeMode('double')}
              >
                {t('interference.doubleSlit', 'Double slit')}
              </button>
              <button
                className={`preset-btn mode-btn${mode === 'single' ? ' active' : ''}`}
                data-mode="single"
                onClick={() => changeMode('single')}
              >
                {t('interference.singleSlit', 'Single slit')}
              </button>
              <button
                className={`preset-btn mode-btn${mode === 'which-path' ? ' active' : ''}`}
                data-mode="which-path"
                onClick={() => changeMode('which-path')}
              >
                {t('interference.whichPath', 'Which-path')}
              </button>
            </div>
          </div>
          <div className="card">
            <div className="card-title">{t('interference.wave', 'Wave')}</div>
            <div className="slider-group">
              <div className="slider-row">
                <span className="slider-sym">d</span>
                <input
                  type="range"
                  id="slit-sep"
                  min="20"
                  max="90"
                  value={slitSep}
                  onChange={(e) => changeSlitSep(parseInt(e.target.value, 10))}
                />
                <span className="slider-val" id="slit-sep-val">
                  {slitSep}
                </span>
              </div>
              <div className="slider-row">
                <span className="slider-sym">λ</span>
                <input
                  type="range"
                  id="wavelength"
                  min="10"
                  max="34"
                  value={wavelength}
                  onChange={(e) => changeWavelength(parseInt(e.target.value, 10))}
                />
                <span className="slider-val" id="wavelength-val">
                  {wavelength}
                </span>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">
              <span>{t('common.detector', 'Detector')}</span>
              <span className="muted-text" id="interference-count">
                {hitCount ? `· ${hitCount} detected` : ''}
              </span>
            </div>
            <button className="btn-secondary" id="btn-clear-screen" onClick={resetScreen}>
              {t('interference.clearAccumulation', 'Clear accumulation')}
            </button>
          </div>
          <div className="card explainer-card">
            <div className="card-title">{t('common.whatJustHappened', 'What just happened')}</div>
            <Explainer id="interference-explainer" html={explainer} />
          </div>
        </div>
      </div>
      <div className="card" style={{ maxWidth: '960px', margin: '20px auto 0' }}>
        <div className="card-title">{t('interference.physicsInDetail', 'The Physics, In Detail')}</div>
        <p
          className="bit-explainer"
          dangerouslySetInnerHTML={{
            __html: t(
              'interference.body1',
              'Every dot on the screen is one particle landing at one spot — that part is completely ordinary. What isn\'t ordinary is <em>where</em> those dots are allowed to land. Fire particles at the double slit one at a time, with no way for two particles to ever meet mid-flight, and the dots still pile up into stripes. There\'s no crowd of particles interfering with each other — each individual particle\'s own wavefunction passes through <em>both</em> slits at once and interferes with itself. That\'s the actual mystery here, not just "waves make patterns."'
            ),
          }}
        />
        <div
          className="formula"
          style={{ marginTop: '12px' }}
          dangerouslySetInnerHTML={{
            __html: t(
              'interference.formula',
              'I(y) = |A<sub>1</sub>(y) + A<sub>2</sub>(y)|² = |A<sub>1</sub>|² + |A<sub>2</sub>|² + 2|A<sub>1</sub>||A<sub>2</sub>|cos φ(y)'
            ),
          }}
        />
        <p
          className="bit-explainer"
          style={{ marginTop: '12px' }}
          dangerouslySetInnerHTML={{
            __html: t(
              'interference.body2',
              'A<sub>1</sub> and A<sub>2</sub> are the amplitudes for "the particle went through slit 1" and "through slit 2," and φ(y) is the extra distance one path travels to reach point y, converted to a phase. Classical probabilities would just add: P = P<sub>1</sub> + P<sub>2</sub>, a flat pile with no stripes. Quantum amplitudes add first and get squared afterward — and squaring a sum produces that <strong>2|A<sub>1</sub>||A<sub>2</sub>|cos φ</strong> cross term, which is positive at some y (bright fringes), negative at others (dark fringes), and is the entire reason stripes exist at all.'
            ),
          }}
        />
        <p
          className="bit-explainer"
          style={{ marginTop: '12px' }}
          dangerouslySetInnerHTML={{
            __html: t(
              'interference.body3',
              "<strong>Double slit</strong> — both paths stay open and genuinely indistinguishable, so the cross term survives and you get fringes. <strong>Single slit</strong> — only one amplitude exists at all, so there's nothing for it to interfere with; I = |A<sub>1</sub>|², a plain diffraction blob. <strong>Which-path</strong> — both slits are still physically open, but tagging each particle's path (the small detector dots on the plate) means a which-path measurement now exists for every hit. Averaged over those measurements the cross term cancels exactly, leaving the flat I = |A<sub>1</sub>|² + |A<sub>2</sub>|² you'd expect from ordinary particles — two humps, no stripes. Nothing needs to physically jostle the particle for this to happen; merely making the path <em>knowable in principle</em> is enough to erase the pattern."
            ),
          }}
        />
        <p className="bit-explainer" style={{ marginTop: '12px' }}>
          {t(
            'interference.body4',
            "That's why the ripple animation on the left and the dot-by-dot screen on the right are shown side by side: the ripples are the continuous wave picture that predicts where the cross term is constructive or destructive, and the screen is what actually gets measured — one random, all-or-nothing click at a time. The wave never lands anywhere; only the particle does. The stripes are the wave's fingerprint on where the particles were and weren't allowed to click."
          )}
        </p>
      </div>
      <LessonEmbed id="interference" />
    </section>
  );
}
