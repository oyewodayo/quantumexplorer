export type ClassicalGateKey = 'NOT' | 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOR' | 'XNOR';

export interface ClassicalGateDef {
  name: ClassicalGateKey;
  inputs: 1 | 2;
  fn: (a: number, b?: number) => number;
  desc: string;
  explain: string;
}

export const CLASSICAL_GATES: Record<ClassicalGateKey, ClassicalGateDef> = {
  NOT:  { name: 'NOT',  inputs: 1, fn: (a) => 1 - a,          desc: 'Flips the single input',
    explain: "NOT takes one input and flips it — the only gate here that doesn't need a second input at all. 0 becomes 1, 1 becomes 0, no exceptions." },
  AND:  { name: 'AND',  inputs: 2, fn: (a, b = 0) => a & b,   desc: 'Both must be 1',
    explain: 'AND only outputs 1 when every input is 1 — a strict, all-or-nothing gate. One 0 anywhere and the whole thing collapses to 0.' },
  OR:   { name: 'OR',   inputs: 2, fn: (a, b = 0) => a | b,   desc: 'Either can be 1',
    explain: 'OR outputs 1 as soon as at least one input is 1 — the easiest gate to satisfy. Only both inputs being 0 gives a 0.' },
  XOR:  { name: 'XOR',  inputs: 2, fn: (a, b = 0) => a ^ b,   desc: 'Exactly one is 1',
    explain: 'XOR (exclusive OR) outputs 1 only when the inputs disagree — one 0 and one 1. Two matching inputs, either 0,0 or 1,1, give a 0.' },
  NAND: { name: 'NAND', inputs: 2, fn: (a, b = 0) => 1 - (a & b), desc: 'Opposite of AND',
    explain: 'NAND is AND with the output flipped — 0 only when both inputs are 1, and 1 in every other case. It\'s "universal": every other classical gate can be built from NANDs alone.' },
  NOR:  { name: 'NOR',  inputs: 2, fn: (a, b = 0) => 1 - (a | b), desc: 'Opposite of OR',
    explain: 'NOR is OR with the output flipped — 1 only when both inputs are 0, and 0 as soon as either input is 1.' },
  XNOR: { name: 'XNOR', inputs: 2, fn: (a, b = 0) => 1 - (a ^ b), desc: 'Opposite of XOR',
    explain: "XNOR is XOR with the output flipped — 1 when the inputs agree (0,0 or 1,1), 0 when they differ. It's a literal equality check." }
};

export const CLASSICAL_GATE_SHAPES: Record<ClassicalGateKey, { body: 'not' | 'and' | 'or' | 'xor'; bubble?: boolean }> = {
  NOT:  { body: 'not', bubble: true },
  AND:  { body: 'and' },
  NAND: { body: 'and', bubble: true },
  OR:   { body: 'or' },
  NOR:  { body: 'or', bubble: true },
  XOR:  { body: 'xor' },
  XNOR: { body: 'xor', bubble: true }
};

export function classicalGateInnerSVG(key: ClassicalGateKey): string {
  const shape     = CLASSICAL_GATE_SHAPES[key].body;
  const hasBubble = !!CLASSICAL_GATE_SHAPES[key].bubble;
  const twoInput  = shape !== 'not';

  let body: string, tipX: number, backX: number;
  if (shape === 'not') {
    body  = '<path d="M16,6 L16,34 L44,20 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>';
    tipX  = 44; backX = 16;
  } else if (shape === 'and') {
    body  = '<path d="M16,6 H32 A14,14 0 0 1 32,34 H16 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>';
    tipX  = 46; backX = 16;
  } else {
    body  = '<path d="M18,7 C28,7 40,10 50,20 C40,30 28,33 18,33 C24,26 24,14 18,7 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>';
    if (shape === 'xor') {
      body += '<path d="M12,7 C18,14 18,26 12,33" fill="none" stroke="currentColor" stroke-width="2"/>';
    }
    tipX  = 50; backX = 18;
  }

  let outX = tipX, bubble = '';
  if (hasBubble) {
    bubble = `<circle cx="${tipX + 4}" cy="20" r="4" fill="none" stroke="currentColor" stroke-width="2"/>`;
    outX   = tipX + 8;
  }

  const inputs = twoInput
    ? `<line x1="0" y1="13" x2="${backX}" y2="13" stroke="currentColor" stroke-width="2"/>
       <line x1="0" y1="27" x2="${backX}" y2="27" stroke="currentColor" stroke-width="2"/>`
    : `<line x1="0" y1="20" x2="${backX}" y2="20" stroke="currentColor" stroke-width="2"/>`;

  const outputLine = `<line x1="${outX}" y1="20" x2="64" y2="20" stroke="currentColor" stroke-width="2"/>`;

  return `${inputs}${body}${bubble}${outputLine}`;
}

export function classicalGateIconSVG(key: ClassicalGateKey): string {
  return `<svg viewBox="0 0 64 40" class="classical-gate-icon" aria-hidden="true">${classicalGateInnerSVG(key)}</svg>`;
}
