'use strict';
// Mostly a reference tab — text + formulas, no state of its own — except
// the State Vector section, which also embeds the interactive
// classical-vs-quantum comparison widget from tabs/statevector-tab.js
// (wired up separately by that file's own initStatevecTab(), called
// alongside initMathsConceptTab() in app.js). Navigated exclusively via
// the sidebar's Maths Concept sub-links (see the generic .tab-sub
// handler in app.js), which call setMathsSection() directly, so there's
// no in-page toggle to wire up here.
// Depends on: core/tab-registry.js (registerTab), tabs/statevector-tab.js
// (redrawStatevecCanvases).

const MATHS_SECTIONS = ['complex', 'vectors', 'matrices', 'statevector', 'dirac', 'tensor'];

function initMathsConceptTab() {
  registerTab('mathsconcept', {});
  setMathsSection('complex'); // matches the panel already visible by default in index.html
}

/** Shows the one .maths-panel matching `section`, hides the rest. */
function setMathsSection(section) {
  MATHS_SECTIONS.forEach(name => {
    document.getElementById(`maths-${name}`).style.display = name === section ? '' : 'none';
  });
  syncSidebarSub('mathsconcept', { mathsSection: section });
  // The state-vector section's canvases (see tabs/statevector-tab.js)
  // don't redraw themselves while display:none, so opening this section
  // needs the same explicit redraw a tab visit used to trigger back when
  // this widget was its own top-level "Statevec" tab.
  if (section === 'statevector') redrawStatevecCanvases();
}
