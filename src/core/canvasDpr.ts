/**
 * Configures a <canvas> backing store for crisp HiDPI / Retina rendering.
 * Returns the logical CSS width, height, and active devicePixelRatio, and
 * resets the 2D context transform so callers can draw in CSS pixel coordinates.
 */
export function setupHiDPICanvas(
  canvas: HTMLCanvasElement,
  cssWidth?: number,
  cssHeight?: number
): { ctx: CanvasRenderingContext2D; width: number; height: number; dpr: number } | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1;
  const w = cssWidth ?? (parseFloat(canvas.dataset.cssWidth || '') || canvas.width || 260);
  const h = cssHeight ?? (parseFloat(canvas.dataset.cssHeight || '') || canvas.height || 260);

  canvas.dataset.cssWidth = String(w);
  canvas.dataset.cssHeight = String(h);

  const targetW = Math.round(w * dpr);
  const targetH = Math.round(h * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: w, height: h, dpr };
}
