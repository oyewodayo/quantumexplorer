# Quantum Explorer Code Map

Where each simulated physical claim lives in the source.

| | | | |
|---|---|---|---|
| **16** simulation modules | **27** automated checks | **5** quantum-math modules | **React 19 · Vite · Tailwind 4** |

---

## Layout

- **`src/core/`** — Framework-free ES modules: the math and physics. Everything else is UI on top of these.
- **`src/components/generated/`** — One React component per page section: header, sidebar, footer, Home map and each simulation tab.
- **`src/engine/engine.js`** — The interactive layer (Bloch renderer, language switching, roadmap, tour and each tab's controller). It is being migrated tab by tab into React components; see `a.md`. Each original file is marked with a `════ js/… ════` banner.
- **`src/styles/`** — The stylesheets, imported through Vite. `src/styles.css` adds Tailwind theme tokens and utilities.
- **`tests/run.mjs`** — `npm test`; imports `src/core` directly.

## Core mathematics (`src/core/`)

- **`complex.js`** — Complex-number arithmetic (`C`), the primitive everything else uses.
- **`qubit.js`** — `Qubit`: two complex amplitudes plus the Bloch-sphere (θ, φ) representation.
- **`gates.js`** — `GATES`: the unitary matrices H, X, Y, Z, S, T, and `rotationMatrix()` for Rx/Ry/Rz.
- **`twoQubit.js`** — `TwoQubitState`: 4 amplitudes, CNOT, Born-rule `measureQubit()`, partial-trace reduction to a single-qubit Bloch vector, and the oracle/diffusion steps Grover's search uses.
- **`threeQubit.js`** — `ThreeQubitState`: 8 amplitudes, CNOT, Toffoli, `measureQubit()`, and the same Grover steps at N=8.
- **`tunnelSolver.js`** — `TunnelSolver`: staggered-leapfrog Schrödinger integrator (`step()`), barrier construction and reflected/transmitted probabilities.

## Simulation modules (in `src/engine/engine.js`)

| Topic | Functions to look for |
|---|---|
| Bits & Qubits, Maths Concept, Gates | `initQubitTab`, `initMathsConceptTab`, `buildGateButtons` |
| Circuits (1/2/3 qubit and classical) | `initCircuitTab`, `initCircuit2Tab`, `initCircuit3Tab`, `renderHalfAdderCompareDiagrams` |
| Measurement, Entanglement, Bell States | `initMeasureTab`, `initEntangle`, `runBellStateCircuit` |
| Tunnelling | `fireTunnelPacket`, `drawTunnel` (physics in `TunnelSolver`) |
| Interference | `interferenceIntensity`, `interferenceAddHits` |
| Beam Splitter, Stern–Gerlach | `initBeamSplitterTab`, `initSternGerlachTab` |
| Teleportation, Superdense Coding | `fireTeleport`, `sendSuperdense` |
| Noise & Decoherence | `noiseCompute`: T₁/T₂ relaxation with T₂ capped at 2T₁ |
| Grover's Search | `GROVER_MODES`, `runGrover`: N=4 (exact after 1 iteration) and N=8 (about 94.5% after 2; a 3rd overshoots) |

## Tests

`npm test` runs 27 dependency-free checks: complex and single-qubit math, multi-qubit gates, measurement collapse, teleportation, superdense coding, Grover at N=4 and N=8, and the tunnelling solver's probability conservation and transmission scaling.
