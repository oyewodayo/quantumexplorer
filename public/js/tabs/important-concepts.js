'use strict';
// Important Concepts tab — the only interactive behavior on an otherwise
// static glossary page: a live search box that filters the glossary
// grids as you type (initImportantConceptsSearch()), and tapping a card
// to zoom it into a centered overlay for a bigger, easier read, dismissed
// via its own close button, Esc, or a backdrop click
// (initImportantConceptsZoom()/openConceptZoom()). The zoom overlay
// depends on: core/dom-utils.js's showConfirmModal for the sibling
// pattern it mirrors (fixed backdrop, Esc/backdrop-click to close, one
// fresh element per open rather than a reused hidden one).
// No registerTab() entry — this tab carries no simulation state to
// enter/leave, just these two delegated/one-time handlers.

/** Filters the glossary grids by re-reading each card's own live
 *  textContent on every keystroke — already-translated by i18n.js's
 *  applyTranslations(), so this needs no separate per-language search
 *  index and one onLangChange() re-run (below) keeps it correct across a
 *  language switch mid-search. A group's .section-label and
 *  .intro-glossary-grid are hidden together whenever every card inside
 *  it is filtered out, rather than leaving an empty heading floating
 *  above nothing. */
function initImportantConceptsSearch() {
  const input = document.getElementById('concept-search');
  if (!input) return;
  const clearBtn = document.getElementById('concept-search-clear');
  const emptyMsg = document.getElementById('concept-search-empty');
  const grids = Array.from(document.querySelectorAll('#tab-important-concepts .intro-glossary-grid'));
  const labels = Array.from(document.querySelectorAll('#tab-important-concepts .section-label'));

  function applyFilter() {
    const query = input.value.trim().toLowerCase();
    clearBtn.style.display = query ? '' : 'none';

    let totalVisible = 0;
    grids.forEach((grid, i) => {
      let groupVisible = 0;
      grid.querySelectorAll('.card').forEach(card => {
        const matches = !query || card.textContent.toLowerCase().includes(query);
        card.classList.toggle('concept-hidden', !matches);
        if (matches) groupVisible++;
      });
      grid.classList.toggle('concept-hidden', groupVisible === 0);
      if (labels[i]) labels[i].classList.toggle('concept-hidden', groupVisible === 0);
      totalVisible += groupVisible;
    });

    emptyMsg.style.display = totalVisible === 0 ? '' : 'none';
    if (totalVisible === 0) {
      emptyMsg.textContent = t('concepts.searchNoResults', 'No concepts match "{query}".').replace('{query}', input.value.trim());
    }
  }

  input.addEventListener('input', applyFilter);
  clearBtn.addEventListener('click', () => { input.value = ''; applyFilter(); input.focus(); });
  // Re-render the "no results" message (and, in principle, re-filter) so
  // switching language mid-search never leaves stale English text behind
  // — see core/i18n.js's onLangChange().
  onLangChange(applyFilter);
}

/** Wires a single delegated click handler on the whole Important Concepts
 *  section rather than one listener per card, so it keeps working
 *  regardless of how many glossary cards get added later. */
function initImportantConceptsZoom() {
  const section = document.getElementById('tab-important-concepts');
  if (!section) return;
  section.addEventListener('click', (e) => {
    const card = e.target.closest('.intro-glossary-grid .card');
    if (card) openConceptZoom(card);
  });
}

let activeConceptZoom = null; // { close } while a zoom overlay is open, else null

/**
 * FLIP transition: the overlay card is built at its real (bigger,
 * centered) size first, then instantly transformed (translate+scale) to
 * exactly overlay the clicked card's on-screen position/size, then that
 * transform is animated back to identity — so the very first frame looks
 * identical to the grid card sitting where it was, and it visibly grows
 * from there into the centered overlay, rather than just fading in
 * generically. Closing plays the same transform forward instead of
 * reversed-from-scratch, so it shrinks back into the same card.
 */
function openConceptZoom(card) {
  if (activeConceptZoom) return; // one overlay at a time
  const startRect = card.getBoundingClientRect();

  const backdrop = document.createElement('div');
  backdrop.className = 'concept-zoom-backdrop';
  backdrop.innerHTML = `
    <div class="concept-zoom-card" role="dialog" aria-modal="true">
      <button class="concept-zoom-close" type="button" aria-label="Close" data-zoom-close>✕</button>
      <div class="concept-zoom-body">${card.innerHTML}</div>
    </div>`;
  document.body.appendChild(backdrop);
  const modal = backdrop.querySelector('.concept-zoom-card');

  const endRect = modal.getBoundingClientRect();
  const scaleX = startRect.width / endRect.width;
  const scaleY = startRect.height / endRect.height;
  const dx = (startRect.left + startRect.width / 2) - (endRect.left + endRect.width / 2);
  const dy = (startRect.top + startRect.height / 2) - (endRect.top + endRect.height / 2);
  const fromCardTransform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    modal.style.transform = fromCardTransform;
    modal.style.opacity = '0.4';
  }
  void modal.offsetWidth; // force layout so the transform above paints before the transition below starts
  backdrop.classList.add('visible');
  requestAnimationFrame(() => {
    modal.style.transform = '';
    modal.style.opacity = '';
  });

  function close() {
    document.removeEventListener('keydown', onKey);
    activeConceptZoom = null;
    if (reduceMotion) { backdrop.remove(); return; }
    modal.style.transform = fromCardTransform;
    modal.style.opacity = '0.4';
    backdrop.classList.remove('visible');
    modal.addEventListener('transitionend', () => backdrop.remove(), { once: true });
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  modal.querySelector('[data-zoom-close]').addEventListener('click', close);
  document.addEventListener('keydown', onKey);

  activeConceptZoom = { close };
}
