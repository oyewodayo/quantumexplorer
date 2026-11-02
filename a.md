# Quantum Explorer improvement plan

Production domain: **quantumexplorer.com**

Legend: `[x]` done · `[~]` partly done · `[ ]` not started

## 1. Finish the React migration  `[~]`

Goal: replace `src/engine/engine.js` (about 12,000 lines of code that edits the page directly) with ordinary React components, state and hooks.

- [x] 1.0 Render all markup as React components (`src/components/generated/`)
- [x] 1.0 Bundle the old scripts through Vite (`src/engine/engine.js`)
- [x] 1.1 Move the quantum math into ES modules (`src/core/`: complex, gates, qubit, two-qubit, three-qubit) and point the tests at them
- [x] 1.2 Move the tunnelling solver into `src/core/tunnelSolver.js` (tested)
- [~] 1.2b Remaining pure physics: noise decay and interference done (`src/core/noise.js`, `interference.js`, tested); Grover, teleport and superdense logic still tangled with the page code
- [x] 1.2c Theme state and the Bloch renderer moved into ES modules (`src/core/theme.js`, `blochRenderer.js`)
- [ ] 1.3 Shared React `BlochSphere` component
- [x] 1.4 Shared hooks: `useTheme`, `useI18n`, `useNav`, `useProgress`
- [x] 1.5 App shell in React: header, Home toggle, sidebar, footer
- [ ] 1.6 Convert the tabs one by one (each: component + state, then delete its code from the engine):
  - [x] Measure (`src/components/tabs/MeasureTab.jsx`)
  - [ ] Noise
  - [ ] Superdense Coding
  - [ ] Teleport
  - [ ] Entangle
  - [ ] Bell States
  - [ ] Tunnel
  - [ ] Interference
  - [ ] Beam Splitter
  - [ ] Stern-Gerlach
  - [ ] Grover
  - [ ] Gates
  - [ ] Circuits (1, 2 and 3 qubit, plus classical)
  - [ ] Bits & Qubits
  - [ ] Maths Concept (including State Vector)
  - [ ] Important Concepts
  - [ ] Introduction
- [~] 1.7 Home concept map, My Progress, lessons and quizzes done in React (`RoadmapView`, `LessonEmbed`, `IntroLearningPath`); the first-visit tour is still in the engine
- [ ] 1.8 Delete `engine.js`, `public/js`, `public/legacy.html`, `public/css`

## 2. Code splitting and load time  `[ ]`

- [x] Load only the selected language (French and Spanish are now separate downloads; main bundle 1 MB to 770 KB)
- [ ] Lazy-load each tab with `React.lazy`

## 3. Content and teaching  `[ ]`

- [ ] "Next lesson" button at the end of each tab
- [ ] Export / import saved progress
- [ ] Tour: visible Skip link, longer tour, "Replay tour" in the header

## 4. Accessibility and mobile  `[ ]`

- [ ] Real buttons and labels for controls
- [ ] Keyboard control for the Bloch sphere, visible focus outlines
- [ ] Check apparatus diagrams and circuit builders on a phone
- [ ] "Reduce motion" setting
- [ ] Contrast check for small labels in dark mode

## 5. Quality and maintenance  `[ ]`

- [x] Put the project under git (github.com/oyewodayo/quantumexplorer)
- [ ] Browser test that opens every tab and clicks through it
- [~] ESLint done (`npm run lint`, catches undefined names); Prettier not yet
- [ ] Remove leftover copies once nothing uses them
- [~] README updated; page title still mentions CERN in places

## 6. Product ideas  `[ ]`

- [ ] "Copy link" button on every tab
- [ ] Challenge mode
- [ ] Installable offline use (PWA)
- [ ] Glossary with tooltips

## 7. Search visibility (quantumexplorer.com)  `[~]`

- [x] Fix shared links (they now open the right tab and state)
- [x] Per-tab address (`?tab=`) and page title, meta description, social tags, structured data, `robots.txt`
- [ ] `sitemap.xml` and canonical link for `https://quantumexplorer.com`
- [ ] One real page per topic (for example `/quantum-gates`) with its own title and text, generated at build time
