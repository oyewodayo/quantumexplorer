# Quantum Explorer Code Map

Where each simulated physical claim lives in the source.

| | | | |
|---|---|---|---|
| **16** simulation modules | **32** automated checks | **14** core TypeScript modules | **React 19 · TypeScript · Vite · Tailwind 4** |

---

## Layout

- **`src/core/`** — Framework-free TypeScript modules: quantum math, physics solvers, canvas renderers, and layout algorithms.
- **`src/components/tabs/`** — Full React + TypeScript components for every simulation tab (`IntroductionTab.tsx`, `ImportantConceptsTab.tsx`, `QubitTab.tsx`, `MathsconceptTab.tsx`, `GatesTab.tsx`, `CircuitTab.tsx`, `BellstatesTab.tsx`, `MeasureTab.tsx`, `EntangleTab.tsx`, `TunnelTab.tsx`, `InterferenceTab.tsx`, `BeamsplitterTab.tsx`, `SterngerlachTab.tsx`, `TeleportTab.tsx`, `SuperdenseTab.tsx`, `NoiseTab.tsx`, `GroverTab.tsx`).
- **`src/components/`** — Shared React + TypeScript components: `AppHeader.tsx`, `Sidebar.tsx`, `AppFooter.tsx`, `RoadmapView.tsx`, `BlochSphere.tsx`, `CoinCanvas.tsx`, `Explainer.tsx`, `IntroLearningPath.tsx`, `LessonEmbed.tsx`, `ConfirmModal.tsx`, `Tour.tsx`.
- **`src/hooks/` & `src/state/`** — Shared React hooks (`useI18n.ts`, `useNav.ts`, `useProgress.ts`, `useTheme.ts`) and observable stores (`nav.ts`, `progress.ts`).
- **`src/i18n/` & `src/content/`** — Typed localization dictionary (`en.ts`, `fr.ts`, `es.ts`) and curriculum data (`roadmapContent.ts`, `text.ts`).
- **`src/styles/`** — The stylesheets, imported through Vite. `src/styles.css` adds Tailwind theme tokens and utilities.
- **`tests/run.ts`** — `npm test`; runs automated physics and curriculum verification checks against `src/core` and `src/content`.

## Core mathematics & physics (`src/core/`)

- **`complex.ts`** — Complex-number arithmetic (`C`), the primitive everything else uses.
- **`qubit.ts`** — `Qubit`: two complex amplitudes plus the Bloch-sphere (θ, φ) representation.
- **`gates.ts`** — `GATES`: the unitary matrices H, X, Y, Z, S, T, and `rotationMatrix()` for Rx/Ry/Rz.
- **`twoQubit.ts`** — `TwoQubitState`: 4 amplitudes, CNOT, Born-rule `measureQubit()`, partial-trace reduction to a single-qubit Bloch vector, and the oracle/diffusion steps Grover's search uses.
- **`threeQubit.ts`** — `ThreeQubitState`: 8 amplitudes, CNOT, Toffoli, `measureQubit()`, and the same Grover steps at N=8.
- **`tunnelSolver.ts`** — `TunnelSolver`: staggered-leapfrog Schrödinger integrator (`step()`), barrier construction and reflected/transmitted probabilities.
- **`noise.ts`** — `noiseCompute`: T₁/T₂ relaxation and dephasing with T₂ capped at 2T₁.
- **`interference.ts`** — `interferenceIntensity` and `interferenceSampleY`: double-slit probability profile and Monte-Carlo sampling.
- **`classicalGates.ts`** — Classical Boolean gate evaluations, truth tables, and descriptions.
- **`blochRenderer.ts`** — 3D Bloch sphere canvas projection, shading, trail, and hit-testing.

## Tests

`npm test` runs 32 dependency-free checks: complex and single-qubit math, multi-qubit gates, measurement collapse, teleportation, superdense coding, Grover at N=4 and N=8, the tunnelling solver's probability conservation and transmission scaling, T₁/T₂ noise relaxation, double-slit interference, concept map layout, and lesson/quiz integrity.
