// No dependencies. Must load before core/gates.ts — the T gate's matrix
// literal calls C.polar(...) at top-level script-execution time.

export interface Complex {
  r: number;
  i: number;
}

// ─── COMPLEX ARITHMETIC ──────────────────────────────────────────────
// Intentionally a minimal, closed set of ops for this app's needs
// (qubit amplitudes and gate matrices) — not a general-purpose library.
export const C = {
  add:   (a: Complex, b: Complex): Complex => ({ r: a.r + b.r, i: a.i + b.i }),
  mul:   (a: Complex, b: Complex): Complex => ({ r: a.r * b.r - a.i * b.i, i: a.r * b.i + a.i * b.r }),
  scale: (a: Complex, s: number): Complex  => ({ r: a.r * s,   i: a.i * s }),
  mag:   (a: Complex): number              => Math.sqrt(a.r * a.r + a.i * a.i),
  conj:  (a: Complex): Complex             => ({ r: a.r, i: -a.i }),
  arg:   (a: Complex): number              => Math.atan2(a.i, a.r),
  polar: (r: number, theta: number): Complex => ({ r: r * Math.cos(theta), i: r * Math.sin(theta) }),
  fmt: (a: Complex): string => {
    const re = Math.round(a.r * 1000) / 1000;
    const im = Math.round(a.i * 1000) / 1000;
    if (Math.abs(im) < 0.0005) return `${re}`;
    if (Math.abs(re) < 0.0005) return `${im}i`;
    return `${re}${im >= 0 ? '+' : ''}${im}i`;
  }
};
