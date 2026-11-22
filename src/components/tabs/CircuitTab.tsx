import { useEffect, useMemo, useRef, useState } from 'react';
import type { Complex } from '../../core/complex.ts';
import { GATES, type GateKey } from '../../core/gates.ts';
import { Qubit, blochVectorLabel } from '../../core/qubit.ts';
import { TwoQubitState } from '../../core/twoQubit.ts';
import { ThreeQubitState } from '../../core/threeQubit.ts';
import {
  CLASSICAL_GATES,
  classicalGateIconSVG,
  classicalGateInnerSVG,
  type ClassicalGateKey,
} from '../../core/classicalGates.ts';
import { delay } from '../../core/pulse.ts';
import { useI18n } from '../../hooks/useI18n.ts';
import { useNav } from '../../hooks/useNav.ts';
import { setTabSub } from '../../state/nav.ts';
import BlochSphere from '../BlochSphere.tsx';
import Explainer from '../Explainer.tsx';
import LessonEmbed from '../LessonEmbed.tsx';

const SLOT_COUNT = 8;
const CIRCUIT_MULTIQUBIT_MAX_STEPS = 10;
const CNOT_HIST_COLOR = '#5B8DEF';
const TOFFOLI_HIST_COLOR = '#34D399';
const CIRCUIT2_KETS = ['00', '01', '10', '11'];
const CIRCUIT3_KETS = ['000', '001', '010', '011', '100', '101', '110', '111'];

const HA_SVG_WIDTH = 280;
const HA_ROW_HEIGHT = 56;
const HA_TOP_PAD = 20;
const HA_BOTTOM_PAD = 18;
const HA_BUS_A_X = 26;
const HA_BUS_B_X = 42;
const HA_GATE_X = 74;

const HA_METER_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
  <path d="M4 18a8 8 0 0 1 16 0" fill="none" stroke="currentColor" stroke-width="2"/>
  <line x1="12" y1="18" x2="17" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <circle cx="12" cy="18" r="1.6" fill="currentColor"/>
</svg>`;

interface Circuit1Preset {
  name: string;
  gates: GateKey[];
}

const CIRCUIT_PRESETS: Circuit1Preset[] = [
  { name: 'Superposition', gates: ['H'] },
  { name: 'Bit Flip', gates: ['X'] },
  { name: 'Hidden Phase', gates: ['H', 'Z', 'H'] },
];

export type MultiGateEntry =
  | { type: 'single'; qubit: number; key: GateKey }
  | { type: 'cnot'; control: number; target: number }
  | { type: 'toffoli'; control1: number; control2: number; target: number };

interface MultiCircuitPreset {
  name: string;
  gates: MultiGateEntry[];
}

const CIRCUIT2_PRESETS: MultiCircuitPreset[] = [
  {
    name: 'Bell Pair',
    gates: [
      { type: 'single', qubit: 0, key: 'H' },
      { type: 'cnot', control: 0, target: 1 },
    ],
  },
  {
    name: 'Flip Both',
    gates: [
      { type: 'single', qubit: 0, key: 'X' },
      { type: 'single', qubit: 1, key: 'X' },
    ],
  },
  {
    name: 'Anti-Correlated',
    gates: [
      { type: 'single', qubit: 0, key: 'H' },
      { type: 'single', qubit: 1, key: 'X' },
      { type: 'cnot', control: 0, target: 1 },
    ],
  },
];

const CIRCUIT3_PRESETS: MultiCircuitPreset[] = [
  {
    name: 'GHZ State',
    gates: [
      { type: 'single', qubit: 0, key: 'H' },
      { type: 'cnot', control: 0, target: 1 },
      { type: 'cnot', control: 0, target: 2 },
    ],
  },
  {
    name: 'Flip All Three',
    gates: [
      { type: 'single', qubit: 0, key: 'X' },
      { type: 'single', qubit: 1, key: 'X' },
      { type: 'single', qubit: 2, key: 'X' },
    ],
  },
  {
    name: 'Partial Entangle',
    gates: [
      { type: 'single', qubit: 0, key: 'H' },
      { type: 'cnot', control: 0, target: 1 },
    ],
  },
  {
    name: 'Half Adder (A=1,B=1)',
    gates: [
      { type: 'single', qubit: 0, key: 'X' },
      { type: 'single', qubit: 1, key: 'X' },
      { type: 'toffoli', control1: 0, control2: 1, target: 2 },
      { type: 'cnot', control: 0, target: 1 },
    ],
  },
];

interface Circuit1HistoryEntry {
  theta: number;
  phi: number;
  label: string;
  color: string;
  title: string;
  explain: string;
}

interface MultiHistoryEntry {
  amps: Complex[];
  label: string;
  color: string;
  title: string;
  explain: string;
}

function entryLabel(entry: MultiGateEntry): string {
  if (entry.type === 'cnot') return `CNOT Q${entry.control}→Q${entry.target}`;
  if (entry.type === 'toffoli') return `Toffoli Q${entry.control1},Q${entry.control2}→Q${entry.target}`;
  return `${GATES[entry.key].name} on Q${entry.qubit}`;
}

function describeStepColor(entry: MultiGateEntry): string {
  if (entry.type === 'cnot') return CNOT_HIST_COLOR;
  if (entry.type === 'toffoli') return TOFFOLI_HIST_COLOR;
  return GATES[entry.key].color;
}

function describeStepExplain(entry: MultiGateEntry, i: number, formula: string): string {
  const color = describeStepColor(entry);
  if (entry.type === 'cnot') {
    return (
      `<strong style="color:${color}">Step ${i + 1}: ${entryLabel(entry)}.</strong> Flips Q${entry.target}'s bit whenever Q${entry.control} is |1⟩ — the entangling move behind every Bell pair and GHZ state. ` +
      `<br><br>State is now <span style="font-family:'JetBrains Mono',monospace">${formula}</span>.`
    );
  }
  if (entry.type === 'toffoli') {
    return (
      `<strong style="color:${color}">Step ${i + 1}: ${entryLabel(entry)}.</strong> Flips Q${entry.target}'s bit only when BOTH Q${entry.control1} and Q${entry.control2} are |1⟩ — with the target starting at |0⟩, that computes Q${entry.target} = Q${entry.control1} AND Q${entry.control2}, the Carry half of a half adder (a Toffoli is the reversible-logic stand-in for a classical AND gate). ` +
      `<br><br>State is now <span style="font-family:'JetBrains Mono',monospace">${formula}</span>.`
    );
  }
  const gate = GATES[entry.key];
  return (
    `<strong style="color:${color}">Step ${i + 1}: ${entryLabel(entry)} — ${gate.desc}.</strong> ${gate.explain} ` +
    `<br><br>State is now <span style="font-family:'JetBrains Mono',monospace">${formula}</span>.`
  );
}

function describeOutcome2(state: TwoQubitState): string {
  const p00 = state.prob(0),
    p11 = state.prob(3);
  const entangled = p00 > 0.001 && p11 > 0.001 && state.prob(1) < 0.001 && state.prob(2) < 0.001;
  return entangled
    ? `That's an entangled pair: only |00⟩ (${Math.round(p00 * 100)}%) and |11⟩ (${Math.round(p11 * 100)}%) show up — measuring one qubit instantly tells you the other, exactly like the Entangle tab, except this time H + CNOT built it from scratch.`
    : `Sequence complete. Final state: ${state.getFormula()}.`;
}

function describeOutcome3(state: ThreeQubitState): string {
  const p000 = state.prob(0),
    p111 = state.prob(7);
  const others = [1, 2, 3, 4, 5, 6].every((i) => state.prob(i) < 0.001);
  const ghz = p000 > 0.001 && p111 > 0.001 && others;
  return ghz
    ? `That's a GHZ state: only |000⟩ (${Math.round(p000 * 100)}%) and |111⟩ (${Math.round(p111 * 100)}%) show up — measuring any one of the three qubits instantly tells you all three, a three-way version of the entangled pair from the Entangle tab.`
    : `Sequence complete. Final state: ${state.getFormula()}.`;
}

function TryMePresets<T extends { name: string }>({
  id,
  presets,
  onSelect,
}: {
  id: string;
  presets: T[];
  onSelect: (p: T) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="try-me-wrap" id={id} style={{ marginTop: '10px' }}>
      <button
        className={`try-me-toggle${open ? ' active' : ''}`}
        type="button"
        onClick={() => setOpen((o) => !o)}
      >
        {t('common.tryMePresets', '🎲 Try me — preset circuits')}
      </button>
      <div className="try-me-presets" style={{ display: open ? 'flex' : 'none' }}>
        {presets.map((p, i) => (
          <button key={i} className="try-preset-btn" data-i={i} onClick={() => onSelect(p)}>
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiDiagram({
  n,
  id,
  className,
  gates,
  runningStep,
  onRemove,
}: {
  n: 2 | 3;
  id: string;
  className: string;
  gates: MultiGateEntry[];
  runningStep: number | null;
  onRemove: (idx: number) => void;
}) {
  const rows = Array.from({ length: n }, (_, i) => i + 1);
  const cols = Array.from({ length: CIRCUIT_MULTIQUBIT_MAX_STEPS }, (_, i) => i);

  return (
    <div className={className} id={id}>
      {rows.map((row) => (
        <div key={`wire-${row}`} style={{ display: 'contents' }}>
          <div className="circuit2-ket" style={{ gridColumn: 1, gridRow: row }}>
            |0⟩
          </div>
          <div className="circuit2-wire" style={{ gridColumn: '2/-1', gridRow: row }} />
        </div>
      ))}
      {cols.map((c) => {
        const col = c + 2;
        const entry = gates[c];
        const isRunning = runningStep === c;
        const runCls = isRunning ? ' running' : '';

        if (!entry) {
          const isHint = c === 0 && gates.length === 0;
          return (
            <div key={`col-${c}`} style={{ display: 'contents' }}>
              {rows.map((row) => (
                <div
                  key={`empty-${c}-${row}`}
                  className={`circuit2-cell empty${isHint && row === 1 ? ' circuit2-cell-hint' : ''}`}
                  style={{ gridColumn: col, gridRow: row }}
                >
                  {isHint && row === 1 ? '+' : ''}
                </div>
              ))}
            </div>
          );
        }

        if (entry.type === 'single') {
          const g = GATES[entry.key];
          const row = entry.qubit + 1;
          return (
            <div key={`col-${c}`} style={{ display: 'contents' }}>
              <button
                className={`circuit2-cell circuit2-gate${runCls}`}
                data-i={c}
                style={{ gridColumn: col, gridRow: row, color: g.color, borderColor: g.color }}
                title={`${entryLabel(entry)} — click to remove`}
                onClick={() => onRemove(c)}
              >
                {g.name}
              </button>
              {n > 2 &&
                rows
                  .filter((r2) => r2 !== row)
                  .map((r2) => (
                    <div
                      key={`fill-${c}-${r2}`}
                      className="circuit2-cell empty"
                      style={{ gridColumn: col, gridRow: r2 }}
                    />
                  ))}
            </div>
          );
        }

        if (entry.type === 'toffoli') {
          const c1Row = entry.control1 + 1;
          const c2Row = entry.control2 + 1;
          const tRow = entry.target + 1;
          const lineStart = Math.min(c1Row, c2Row, tRow);
          const lineEnd = Math.max(c1Row, c2Row, tRow) + 1;
          return (
            <div key={`col-${c}`} style={{ display: 'contents' }}>
              <div
                className="circuit2-cnot-line"
                style={{ gridColumn: col, gridRow: `${lineStart}/${lineEnd}` }}
              />
              <button
                className={`circuit2-cell circuit2-cnot-dot${runCls}`}
                data-i={c}
                style={{ gridColumn: col, gridRow: c1Row }}
                title={`${entryLabel(entry)} — click to remove`}
                onClick={() => onRemove(c)}
              />
              <button
                className={`circuit2-cell circuit2-cnot-dot${runCls}`}
                data-i={c}
                style={{ gridColumn: col, gridRow: c2Row }}
                title={`${entryLabel(entry)} — click to remove`}
                onClick={() => onRemove(c)}
              />
              <button
                className={`circuit2-cell circuit2-cnot-target${runCls}`}
                data-i={c}
                style={{ gridColumn: col, gridRow: tRow }}
                title={`${entryLabel(entry)} — click to remove`}
                onClick={() => onRemove(c)}
              >
                ⊕
              </button>
            </div>
          );
        }

        const controlRow = entry.control + 1;
        const targetRow = entry.target + 1;
        const lineStart = Math.min(controlRow, targetRow);
        const lineEnd = Math.max(controlRow, targetRow) + 1;
        return (
          <div key={`col-${c}`} style={{ display: 'contents' }}>
            <div
              className="circuit2-cnot-line"
              style={{ gridColumn: col, gridRow: `${lineStart}/${lineEnd}` }}
            />
            <button
              className={`circuit2-cell circuit2-cnot-dot${runCls}`}
              data-i={c}
              style={{ gridColumn: col, gridRow: controlRow }}
              title={`${entryLabel(entry)} — click to remove`}
              onClick={() => onRemove(c)}
            />
            <button
              className={`circuit2-cell circuit2-cnot-target${runCls}`}
              data-i={c}
              style={{ gridColumn: col, gridRow: targetRow }}
              title={`${entryLabel(entry)} — click to remove`}
              onClick={() => onRemove(c)}
            >
              ⊕
            </button>
            {rows
              .filter((r2) => r2 !== controlRow && r2 !== targetRow)
              .map((r2) => (
                <div
                  key={`fill-${c}-${r2}`}
                  className="circuit2-cell empty"
                  style={{ gridColumn: col, gridRow: r2 }}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}

export default function CircuitTab() {
  const { t } = useI18n();
  const nav = useNav();
  const isActive = nav.mode === 'sim' && nav.tab === 'circuit';

  const domain = nav.sub.circuit?.circuitDomain || 'quantum';
  const circuitMode = nav.sub.circuit?.circuitMode || '1q';

  // Classical half adder state
  const [halfAdderA, setHalfAdderA] = useState<0 | 1>(0);
  const [halfAdderB, setHalfAdderB] = useState<0 | 1>(0);
  const [haGates, setHaGates] = useState<Array<{ key: ClassicalGateKey }>>([]);
  const [armedGateKey, setArmedGateKey] = useState<ClassicalGateKey | null>(null);
  const [haCustomExplainer, setHaCustomExplainer] = useState<string | null>(null);
  const [dropDragOver, setDropDragOver] = useState(false);
  const [dropRejected, setDropRejected] = useState(false);

  // 1Q state
  const [circuitGates, setCircuitGates] = useState<GateKey[]>([]);
  const [qubit1, setQubit1] = useState<Qubit>(() => new Qubit());
  const [c1Status, setC1Status] = useState('');
  const [c1Explainer, setC1Explainer] = useState(
    'Lay down a path by clicking gates above — each one claims the next checkpoint on the wire. Press Run and the qubit walks it from |0⟩ to the end, one stop at a time.'
  );
  const [c1History, setC1History] = useState<Circuit1HistoryEntry[]>([]);
  const [c1Cursor, setC1Cursor] = useState(-1);
  const [c1Running, setC1Running] = useState(false);
  const [c1RunningSlot, setC1RunningSlot] = useState<number | null>(null);
  const [shareText, setShareText] = useState<string | null>(null);

  // 2Q state
  const [c2Gates, setC2Gates] = useState<MultiGateEntry[]>([]);
  const [c2Target, setC2Target] = useState(0);
  const [c2State, setC2State] = useState<TwoQubitState>(() => new TwoQubitState());
  const [c2Status, setC2Status] = useState('');
  const [c2Explainer, setC2Explainer] = useState(
    "Two qubits, no entanglement yet. Try adding H to Qubit 0, then CNOT Q0→Q1, then press Run — that's the exact recipe behind the Bell state you saw in the Entangle tab, except this time you built it gate by gate."
  );
  const [c2History, setC2History] = useState<MultiHistoryEntry[]>([]);
  const [c2Cursor, setC2Cursor] = useState(-1);
  const [c2Running, setC2Running] = useState(false);
  const [c2RunningStep, setC2RunningStep] = useState<number | null>(null);

  // 3Q state
  const [c3Gates, setC3Gates] = useState<MultiGateEntry[]>([]);
  const [c3Target, setC3Target] = useState(0);
  const [c3State, setC3State] = useState<ThreeQubitState>(() => new ThreeQubitState());
  const [c3Status, setC3Status] = useState('');
  const [c3Explainer, setC3Explainer] = useState(
    "Three qubits, all starting at |000⟩. Try H on Qubit 0, then CNOT Q0→Q1, then CNOT Q0→Q2 — that recipe spreads one qubit's coin flip across all three, a three-way GHZ state."
  );
  const [c3History, setC3History] = useState<MultiHistoryEntry[]>([]);
  const [c3Cursor, setC3Cursor] = useState(-1);
  const [c3Running, setC3Running] = useState(false);
  const [c3RunningStep, setC3RunningStep] = useState<number | null>(null);
  const [cnot3Control, setCnot3Control] = useState(0);
  const [cnot3Target, setCnot3Target] = useState(1);
  const [tof3Control1, setTof3Control1] = useState(0);
  const [tof3Control2, setTof3Control2] = useState(1);
  const [tof3Target, setTof3Target] = useState(2);

  const dropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (nav.sharedCircuitGates && nav.sharedCircuitGates.length > 0) {
      const valid = nav.sharedCircuitGates.filter((k): k is GateKey => k in GATES).slice(0, SLOT_COUNT);
      if (valid.length > 0) {
        setCircuitGates(valid);
      }
    }
  }, [nav.sharedCircuitGates]);

  // Classical half adder helpers
  function flashRejected() {
    setDropRejected(false);
    requestAnimationFrame(() => {
      setDropRejected(true);
      setTimeout(() => setDropRejected(false), 500);
    });
  }

  function addHalfAdderGate(rawKey: string) {
    if (!rawKey || !(rawKey in CLASSICAL_GATES)) return;
    const key = rawKey as ClassicalGateKey;
    if (CLASSICAL_GATES[key].inputs !== 2) {
      setHaCustomExplainer(
        `${CLASSICAL_GATES[key].name} only takes one input — this circuit's rows each need a gate that reads both A and B (AND, OR, XOR, NAND, NOR, or XNOR).`
      );
      flashRejected();
      return;
    }
    setHaCustomExplainer(null);
    setHaGates((prev) => [...prev, { key }]);
  }

  function removeHalfAdderGate(index: number) {
    setHaCustomExplainer(null);
    setHaGates((prev) => prev.filter((_, i) => i !== index));
  }

  const hasXor = haGates.some((g) => g.key === 'XOR');
  const hasAnd = haGates.some((g) => g.key === 'AND');

  const haDefaultExplainer = useMemo(() => {
    if (haGates.length === 0) {
      return 'Drag a gate — or click one, then click the circuit board — to add it as a new row, wired to A and B automatically. A half adder needs one row computing Sum = A⊕B (XOR) and another computing Carry = A·B (AND), from the exact same two inputs.';
    }
    const sum = hasXor ? CLASSICAL_GATES.XOR.fn(halfAdderA, halfAdderB) : null;
    const carry = hasAnd ? CLASSICAL_GATES.AND.fn(halfAdderA, halfAdderB) : null;
    if (hasXor && hasAnd) {
      const extra =
        haGates.length > 2
          ? ` (plus ${haGates.length - 2} extra gate${haGates.length - 2 === 1 ? '' : 's'} — harmless, but not needed)`
          : '';
      return `<strong style="color:var(--success)">That's a correct half adder.</strong> A=${halfAdderA}, B=${halfAdderB} → Sum = ${sum}, Carry = ${carry}${extra}. XOR catches the bit-by-bit total, AND catches the overflow — together they're the two gates every full adder is built from.`;
    }
    if (!hasXor && !hasAnd) {
      return `A=${halfAdderA}, B=${halfAdderB} — ${haGates.length} gate${haGates.length === 1 ? '' : 's'} placed, but none of them are XOR or AND yet. Compare against the target truth table on the right: a true half adder needs an XOR row (for Sum) and an AND row (for Carry).`;
    }
    return `A=${halfAdderA}, B=${halfAdderB} — you've got ${hasXor ? 'the XOR (Sum)' : 'the AND (Carry)'} row, but still need ${hasXor ? 'an AND row for Carry' : 'an XOR row for Sum'} to complete the half adder.`;
  }, [haGates, halfAdderA, halfAdderB, hasXor, hasAnd]);

  const haExplainer = haCustomExplainer ?? haDefaultExplainer;
  const haStatus =
    haGates.length === 0
      ? ''
      : hasXor && hasAnd
        ? '✓ half adder present'
        : `${haGates.length} gate${haGates.length === 1 ? '' : 's'}`;

  // 1Q helpers
  function addGateToCircuit1(key: GateKey) {
    if (circuitGates.length >= SLOT_COUNT) {
      setC1Status('Circuit full — clear to reset');
      return;
    }
    const next = [...circuitGates, key];
    setCircuitGates(next);
    setC1Status('');
    setC1Explainer(
      next.length === 1
        ? `${GATES[key].name} takes the first checkpoint on the wire. The qubit hasn't moved yet, though — it's still sitting at |0⟩ until you hit Run and send it walking down the line.`
        : `Checkpoint ${next.length} is now ${GATES[key].name}. The route so far: ${next.map((k) => GATES[k].name).join(' → ')}. Hit Run and the qubit will walk it start to finish.`
    );
  }

  function removeCircuit1Gate(i: number) {
    if (i < circuitGates.length) {
      const next = circuitGates.filter((_, idx) => idx !== i);
      setCircuitGates(next);
      setC1Explainer(
        next.length
          ? `Checkpoint removed. Remaining route: ${next.map((k) => GATES[k].name).join(' → ')}.`
          : 'Route cleared — the wire is empty. Click gates above to lay down a new path.'
      );
    }
  }

  async function runCircuit1(gatesToRun: GateKey[] = circuitGates) {
    if (c1Running) return;
    if (gatesToRun.length === 0) {
      setC1Status('Add gates first');
      setC1Explainer(
        "The wire is empty — there's no path to walk yet. Click gates in the palette above to lay one down, then press Run."
      );
      return;
    }
    setC1Running(true);
    const q = new Qubit();
    setQubit1(q.clone());
    setC1Status('Running…');
    setC1Explainer('The qubit steps onto the wire at |0⟩ and starts walking the line, left to right…');
    setC1History([]);
    setC1Cursor(-1);

    const runHist: Circuit1HistoryEntry[] = [];
    for (let i = 0; i < gatesToRun.length; i++) {
      const key = gatesToRun[i];
      const gate = GATES[key];
      setC1RunningSlot(i);
      setC1Explainer(
        `Checkpoint ${i + 1} of ${gatesToRun.length}: ${gate.name} — ${gate.desc.toLowerCase()}. ${gate.explain.split('.')[0]}.`
      );
      await delay(320);
      q.applyGate(gate.matrix);
      setQubit1(q.clone());
      const b = q.getBloch();
      const p0 = Math.round(q.prob0() * 100);
      const p1 = Math.round(q.prob1() * 100);
      const explain = `<strong style="color:${gate.color}">Step ${i + 1}: ${gate.name} — ${gate.desc}.</strong> ${gate.explain} <br><br>State is now <span style="font-family:'JetBrains Mono',monospace">${q.getFormula()}</span> — ${p0}% |0⟩, ${p1}% |1⟩.`;
      runHist.push({
        theta: b.theta,
        phi: b.phi,
        label: String(i + 1),
        color: gate.color,
        title: `Step ${i + 1}: ${gate.name} — ${q.getFormula()}`,
        explain,
      });
      setC1History([...runHist]);
      setC1Cursor(runHist.length - 1);
      await delay(130);
      setC1RunningSlot(null);
    }
    setC1Running(false);
    setC1Status(`Done · ${q.getLabel()}`);
    const p0 = Math.round(q.prob0() * 100);
    const p1 = Math.round(q.prob1() * 100);
    setC1Explainer(
      `Journey complete. After passing through ${gatesToRun.map((k) => GATES[k].name).join(' → ')}, the qubit arrives at ${q.getFormula()} — a ${p0}% / ${p1}% shot at |0⟩ vs |1⟩ if you measured it right now.`
    );
  }

  function restoreCircuit1Step(i: number) {
    if (c1Running) return;
    const entry = c1History[i];
    if (!entry) return;
    setC1Cursor(i);
    const q = new Qubit();
    q.setState(entry.theta, entry.phi);
    setQubit1(q);
    setC1Status(`Step ${entry.label} of ${c1History.length}`);
    setC1Explainer(entry.explain);
  }

  function clearCircuit1() {
    if (c1Running) return;
    setCircuitGates([]);
    setQubit1(new Qubit());
    setC1Status('');
    setC1Explainer(
      'Route cleared. Lay down a path by clicking gates above — each one claims the next checkpoint on the wire. Press Run and the qubit walks it from |0⟩ to the end, one stop at a time.'
    );
    setC1History([]);
    setC1Cursor(-1);
  }

  async function copyShareCircuit1() {
    const params = new URLSearchParams({
      tab: 'circuit',
      circuit: circuitGates.join(','),
    });
    const url = `${location.origin}${location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareText('Copied!');
    } catch {
      setShareText('Copy failed');
    }
    setTimeout(() => setShareText(null), 1400);
  }

  // 2Q helpers
  function addGate2(entry: MultiGateEntry) {
    if (c2Gates.length >= CIRCUIT_MULTIQUBIT_MAX_STEPS) {
      setC2Status('Sequence full — clear to reset');
      return;
    }
    setC2Gates((prev) => [...prev, entry]);
    setC2Status('');
  }

  async function runCircuit2(gatesToRun: MultiGateEntry[] = c2Gates) {
    if (c2Running) return;
    if (gatesToRun.length === 0) {
      setC2Status('Add gates first');
      return;
    }
    setC2Running(true);
    const st = new TwoQubitState();
    setC2State(st);
    setC2Status('Running…');
    setC2Explainer('Both qubits start at |00⟩ and step through the sequence in order…');
    setC2History([]);
    setC2Cursor(-1);

    const hist: MultiHistoryEntry[] = [];
    for (let i = 0; i < gatesToRun.length; i++) {
      const entry = gatesToRun[i];
      setC2RunningStep(i);
      setC2Explainer(`Step ${i + 1} of ${gatesToRun.length}: ${entryLabel(entry)}.`);
      await delay(320);
      if (entry.type === 'cnot') {
        st.applyCNOT(entry.control, entry.target);
      } else if (entry.type === 'single') {
        st.applySingleQubitGate(entry.qubit, GATES[entry.key].matrix);
      }
      const nextSt = new TwoQubitState();
      nextSt.amps = st.amps.map((a) => ({ ...a }));
      setC2State(nextSt);

      hist.push({
        amps: st.amps.map((a) => ({ ...a })),
        label: String(i + 1),
        color: describeStepColor(entry),
        title: `Step ${i + 1}: ${entryLabel(entry)} — ${st.getFormula()}`,
        explain: describeStepExplain(entry, i, st.getFormula()),
      });
      setC2History([...hist]);
      setC2Cursor(hist.length - 1);
      await delay(130);
      setC2RunningStep(null);
    }

    setC2Running(false);
    setC2Status('Done');
    setC2Explainer(describeOutcome2(st));
  }

  function restoreCircuit2Step(i: number) {
    if (c2Running) return;
    const entry = c2History[i];
    if (!entry) return;
    setC2Cursor(i);
    const st = new TwoQubitState();
    st.amps = entry.amps.map((a) => ({ ...a }));
    setC2State(st);
    setC2Status(`Step ${entry.label} of ${c2History.length}`);
    setC2Explainer(entry.explain);
  }

  function clearCircuit2() {
    if (c2Running) return;
    setC2Gates([]);
    setC2State(new TwoQubitState());
    setC2Status('');
    setC2Explainer(
      "Two qubits, no entanglement yet. Try adding H to Qubit 0, then CNOT Q0→Q1, then press Run — that's the exact recipe behind the Bell state you saw in the Entangle tab, except this time you built it gate by gate."
    );
    setC2History([]);
    setC2Cursor(-1);
  }

  // 3Q helpers
  function addGate3(entry: MultiGateEntry) {
    if (c3Gates.length >= CIRCUIT_MULTIQUBIT_MAX_STEPS) {
      setC3Status('Sequence full — clear to reset');
      return;
    }
    setC3Gates((prev) => [...prev, entry]);
    setC3Status('');
  }

  async function runCircuit3(gatesToRun: MultiGateEntry[] = c3Gates) {
    if (c3Running) return;
    if (gatesToRun.length === 0) {
      setC3Status('Add gates first');
      return;
    }
    setC3Running(true);
    const st = new ThreeQubitState();
    setC3State(st);
    setC3Status('Running…');
    setC3Explainer('All three qubits start at |000⟩ and step through the sequence in order…');
    setC3History([]);
    setC3Cursor(-1);

    const hist: MultiHistoryEntry[] = [];
    for (let i = 0; i < gatesToRun.length; i++) {
      const entry = gatesToRun[i];
      setC3RunningStep(i);
      setC3Explainer(`Step ${i + 1} of ${gatesToRun.length}: ${entryLabel(entry)}.`);
      await delay(320);
      if (entry.type === 'cnot') {
        st.applyCNOT(entry.control, entry.target);
      } else if (entry.type === 'toffoli') {
        st.applyToffoli(entry.control1, entry.control2, entry.target);
      } else {
        st.applySingleQubitGate(entry.qubit, GATES[entry.key].matrix);
      }
      const nextSt = new ThreeQubitState();
      nextSt.amps = st.amps.map((a) => ({ ...a }));
      setC3State(nextSt);

      hist.push({
        amps: st.amps.map((a) => ({ ...a })),
        label: String(i + 1),
        color: describeStepColor(entry),
        title: `Step ${i + 1}: ${entryLabel(entry)} — ${st.getFormula()}`,
        explain: describeStepExplain(entry, i, st.getFormula()),
      });
      setC3History([...hist]);
      setC3Cursor(hist.length - 1);
      await delay(130);
      setC3RunningStep(null);
    }

    setC3Running(false);
    setC3Status('Done');
    setC3Explainer(describeOutcome3(st));
  }

  function restoreCircuit3Step(i: number) {
    if (c3Running) return;
    const entry = c3History[i];
    if (!entry) return;
    setC3Cursor(i);
    const st = new ThreeQubitState();
    st.amps = entry.amps.map((a) => ({ ...a }));
    setC3State(st);
    setC3Status(`Step ${entry.label} of ${c3History.length}`);
    setC3Explainer(entry.explain);
  }

  function clearCircuit3() {
    if (c3Running) return;
    setC3Gates([]);
    setC3State(new ThreeQubitState());
    setC3Status('');
    setC3Explainer(
      "Three qubits, all starting at |000⟩. Try H on Qubit 0, then CNOT Q0→Q1, then CNOT Q0→Q2 — that recipe spreads one qubit's coin flip across all three, a three-way GHZ state."
    );
    setC3History([]);
    setC3Cursor(-1);
  }

  const b1 = qubit1.getBloch();
  const c1P0 = qubit1.prob0() * 100;
  const c1P1 = qubit1.prob1() * 100;

  const haTruthRows = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ].map(([a, b]) => ({ a, b, sum: a ^ b, carry: a & b }));

  const nHa = haGates.length;
  const haSvgHeight = nHa === 0 ? 100 : HA_TOP_PAD + nHa * HA_ROW_HEIGHT + HA_BOTTOM_PAD;
  const haLastTapA = HA_TOP_PAD + (nHa - 1) * HA_ROW_HEIGHT + 13;
  const haLastTapB = HA_TOP_PAD + (nHa - 1) * HA_ROW_HEIGHT + 27;

  return (
    <section
      id="tab-circuit"
      className={`tab-content${isActive ? ' active' : ''}`}
      style={{ display: nav.mode === 'sim' ? undefined : 'none' }}
    >
      <div className="compare-header">
        <h1 className="compare-title">{t('circuits.title', 'Circuits')}</h1>
        <p className="compare-subtitle">
          {t(
            'circuits.subtitle',
            'Classical gates combine bits with strict rules; quantum circuits walk a qubit through a route of gates, picking up rotations — pick a builder below'
          )}
        </p>
      </div>
      <div className="circuit-layout">
        <div className="mode-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', maxWidth: '480px', margin: '0 auto 18px' }}>
          <button
            className={`preset-btn mode-btn${domain === 'classical' ? ' active' : ''}`}
            data-circuit-domain="classical"
            onClick={() => setTabSub('circuit', { circuitDomain: 'classical' })}
          >
            {t('circuits.classicalCircuit', 'Classical Circuit')}
          </button>
          <button
            className={`preset-btn mode-btn${domain === 'quantum' ? ' active' : ''}`}
            data-circuit-domain="quantum"
            onClick={() => setTabSub('circuit', { circuitDomain: 'quantum' })}
          >
            {t('circuits.quantumCircuit', 'Quantum Circuit')}
          </button>
          <button
            className={`preset-btn mode-btn${domain === 'compare' ? ' active' : ''}`}
            data-circuit-domain="compare"
            onClick={() => setTabSub('circuit', { circuitDomain: 'compare' })}
          >
            {t('circuits.compareHalfAdder', 'Compare')}
          </button>
        </div>

        {/* CLASSICAL CIRCUIT PANEL */}
        <div id="circuit-classical-panel" style={{ display: domain === 'classical' ? undefined : 'none' }}>
          <div className="circuit-top">
            <div className="circuit-left">
              <div className="section-label">
                {t('circuits.gatePaletteDrag', 'Gate Palette — drag onto the circuit (or click, then click the circuit)')}
              </div>
              <div className="circuit-palette" id="classical-gate-palette">
                {(Object.keys(CLASSICAL_GATES) as ClassicalGateKey[]).map((key) => {
                  const g = CLASSICAL_GATES[key];
                  return (
                    <button
                      key={key}
                      className={`circuit-gate-btn classical-gate-palette-btn${armedGateKey === key ? ' is-armed' : ''}`}
                      title={g.desc}
                      draggable
                      data-gate-key={key}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', key);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onClick={() => setArmedGateKey((prev) => (prev === key ? null : key))}
                      dangerouslySetInnerHTML={{
                        __html: `${classicalGateIconSVG(key)}<span class="circuit-gate-btn-label">${g.name}</span>`,
                      }}
                    />
                  );
                })}
              </div>
              <div className="switch-area mt-14">
                <span className={`bit-label${halfAdderA === 0 ? ' active' : ''}`} id="ha-lbl-a0">
                  0
                </span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="ha-input-a"
                    checked={halfAdderA === 1}
                    onChange={(e) => setHalfAdderA(e.target.checked ? 1 : 0)}
                  />
                  <span className="toggle-track">
                    <span className="toggle-thumb" />
                  </span>
                </label>
                <span className={`bit-label${halfAdderA === 1 ? ' active' : ''}`} id="ha-lbl-a1">
                  1
                </span>
                <span className="muted-text" style={{ marginLeft: '10px' }}>
                  {t('gates.inputA', 'Input A')}
                </span>
              </div>
              <div className="switch-area">
                <span className={`bit-label${halfAdderB === 0 ? ' active' : ''}`} id="ha-lbl-b0">
                  0
                </span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="ha-input-b"
                    checked={halfAdderB === 1}
                    onChange={(e) => setHalfAdderB(e.target.checked ? 1 : 0)}
                  />
                  <span className="toggle-track">
                    <span className="toggle-thumb" />
                  </span>
                </label>
                <span className={`bit-label${halfAdderB === 1 ? ' active' : ''}`} id="ha-lbl-b1">
                  1
                </span>
                <span className="muted-text" style={{ marginLeft: '10px' }}>
                  {t('gates.inputB', 'Input B')}
                </span>
              </div>
              <div className="circuit-actions">
                <button
                  className="btn-secondary"
                  id="btn-clear-halfadder"
                  onClick={() => {
                    setHaCustomExplainer(null);
                    setHaGates([]);
                  }}
                >
                  {t('common.clear', 'Clear')}
                </button>
                <span
                  className="muted-text"
                  id="halfadder-status"
                  style={{ color: hasXor && hasAnd ? 'var(--success)' : 'var(--text3)' }}
                >
                  {haStatus}
                </span>
              </div>
              <div className="card explainer-card mt-14">
                <div className="card-title">{t('circuits.whatsGoingOn', "What's going on")}</div>
                <Explainer id="halfadder-explainer" html={haExplainer} />
              </div>
            </div>
            <div className="circuit-right">
              <div className="section-label">
                {t('circuits.halfAdderCircuit', 'Circuit — drag gates here, A and B wire into every one')}
              </div>
              <div
                ref={dropRef}
                className={`halfadder-circuit-wrap${dropDragOver ? ' drag-over' : ''}${dropRejected ? ' drop-rejected' : ''}`}
                id="halfadder-circuit-drop"
                tabIndex={0}
                role="button"
                aria-label="Circuit board — drag a gate here, or click a gate then click here, to add it wired to A and B"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                  setDropDragOver(true);
                }}
                onDragLeave={() => setDropDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropDragOver(false);
                  addHalfAdderGate(e.dataTransfer.getData('text/plain'));
                }}
                onClick={() => {
                  if (armedGateKey) {
                    addHalfAdderGate(armedGateKey);
                    setArmedGateKey(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (armedGateKey) {
                      addHalfAdderGate(armedGateKey);
                      setArmedGateKey(null);
                    }
                  }
                }}
              >
                <svg
                  id="halfadder-circuit-svg"
                  viewBox={`0 0 ${HA_SVG_WIDTH} ${haSvgHeight}`}
                  role="img"
                  aria-label={
                    nHa === 0
                      ? 'Half adder circuit diagram, currently empty.'
                      : `Half adder circuit diagram with ${nHa} gate${nHa === 1 ? '' : 's'}.`
                  }
                >
                  {nHa === 0 ? (
                    <>
                      <rect
                        x="10"
                        y="10"
                        width={HA_SVG_WIDTH - 20}
                        height="80"
                        rx="10"
                        fill="none"
                        stroke="var(--border2)"
                        strokeWidth="2"
                        strokeDasharray="6,5"
                      />
                      <text
                        x={HA_SVG_WIDTH / 2}
                        y="46"
                        textAnchor="middle"
                        fill="var(--text3)"
                        fontSize="13"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        +
                      </text>
                      <text
                        x={HA_SVG_WIDTH / 2}
                        y="66"
                        textAnchor="middle"
                        fill="var(--text3)"
                        fontSize="10"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        drag a gate here
                      </text>
                    </>
                  ) : (
                    <>
                      <text
                        x={HA_BUS_A_X}
                        y={HA_TOP_PAD - 8}
                        textAnchor="middle"
                        fill="var(--zero)"
                        fontSize="11"
                        fontWeight="700"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        A={halfAdderA}
                      </text>
                      <text
                        x={HA_BUS_B_X + 6}
                        y={HA_TOP_PAD - 8}
                        textAnchor="middle"
                        fill="var(--one)"
                        fontSize="11"
                        fontWeight="700"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        B={halfAdderB}
                      </text>
                      <line
                        x1={HA_BUS_A_X}
                        y1={HA_TOP_PAD}
                        x2={HA_BUS_A_X}
                        y2={haLastTapA}
                        stroke="var(--zero)"
                        strokeWidth="2"
                      />
                      <line
                        x1={HA_BUS_B_X}
                        y1={HA_TOP_PAD}
                        x2={HA_BUS_B_X}
                        y2={haLastTapB}
                        stroke="var(--one)"
                        strokeWidth="2"
                      />
                      {haGates.map((g, i) => {
                        const rowY = HA_TOP_PAD + i * HA_ROW_HEIGHT;
                        const tapAY = rowY + 13;
                        const tapBY = rowY + 27;
                        const val = CLASSICAL_GATES[g.key].fn(halfAdderA, halfAdderB);
                        const label =
                          g.key === 'XOR'
                            ? t('circuits.sum', 'Sum')
                            : g.key === 'AND'
                              ? t('circuits.carry', 'Carry')
                              : CLASSICAL_GATES[g.key].name;
                        const outX = HA_GATE_X + 64 + 10;
                        return (
                          <g key={i}>
                            <line
                              x1={HA_BUS_A_X}
                              y1={tapAY}
                              x2={HA_GATE_X}
                              y2={tapAY}
                              stroke="var(--zero)"
                              strokeWidth="2"
                            />
                            <line
                              x1={HA_BUS_B_X}
                              y1={tapBY}
                              x2={HA_GATE_X}
                              y2={tapBY}
                              stroke="var(--one)"
                              strokeWidth="2"
                            />
                            <g
                              transform={`translate(${HA_GATE_X},${rowY})`}
                              dangerouslySetInnerHTML={{ __html: classicalGateInnerSVG(g.key) }}
                            />
                            <text
                              x={outX}
                              y={rowY + 24}
                              fill={val ? 'var(--zero)' : 'var(--text3)'}
                              fontSize="12"
                              fontWeight="700"
                              fontFamily="'JetBrains Mono', monospace"
                            >
                              → {label} = {val}
                            </text>
                            <rect
                              data-row-index={i}
                              x="0"
                              y={rowY}
                              width={HA_SVG_WIDTH}
                              height="40"
                              fill="transparent"
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeHalfAdderGate(i);
                              }}
                            >
                              <title>{CLASSICAL_GATES[g.key].name} — click to remove</title>
                            </rect>
                          </g>
                        );
                      })}
                    </>
                  )}
                </svg>
              </div>
              <div className="section-label" style={{ marginTop: '18px' }}>
                {t('circuits.truthTableHalfAdder', 'Target Truth Table — A, B → Sum, Carry')}
              </div>
              <table className="truth-table" id="ha-truth-table">
                <tbody>
                  <tr>
                    <th>A</th>
                    <th>B</th>
                    <th>{t('circuits.sum', 'Sum')}</th>
                    <th>{t('circuits.carry', 'Carry')}</th>
                  </tr>
                  {haTruthRows.map((r, i) => {
                    const active = r.a === halfAdderA && r.b === halfAdderB;
                    return (
                      <tr key={i} className={active ? 'truth-row-active' : ''}>
                        <td>{r.a}</td>
                        <td>{r.b}</td>
                        <td>{r.sum}</td>
                        <td>{r.carry}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* QUANTUM CIRCUIT PANEL */}
        <div id="circuit-quantum-panel" style={{ display: domain === 'quantum' ? undefined : 'none' }}>
          <div className="mode-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', maxWidth: '380px', margin: '0 auto 18px' }}>
            <button
              className={`preset-btn mode-btn${circuitMode === '1q' ? ' active' : ''}`}
              data-circuit-mode="1q"
              onClick={() => setTabSub('circuit', { circuitMode: '1q' })}
            >
              {t('circuits.oneQubit', '1 Qubit')}
            </button>
            <button
              className={`preset-btn mode-btn${circuitMode === '2q' ? ' active' : ''}`}
              data-circuit-mode="2q"
              onClick={() => setTabSub('circuit', { circuitMode: '2q' })}
            >
              {t('circuits.twoQubits', '2 Qubits')}
            </button>
            <button
              className={`preset-btn mode-btn${circuitMode === '3q' ? ' active' : ''}`}
              data-circuit-mode="3q"
              onClick={() => setTabSub('circuit', { circuitMode: '3q' })}
            >
              {t('circuits.threeQubits', '3 Qubits')}
            </button>
          </div>

          {/* 1Q BUILDER */}
          <div id="circuit-1q-panel" style={{ display: circuitMode === '1q' ? undefined : 'none' }}>
            <div className="circuit-top">
              <div className="circuit-left">
                <div className="section-label">{t('circuits.gatePalette', 'Gate Palette — click to add')}</div>
                <div className="circuit-palette" id="circuit-palette">
                  {(Object.keys(GATES) as GateKey[]).map((key) => {
                    const g = GATES[key];
                    return (
                      <button
                        key={key}
                        className="circuit-gate-btn"
                        style={{ color: g.color, borderColor: `${g.color}55` }}
                        title={t(`gates.${key}.desc`, g.desc)}
                        onClick={() => addGateToCircuit1(key)}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
                <TryMePresets
                  id="circuit-try-me"
                  presets={CIRCUIT_PRESETS}
                  onSelect={(p) => {
                    const next = [...p.gates];
                    setCircuitGates(next);
                    runCircuit1(next);
                  }}
                />
                <div className="section-label" style={{ marginTop: '18px' }}>
                  {t('circuits.circuitWire', 'Circuit Wire')}
                </div>
                <div className="wire-wrap">
                  <div className="wire-ket">|0⟩</div>
                  <div className="wire-track">
                    <div className="wire-line" />
                    <div className="gate-slots" id="gate-slots">
                      {Array.from({ length: SLOT_COUNT }, (_, i) => {
                        const key = circuitGates[i];
                        const isHint = i === 0 && circuitGates.length === 0;
                        const isRunning = c1RunningSlot === i;
                        if (key) {
                          const g = GATES[key];
                          return (
                            <div
                              key={i}
                              className={`gate-slot filled${isRunning ? ' running' : ''}`}
                              data-index={i}
                              title="Click to remove"
                              style={{ color: g.color, borderColor: g.color }}
                              onClick={() => removeCircuit1Gate(i)}
                            >
                              {g.name}
                            </div>
                          );
                        }
                        return (
                          <div
                            key={i}
                            className={`gate-slot empty${isHint ? ' gate-slot-hint' : ''}`}
                            data-index={i}
                            title="Click to remove"
                          >
                            {isHint ? '+' : ''}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="circuit-actions">
                  <button className="btn-run" id="btn-run-circuit" onClick={() => runCircuit1()}>
                    {t('common.run', '▶ Run')}
                  </button>
                  <button className="btn-secondary" id="btn-clear-circuit" onClick={clearCircuit1}>
                    {t('common.clear', 'Clear')}
                  </button>
                  <button className="btn-secondary" id="btn-share-circuit" onClick={copyShareCircuit1}>
                    {shareText ?? t('common.copyShareableLink', 'Copy shareable link')}
                  </button>
                  <span className="muted-text" id="circuit-status">
                    {c1Status}
                  </span>
                </div>
                <div className="card explainer-card" style={{ marginTop: '4px' }}>
                  <div className="card-title">{t('circuits.whatsGoingOn', "What's going on")}</div>
                  <Explainer id="circuit-explainer" html={c1Explainer} />
                </div>
                <div className="card" style={{ marginTop: '4px' }}>
                  <div className="card-title">{t('circuits.runHistory', 'Run History — click a step to revisit it')}</div>
                  <div className="history-row" id="circuit-history">
                    {c1History.length === 0 ? (
                      <span className="muted-text">—</span>
                    ) : (
                      c1History.map((entry, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`hist-tag${i === c1Cursor ? ' is-current' : ''}`}
                          style={{ color: entry.color, borderColor: `${entry.color}44` }}
                          title={entry.title}
                          onClick={() => restoreCircuit1Step(i)}
                        >
                          {entry.label}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="circuit-right">
                <div className="section-label">{t('circuits.outputState', 'Output State')}</div>
                <div className="circuit-output-card">
                  <BlochSphere
                    id="bloch-circuit"
                    width={260}
                    height={260}
                    vector={{ x: b1.x, y: b1.y, z: b1.z }}
                    label={qubit1.getLabel()}
                    ariaLabel={`Bloch sphere showing the circuit's output state. State: ${qubit1.getFormula()}.`}
                  />
                  <div className="state-label" id="label-circuit">
                    {qubit1.getLabel()}
                  </div>
                  <div className="prob-rows" style={{ marginTop: '10px', width: '100%' }}>
                    <div className="prob-row">
                      <span className="ket zero-color">|0⟩</span>
                      <div className="track">
                        <div className="fill zero-fill" id="cfill0" style={{ width: `${c1P0}%` }} />
                      </div>
                      <span className="pct" id="cpct0">
                        {Math.round(c1P0)}%
                      </span>
                    </div>
                    <div className="prob-row">
                      <span className="ket one-color">|1⟩</span>
                      <div className="track">
                        <div className="fill one-fill" id="cfill1" style={{ width: `${c1P1}%` }} />
                      </div>
                      <span className="pct" id="cpct1">
                        {Math.round(c1P1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2Q BUILDER */}
          <div id="circuit-2q-panel" style={{ display: circuitMode === '2q' ? undefined : 'none' }}>
            <div className="circuit-top">
              <div className="circuit-left">
                <div className="section-label">{t('circuits.targetQubit2', 'Target Qubit — new gates apply to')}</div>
                <div className="mode-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  {[0, 1].map((q) => (
                    <button
                      key={q}
                      className={`preset-btn mode-btn${c2Target === q ? ' active' : ''}`}
                      data-target-qubit={q}
                      onClick={() => setC2Target(q)}
                    >
                      Qubit {q}
                    </button>
                  ))}
                </div>
                <div className="section-label mt-14">
                  {t('circuits.gatePaletteTarget', 'Gate Palette — click to add to target qubit')}
                </div>
                <div className="circuit-palette" id="circuit-2q-palette">
                  {(Object.keys(GATES) as GateKey[]).map((key) => {
                    const g = GATES[key];
                    return (
                      <button
                        key={key}
                        className="circuit-gate-btn"
                        style={{ color: g.color, borderColor: `${g.color}55` }}
                        title={t(`gates.${key}.desc`, g.desc)}
                        onClick={() => addGate2({ type: 'single', qubit: c2Target, key })}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
                <div className="circuit-palette" style={{ marginTop: '6px' }}>
                  <button
                    className="circuit-gate-btn"
                    id="btn-add-cnot-01"
                    style={{ fontSize: '0.72rem', padding: '7px 10px' }}
                    onClick={() => addGate2({ type: 'cnot', control: 0, target: 1 })}
                  >
                    CNOT Q0→Q1
                  </button>
                  <button
                    className="circuit-gate-btn"
                    id="btn-add-cnot-10"
                    style={{ fontSize: '0.72rem', padding: '7px 10px' }}
                    onClick={() => addGate2({ type: 'cnot', control: 1, target: 0 })}
                  >
                    CNOT Q1→Q0
                  </button>
                </div>
                <TryMePresets
                  id="circuit-2q-try-me"
                  presets={CIRCUIT2_PRESETS}
                  onSelect={(p) => {
                    const next = p.gates.map((g) => ({ ...g }));
                    setC2Gates(next);
                    runCircuit2(next);
                  }}
                />
                <div className="section-label" style={{ marginTop: '18px' }}>
                  {t('circuits.circuitDiagram', 'Circuit Diagram')}
                </div>
                <div className="circuit2-diagram-wrap">
                  <MultiDiagram
                    n={2}
                    id="circuit-2q-diagram"
                    className="circuit2-diagram"
                    gates={c2Gates}
                    runningStep={c2RunningStep}
                    onRemove={(idx) => setC2Gates((prev) => prev.filter((_, i) => i !== idx))}
                  />
                </div>
                <div className="circuit-actions">
                  <button className="btn-run" id="btn-run-circuit-2q" onClick={() => runCircuit2()}>
                    {t('common.run', '▶ Run')}
                  </button>
                  <button className="btn-secondary" id="btn-clear-circuit-2q" onClick={clearCircuit2}>
                    {t('common.clear', 'Clear')}
                  </button>
                  <span className="muted-text" id="circuit-2q-status">
                    {c2Status}
                  </span>
                </div>
                <div className="card explainer-card" style={{ marginTop: '4px' }}>
                  <div className="card-title">{t('circuits.whatsGoingOn', "What's going on")}</div>
                  <Explainer id="circuit-2q-explainer" html={c2Explainer} />
                </div>
                <div className="card" style={{ marginTop: '4px' }}>
                  <div className="card-title">{t('circuits.runHistory', 'Run History — click a step to revisit it')}</div>
                  <div className="history-row" id="circuit-2q-history">
                    {c2History.length === 0 ? (
                      <span className="muted-text">—</span>
                    ) : (
                      c2History.map((entry, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`hist-tag${i === c2Cursor ? ' is-current' : ''}`}
                          style={{ color: entry.color, borderColor: `${entry.color}44` }}
                          title={entry.title}
                          onClick={() => restoreCircuit2Step(i)}
                        >
                          {entry.label}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="circuit-right">
                <div className="section-label">{t('circuits.outputState2Q', 'Output State (2 Qubits)')}</div>
                <div className="circuit-output-card">
                  <div className="section-label" style={{ marginBottom: '6px' }}>
                    {t('circuits.perQubitBlochSpheres', 'Per-Qubit Bloch Spheres — shrink toward center when entangled')}
                  </div>
                  <div className="mini-bloch-row">
                    {[0, 1].map((i) => {
                      const b = c2State.getSingleQubitBloch(i);
                      const lbl = blochVectorLabel(b.x, b.y, b.z);
                      return (
                        <div className="mini-bloch" key={i}>
                          <BlochSphere
                            id={`bloch-circuit-2q-${i}`}
                            width={118}
                            height={118}
                            vector={b}
                            label={lbl}
                            ariaLabel={`Reduced Bloch sphere for Qubit ${i}. State: ${lbl}.`}
                          />
                          <div className="mini-bloch-label" id={`mini-label-2q-${i}`}>
                            {lbl}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="formula" id="circuit-2q-formula" style={{ textAlign: 'center' }}>
                    {c2State.getFormula()}
                  </div>
                  <div className="prob-rows" id="circuit-2q-probs" style={{ width: '100%', marginTop: '8px' }}>
                    {CIRCUIT2_KETS.map((ket, i) => {
                      const pct = c2State.prob(i) * 100;
                      const last = CIRCUIT2_KETS.length - 1;
                      const color = i === 0 ? 'var(--zero)' : i === last ? 'var(--one)' : 'var(--text2)';
                      const fillClass = i === 0 ? 'zero-fill' : i === last ? 'one-fill' : '';
                      return (
                        <div className="prob-row" key={ket}>
                          <span className="ket" style={{ color }}>
                            |{ket}⟩
                          </span>
                          <div className="track">
                            <div
                              className={`fill ${fillClass}`}
                              id={`c2-fill-${ket}`}
                              style={{
                                width: `${pct}%`,
                                background: fillClass ? undefined : 'var(--text2)',
                              }}
                            />
                          </div>
                          <span className="pct" id={`c2-pct-${ket}`}>
                            {Math.round(pct)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3Q BUILDER */}
          <div id="circuit-3q-panel" style={{ display: circuitMode === '3q' ? undefined : 'none' }}>
            <div className="circuit-top">
              <div className="circuit-left">
                <div className="section-label">
                  {t('circuits.targetQubit3', 'Target Qubit — new single-qubit gates apply to')}
                </div>
                <div className="mode-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  {[0, 1, 2].map((q) => (
                    <button
                      key={q}
                      className={`preset-btn mode-btn${c3Target === q ? ' active' : ''}`}
                      data-target-qubit3={q}
                      onClick={() => setC3Target(q)}
                    >
                      Qubit {q}
                    </button>
                  ))}
                </div>
                <div className="section-label mt-14">
                  {t('circuits.gatePaletteTarget', 'Gate Palette — click to add to target qubit')}
                </div>
                <div className="circuit-palette" id="circuit-3q-palette">
                  {(Object.keys(GATES) as GateKey[]).map((key) => {
                    const g = GATES[key];
                    return (
                      <button
                        key={key}
                        className="circuit-gate-btn"
                        style={{ color: g.color, borderColor: `${g.color}55` }}
                        title={t(`gates.${key}.desc`, g.desc)}
                        onClick={() => addGate3({ type: 'single', qubit: c3Target, key })}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
                <div className="section-label mt-14">{t('circuits.addCnot', 'Add CNOT')}</div>
                <div className="cnot3-picker">
                  <select
                    className="cnot3-select"
                    id="cnot3-control"
                    value={cnot3Control}
                    onChange={(e) => setCnot3Control(parseInt(e.target.value, 10))}
                  >
                    {[0, 1, 2].map((q) => (
                      <option key={q} value={q}>
                        Qubit {q}
                      </option>
                    ))}
                  </select>
                  <span className="cnot3-arrow">→</span>
                  <select
                    className="cnot3-select"
                    id="cnot3-target"
                    value={cnot3Target}
                    onChange={(e) => setCnot3Target(parseInt(e.target.value, 10))}
                  >
                    {[0, 1, 2].map((q) => (
                      <option key={q} value={q}>
                        Qubit {q}
                      </option>
                    ))}
                  </select>
                  <button
                    className="circuit-gate-btn"
                    id="btn-add-cnot3"
                    style={{ fontSize: '0.72rem', padding: '7px 10px' }}
                    onClick={() => {
                      if (cnot3Control === cnot3Target) {
                        setC3Status('Control and target must be different qubits');
                        return;
                      }
                      addGate3({ type: 'cnot', control: cnot3Control, target: cnot3Target });
                    }}
                  >
                    {t('common.add', 'Add')}
                  </button>
                </div>
                <div className="section-label mt-14">
                  {t('circuits.addToffoli', 'Add Toffoli (2 controls → 1 target)')}
                </div>
                <div className="cnot3-picker">
                  <select
                    className="cnot3-select"
                    id="toffoli3-control1"
                    value={tof3Control1}
                    onChange={(e) => setTof3Control1(parseInt(e.target.value, 10))}
                  >
                    {[0, 1, 2].map((q) => (
                      <option key={q} value={q}>
                        Qubit {q}
                      </option>
                    ))}
                  </select>
                  <span className="cnot3-arrow">+</span>
                  <select
                    className="cnot3-select"
                    id="toffoli3-control2"
                    value={tof3Control2}
                    onChange={(e) => setTof3Control2(parseInt(e.target.value, 10))}
                  >
                    {[0, 1, 2].map((q) => (
                      <option key={q} value={q}>
                        Qubit {q}
                      </option>
                    ))}
                  </select>
                  <span className="cnot3-arrow">→</span>
                  <select
                    className="cnot3-select"
                    id="toffoli3-target"
                    value={tof3Target}
                    onChange={(e) => setTof3Target(parseInt(e.target.value, 10))}
                  >
                    {[0, 1, 2].map((q) => (
                      <option key={q} value={q}>
                        Qubit {q}
                      </option>
                    ))}
                  </select>
                  <button
                    className="circuit-gate-btn"
                    id="btn-add-toffoli3"
                    style={{ fontSize: '0.72rem', padding: '7px 10px' }}
                    onClick={() => {
                      if (
                        tof3Control1 === tof3Control2 ||
                        tof3Control1 === tof3Target ||
                        tof3Control2 === tof3Target
                      ) {
                        setC3Status('Controls and target must all be different qubits');
                        return;
                      }
                      addGate3({
                        type: 'toffoli',
                        control1: tof3Control1,
                        control2: tof3Control2,
                        target: tof3Target,
                      });
                    }}
                  >
                    {t('common.add', 'Add')}
                  </button>
                </div>
                <TryMePresets
                  id="circuit-3q-try-me"
                  presets={CIRCUIT3_PRESETS}
                  onSelect={(p) => {
                    const next = p.gates.map((g) => ({ ...g }));
                    setC3Gates(next);
                    runCircuit3(next);
                  }}
                />
                <div className="section-label" style={{ marginTop: '18px' }}>
                  {t('circuits.circuitDiagram', 'Circuit Diagram')}
                </div>
                <div className="circuit2-diagram-wrap">
                  <MultiDiagram
                    n={3}
                    id="circuit-3q-diagram"
                    className="circuit3-diagram"
                    gates={c3Gates}
                    runningStep={c3RunningStep}
                    onRemove={(idx) => setC3Gates((prev) => prev.filter((_, i) => i !== idx))}
                  />
                </div>
                <div className="circuit-actions">
                  <button className="btn-run" id="btn-run-circuit-3q" onClick={() => runCircuit3()}>
                    {t('common.run', '▶ Run')}
                  </button>
                  <button className="btn-secondary" id="btn-clear-circuit-3q" onClick={clearCircuit3}>
                    {t('common.clear', 'Clear')}
                  </button>
                  <span className="muted-text" id="circuit-3q-status">
                    {c3Status}
                  </span>
                </div>
                <div className="card explainer-card" style={{ marginTop: '4px' }}>
                  <div className="card-title">{t('circuits.whatsGoingOn', "What's going on")}</div>
                  <Explainer id="circuit-3q-explainer" html={c3Explainer} />
                </div>
                <div className="card" style={{ marginTop: '4px' }}>
                  <div className="card-title">{t('circuits.runHistory', 'Run History — click a step to revisit it')}</div>
                  <div className="history-row" id="circuit-3q-history">
                    {c3History.length === 0 ? (
                      <span className="muted-text">—</span>
                    ) : (
                      c3History.map((entry, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`hist-tag${i === c3Cursor ? ' is-current' : ''}`}
                          style={{ color: entry.color, borderColor: `${entry.color}44` }}
                          title={entry.title}
                          onClick={() => restoreCircuit3Step(i)}
                        >
                          {entry.label}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="circuit-right">
                <div className="section-label">{t('circuits.outputState3Q', 'Output State (3 Qubits)')}</div>
                <div className="circuit-output-card">
                  <div className="section-label" style={{ marginBottom: '6px' }}>
                    {t('circuits.perQubitBlochSpheres', 'Per-Qubit Bloch Spheres — shrink toward center when entangled')}
                  </div>
                  <div className="mini-bloch-row">
                    {[0, 1, 2].map((i) => {
                      const b = c3State.getSingleQubitBloch(i);
                      const lbl = blochVectorLabel(b.x, b.y, b.z);
                      return (
                        <div className="mini-bloch" key={i}>
                          <BlochSphere
                            id={`bloch-circuit-3q-${i}`}
                            width={86}
                            height={86}
                            vector={b}
                            label={lbl}
                            ariaLabel={`Reduced Bloch sphere for Qubit ${i}. State: ${lbl}.`}
                          />
                          <div className="mini-bloch-label" id={`mini-label-3q-${i}`}>
                            {lbl}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="formula" id="circuit-3q-formula" style={{ textAlign: 'center' }}>
                    {c3State.getFormula()}
                  </div>
                  <div className="prob-rows" id="circuit-3q-probs" style={{ width: '100%', marginTop: '8px' }}>
                    {CIRCUIT3_KETS.map((ket, i) => {
                      const pct = c3State.prob(i) * 100;
                      const last = CIRCUIT3_KETS.length - 1;
                      const color = i === 0 ? 'var(--zero)' : i === last ? 'var(--one)' : 'var(--text2)';
                      const fillClass = i === 0 ? 'zero-fill' : i === last ? 'one-fill' : '';
                      return (
                        <div className="prob-row" key={ket}>
                          <span className="ket" style={{ color }}>
                            |{ket}⟩
                          </span>
                          <div className="track">
                            <div
                              className={`fill ${fillClass}`}
                              id={`c3-fill-${ket}`}
                              style={{
                                width: `${pct}%`,
                                background: fillClass ? undefined : 'var(--text2)',
                              }}
                            />
                          </div>
                          <span className="pct" id={`c3-pct-${ket}`}>
                            {Math.round(pct)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COMPARE PANEL */}
        <div id="circuit-compare-panel" style={{ display: domain === 'compare' ? undefined : 'none' }}>
          <div className="compare-layout" style={{ gridTemplateColumns: '1fr 40px 1fr', maxWidth: '900px' }}>
            <div className="compare-col classical-col">
              <div className="col-label">
                <span className="col-badge">{t('common.classical', 'Classical')}</span>
                <span className="col-desc">
                  {t('circuits.compareClassicalDesc', 'XOR and AND gates, wired straight to A and B')}
                </span>
              </div>
              <div className="circuit2-diagram-wrap">
                <svg
                  id="ha-compare-classical-svg"
                  viewBox="0 0 230 140"
                  role="img"
                  aria-label="Classical half adder: A and B feed an XOR gate producing Sum, and an AND gate producing Carry."
                >
                  <text
                    x="20"
                    y="12"
                    textAnchor="middle"
                    fill="var(--zero)"
                    fontSize="12"
                    fontWeight="700"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    A
                  </text>
                  <text
                    x="40"
                    y="12"
                    textAnchor="middle"
                    fill="var(--one)"
                    fontSize="12"
                    fontWeight="700"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    B
                  </text>
                  <line x1="20" y1="20" x2="20" y2="89" stroke="var(--zero)" strokeWidth="2" />
                  <line x1="34" y1="20" x2="34" y2="103" stroke="var(--one)" strokeWidth="2" />
                  {(
                    [
                      { key: 'XOR' as const, label: 'Sum', rowY: 20 },
                      { key: 'AND' as const, label: 'Carry', rowY: 76 },
                    ]
                  ).map((row) => (
                    <g key={row.key}>
                      <line x1="20" y1={row.rowY + 13} x2="56" y2={row.rowY + 13} stroke="var(--zero)" strokeWidth="2" />
                      <line x1="34" y1={row.rowY + 27} x2="56" y2={row.rowY + 27} stroke="var(--one)" strokeWidth="2" />
                      <g
                        transform={`translate(56,${row.rowY})`}
                        dangerouslySetInnerHTML={{ __html: classicalGateInnerSVG(row.key) }}
                      />
                      <text
                        x="130"
                        y={row.rowY + 24}
                        fill="var(--text)"
                        fontSize="12"
                        fontWeight="700"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        → {row.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
            <div className="compare-divider">
              <div className="divider-line" />
              <div className="divider-vs">vs</div>
              <div className="divider-line" />
            </div>
            <div className="compare-col quantum-col">
              <div className="col-label">
                <span className="col-badge quantum-badge">{t('common.quantum', 'Quantum')}</span>
                <span className="col-desc">
                  {t('circuits.compareQuantumDesc', 'X, CNOT and Toffoli — reversible gates reaching the same answer')}
                </span>
              </div>
              <div className="circuit2-diagram-wrap">
                <div className="ha-quantum-diagram" id="ha-compare-quantum-diagram">
                  {[1, 2, 3, 4].map((row) => (
                    <div key={row} style={{ display: 'contents' }}>
                      <div className="circuit2-ket" style={{ gridColumn: 1, gridRow: row }}>
                        |0⟩
                      </div>
                      <div className="circuit2-wire" style={{ gridColumn: '2/-1', gridRow: row }} />
                    </div>
                  ))}
                  <div className="circuit2-ket" style={{ gridColumn: 1, gridRow: 5 }}>
                    c⫽2
                  </div>
                  <div className="ha-classical-wire" style={{ gridColumn: '2/-1', gridRow: 5 }} />

                  {/* Column 2 */}
                  <div
                    className="circuit2-cell circuit2-gate"
                    style={{ gridColumn: 2, gridRow: 1, color: GATES.X.color, borderColor: GATES.X.color }}
                    title="X — sets q0 = A"
                  >
                    X
                  </div>
                  <div
                    className="circuit2-cell circuit2-gate"
                    style={{ gridColumn: 2, gridRow: 2, color: GATES.X.color, borderColor: GATES.X.color }}
                    title="X — sets q1 = B"
                  >
                    X
                  </div>

                  {/* Column 3 */}
                  <div className="circuit2-cnot-line" style={{ gridColumn: 3, gridRow: '1/4' }} />
                  <div className="circuit2-cell circuit2-cnot-dot" style={{ gridColumn: 3, gridRow: 1 }} title="CNOT q0→q2" />
                  <div className="circuit2-cell circuit2-cnot-target" style={{ gridColumn: 3, gridRow: 3 }} title="CNOT q0→q2">
                    ⊕
                  </div>

                  {/* Column 4 */}
                  <div className="circuit2-cnot-line" style={{ gridColumn: 4, gridRow: '2/4' }} />
                  <div className="circuit2-cell circuit2-cnot-dot" style={{ gridColumn: 4, gridRow: 2 }} title="CNOT q1→q2" />
                  <div className="circuit2-cell circuit2-cnot-target" style={{ gridColumn: 4, gridRow: 3 }} title="CNOT q1→q2">
                    ⊕
                  </div>

                  {/* Column 5 */}
                  <div className="circuit2-cnot-line" style={{ gridColumn: 5, gridRow: '1/5' }} />
                  <div className="circuit2-cell circuit2-cnot-dot" style={{ gridColumn: 5, gridRow: 1 }} title="Toffoli q0,q1→q3" />
                  <div className="circuit2-cell circuit2-cnot-dot" style={{ gridColumn: 5, gridRow: 2 }} title="Toffoli q0,q1→q3" />
                  <div className="circuit2-cell circuit2-cnot-target" style={{ gridColumn: 5, gridRow: 4 }} title="Toffoli q0,q1→q3">
                    ⊕
                  </div>

                  {/* Column 6 */}
                  <div className="ha-meter-drop" style={{ gridColumn: 6, gridRow: '3/6' }} />
                  <div
                    className="circuit2-cell ha-meter"
                    style={{ gridColumn: 6, gridRow: 3 }}
                    title="Measure q2 (Sum) → bit 0"
                    dangerouslySetInnerHTML={{ __html: HA_METER_ICON }}
                  />
                  <div className="ha-meter-label" style={{ gridColumn: 6, gridRow: 5 }}>
                    0
                  </div>

                  {/* Column 7 */}
                  <div className="ha-meter-drop" style={{ gridColumn: 7, gridRow: '4/6' }} />
                  <div
                    className="circuit2-cell ha-meter"
                    style={{ gridColumn: 7, gridRow: 4 }}
                    title="Measure q3 (Carry) → bit 1"
                    dangerouslySetInnerHTML={{ __html: HA_METER_ICON }}
                  />
                  <div className="ha-meter-label" style={{ gridColumn: 7, gridRow: 5 }}>
                    1
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card mt-14" style={{ maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>
            <div className="section-label">
              {t('circuits.halfAdderCompareTitle', 'Classical vs Quantum — Same Half Adder')}
            </div>
            <table className="truth-table" id="ha-compare-table">
              <tbody>
                <tr>
                  <th>A</th>
                  <th>B</th>
                  <th>{t('circuits.sumClassical', 'Sum (Classical)')}</th>
                  <th>{t('circuits.carryClassical', 'Carry (Classical)')}</th>
                  <th>{t('circuits.sumQuantum', 'Sum (Quantum)')}</th>
                  <th>{t('circuits.carryQuantum', 'Carry (Quantum)')}</th>
                </tr>
                {haTruthRows.map((r, i) => {
                  const active = r.a === halfAdderA && r.b === halfAdderB;
                  return (
                    <tr key={i} className={active ? 'truth-row-active' : ''}>
                      <td>{r.a}</td>
                      <td>{r.b}</td>
                      <td>{r.sum}</td>
                      <td>{r.carry}</td>
                      <td>{r.sum}</td>
                      <td>{r.carry}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="bit-explainer mt-14">
              {t(
                'circuits.halfAdderCompareBody',
                'The classical circuit reaches Sum/Carry with AND/XOR gates. The quantum circuit above (shown for A=1, B=1) reaches the exact same two numbers using only reversible gates: X gates set q0=A and q1=B, two CNOTs copy their XOR into ancilla q2 for Sum = A⊕B, and a Toffoli copies their AND into ancilla q3 for Carry = A·B — then q2 and q3 are measured out. You can build a related reversible half adder yourself, gate by gate, under Quantum Circuit → 3 Qubits → Try me → Half Adder.'
              )}
            </p>
          </div>
        </div>
      </div>
      <LessonEmbed id="circuit" />
    </section>
  );
}
