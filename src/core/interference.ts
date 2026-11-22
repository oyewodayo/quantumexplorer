// Double-slit intensity at screen height y.
//   'coherent' / 'double' -> amplitudes add: 2 + 2cos(k(r1 - r2)), range [0, 4]
//   'single'              -> one slit open, nothing to interfere with
//   'which-path'          -> both open but path known, so no cross term: flat
export type InterferenceMode = 'double' | 'coherent' | 'single' | 'which-path';

export interface InterferenceGeometry {
  screenX: number;
  sourceX: number;
  y1: number;
  y2: number;
  centerY?: number;
}

export function interferenceIntensity(y: number, geo: InterferenceGeometry, mode: InterferenceMode, wavelength: number): number {
  const k = 2 * Math.PI / wavelength;
  if (mode === 'single') return 1;
  const r1 = Math.hypot(geo.screenX - geo.sourceX, y - geo.y1);
  const r2 = Math.hypot(geo.screenX - geo.sourceX, y - geo.y2);
  if (mode === 'which-path') return 2;
  return 2 + 2 * Math.cos(k * (r1 - r2));
}

export const interferenceMaxIntensity = (mode: InterferenceMode): number =>
  mode === 'single' ? 1 : mode === 'which-path' ? 2 : 4;
