# Quantum Explorer improvement plan

Production domain: **quantumexplorer.com**

Legend: `[x]` done · `[~]` partly done · `[ ]` not started

## 1. Finish the React + TypeScript migration  `[x]`

Goal: replace `src/engine/engine.js` (about 12,000 lines of code that edits the page directly) with ordinary React + TypeScript components, state and hooks.

- [x] 1.0 Render all markup as React components (`src/components/tabs/`)
- [x] 1.0 Bundle the old scripts through Vite (`src/engine/engine.js`)
- [x] 1.1 Move the quantum math into ES modules (`src/core/`: complex, gates, qubit, two-qubit, three-qubit) and point the tests at them
- [x] 1.2 Move the tunnelling solver into `src/core/tunnelSolver.ts` (tested)
- [x] 1.2b Remaining pure physics: noise decay and interference done (`src/core/noise.ts`, `interference.ts`, tested); Grover, teleport and superdense logic converted to React state
- [x] 1.2c Theme state and the Bloch renderer moved into ES modules (`src/core/theme.ts`, `blochRenderer.ts`)
- [x] 1.3 Shared React `BlochSphere` component (`src/components/BlochSphere.tsx`)
- [x] 1.4 Shared hooks: `useTheme`, `useI18n`, `useNav`, `useProgress`
- [x] 1.5 App shell in React: header, Home toggle, sidebar, footer
- [x] 1.6 Convert the tabs one by one (each: component + state, then delete its code from the engine):
  - [x] Measure (`src/components/tabs/MeasureTab.tsx`)
  - [x] Noise (`src/components/tabs/NoiseTab.tsx`)
  - [x] Superdense Coding (`src/components/tabs/SuperdenseTab.tsx`)
  - [x] Teleport (`src/components/tabs/TeleportTab.tsx`)
  - [x] Entangle (`src/components/tabs/EntangleTab.tsx`)
  - [x] Bell States (`src/components/tabs/BellstatesTab.tsx`)
  - [x] Tunnel (`src/components/tabs/TunnelTab.tsx`)
  - [x] Interference (`src/components/tabs/InterferenceTab.tsx`)
  - [x] Beam Splitter (`src/components/tabs/BeamsplitterTab.tsx`)
  - [x] Stern-Gerlach (`src/components/tabs/SterngerlachTab.tsx`)
  - [x] Grover (`src/components/tabs/GroverTab.tsx`)
  - [x] Gates (`src/components/tabs/GatesTab.tsx`)
  - [x] Circuits (`src/components/tabs/CircuitTab.tsx` — 1, 2 and 3 qubit, plus classical)
  - [x] Bits & Qubits (`src/components/tabs/QubitTab.tsx`)
  - [x] Maths Concept (`src/components/tabs/MathsconceptTab.tsx` — including State Vector)
  - [x] Important Concepts (`src/components/tabs/ImportantConceptsTab.tsx`)
  - [x] Introduction (`src/components/tabs/IntroductionTab.tsx`)
- [x] 1.7 Home concept map, My Progress, lessons, quizzes, and first-visit tour done in React (`RoadmapView`, `LessonEmbed`, `IntroLearningPath`, `Tour`)
- [x] 1.8 Delete `engine.js`, `public/js`, `public/legacy.html`, `public/css`

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
