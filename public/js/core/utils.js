'use strict';
// No dependencies. Used by several tabs/*.js async flows (call-time only).

// ─── UTILITY ──────────────────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
