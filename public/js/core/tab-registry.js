'use strict';
// No dependencies. Loads before every tabs/*.js file, each of which calls
// registerTab() from its own init function (during app.js's
// DOMContentLoaded) to declare what should happen when its tab becomes
// visible/hidden. app.js's tab-switch handler looks entries up here
// instead of branching on tab name — adding a new tab never requires
// touching app.js's switch logic, only calling registerTab() once.

const TABS = {};

/**
 * Declares lifecycle hooks for a tab.
 * @param {string} name - matches a button's data-tab and its
 *   `tab-<name>` section id.
 * @param {{onEnter?: Function, onLeave?: Function}} handlers - onEnter
 *   fires every time the tab becomes visible (including page load, for
 *   the initially-active tab, if you call it yourself); onLeave fires
 *   right before switching away. Both are optional.
 */
function registerTab(name, handlers) {
  TABS[name] = handlers || {};
}
