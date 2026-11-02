'use strict';
// First-run guided tour — shown once per browser (tracked via
// localStorage) to orient new visitors. Depends on app.js's
// switchToTab()/currentTab and core/tab-registry.js indirectly through
// that. Loads right before app.js and is kicked off from app.js's
// DOMContentLoaded, once every other tab is fully initialized.

const TOUR_STORAGE_KEY = 'qe-tour-seen';

const TOUR_STEPS = [
  {
    tab: 'qubit',
    selector: '#tab-sidebar',
    text: 'Each tab explores one quantum concept, building from a single qubit up to entanglement and wave phenomena. Click through them anytime.'
  },
  {
    tab: 'qubit',
    selector: '#bloch-main',
    text: 'This is the Bloch sphere. Try dragging the arrow directly — it sets the qubit\'s state in real time.'
  },
  {
    tab: 'qubit',
    selector: '#theme-toggle',
    text: 'Toggle light or dark mode here — your choice is remembered next time you visit.'
  }
];

let tourIndex = 0;
let tourBackdrop = null;
let tourPopover  = null;
let tourHighlightEl = null;

function startTourIfFirstVisit() {
  if (localStorage.getItem(TOUR_STORAGE_KEY)) return;
  tourIndex = 0;
  // Every step targets a Concepts-page element (nav, #bloch-main,
  // #theme-toggle) — since Roadmap is the default landing view, switch
  // there explicitly rather than relying on whatever mode happened to be
  // active, so the tour never tries to highlight a 0x0 hidden element.
  setAppMode('sim');
  buildTourDOM();
  showTourStep();
}

function buildTourDOM() {
  tourBackdrop = document.createElement('div');
  tourBackdrop.className = 'tour-backdrop';
  tourPopover = document.createElement('div');
  tourPopover.className = 'tour-popover';
  document.body.appendChild(tourBackdrop);
  document.body.appendChild(tourPopover);
}

function clearTourHighlight() {
  if (tourHighlightEl) tourHighlightEl.classList.remove('tour-highlight');
  tourHighlightEl = null;
  document.querySelectorAll('.tour-raise-header').forEach(el => el.classList.remove('tour-raise-header'));
}

function showTourStep() {
  clearTourHighlight();
  const step = TOUR_STEPS[tourIndex];
  if (currentTab !== step.tab) switchToTab(step.tab);

  requestAnimationFrame(() => {
    const target = document.querySelector(step.selector);
    if (!target) { endTour(); return; }

    target.classList.add('tour-highlight');
    tourHighlightEl = target;
    // Elements inside <header> live in its own stacking context (it's
    // position:fixed with its own z-index), so a highlighted child can't
    // out-rank the backdrop just by raising its own z-index — the whole
    // header needs to be raised instead.
    const headerAncestor = target.closest('header');
    if (headerAncestor) headerAncestor.classList.add('tour-raise-header');

    const rect = target.getBoundingClientRect();
    tourPopover.innerHTML = `
      <div class="tour-step-count">Step ${tourIndex + 1} of ${TOUR_STEPS.length}</div>
      <p>${step.text}</p>
      <div class="tour-actions">
        <button class="btn-secondary" id="tour-skip">Skip</button>
        <button class="btn-run" id="tour-next">${tourIndex === TOUR_STEPS.length - 1 ? 'Done' : 'Next'}</button>
      </div>
    `;
    // Usually anchored below the target, but a tall element (e.g. the
    // full-height #tab-sidebar) leaves no room below it — fall back to
    // anchoring beside it instead of letting the popover run off-screen.
    const popoverH = 170;
    let top, left;
    if (rect.bottom + 12 + popoverH <= window.innerHeight) {
      top  = rect.bottom + 12;
      left = Math.min(window.innerWidth - 300, Math.max(12, rect.left));
    } else {
      top  = Math.min(window.innerHeight - popoverH - 12, Math.max(12, rect.top));
      left = Math.min(window.innerWidth - 300, rect.right + 12);
    }
    tourPopover.style.top  = top + 'px';
    tourPopover.style.left = left + 'px';

    document.getElementById('tour-next').addEventListener('click', nextTourStep);
    document.getElementById('tour-skip').addEventListener('click', endTour);
  });
}

function nextTourStep() {
  tourIndex++;
  if (tourIndex >= TOUR_STEPS.length) { endTour(); return; }
  showTourStep();
}

function endTour() {
  clearTourHighlight();
  if (tourBackdrop) tourBackdrop.remove();
  if (tourPopover) tourPopover.remove();
  tourBackdrop = null;
  tourPopover  = null;
  localStorage.setItem(TOUR_STORAGE_KEY, '1');
}
