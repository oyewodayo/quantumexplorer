import { useRef, useState } from 'react';
import { animateCoinFlip } from '../../core/coin.ts';
import { pulseElement, delay } from '../../core/pulse.ts';
import { useI18n } from '../../hooks/useI18n.ts';
import { useNav } from '../../hooks/useNav.ts';
import CoinCanvas from '../CoinCanvas.tsx';
import LessonEmbed from '../LessonEmbed.tsx';

export default function EntangleTab() {
  const { t } = useI18n();
  const nav = useNav();
  const isActive = nav.mode === 'sim' && nav.tab === 'entangle';

  const [coin1State, setCoin1State] = useState<0 | 1 | null>(null);
  const [coin2State, setCoin2State] = useState<0 | 1 | null>(null);
  const [coin1Label, setCoin1Label] = useState('Unmeasured');
  const [coin2Label, setCoin2Label] = useState('Unmeasured');
  const [note, setNote] = useState('Measuring A instantly<br />determines B');
  const [result, setResult] = useState<{ text: string; color: string }>({ text: '', color: '' });
  const [counts, setCounts] = useState<{ '00': number; '11': number }>({ '00': 0, '11': 0 });
  const [animating, setAnimating] = useState(false);

  const coin1Ref = useRef<HTMLCanvasElement | null>(null);
  const coin2Ref = useRef<HTMLCanvasElement | null>(null);
  const resRef = useRef<HTMLDivElement | null>(null);

  const total = counts['00'] + counts['11'];
  const p00 = total ? (counts['00'] / total) * 100 : 0;
  const p11 = total ? (counts['11'] / total) * 100 : 0;

  async function flipEntangled() {
    if (animating) return;
    setAnimating(true);

    setNote('Measuring…');
    setResult({ text: '', color: '' });
    setCoin1Label('…');
    setCoin2Label('…');

    for (let i = 0; i < 10; i++) {
      setCoin1State((i % 2) as 0 | 1);
      setCoin2State((1 - (i % 2)) as 0 | 1);
      await delay(55);
    }

    const res: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
    setCoin1State(res);
    setCoin2State(res);

    pulseElement(coin1Ref.current, 'collapsing');
    pulseElement(coin2Ref.current, 'collapsing');

    const ket = res === 0 ? '|0⟩' : '|1⟩';
    setCoin1Label(ket);
    setCoin2Label(ket);
    setNote('Both collapsed to the same state');

    setResult({
      text: `Outcome: |${res}${res}⟩`,
      color: res === 0 ? 'var(--zero)' : 'var(--one)',
    });
    pulseElement(resRef.current, 'collapsing', 500);

    setCounts((c) => ({ ...c, [res === 0 ? '00' : '11']: c[res === 0 ? '00' : '11'] + 1 }));
    setAnimating(false);
  }

  async function measureCoinA() {
    if (animating) return;
    setAnimating(true);

    setCoin1State(null);
    setCoin2State(null);
    setCoin2Label('Entangled…');
    setNote('Measuring A…');
    setResult({ text: '', color: '' });
    setCoin1Label('Measuring…');

    await animateCoinFlip(coin1Ref.current, 9, 62);

    const res: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
    setCoin1State(res);
    pulseElement(coin1Ref.current, 'collapsing');
    setCoin1Label(`A = ${res === 0 ? '|0⟩' : '|1⟩'}`);
    setNote('A collapsed — B instantly determined!');

    await delay(580);

    setCoin2State(res);
    pulseElement(coin2Ref.current, 'collapsing');
    setCoin2Label(`B = ${res === 0 ? '|0⟩' : '|1⟩'}`);

    setResult({
      text: `|${res}${res}⟩ — no signal sent to B`,
      color: res === 0 ? 'var(--zero)' : 'var(--one)',
    });
    pulseElement(resRef.current, 'collapsing', 500);
    setNote('Correlation holds regardless of distance');

    setCounts((c) => ({ ...c, [res === 0 ? '00' : '11']: c[res === 0 ? '00' : '11'] + 1 }));
    setAnimating(false);
  }

  function resetEntangle() {
    if (animating) return;
    setCoin1State(null);
    setCoin2State(null);
    setCoin1Label('Unmeasured');
    setCoin2Label('Unmeasured');
    setResult({ text: '', color: '' });
    setNote('Measuring A instantly determines B');
  }

  return (
    <section
      id="tab-entangle"
      className={`tab-content${isActive ? ' active' : ''}`}
      style={{ display: nav.mode === 'sim' ? undefined : 'none' }}
    >
      <div className="compare-header">
        <h1 className="compare-title">{t('entangle.title', 'Quantum Entanglement')}</h1>
        <p className="compare-subtitle">
          {t(
            'entangle.subtitle',
            'Bell state (|00⟩ + |11⟩)/√2 — neither qubit has a definite state alone; measuring one instantly determines the other'
          )}
        </p>
      </div>
      <div className="entangle-layout">
        <div className="card entangle-main-card">
          <img
            className="entangle-banner-img"
            src="entaglement.png"
            alt={t(
              'entangle.bannerAlt',
              'Illustration of the coin-flip analogy for quantum entanglement: two people each flip a coin at separate detectors, connected by a glowing sphere of correlation cones — whichever way Coin A lands, Coin B instantly lands the opposite way, with the state indeterminate until measured.'
            )}
          />
          <div className="entangle-bell-state">
            <span className="formula" style={{ fontSize: '1.05rem' }}>
              (|00⟩ + |11⟩) / √2
            </span>
            <span className="muted-text" style={{ marginLeft: '14px', fontSize: '0.72rem' }}>
              {t('entangle.jointStateLabel', 'joint state of both qubits')}
            </span>
          </div>
          <div className="card-title">{t('entangle.explainerTitle', 'What Is Quantum Entanglement?')}</div>
          <p className="bit-explainer">
            {t(
              'entangle.explainerBody1',
              'Quantum entanglement is a phenomenon in which two or more particles become linked so that their quantum states can no longer be described independently of one another — even when the particles are separated by enormous distances. Instead of two separate qubits each carrying their own state, the pair shares a single joint state, like the Bell state (|00⟩ + |11⟩)/√2 shown above: a 50/50 mix of "both measured 0" and "both measured 1," with no way to break it down into what qubit A or qubit B is doing on its own.'
            )}
          </p>
          <p className="bit-explainer" style={{ marginTop: '10px' }}>
            {t(
              'entangle.explainerBody2',
              'Entanglement isn\'t produced by some mysterious force reaching between the particles — it\'s created locally, the moment two qubits interact (here, with a Hadamard gate followed by a CNOT — build the same recipe gate by gate on the Circuits tab), and it persists afterward no matter how far apart the qubits later travel. Einstein famously called the resulting correlations "spooky action at a distance," since measuring one qubit appears to instantly affect the other.'
            )}
          </p>
          <p className="bit-explainer" style={{ marginTop: '10px' }}>
            {t(
              'entangle.explainerBody3',
              "The two cards below work out the details behind that intuition: why a state like this genuinely can't be described as two separate qubits, and why the instant correlation still can't be used to send a signal faster than light."
            )}
          </p>
          <div className="entangle-map">
            <svg className="entangle-map-bg" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
              <rect x="0" y="0" width="100" height="32" fill="var(--zero-dim)" />
              <g stroke="var(--border2)" strokeWidth="0.25" opacity="0.6">
                <line x1="0" y1="8" x2="100" y2="8" />
                <line x1="0" y1="16" x2="100" y2="16" />
                <line x1="0" y1="24" x2="100" y2="24" />
                <line x1="17" y1="0" x2="17" y2="32" />
                <line x1="34" y1="0" x2="34" y2="32" />
                <line x1="50" y1="0" x2="50" y2="32" />
                <line x1="67" y1="0" x2="67" y2="32" />
                <line x1="84" y1="0" x2="84" y2="32" />
              </g>
              <g fill="var(--success-dim)">
                <path d="M5,12 Q9,7 15,10 Q19,9 20,13 Q16,17 11,16 Q6,17 5,12 Z" />
                <path d="M39,17 Q46,12 53,15 Q57,18 54,22 Q47,24 42,21 Q38,20 39,17 Z" />
                <path d="M74,10 Q82,6 89,10 Q93,13 89,17 Q82,19 77,16 Q73,13 74,10 Z" />
                <path d="M27,3 Q32,1 35,4 Q33,7 28,7 Q26,6 27,3 Z" />
                <path d="M60,4 Q65,2 69,5 Q67,8 62,7 Q59,6 60,4 Z" />
              </g>
              <path
                d="M15,19 Q50,2 85,19"
                fill="none"
                stroke="var(--zero)"
                strokeWidth="0.5"
                strokeDasharray="2 1.4"
                opacity="0.75"
              />
              <line x1="15" y1="19" x2="15" y2="26" stroke="var(--text3)" strokeWidth="0.5" />
              <circle cx="15" cy="19" r="1.5" fill="var(--zero)" />
              <line x1="85" y1="19" x2="85" y2="26" stroke="var(--text3)" strokeWidth="0.5" />
              <circle cx="85" cy="19" r="1.5" fill="var(--one)" />
            </svg>
            <div className="coins-row">
              <div className="coin-wrap">
                <div className="coin-label-top">{t('qubitTab.qubitABadge', 'Qubit A')}</div>
                <CoinCanvas id="coin1" ref={coin1Ref} state={coin1State} />
                <div className="coin-label-bottom" id="coin1-label">
                  {coin1Label}
                </div>
              </div>
              <div className="entangle-mid">
                <div className="entangle-link-label">{t('entangle.entangledLabel', 'Entangled')}</div>
                <div className="entangle-link-arrow">↔</div>
                <div
                  className="entangle-note"
                  id="entangle-note"
                  dangerouslySetInnerHTML={{ __html: note }}
                />
              </div>
              <div className="coin-wrap">
                <div className="coin-label-top">{t('qubitTab.qubitBBadge', 'Qubit B')}</div>
                <CoinCanvas id="coin2" ref={coin2Ref} state={coin2State} />
                <div className="coin-label-bottom" id="coin2-label">
                  {coin2Label}
                </div>
              </div>
            </div>
            <div className="entangle-map-caption">
              {t(
                'entangle.mapCaption',
                'Two different locations, arbitrarily far apart — the correlation holds regardless of the distance between them.'
              )}
            </div>
          </div>
          <div className="entangle-actions">
            <button className="btn-measure" id="btn-measure-both" disabled={animating} onClick={flipEntangled}>
              {t('entangle.measureBoth', 'Measure Both')}
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '10px 16px', fontSize: '0.8rem' }}
              id="btn-measure-a"
              disabled={animating}
              onClick={measureCoinA}
            >
              {t('entangle.measureAOnly', 'Measure A Only')}
            </button>
            <button className="btn-secondary" id="btn-reset-entangle" disabled={animating} onClick={resetEntangle}>
              {t('common.reset', 'Reset')}
            </button>
          </div>
          <div
            className="entangle-result"
            id="entangle-result"
            ref={resRef}
            style={{ color: result.color }}
          >
            {result.text}
          </div>
        </div>
        <div className="card mt-14">
          <div className="card-title">
            <span>{t('measure.measurementStatistics', 'Measurement Statistics')}</span>
            <span className="muted-text" id="entangle-trial-count">
              {total ? `· ${total} trials` : ''}
            </span>
          </div>
          <div className="entangle-stats">
            <div className="prob-row">
              <span className="ket zero-color" style={{ minWidth: '34px' }}>
                |00⟩
              </span>
              <div className="track">
                <div className="fill zero-fill" id="estat-fill-00" style={{ width: `${p00}%` }} />
              </div>
              <span className="pct" id="estat-pct-00">
                {total ? `${Math.round(p00)}%` : '—'}
              </span>
            </div>
            <div className="prob-row">
              <span className="ket one-color" style={{ minWidth: '34px' }}>
                |11⟩
              </span>
              <div className="track">
                <div className="fill one-fill" id="estat-fill-11" style={{ width: `${p11}%` }} />
              </div>
              <span className="pct" id="estat-pct-11">
                {total ? `${Math.round(p11)}%` : '—'}
              </span>
            </div>
            <div className="prob-row" style={{ marginTop: '4px', opacity: 0.35 }}>
              <span className="ket" style={{ minWidth: '34px', color: 'var(--text3)' }}>
                |01⟩
              </span>
              <div className="track">
                <div className="fill" style={{ background: 'var(--text3)', width: '0%' }} />
              </div>
              <span className="pct">0%</span>
            </div>
            <div className="prob-row" style={{ opacity: 0.35 }}>
              <span className="ket" style={{ minWidth: '34px', color: 'var(--text3)' }}>
                |10⟩
              </span>
              <div className="track">
                <div className="fill" style={{ background: 'var(--text3)', width: '0%' }} />
              </div>
              <span className="pct">0%</span>
            </div>
          </div>
          <div className="convergence-note" style={{ marginTop: '10px' }} id="entangle-convergence">
            {total >= 10 ? 'Always |00⟩ or |11⟩ — the perfect quantum correlation converges to 50/50' : ''}
          </div>
        </div>
        <div className="card mt-14">
          <div className="card-title">{t('entangle.tensorTitle', "Why Isn't This Just Two Qubits? (Tensor Products)")}</div>
          <p
            className="bit-explainer"
            dangerouslySetInnerHTML={{
              __html: t(
                'entangle.tensorBody1',
                "Two independent qubits always combine by <span class=\"key-term\">tensor product</span> (⊗): stack qubit A's 2-entry vector against qubit B's, multiplying every pair of entries to build a 4-entry joint vector. Every product state — anything you could build in the Two Qubit panel on the Bits & Qubits tab — factors apart into two separate qubits this way:"
              ),
            }}
          />
          <div
            className="formula"
            style={{ marginTop: '10px' }}
            dangerouslySetInnerHTML={{
              __html: t('entangle.tensorFormula1', '|0⟩⊗|0⟩ = [1,0]<sup>T</sup>⊗[1,0]<sup>T</sup> = [1,0,0,0]<sup>T</sup> = |00⟩'),
            }}
          />
          <p
            className="bit-explainer"
            style={{ marginTop: '10px' }}
            dangerouslySetInnerHTML={{
              __html: t(
                'entangle.tensorBody2',
                "The Bell state above is also a 4-entry vector — [1,0,0,1]<sup>T</sup>/√2 — but try to factor it back into [a,b]<sup>T</sup>⊗[c,d]<sup>T</sup> = [ac,ad,bc,bd]<sup>T</sup> and there's no solution: <em>ad</em> = 0 and <em>bc</em> = 0 force one of each pair to be zero, which would also zero out <em>ac</em> or <em>bd</em> — no single-qubit states A and B multiply together to reproduce it."
              ),
            }}
          />
          <div className="formula" style={{ marginTop: '10px' }}>
            {t('entangle.tensorFormula2', '(|00⟩ + |11⟩) / √2 = [1, 0, 0, 1]ᵀ/√2 ≠ [a,b]ᵀ ⊗ [c,d]ᵀ for any a, b, c, d')}
          </div>
          <p className="bit-explainer" style={{ marginTop: '10px' }}>
            {t(
              'entangle.tensorBody3',
              "That's the literal, checkable definition of entanglement: a joint state that can't be split back into two independent single-qubit factors. Neither qubit alone has a well-defined state — only the pair does."
            )}
          </p>
        </div>
        <div className="card mt-14">
          <div className="card-title">{t('entangle.relativityTitle', "Why This Doesn't Break Relativity")}</div>
          <p className="bit-explainer">
            {t(
              'entangle.relativityBody1',
              "This setup is a version of the Einstein-Podolsky-Rosen (EPR) thought experiment: Alice measures Qubit A and instantly knows Qubit B's outcome, even if B is light-years away. It looks like faster-than-light signaling — but it isn't."
            )}
          </p>
          <p className="bit-explainer" style={{ marginTop: '10px' }}>
            {t(
              'entangle.relativityBody2',
              "Alice can't choose which outcome she gets — that's still random, same 50/50 odds as any single qubit. So there's nothing for her to control, and therefore nothing she can encode into a message. The correlation is only visible after the fact, once Alice and Bob compare notes over an ordinary (slower-than-light) channel. No energy, no information, and no signal actually crosses the distance between them at the moment of measurement."
            )}
          </p>
        </div>
        <div className="card mt-14">
          <div className="card-title">{t('entangle.cernTitle', 'Why CERN Cares About Entanglement')}</div>
          <p className="bit-explainer">
            {t(
              'entangle.cernBody1',
              "This isn't only a teaching example. Physicists at the LHC have measured genuine quantum entanglement directly in the particles produced by proton-proton collisions — most notably between a top quark and its antiquark, created and decaying within a fraction of a trillionth of a trillionth of a second. The same Bell-state math on this page, (|00⟩ + |11⟩)/√2, describes a real, measured correlation in the highest-energy environment humans have ever built."
            )}
          </p>
          <p className="bit-explainer" style={{ marginTop: '10px' }}>
            {t(
              'entangle.cernBody2',
              "CERN's Quantum Technology Initiative treats entanglement and superposition as engineering resources, not just curiosities: quantum computers for simulating the quantum field theories behind particle physics itself — a problem classical computers scale badly on — and quantum sensors built from entangled or squeezed states, aimed at the kind of extreme-precision measurements that searches for dark matter and other new physics depend on."
            )}
          </p>
        </div>
      </div>
      <LessonEmbed id="entangle" />
    </section>
  );
}
