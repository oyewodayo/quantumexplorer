import { useEffect, useState } from 'react';
import { setAppMode, switchToTab } from '../state/nav.ts';

const TOUR_STORAGE_KEY = 'qe-tour-seen';

interface TourStep {
  tab: string;
  selector: string;
  text: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    tab: 'qubit',
    selector: '#tab-sidebar',
    text: 'Each tab explores one quantum concept, building from a single qubit up to entanglement and wave phenomena. Click through them anytime.',
  },
  {
    tab: 'qubit',
    selector: '#bloch-main',
    text: 'This is the Bloch sphere. Try dragging the arrow directly — it sets the qubit\'s state in real time.',
  },
  {
    tab: 'qubit',
    selector: '#theme-toggle',
    text: 'Toggle light or dark mode here — your choice is remembered next time you visit.',
  },
];

export default function Tour({ skipTour }: { skipTour: boolean }) {
  const [stepIdx, setStepIdx] = useState<number | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 100, left: 100 });

  useEffect(() => {
    if (skipTour) return;
    try {
      if (localStorage.getItem(TOUR_STORAGE_KEY)) return;
    } catch {
      return;
    }
    setAppMode('sim');
    switchToTab('qubit');
    setStepIdx(0);
  }, [skipTour]);

  useEffect(() => {
    if (stepIdx === null) return undefined;
    const step = TOUR_STEPS[stepIdx];
    switchToTab(step.tab);

    let highlightEl: Element | null = null;
    let headerEl: Element | null = null;

    const raf = requestAnimationFrame(() => {
      const target = document.querySelector(step.selector);
      if (!target) {
        endTour();
        return;
      }
      target.classList.add('tour-highlight');
      highlightEl = target;
      const headerAncestor = target.closest('header');
      if (headerAncestor) {
        headerAncestor.classList.add('tour-raise-header');
        headerEl = headerAncestor;
      }
      const rect = target.getBoundingClientRect();
      const popoverH = 170;
      let top: number, left: number;
      if (rect.bottom + 12 + popoverH <= window.innerHeight) {
        top = rect.bottom + 12;
        left = Math.min(window.innerWidth - 300, Math.max(12, rect.left));
      } else {
        top = Math.min(window.innerHeight - popoverH - 12, Math.max(12, rect.top));
        left = Math.min(window.innerWidth - 300, rect.right + 12);
      }
      setPos({ top, left });
    });

    return () => {
      cancelAnimationFrame(raf);
      if (highlightEl) highlightEl.classList.remove('tour-highlight');
      if (headerEl) headerEl.classList.remove('tour-raise-header');
    };
  }, [stepIdx]);

  function endTour() {
    setStepIdx(null);
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, '1');
    } catch { /* private mode */ }
  }

  function nextStep() {
    if (stepIdx === null) return;
    if (stepIdx + 1 >= TOUR_STEPS.length) {
      endTour();
    } else {
      setStepIdx(stepIdx + 1);
    }
  }

  if (stepIdx === null) return null;
  const step = TOUR_STEPS[stepIdx];

  return (
    <>
      <div className="tour-backdrop" />
      <div className="tour-popover" style={{ top: pos.top, left: pos.left }}>
        <div className="tour-step-count">
          Step {stepIdx + 1} of {TOUR_STEPS.length}
        </div>
        <p>{step.text}</p>
        <div className="tour-actions">
          <button className="btn-secondary" id="tour-skip" onClick={endTour}>
            Skip
          </button>
          <button className="btn-run" id="tour-next" onClick={nextStep}>
            {stepIdx === TOUR_STEPS.length - 1 ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
}
