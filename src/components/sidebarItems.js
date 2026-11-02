// Sidebar structure. `mode` keys describe the page state each sub-link selects.
export const SIDEBAR_ITEMS = [
  {
    "tab": "introduction",
    "badge": "1",
    "key": "nav.introduction",
    "label": "Introduction"
  },
  {
    "tab": "important-concepts",
    "badge": "✦",
    "key": "nav.importantConcepts",
    "label": "Important Concepts"
  },
  {
    "tab": "qubit",
    "badge": "Q",
    "key": "nav.bitsQubits",
    "label": "Bits & Qubits",
    "subs": [
      {
        "key": "qubitTab.classical",
        "label": "Classical",
        "mode": {
          "qubitMode": "classical"
        }
      },
      {
        "key": "qubitTab.oneQubit",
        "label": "One Qubit",
        "mode": {
          "qubitMode": "quantum",
          "qubitSubmode": "1q"
        }
      },
      {
        "key": "qubitTab.twoQubit",
        "label": "Two Qubit",
        "mode": {
          "qubitMode": "quantum",
          "qubitSubmode": "2q"
        }
      },
      {
        "key": "qubitTab.threeQubit",
        "label": "Three Qubit",
        "mode": {
          "qubitMode": "quantum",
          "qubitSubmode": "3q"
        }
      }
    ]
  },
  {
    "tab": "mathsconcept",
    "badge": "∑",
    "key": "nav.mathsConcept",
    "label": "Maths Concept",
    "subs": [
      {
        "key": "mathsTab.complexNumbers",
        "label": "Complex Numbers",
        "mode": {
          "mathsSection": "complex"
        }
      },
      {
        "key": "mathsTab.vectors",
        "label": "Vectors",
        "mode": {
          "mathsSection": "vectors"
        }
      },
      {
        "key": "mathsTab.matrices",
        "label": "Matrices",
        "mode": {
          "mathsSection": "matrices"
        }
      },
      {
        "key": "mathsTab.stateVector",
        "label": "State Vector",
        "mode": {
          "mathsSection": "statevector"
        }
      },
      {
        "key": "mathsTab.diracNotation",
        "label": "Dirac Notation",
        "mode": {
          "mathsSection": "dirac"
        }
      },
      {
        "key": "mathsTab.tensorProducts",
        "label": "Tensor Products",
        "mode": {
          "mathsSection": "tensor"
        }
      }
    ]
  },
  {
    "tab": "gates",
    "badge": "G",
    "key": "nav.gates",
    "label": "Gates",
    "subs": [
      {
        "key": "gatesTab.classical",
        "label": "Classical",
        "mode": {
          "gatesDomain": "classical"
        }
      },
      {
        "key": "gatesTab.quantum",
        "label": "Quantum",
        "mode": {
          "gatesDomain": "quantum"
        }
      },
      {
        "key": "gatesTab.compare",
        "label": "Compare",
        "mode": {
          "gatesDomain": "compare"
        }
      }
    ]
  },
  {
    "tab": "circuit",
    "badge": "C",
    "key": "nav.circuits",
    "label": "Circuits"
  },
  {
    "tab": "measure",
    "badge": "M",
    "key": "nav.measure",
    "label": "Measure"
  },
  {
    "tab": "entangle",
    "badge": "E",
    "key": "nav.entangle",
    "label": "Entangle"
  },
  {
    "tab": "bellstates",
    "badge": "β",
    "key": "nav.bellStates",
    "label": "Bell States"
  },
  {
    "tab": "tunnel",
    "badge": "T",
    "key": "nav.tunnel",
    "label": "Tunnel"
  },
  {
    "tab": "interference",
    "badge": "I",
    "key": "nav.interference",
    "label": "Interference"
  },
  {
    "tab": "beamsplitter",
    "badge": "B",
    "key": "nav.beamSplitter",
    "label": "Beam Splitter"
  },
  {
    "tab": "sterngerlach",
    "badge": "S",
    "key": "nav.sternGerlach",
    "label": "Stern–Gerlach"
  },
  {
    "tab": "teleport",
    "badge": "τ",
    "key": "nav.teleport",
    "label": "Teleport"
  },
  {
    "tab": "superdense",
    "badge": "D",
    "key": "nav.superdense",
    "label": "Superdense Coding"
  },
  {
    "tab": "noise",
    "badge": "N",
    "key": "nav.noise",
    "label": "Noise"
  },
  {
    "tab": "grover",
    "badge": "🔍",
    "key": "nav.grover",
    "label": "Grover's Search"
  }
];
