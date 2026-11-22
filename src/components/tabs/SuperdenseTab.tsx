import { useState } from 'react';
import { TwoQubitState } from '../../core/twoQubit.ts';
import { GATES } from '../../core/gates.ts';
import { delay } from '../../core/pulse.ts';
import { useI18n } from '../../hooks/useI18n.ts';
import { useNav } from '../../hooks/useNav.ts';
import Explainer from '../Explainer.tsx';
import LessonEmbed from '../LessonEmbed.tsx';

export type SuperdenseMsg = '00' | '01' | '10' | '11';
const SUPERDENSE_STEP_MS = 700;

export default function SuperdenseTab() {
  const { t } = useI18n();
  const nav = useNav();
  const isActive = nav.mode === 'sim' && nav.tab === 'superdense';

  const [msg, setMsg] = useState<SuperdenseMsg>('00');
  const [animating, setAnimating] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [receivedVal, setReceivedVal] = useState('?');
  const [receivedSet, setReceivedSet] = useState(false);
  const [resultText, setResultText] = useState('—');
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [channelSending, setChannelSending] = useState(false);
  const [explainer, setExplainer] = useState(
    t(
      'superdense.explainerDefault',
      'Pick a 2-bit message above, then press Send. Watch Alice encode it onto her own qubit alone, physically hand that one qubit to Bob, and Bob decode both bits back out exactly — nothing here is random.'
    )
  );

  const b0 = msg[0];
  const b1 = msg[1];

  function selectMessage(m: SuperdenseMsg) {
    if (animating) return;
    setMsg(m);
    setReceivedVal('?');
    setReceivedSet(false);
  }

  function pulseStage(stageId: string) {
    setActiveStage(stageId);
    setTimeout(() => {
      setActiveStage((prev) => (prev === stageId ? null : prev));
    }, 700);
  }

  async function sendSuperdense() {
    if (animating) return;
    setAnimating(true);
    setResultText(t('superdense.resultRunning', 'running…'));
    setReceivedVal('?');
    setReceivedSet(false);

    const bit0 = msg[0] === '1' ? 1 : 0;
    const bit1 = msg[1] === '1' ? 1 : 0;

    pulseStage('pair');
    setExplainer(t('superdense.stepPair', 'Alice and Bob share an entangled pair, prepared in advance.'));
    await delay(SUPERDENSE_STEP_MS);
    const state = new TwoQubitState();
    state.applySingleQubitGate(0, GATES.H.matrix);
    state.applyCNOT(0, 1);

    setExplainer(
      t('superdense.stepEncode', "Alice encodes her message onto her own qubit alone — Bob's half of the pair is never touched.")
    );
    await delay(SUPERDENSE_STEP_MS);
    if (bit1 === 1) state.applySingleQubitGate(0, GATES.X.matrix);
    if (bit0 === 1) state.applySingleQubitGate(0, GATES.Z.matrix);

    setChannelSending(true);
    setExplainer(
      t('superdense.stepSend', 'Alice physically sends that one qubit to Bob over a real quantum channel — the one step with no classical substitute.')
    );
    await delay(SUPERDENSE_STEP_MS);
    setChannelSending(false);

    pulseStage('decode');
    setExplainer(
      t(
        'superdense.stepDecode',
        "Bob, now holding both qubits, runs the same Bell-basis circuit Teleport's Alice used — a CNOT then a Hadamard — to tell the four possible messages apart."
      )
    );
    await delay(SUPERDENSE_STEP_MS);
    state.applyCNOT(0, 1);
    state.applySingleQubitGate(0, GATES.H.matrix);

    pulseStage('measure');
    setExplainer(t('superdense.stepMeasure', "Bob measures both qubits and reads off Alice's exact two bits."));
    await delay(SUPERDENSE_STEP_MS);
    const d0 = state.measureQubit(0);
    const d1 = state.measureQubit(1);
    const received = `${d0}${d1}`;
    const match = received === msg;

    setReceivedVal(received);
    setReceivedSet(true);
    setSentCount((c) => c + 1);
    if (match) setMatchCount((c) => c + 1);

    setResultText(
      match
        ? t('superdense.resultMatch', 'Decoded exactly right')
        : t('superdense.resultMismatch', 'Mismatch — check the console, this should never happen')
    );
    setExplainer(
      t(
        'superdense.stepDone',
        "Bob decoded {received} — exactly what Alice sent, {sent}. Nothing here was random: the four possible messages land on four mutually orthogonal states, so Bob's measurement has zero uncertainty left in it once the qubit arrives."
      )
        .replace('{received}', received)
        .replace('{sent}', msg)
    );

    setAnimating(false);
  }

  function resetSuperdense() {
    if (animating) return;
    setSentCount(0);
    setMatchCount(0);
    setReceivedVal('?');
    setReceivedSet(false);
    setResultText('—');
    setExplainer(
      t(
        'superdense.explainerDefault',
        'Pick a 2-bit message above, then press Send. Watch Alice encode it onto her own qubit alone, physically hand that one qubit to Bob, and Bob decode both bits back out exactly — nothing here is random.'
      )
    );
  }

  const tallyText = sentCount
    ? t('superdense.tally', '{sent} sent · {match}/{sent} decoded correctly')
        .replace('{sent}', String(sentCount))
        .replace('{match}', String(matchCount))
        .replace('{sent}', String(sentCount))
    : '';

  return (
    <section
      id="tab-superdense"
      className={`tab-content${isActive ? ' active' : ''}`}
      style={{ display: nav.mode === 'sim' ? undefined : 'none' }}
    >
      <div className="compare-header">
        <h1 className="compare-title">{t('superdense.title', 'Superdense Coding')}</h1>
        <p className="compare-subtitle">
          {t(
            'superdense.subtitle',
            'Transmitting two classical bits of information by physically sending only one qubit, given a shared entangled pair prepared in advance'
          )}
        </p>
      </div>
      <div className="superdense-layout">
        <div className="card">
          <div className="card-title">{t('superdense.definitionTitle', 'What Is Superdense Coding?')}</div>
          <p className="bit-explainer">
            {t(
              'superdense.definitionBody1',
              'Superdense coding is a quantum communication protocol that transmits two classical bits of information by physically sending only a single qubit, provided the sender and receiver already share one half each of an entangled pair prepared in advance. It is the logical converse of quantum teleportation: teleportation spends two classical bits and a shared entangled pair to move one qubit of quantum information, while superdense coding spends one qubit and that same kind of shared pair to move two classical bits.'
            )}
          </p>
          <p className="bit-explainer" style={{ marginTop: '10px' }}>
            {t(
              'superdense.definitionBody2',
              'It is not a loophole in classical communication limits — an actual physical qubit still has to travel from sender to receiver for the protocol to work, so the transmission remains bounded by ordinary signal speed. As in the Teleportation tab, the two parties below are given their conventional quantum-information-theory labels: Alice for the sender, Bob for the receiver.'
            )}
          </p>
        </div>
        <div className="card superdense-circuit-card">
          <div className="card-title">{t('superdense.circuitTitle', 'The Protocol')}</div>
          <svg
            id="superdense-svg"
            viewBox="0 0 700 180"
            role="img"
            aria-label={t(
              'superdense.svgAlt',
              "Circuit diagram: Alice's qubit and Bob's qubit. A Hadamard and CNOT create an entangled pair. Alice conditionally applies X and/or Z to her own qubit only, encoding two classical bits. She then physically sends that qubit to Bob over a quantum channel. Bob, now holding both qubits, applies a CNOT and Hadamard to decode, then measures both to recover Alice's exact two bits."
            )}
          >
            <defs>
              <marker id="sd-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>
            <line x1="40" y1="50" x2="660" y2="50" stroke="var(--zero)" strokeWidth="2" opacity="0.55" />
            <line x1="40" y1="130" x2="660" y2="130" stroke="var(--one)" strokeWidth="2" opacity="0.55" />
            <text x="20" y="55" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--zero)">
              A
            </text>
            <text x="20" y="135" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--one)">
              B
            </text>
            <g id="superdense-stage-pair" className={`teleport-stage${activeStage === 'pair' ? ' active' : ''}`}>
              <rect x="70" y="30" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <text x="90" y="55" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--zero)">
                H
              </text>
              <line x1="150" y1="50" x2="150" y2="130" stroke="var(--text2)" strokeWidth="2" />
              <circle cx="150" cy="50" r="7" fill="var(--text2)" />
              <circle cx="150" cy="130" r="15" fill="none" stroke="var(--text2)" strokeWidth="2" />
              <line x1="150" y1="117" x2="150" y2="143" stroke="var(--text2)" strokeWidth="2" />
              <line x1="137" y1="130" x2="163" y2="130" stroke="var(--text2)" strokeWidth="2" />
            </g>
            <g id="superdense-stage-encode">
              <g id="superdense-gate-x" className={`circuit-gate${b1 !== '1' ? ' circuit-gate-off' : ''}`}>
                <rect x="200" y="30" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <text x="220" y="55" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--zero)">
                  X
                </text>
              </g>
              <g id="superdense-gate-z" className={`circuit-gate${b0 !== '1' ? ' circuit-gate-off' : ''}`}>
                <rect x="260" y="30" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
                <text x="280" y="55" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--zero)">
                  Z
                </text>
              </g>
            </g>
            <g id="superdense-channel" className={channelSending ? 'sending' : undefined}>
              <text x="360" y="20" textAnchor="middle" fontSize="10.5" fill="var(--text2)">
                {t('superdense.channelLabel', 'quantum channel')}
              </text>
              <line
                className="superdense-channel-wire"
                x1="320"
                y1="50"
                x2="400"
                y2="50"
                stroke="var(--zero)"
                strokeWidth="2"
                markerEnd="url(#sd-arr)"
              />
              <g className="superdense-particle-stream">
                <circle className="superdense-particle" cx="320" cy="50" r="1.6" fill="var(--zero)" style={{ '--dx': '80px', animationDelay: '0s' } as React.CSSProperties} />
                <circle className="superdense-particle" cx="320" cy="50" r="1.6" fill="var(--zero)" style={{ '--dx': '80px', animationDelay: '-0.4s' } as React.CSSProperties} />
                <circle className="superdense-particle" cx="320" cy="50" r="1.6" fill="var(--zero)" style={{ '--dx': '80px', animationDelay: '-0.8s' } as React.CSSProperties} />
              </g>
            </g>
            <g id="superdense-stage-decode" className={`teleport-stage${activeStage === 'decode' ? ' active' : ''}`}>
              <line x1="440" y1="50" x2="440" y2="130" stroke="var(--text2)" strokeWidth="2" />
              <circle cx="440" cy="50" r="7" fill="var(--text2)" />
              <circle cx="440" cy="130" r="15" fill="none" stroke="var(--text2)" strokeWidth="2" />
              <line x1="440" y1="117" x2="440" y2="143" stroke="var(--text2)" strokeWidth="2" />
              <line x1="427" y1="130" x2="453" y2="130" stroke="var(--text2)" strokeWidth="2" />
              <rect x="480" y="30" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <text x="500" y="55" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--zero)">
                H
              </text>
            </g>
            <g id="superdense-stage-measure" className={`teleport-stage${activeStage === 'measure' ? ' active' : ''}`}>
              <rect x="550" y="30" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--zero)" strokeWidth="1.5" />
              <path d="M562,58 A10,10 0 0 1 578,58" fill="none" stroke="var(--zero)" strokeWidth="1.6" />
              <line x1="570" y1="59" x2="577" y2="45" stroke="var(--zero)" strokeWidth="1.6" strokeLinecap="round" />
              <rect x="550" y="110" width="40" height="40" rx="6" fill="var(--surface2)" stroke="var(--one)" strokeWidth="1.5" />
              <path d="M562,138 A10,10 0 0 1 578,138" fill="none" stroke="var(--one)" strokeWidth="1.6" />
              <line x1="570" y1="139" x2="577" y2="125" stroke="var(--one)" strokeWidth="1.6" strokeLinecap="round" />
            </g>
            <text x="625" y="45" textAnchor="middle" fontSize="11" fill="var(--text2)">
              {t('superdense.finalLabelA', 'd₀')}
            </text>
            <text x="625" y="125" textAnchor="middle" fontSize="11" fill="var(--text2)">
              {t('superdense.finalLabelB', 'd₁')}
            </text>
          </svg>
          <div className="superdense-actions">
            <button className="btn-run" id="btn-superdense-send" disabled={animating} onClick={sendSuperdense}>
              {t('superdense.sendBtn', 'Send')}
            </button>
            <span className="muted-text" id="superdense-result">
              {resultText}
            </span>
          </div>
        </div>
        <div className="superdense-controls-grid">
          <div className="card">
            <div className="card-title">{t('superdense.messageTitle', 'Message to Send')}</div>
            <p className="bit-explainer">
              {t('superdense.messageBody', 'Pick any 2-bit message — this is what Alice encodes onto her single qubit before sending it to Bob.')}
            </p>
            <div className="mode-grid" id="superdense-message-picker" style={{ gridTemplateColumns: 'repeat(4,1fr)', maxWidth: '340px', margin: '12px auto 0' }}>
              {(['00', '01', '10', '11'] as const).map((m) => (
                <button
                  key={m}
                  className={`preset-btn mode-btn${msg === m ? ' active' : ''}`}
                  data-superdense-msg={m}
                  onClick={() => selectMessage(m)}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="teleport-bits-row" style={{ marginTop: '16px' }}>
              <div className="teleport-bit-chip">
                <span className="teleport-bit-label">{t('superdense.sentLabel', 'Alice sent')}</span>
                <span className="teleport-bit-val" id="superdense-sent-val">
                  {msg}
                </span>
              </div>
              <div className="teleport-bit-chip">
                <span className="teleport-bit-label">{t('superdense.receivedLabel', 'Bob decoded')}</span>
                <span className={`teleport-bit-val${receivedSet ? ' set' : ''}`} id="superdense-received-val">
                  {receivedVal}
                </span>
              </div>
            </div>
            <p className="muted-text" id="superdense-tally-text" style={{ marginTop: '10px', textAlign: 'center' }}>
              {tallyText}
            </p>
            <button className="btn-secondary" id="btn-reset-superdense" style={{ marginTop: '6px' }} onClick={resetSuperdense}>
              {t('common.reset', 'Reset')}
            </button>
          </div>
          <div className="card explainer-card">
            <div className="card-title">{t('common.whatJustHappened', 'What just happened')}</div>
            <Explainer id="superdense-explainer" html={explainer} />
          </div>
        </div>
        <div className="card mt-14">
          <div className="card-title">{t('superdense.whyChannelTitle', 'Why This Still Needs a Quantum Channel')}</div>
          <p className="bit-explainer">
            {t(
              'superdense.whyChannelBody',
              'Teleportation moved a qubit\'s worth of information using only classical bits, which is why it can\'t outrun the speed of light. Superdense coding runs the opposite direction — it moves 2 classical bits using only 1 qubit of communication, which sounds like it\'s beating the classical limit, but it isn\'t a loophole: an actual physical qubit still has to travel from Alice to Bob for this to work. The "savings" is real (1 qubit instead of 2 classical bits\' worth of separate signal), but it\'s still bounded by however fast that qubit itself can travel.'
            )}
          </p>
        </div>
        <div className="card mt-14">
          <div className="card-title">{t('superdense.compareTitle', 'Teleportation vs. Superdense Coding')}</div>
          <p className="bit-explainer">
            {t(
              'superdense.compareBody',
              'Same resource — one pre-shared entangled pair — spent in opposite directions. Teleportation sends 1 qubit of quantum information using 2 classical bits; superdense coding sends 2 classical bits of information using 1 qubit. Both need that entangled pair set up in advance, and both end by running essentially the same Bell-basis circuit (a CNOT then a Hadamard) — teleportation runs it on the sending side to read a state out, superdense coding runs it on the receiving side to read a message in.'
            )}
          </p>
        </div>
      </div>
      <LessonEmbed id="superdense" />
    </section>
  );
}
