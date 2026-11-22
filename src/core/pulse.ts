// ─── ONE-SHOT PULSE ANIMATION ─────────────────────────────────────────
/* Adds `className` to `el` just long enough to play its CSS animation,
   then removes it — forcing a reflow first so re-triggering the same
   pulse on an element that's still mid-animation restarts it cleanly
   instead of being a no-op. */
export function pulseElement(el: HTMLElement | SVGElement | null | undefined, className: string, duration = 450): void {
  if (!el) return;
  el.classList.remove(className);
  if ('offsetWidth' in el) void el.offsetWidth;
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), duration);
}

export const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
