// Double-slit intensity at screen height y.
//   'coherent'   -> amplitudes add: 2 + 2cos(k(r1 - r2)), range [0, 4]
//   'single'     -> one slit open, nothing to interfere with
//   'which-path' -> both open but path known, so no cross term: flat
export function interferenceIntensity(y, geo, mode, wavelength) {
  const k = 2 * Math.PI / wavelength;
  if (mode === 'single') return 1;
  const r1 = Math.hypot(geo.screenX - geo.sourceX, y - geo.y1);
  const r2 = Math.hypot(geo.screenX - geo.sourceX, y - geo.y2);
  if (mode === 'which-path') return 2;
  return 2 + 2 * Math.cos(k * (r1 - r2));
}

export const interferenceMaxIntensity = mode =>
  mode === 'single' ? 1 : mode === 'which-path' ? 2 : 4;
