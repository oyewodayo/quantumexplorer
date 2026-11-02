// ─── ONE-SHOT PULSE ANIMATION ─────────────────────────────────────────
/* Adds `className` to `el` just long enough to play its CSS animation,
   then removes it — forcing a reflow first so re-triggering the same
   pulse on an element that's still mid-animation restarts it cleanly
   instead of being a no-op (adding a class that's already present
   doesn't restart a running CSS animation). Reused for gate-apply and
   measurement-collapse pulses. */
export function pulseElement(el, className, duration = 450) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), duration);
}

export const delay = (ms) => new Promise((r) => setTimeout(r, ms));
