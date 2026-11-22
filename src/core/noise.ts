// Phenomenological T1/T2 (Bloch-Redfield) decay, the same equations behind
// NMR/ESR and superconducting-qubit coherence-time measurements:
//   x(t) = x0 e^(-t/T2eff),  y(t) = y0 e^(-t/T2eff),
//   z(t) = 1 + (z0 - 1) e^(-t/T1)
// z relaxes toward +1 (the |0> ground state). T2eff = min(T2, 2*T1): dephasing
// can never be slower than energy relaxation alone implies.

export interface NoiseParams {
  x0: number;
  y0: number;
  z0: number;
  t1: number;
  t2: number;
}

export const noiseT2Eff = (t1: number, t2: number): number => Math.min(t2, 2 * t1);

/** Bloch vector at time t (same unit as t1, t2) from initial (x0, y0, z0). */
export function noiseCompute(t: number, { x0, y0, z0, t1, t2 }: NoiseParams): { x: number; y: number; z: number } {
  const decayXY = Math.exp(-t / noiseT2Eff(t1, t2));
  const decayZ = Math.exp(-t / t1);
  return { x: x0 * decayXY, y: y0 * decayXY, z: 1 + (z0 - 1) * decayZ };
}
