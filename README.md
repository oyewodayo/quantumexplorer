# Quantum Explorer

An interactive quantum computing, quantum mechanics and quantum information learning platform.

## Getting started

Requires Node.js 20.19+ and npm.

```sh
npm install
npm run dev
```

`npm start` starts the same development server.

Create a production build with `npm run build`, then preview it with
`npm run preview`.

## Project layout

- `src/App.jsx` renders the whole interface as React components.
- `src/components/generated/` has one React component per section: header,
  sidebar, footer, home roadmap and each of the 17 simulation tabs.
- `src/engine/engine.js` is the simulation engine (quantum math, Bloch
  renderer, i18n, roadmap, tour and each tab's controller), bundled by Vite.
  `startEngine()` runs once after React mounts the components.
- `src/styles/` holds the original CSS, imported through Vite;
  `src/styles.css` adds Tailwind CSS 4 theme tokens and utilities.
- `public/js/` and `public/legacy.html` are the original sources, kept for
  `tests/run.js` (`npm test`).

Tailwind's global preflight is omitted so the existing simulation styles are
unchanged; use Tailwind utilities in any new React component.
