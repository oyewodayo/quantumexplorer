'use strict';
// Français — traduction complète de la locale canonique en.js. Chaque clé
// présente ici doit exister à l'identique dans en.js ; core/i18n.js's t()
// se rabat sur en.js si la langue active (ici le français) n'a pas la clé
// demandée. Seules les valeurs (le texte) sont traduites — les noms de
// clés restent strictement identiques à ceux de en.js.
registerLocale('fr', {
  header: {
    tag: 'Quantum Explorer · CERN',
    themeToggle: 'Basculer thème clair / sombre'
  },
  footer: {
    tagline: 'Une plateforme interactive pour apprendre l\'informatique quantique et la mécanique quantique',
    cernLink: 'Site officiel du CERN',
    copyright: 'Copyright © {year} CERN'
  },
  nav: {
    home: 'Accueil',
    introduction: 'Introduction',
    importantConcepts: 'Concepts importants',
    bitsQubits: 'Bits & Qubits',
    mathsConcept: 'Concept mathématique',
    gates: 'Portes',
    circuits: 'Circuits',
    measure: 'Mesure',
    entangle: 'Intrication',
    bellStates: 'États de Bell',
    tunnel: 'Effet tunnel',
    interference: 'Interférence',
    beamSplitter: 'Séparateur de faisceau',
    sternGerlach: 'Stern–Gerlach',
    teleport: 'Téléporter',
    superdense: 'Codage Superdense',
    noise: 'Bruit',
    grover: 'Recherche de Grover'
  },
  qubitTab: {
    classical: 'Classique',
    oneQubit: 'Un qubit',
    twoQubit: 'Deux qubits',
    threeQubit: 'Trois qubits',
    pageTitle: 'Bits & Qubits',
    pageSubtitle: 'Découvrez l\'information classique et quantique en explorant un bit, un qubit unique, ou un système à deux qubits.',
    classicalBitBadge: 'Bit classique',
    classicalBitDesc: 'Un bit est la plus petite unité d\'information dans un ordinateur classique. Contrairement à un qubit, un bit classique n\'existe jamais dans les deux états à la fois.',
    currentBit: 'Bit actuel',
    possibleValues: 'Valeurs possibles',
    classicalExplainer: 'Actionnez l\'interrupteur pour changer le bit. Remarquez qu\'il vaut toujours 0 ou 1, jamais les deux.',
    qubitBadge: 'Qubit',
    qubitDesc: 'Un qubit est l\'unité fondamentale de l\'information quantique. Contrairement à un bit classique, il peut exister en superposition de 0 et de 1 à la fois — son état est décrit par deux amplitudes complexes, α et β, jusqu\'au moment où il est mesuré.',
    qubitIntroExplainer: 'Choisissez un mode ci-dessous : explorez la superposition d\'un qubit unique sur la sphère de Bloch, ou observez comment deux qubits indépendants se combinent en un état conjoint.',
    oneQubitDesc: 'Une superposition de 0 et de 1 à la fois',
    exploreBlochSphere: 'Explorer la sphère de Bloch',
    oneQubitExplainer: 'Un qubit peut être en superposition de |0⟩ et |1⟩ simultanément. Faites glisser les curseurs pour explorer chaque état possible sur la sphère de Bloch — chaque point est un état de qubit valide, inaccessible à tout bit classique.',
    qubitABadge: 'Qubit A',
    qubitADesc: 'Indépendant — non intriqué avec B',
    qubitBBadge: 'Qubit B',
    qubitBDesc: 'Indépendant — non intriqué avec A',
    jointState: 'État conjoint — |ψ_A⟩ ⊗ |ψ_B⟩',
    twoQubitExplainer: 'Deux qubits, chacun manipulé indépendamment — l\'état conjoint ci-dessus n\'est que le produit de leurs probabilités individuelles, P(ab) = P(a) × P(b). Rien n\'est encore corrélé ici ; c\'est exactement l\'ingrédient qu\'ajoute l\'onglet Intrication avec une porte CNOT.',
    classicalTryMeIdle: 'Cliquez sur Essayez-moi pour voir le bit basculer d\'avant en arrière.',
    oneQubitTryMeIdle: 'Cliquez sur Essayez-moi pour parcourir les six états de base.',
    twoQubitTryMeIdle: 'Cliquez sur Essayez-moi pour faire parcourir aux deux qubits les quatre états de base ensemble.',
    whatIsQubitBody: 'Un qubit est souvent décrit comme « 0 et 1 en même temps », mais c\'est un raccourci pour quelque chose de plus précis : son état est une <span class="key-term">superposition</span> — une combinaison pondérée — des deux résultats de base |0⟩ et |1⟩, fixée par deux <span class="key-term">amplitudes complexes</span> α et β. Élever au carré la taille de chaque amplitude donne la probabilité de ce résultat lors de la mesure — mais avant la mesure, le qubit n\'en a véritablement choisi aucun. Un bit classique a exactement deux états. Un qubit en a une infinité : chaque point à la surface de la sphère de Bloch ci-dessous est un état valide, pas seulement ses deux pôles.',
    blochEarthTitle: 'La sphère de Bloch — pensez à la planète Terre',
    blochEarthBody: 'La sphère sur laquelle vit votre qubit fonctionne comme un globe. Le <span class="key-term">pôle nord</span> est |0⟩ et le <span class="key-term">pôle sud</span> est |1⟩ — θ (thêta) est la « latitude », c\'est-à-dire à quel point le qubit s\'est incliné du pôle |0⟩ vers |1⟩. Se trouver exactement sur l\'<span class="key-term">équateur</span> (θ = 90°) signifie une <span class="key-term">superposition</span> égale 50/50 des deux. φ (phi) est la « longitude » — elle ne change jamais les probabilités de mesure, seulement la <span class="key-term">phase</span> relative entre les deux amplitudes, invisible lors d\'une seule mesure mais c\'est exactement ce qui provoque l\'interférence ailleurs dans l\'application.',
    qubitCBadge: 'Qubit C',
    qubitA3Desc: 'Indépendant — non intriqué avec B ou C',
    qubitB3Desc: 'Indépendant — non intriqué avec A ou C',
    qubitC3Desc: 'Indépendant — non intriqué avec A ou B',
    jointState3: 'État conjoint — |ψ_A⟩ ⊗ |ψ_B⟩ ⊗ |ψ_C⟩',
    threeQubitExplainer: 'Trois qubits, chacun manipulé indépendamment — l\'état conjoint ci-dessus n\'est que le produit des trois probabilités individuelles, P(abc) = P(a) × P(b) × P(c). Rien n\'est encore corrélé ici ; en généralisant cette même idée avec une porte CNOT, on obtient les états GHZ dans le constructeur à 3 qubits de l\'onglet Circuits.',
    threeQubitTryMeIdle: 'Cliquez sur Essayez-moi pour faire parcourir aux trois qubits les quatre états de base ensemble.'
  },
  maths: {
    title: 'Concept mathématique',
    subtitle: 'Le langage mathématique derrière les qubits — nombres complexes, vecteurs, matrices, vecteurs d\'état, notation de Dirac, et produits tensoriels.',
    complexBody1: 'Les amplitudes d\'un qubit ne sont pas de simples nombres réels — ce sont des nombres complexes, chacun avec une partie réelle et une partie imaginaire. Cette dimension supplémentaire est ce qui rend la phase (et l\'interférence) possible.',
    complexFormula1: 'z = a + bi,&nbsp;&nbsp; i² = −1',
    complexFormula2: 'Module : |z| = √(a² + b²)',
    complexFormula3: 'Forme polaire : z = r·e<sup>iθ</sup> = r(cos θ + i sin θ)',
    complexBody2: 'Un état de qubit α|0⟩ + β|1⟩ a des amplitudes complexes α, β. Seuls leurs modules au carré |α|², |β|² sont directement observables (en tant que probabilités de mesure) — la phase relative entre elles est invisible à une seule mesure, mais c\'est elle qui entraîne l\'interférence.',
    vectorsBody1: 'L\'état d\'un qubit est un vecteur dans un espace vectoriel complexe à 2 dimensions, écrit comme une colonne de ses deux amplitudes.',
    vectorsFormula1: '|0⟩ = [1, 0]<sup>T</sup>&nbsp;&nbsp;&nbsp; |1⟩ = [0, 1]<sup>T</sup>',
    vectorsFormula2: '|ψ⟩ = α|0⟩ + β|1⟩ = [α, β]<sup>T</sup>',
    vectorsFormula3: 'Normalisation : |α|² + |β|² = 1',
    vectorsFormula4: 'Produit scalaire : ⟨φ|ψ⟩ = φ<sub>0</sub>*ψ<sub>0</sub> + φ<sub>1</sub>*ψ<sub>1</sub>',
    vectorsBody2: 'La normalisation maintient la probabilité totale à 100 % — c\'est pourquoi chaque point que vous pouvez atteindre sur la sphère de Bloch est automatiquement un état valide. Le produit scalaire mesure à quel point deux états se recouvrent ; des états orthogonaux (comme |0⟩ et |1⟩) ont un produit scalaire de 0.',
    matricesBody1: 'Chaque porte quantique est une matrice. Appliquer une porte à un qubit revient à une multiplication matrice-vecteur — la matrice de la porte multipliée par le vecteur d\'état donne le nouveau vecteur d\'état.',
    matricesFormula1: 'Pauli-X = [[0, 1], [1, 0]]',
    matricesFormula2: 'X|0⟩ = [[0,1],[1,0]]·[1,0]<sup>T</sup> = [0,1]<sup>T</sup> = |1⟩',
    matricesFormula3: 'Condition d\'unitarité : U†U = I',
    matricesBody2: '« Unitaire » est la contrainte que doit satisfaire toute porte quantique — U† (la transposée conjuguée) annule exactement U. C\'est ce qui garantit qu\'une porte ne détruit ni ne crée de probabilité : l\'état de sortie est toujours normalisé dès lors que l\'état d\'entrée l\'était.',
    svBody1: 'Le vecteur d\'état |ψ⟩ est la description complète d\'un qubit — tout ce que l\'on peut jamais prédire à son sujet (probabilités de mesure, réponse à une porte) se calcule à partir de ces deux amplitudes.',
    svFormula1: '|ψ⟩ = α|0⟩ + β|1⟩',
    svFormula2: 'Forme de Bloch : |ψ⟩ = cos(θ/2)|0⟩ + e<sup>iφ</sup>sin(θ/2)|1⟩',
    svFormula3: 'P(0) = |α|²&nbsp;&nbsp;&nbsp; P(1) = |β|²',
    svBody2: 'θ et φ sont exactement les deux curseurs de la sphère de Bloch dans l\'onglet Bits & Qubits — chaque vecteur d\'état correspond à un point de cette sphère, et réciproquement.',
    compareStateSpaces: 'Comparer les espaces d\'états',
    compareStateSpacesBody: 'Un bit classique est un point sur une ligne ; un qubit est l\'extrémité d\'un vecteur sur un arc unité — choisissez une vue ci-dessous.',
    svClassicalDesc: 'Seulement deux extrémités discrètes',
    toggleBit: 'Basculer le bit',
    currentState: 'État actuel',
    stateSpace: 'Espace d\'état',
    stateSpaceBody: 'Seules les deux extrémités |0⟩ et |1⟩ sont valides. La région intermédiaire est physiquement interdite — il n\'existe pas de « 47 % |1⟩ » pour un bit classique.',
    svQuantumDesc: 'Tout point sur l\'arc unité',
    keyInsight: 'Point clé',
    keyInsightBody: 'L\'extrémité du vecteur d\'état doit se trouver sur l\'arc unité (α² + β² = 1). Chaque point de cet arc est un état quantique distinct et valide. Le bit classique n\'occupe jamais que les deux coins.',
    diracBody1: 'Les symboles |·⟩ et ⟨·| utilisés partout dans cette application sont la notation « bra-ket » de Dirac — un raccourci compact pour les vecteurs et leurs produits scalaires.',
    diracFormula1: 'Ket : |ψ⟩ — un vecteur colonne (un état)',
    diracFormula2: 'Bra : ⟨ψ| — le vecteur ligne transposé conjugué',
    diracFormula3: 'Bra-ket : ⟨φ|ψ⟩ — un produit scalaire (un nombre)',
    diracFormula4: '⟨0|0⟩ = 1&nbsp;&nbsp;&nbsp; ⟨0|1⟩ = 0&nbsp;&nbsp;&nbsp; ⟨1|1⟩ = 1',
    diracFormula5: 'Ket-bra : |ψ⟩⟨φ| — un produit extérieur (une matrice/opérateur)',
    diracBody2: '|0⟩ et |1⟩ sont orthonormés — chacun a une longueur unité et un recouvrement nul avec l\'autre — ce qui explique exactement pourquoi une mesure donne toujours un 0 ou un 1 net, jamais quelque chose entre les deux.',
    tensorBody1: 'Le produit tensoriel (⊗) est la façon dont deux espaces vectoriels indépendants se combinent en un seul espace conjoint plus grand — on empile chaque entrée du premier vecteur contre chaque entrée du second, en multipliant chaque paire. Un vecteur de dimension n combiné à un vecteur de dimension m produit un vecteur de dimension n×m.',
    tensorFormula1: '[a, b]<sup>T</sup> ⊗ [c, d]<sup>T</sup> = [ac, ad, bc, bd]<sup>T</sup>',
    tensorBody2: 'Deux qubits indépendants se combinent exactement de cette manière : chacun est un vecteur à 2 entrées, donc leur état conjoint est un vecteur à 4 entrées — une entrée pour chaque combinaison d\'états de base, |00⟩, |01⟩, |10⟩, |11⟩.',
    tensorFormula2: '|0⟩⊗|0⟩ = [1,0]<sup>T</sup>⊗[1,0]<sup>T</sup> = [1,0,0,0]<sup>T</sup> = |00⟩',
    tensorBody3: 'Tout état construit en faisant le produit tensoriel de deux états à un qubit peut toujours être décomposé à nouveau en ces deux mêmes qubits. Mais tous les vecteurs à 4 entrées ne peuvent pas être décomposés ainsi — un état conjoint qui ne peut pas être séparé en un produit tensoriel de deux états à un qubit est précisément ce que l\'on appelle intriqué, exploré concrètement dans l\'onglet Intrication.'
  },
  gates: {
    title: 'Portes',
    subtitle: 'Choisissez une porte et observez son effet immédiat — classique ou quantique',
    classicalGates: 'Portes classiques',
    quantumGates: 'Portes quantiques',
    compareGates: 'Comparer',
    quantumTruthTableNote: 'L\'action de chaque porte fixe sur les deux états de base — les portes de rotation (Rx/Ry/Rz) ne sont pas incluses car leur résultat dépend d\'un angle défini à l\'exécution, pas d\'une table fixe.',
    compareClassicalDesc: 'NON/ET/OU/OU exclusif et leurs négations — règles strictes et destructrices',
    compareQuantumDesc: 'H/X/Y/Z/S/T — toujours réversibles, peuvent créer une superposition',
    compareInsightTitle: 'La différence essentielle',
    compareInsightBody: 'Chaque ligne classique ci-dessus fait perdre de l\'information — ET, OU et consorts font correspondre plusieurs combinaisons d\'entrées à la même sortie, si bien qu\'il est impossible de remonter à l\'entrée à partir de la seule sortie. Chaque ligne quantique est réversible : chacune est une matrice unitaire, donc lui appliquer ensuite sa propre transposée conjuguée retrouve toujours exactement l\'entrée de départ. Les portes classiques ne peuvent aussi jamais produire qu\'un 0 ou un 1 net ; des portes quantiques comme H peuvent produire une véritable superposition des deux.',
    pickGate: 'Porte — cliquez pour choisir',
    inputA: 'Entrée A',
    inputB: 'Entrée B',
    resetToZero: 'Réinitialiser à |0⟩',
    applyGate: 'Appliquer la porte',
    gateReference: 'Référence des portes',
    rotationGates: 'Portes de rotation',
    gateMatrix: 'Matrice de la porte',
    selectAGate: '← sélectionnez une porte',
    whyReversibleTitle: 'Pourquoi chaque porte est réversible',
    whyReversibleBody: 'Chaque porte à gauche est une matrice unitaire (U†U = I) — non par convention, mais parce qu\'une porte n\'est rien d\'autre que l\'évolution temporelle du qubit selon l\'équation de Schrödinger, laquelle préserve toujours la probabilité totale. Conséquence directe : les portes quantiques ne détruisent jamais d\'information. Appliquez n\'importe quelle porte, puis sa transposée conjuguée, et le qubit revient exactement à son état de départ — il n\'existe pas d\'équivalent quantique d\'une porte ET classique qui jette discrètement un bit à la poubelle.',
    // Surnoms/noms formels des six portes fixes (GATES dans js/core/gates.js)
    // — `name` (la simple lettre H/X/Y/Z/S/T) est une notation, jamais
    // traduite. Le paragraphe complet de `explain` est un texte de narration
    // dynamique (assemblé dans une phrase interpolée au moment où une porte
    // est appliquée, voir applyGate() dans gates-tab.js) et reste hors
    // périmètre, comme le reste de cette catégorie dans toute l'application.
    H: { desc: 'La Pièce Qui Tourne', formalName: 'Porte de Hadamard' },
    X: { desc: 'L\'Interrupteur', formalName: 'Porte de Pauli-X' },
    Y: { desc: 'La Roue', formalName: 'Porte de Pauli-Y' },
    Z: { desc: 'Le Coup Fantôme', formalName: 'Porte de Pauli-Z' },
    S: { desc: 'Le Quart de Tour', formalName: 'Porte de phase (√Z)' },
    T: { desc: 'La Chiquenaude Discrète', formalName: 'Porte T (√S)' }
  },
  // Rx/Ry/Rz (ROTATION_GATES dans js/core/gates.js) — séparé de `gates`
  // ci-dessus car les deux utilisent les mêmes clés d'axe (X/Y/Z), qui
  // entreraient sinon en collision avec les entrées des portes de
  // Pauli-X/Y/Z fixes.
  rotationGates: {
    X: { desc: 'Rotation autour de l\'axe X', formalName: 'Rotation autour de l\'axe X' },
    Y: { desc: 'Rotation autour de l\'axe Y', formalName: 'Rotation autour de l\'axe Y' },
    Z: { desc: 'Rotation autour de l\'axe Z', formalName: 'Rotation autour de l\'axe Z' }
  },
  circuits: {
    title: 'Circuits',
    subtitle: 'Les portes classiques combinent des bits selon des règles strictes ; les circuits quantiques font parcourir à un qubit un trajet de portes, accumulant des rotations — choisissez un constructeur ci-dessous',
    classicalCircuit: 'Circuit classique',
    quantumCircuit: 'Circuit quantique',
    gatePalette: 'Palette de portes — cliquez pour ajouter',
    companionBit: 'Bit compagnon — utilisé par les portes de la famille ET/OU/OU exclusif lorsqu\'il est ajouté',
    startBit: 'Bit de départ',
    circuitWire: 'Fil du circuit',
    whatsGoingOn: 'Que se passe-t-il',
    afterRunning: 'Après exécution',
    truthTableStartOutput: 'Table de vérité — bit de départ → sortie',
    oneQubit: '1 qubit',
    twoQubits: '2 qubits',
    threeQubits: '3 qubits',
    outputState: 'État de sortie',
    targetQubit2: 'Qubit cible — les nouvelles portes s\'appliquent à',
    gatePaletteTarget: 'Palette de portes — cliquez pour ajouter au qubit cible',
    circuitDiagram: 'Diagramme du circuit',
    outputState2Q: 'État de sortie (2 qubits)',
    perQubitBlochSpheres: 'Sphères de Bloch par qubit — se rétractent vers le centre lorsqu\'ils sont intriqués',
    targetQubit3: 'Qubit cible — les nouvelles portes à un qubit s\'appliquent à',
    addCnot: 'Ajouter CNOT',
    outputState3Q: 'État de sortie (3 qubits)',
    runHistory: 'Historique d\'exécution — cliquez sur une étape pour la revoir'
  },
  common: {
    run: '▶ Exécuter',
    clear: 'Effacer',
    add: 'Ajouter',
    reset: 'Réinitialiser',
    controls: 'Contrôles',
    detector: 'Détecteur',
    tryMe: 'Essayez-moi',
    tryMePresets: '🎲 Essayez-moi — circuits prédéfinis',
    classical: 'Classique',
    quantum: 'Quantique',
    stateVector: 'Vecteur d\'état',
    copyShareableLink: 'Copier le lien à partager',
    basisStates: 'États de base',
    possibleStates: 'États possibles',
    uncertainty: 'Incertitude',
    uncertaintyFundamental: 'Fondamentale — jusqu\'à la mesure',
    representation: 'Représentation',
    output: 'Sortie',
    whatJustHappened: 'Ce qui vient de se passer',
    truthTable: 'Table de vérité',
    appliedSequence: 'Séquence appliquée',
    gate: 'Porte',
    input: 'Entrée'
  },
  mathsTab: {
    complexNumbers: 'Nombres complexes',
    vectors: 'Vecteurs',
    matrices: 'Matrices',
    stateVector: 'Vecteur d\'état',
    diracNotation: 'Notation de Dirac',
    tensorProducts: 'Produits tensoriels'
  },
  gatesTab: {
    classical: 'Classique',
    quantum: 'Quantique',
    compare: 'Comparer'
  },
  roadmap: {
    title: 'Concepts quantiques',
    subtitle: 'Cliquez sur un concept pour ouvrir sa simulation',
    conceptMap: 'Carte des concepts',
    myProgress: 'Ma progression',
    lessonsCompleted: 'Leçons terminées',
    quickCheckScore: 'Score aux quiz rapides',
    lessonChecklist: 'Liste des leçons',
    resetProgress: 'Réinitialiser la progression',
    read: 'lu',
    markUnread: 'Marquer comme non lu',
    markAsRead: 'Marquer comme lu',
    start: 'Commencer →',
    quickCheck: 'Quiz rapide',
    correct: 'correct',
    review: 'à revoir',
    notAttempted: 'Pas encore essayé.',
    quizScoreSummary: '{correct} / {answered} quiz rapides corrects jusqu\'à présent ({total} concepts au total).',
    centerTooltip: '{count} concepts fondamentaux de l\'informatique quantique, d\'un simple qubit jusqu\'à l\'intrication et l\'interférence des ondes — cliquez sur un sujet pour l\'explorer.'
  },
  mindmap: {
    quantumWorld: 'Monde quantique',
    introduction: 'Introduction',
    classical: 'Classique',
    quantum: 'Quantique',
    oneQubit: 'Un qubit',
    twoQubits: 'Deux qubits',
    threeQubits: 'Trois qubits'
  },
  intro: {
    title: 'Introduction',
    subtitle: 'Nouveau dans l\'informatique quantique ? Commencez ici — aucune connaissance en physique ou en programmation n\'est requise.',
    classicalTitle: 'INTRODUCTION À L\'INFORMATIQUE QUANTIQUE ?',
    classicalBody: 'Avant d\'aborder les ordinateurs quantiques, commençons par les ordinateurs classiques. Votre téléphone et votre ordinateur utilisent des bits pour traiter l\'information. Un bit n\'a que deux états possibles : <b>0 (ÉTEINT) et 1 (ALLUMÉ)</b>',
    whatIsTitle: 'QU\'EST-CE QUE L\'INFORMATIQUE QUANTIQUE ?',
    whatIsBody: 'L\'informatique quantique utilise les principes de la mécanique quantique pour résoudre certains problèmes plus rapidement que les ordinateurs classiques.',
    bitsToQubitsTitle: 'Des bits aux qubits',
    bitsToQubitsBody: 'Contrairement à un bit, qui vaut soit 0 soit 1, un qubit peut exister dans les deux états à la fois. C\'est ce qu\'on appelle la superposition.',
    superpositionTitle: 'Superposition : plusieurs possibilités',
    superpositionBody: 'Imaginez que vous lancez une pièce de monnaie. Pendant qu\'elle tourne dans les airs, elle représente à la fois pile et face. De même, un qubit peut représenter à la fois 0 et 1 jusqu\'à ce qu\'il soit mesuré.',
    entanglementTitle: 'Intrication : une information quantique connectée',
    entanglementBody: 'L\'intrication relie deux qubits ou plus entre eux. Les changements apportés à l\'un sont corrélés avec les autres, ce qui permet aux ordinateurs quantiques de traiter l\'information de manières radicalement nouvelles.',
    whyMattersTitle: 'Pourquoi l\'informatique quantique est importante',
    whyMattersBody: 'Les ordinateurs quantiques ne sont pas conçus pour remplacer les ordinateurs portables ou les smartphones. Ils sont conçus pour résoudre des problèmes complexes, tels que : <ul class="quantum-list"><li>🧪 Simuler des molécules</li><li>⚙️ Optimiser de grands systèmes</li><li>🔐 Améliorer la cryptographie</li><li>🌦️ Résoudre des problèmes scientifiques et techniques complexes</li></ul>',
    howAppWorksTitle: 'Comment fonctionne cette application',
    howAppWorksBody: 'Chaque onglet associe une courte leçon à une simulation interactive et à un quiz rapide. Explorez les concepts en manipulant les sphères de Bloch, en appliquant des portes et en exécutant des circuits, tout en observant les résultats se mettre à jour en temps réel. Votre progression est suivie au fil de votre apprentissage.',
    suggestedPath: 'Parcours d\'apprentissage suggéré'
  },
  concepts: {
    title: 'Concepts importants',
    subtitle: 'Un glossaire des idées essentielles de la mécanique quantique et de l\'informatique quantique — le vocabulaire sur lequel repose le reste de cette application.',
    searchPlaceholder: 'Rechercher un concept…',
    searchNoResults: 'Aucun concept ne correspond à « {query} ».',
    mechanicsGroupTitle: 'Fondamentaux de la mécanique quantique',
    computingGroupTitle: 'Concepts d\'informatique quantique',
    superpositionTitle: 'Superposition',
    superpositionBody: 'Un système quantique peut exister dans une combinaison de plusieurs états à la fois, plutôt que d\'être figé dans un seul — comme un qubit qui serait en partie |0⟩ et en partie |1⟩ simultanément. Ce n\'est pas que le système soit secrètement dans un état sans que nous sachions lequel ; la combinaison est l\'état physique réel, jusqu\'à ce qu\'une mesure force le système à se fixer sur un résultat.',
    waveParticleTitle: 'Dualité onde-particule',
    waveParticleBody: 'Tout objet quantique — électrons, photons, et même qubits — se comporte comme une onde dans certaines expériences (s\'étalant, interférant avec lui-même) et comme une particule discrète dans d\'autres (arrivant sur un détecteur en un seul point localisé). Le comportement observé dépend de ce que l\'on mesure, et non d\'un changement d\'identité de l\'objet.',
    quantumStateTitle: 'État quantique (fonction d\'onde)',
    quantumStateBody: 'La description mathématique complète d\'un système quantique — tout ce qui peut jamais être prédit à son sujet, encodé dans un ensemble d\'amplitudes complexes. Pour un qubit, il s\'agit du vecteur d\'état à deux amplitudes |ψ⟩ = α|0⟩ + β|1⟩, exploré tout au long des onglets Bits & Qubits et Concept mathématique de cette application.',
    bornRuleTitle: 'La règle de Born',
    bornRuleBody: 'La règle qui relie les amplitudes d\'un état quantique aux probabilités de mesure : élever au carré la taille d\'une amplitude donne la probabilité d\'observer ce résultat. Pour un qubit α|0⟩ + β|1⟩, cela donne P(0) = |α|² et P(1) = |β|² — voir l\'onglet Mesure pour le constater en pratique.',
    collapseTitle: 'Effondrement de la fonction d\'onde',
    collapseBody: 'Au moment où une mesure a lieu, un état quantique cesse d\'être un mélange de possibilités et devient un résultat défini unique — de manière irréversible. Les autres possibilités ne sont pas cachées quelque part ; elles ont tout simplement disparu, ce qui rend la mesure quantique fondamentalement différente du simple constat d\'une valeur déjà fixée.',
    uncertaintyTitle: 'Principe d\'incertitude de Heisenberg',
    uncertaintyBody: 'Certaines paires de propriétés — comme la position et la quantité de mouvement d\'une particule — ne peuvent jamais être connues toutes deux avec une précision arbitraire en même temps. Ce n\'est pas une limitation de nos instruments ; c\'est une caractéristique intrinsèque de la façon dont les états quantiques sont décrits.',
    entanglementTitle: 'Intrication quantique',
    entanglementBody: 'L\'intrication quantique est un phénomène dans lequel deux particules quantiques ou plus deviennent liées de telle sorte que l\'état d\'une particule ne peut pas être décrit indépendamment des autres, même lorsqu\'elles sont séparées par de grandes distances. Elles partagent à la place un unique état quantique conjoint.'
      + '<br><br>Mesurer l\'une des particules intriquées révèle instantanément ce que les autres afficheront, quelle que soit la distance qui les sépare — pourtant, aucun signal ni aucune énergie ne voyage réellement entre elles au moment de la mesure. Cela peut ressembler à une communication plus rapide que la lumière, mais ce n\'en est pas une : le résultat de chaque mesure individuelle reste authentiquement aléatoire, donc il n\'existe aucun moyen d\'encoder un message en utilisant uniquement l\'intrication. Exploré en détail dans l\'onglet Intrication.',
    interferenceTitle: 'Interférence quantique',
    interferenceBody: 'Lorsqu\'un système quantique dispose de plusieurs chemins indiscernables menant au même résultat, les amplitudes de ces chemins se combinent — se renforçant à certains endroits et s\'annulant à d\'autres — produisant des motifs (comme les franges de l\'expérience des doubles fentes) qu\'aucun chemin ne pourrait produire seul. Voir les onglets Interférence et Séparateur de faisceau.',
    tunnelingTitle: 'Effet tunnel quantique',
    tunnelingBody: 'Une particule quantique a une probabilité non nulle d\'apparaître de l\'autre côté d\'une barrière d\'énergie qu\'elle ne devrait classiquement pas pouvoir franchir, car sa fonction d\'onde ne s\'arrête pas net à la barrière — elle s\'y atténue au lieu de rebondir. Voir l\'onglet Effet tunnel pour un paquet d\'ondes interactif heurtant une barrière.',
    decoherenceTitle: 'Décohérence',
    decoherenceBody: 'Le processus par lequel la superposition et l\'intrication fragiles d\'un système quantique se dissipent par une interaction inévitable avec son environnement, le faisant se comporter de plus en plus comme un système classique. C\'est le principal obstacle pratique à la construction d\'ordinateurs quantiques grands et fiables.',
    schrodingerTitle: 'L\'équation de Schrödinger',
    schrodingerBody: 'L\'équation maîtresse de la mécanique quantique — elle décrit exactement comment un état quantique évolue de manière continue dans le temps, tout comme les lois de Newton décrivent le mouvement d\'un objet classique. Chaque porte quantique de cette application n\'est en réalité qu\'un instantané de l\'évolution de cette équation sur une tranche de temps fixe, ce qui explique aussi pourquoi les portes sont réversibles : l\'équation ne détruit jamais l\'information, elle la remodèle seulement.',
    bellTheoremTitle: 'Le théorème de Bell et le paradoxe EPR',
    bellTheoremBody: 'Einstein, Podolsky et Rosen ont soutenu en 1935 que la mécanique quantique devait être incomplète — les corrélations des particules intriquées, selon eux, pourraient s\'expliquer par une « variable cachée » partagée, fixée à l\'avance, sans aucun effet réellement étrange. Le théorème de Bell (1964) a prouvé le contraire : aucune théorie fondée sur des variables cachées ne peut jamais reproduire toutes les corrélations prédites par la mécanique quantique, et des décennies d\'expériences ont confirmé les prédictions de la mécanique quantique, et non celles des variables cachées.',
    zenoTitle: 'Effet Zénon quantique',
    zenoBody: 'Mesurer un système quantique suffisamment souvent peut littéralement figer son évolution — chaque mesure ramène l\'état vers ce qu\'il était déjà, avant qu\'il n\'ait eu le temps d\'évoluer. Nommé d\'après le paradoxe de Zénon de la flèche qui ne semble jamais bouger, c\'est une conséquence directe de l\'effondrement de la fonction d\'onde : un état quantique « observé » change bien plus lentement qu\'un état non observé.',
    hilbertSpaceTitle: 'Espace de Hilbert',
    hilbertSpaceBody: 'L\'« espace » mathématique où vit tout état quantique. Chaque état quantique possible est représenté comme un vecteur dans un espace de Hilbert, et les règles de la mécanique quantique — superposition, mesure et évolution — s\'expriment toutes comme des opérations sur ces vecteurs. Un seul qubit vit dans un espace de Hilbert à deux dimensions, tandis qu\'un système à n qubits vit dans un espace à 2ⁿ dimensions.',
    linearOperatorsTitle: 'Opérateurs linéaires',
    linearOperatorsBody: 'Les grandeurs physiques et les portes quantiques sont représentées par des opérateurs linéaires agissant sur les états quantiques. Appliquer un opérateur transforme un état quantique valide en un autre, faisant de l\'algèbre linéaire le langage de la mécanique quantique.',
    observableTitle: 'Observable',
    observableBody: 'Une observable est toute propriété physique mesurable — comme la position, la quantité de mouvement, le spin ou l\'énergie. Chaque observable est représentée par un opérateur hermitien dont les valeurs propres sont les seuls résultats de mesure qui puissent jamais se produire.',
    eigenstatesTitle: 'États propres et valeurs propres',
    eigenstatesBody: 'Si mesurer une observable produit toujours le même résultat pour un état quantique particulier, cet état est un état propre de l\'observable. Le résultat de la mesure est la valeur propre correspondante. Mesurer un état propre le laisse inchangé, alors que mesurer une superposition provoque généralement l\'effondrement de la fonction d\'onde.',
    expectationValueTitle: 'Valeur moyenne (espérance)',
    expectationValueBody: 'Plutôt que de prédire un résultat de mesure unique et défini, la mécanique quantique prédit la valeur moyenne obtenue en répétant la même expérience de nombreuses fois sur des systèmes préparés de manière identique. Cette moyenne est appelée la valeur moyenne (ou espérance).',
    probabilityAmplitudesTitle: 'Amplitudes de probabilité',
    probabilityAmplitudesBody: 'Contrairement aux probabilités ordinaires, la mécanique quantique attribue des amplitudes de probabilité complexes aux résultats possibles. Ces amplitudes peuvent interférer de manière constructive ou destructive, et seuls leurs modules au carré deviennent des probabilités observables via la règle de Born.',
    phaseTitle: 'Phase',
    phaseBody: 'La phase d\'un état quantique est invisible lors d\'une seule mesure, mais détermine comment les amplitudes interfèrent. C\'est la phase relative — et non la phase absolue — qui donne son pouvoir à l\'interférence quantique et à de nombreux algorithmes quantiques.',
    globalPhaseTitle: 'Phase globale et phase relative',
    globalPhaseBody: 'Multiplier un état quantique entier par la même phase complexe ne change rien physiquement ; c\'est ce qu\'on appelle une phase globale. Changer la phase entre les composantes d\'une superposition modifie les motifs d\'interférence observables et a donc des conséquences physiques.',
    spinTitle: 'Spin',
    spinBody: 'Le spin est une forme intrinsèque de moment cinétique portée par les particules quantiques. Contrairement à une rotation ordinaire, le spin est une propriété quantique fondamentale qui ne prend que des valeurs discrètes. Le spin de l\'électron est la réalisation physique de nombreux qubits expérimentaux.',
    pauliExclusionTitle: 'Principe d\'exclusion de Pauli',
    pauliExclusionBody: 'Deux fermions identiques ne peuvent jamais occuper le même état quantique simultanément. Cette règle simple explique la structure des atomes, la chimie, et pourquoi la matière reste stable.',
    identicalParticlesTitle: 'Particules identiques',
    identicalParticlesBody: 'Les particules d\'un même type sont fondamentalement indiscernables. Échanger deux particules identiques ne crée pas un nouvel état physique — cela ne change la fonction d\'onde que par un signe (fermions) ou pas du tout (bosons).',
    bosonsFermionsTitle: 'Bosons et fermions',
    bosonsFermionsBody: 'Les bosons peuvent partager le même état quantique, ce qui permet des phénomènes comme les lasers et les condensats de Bose-Einstein. Les fermions obéissent au principe d\'exclusion de Pauli, ce qui donne naissance à la structure atomique et aux matériaux électroniques.',
    densityMatrixTitle: 'Matrice densité',
    densityMatrixBody: 'Tout système quantique n\'est pas parfaitement isolé. Une matrice densité décrit à la fois les états quantiques purs et les mélanges statistiques, ce qui en fait l\'outil standard pour décrire les systèmes quantiques bruités ou partiellement connus.',
    mixedStatesTitle: 'États mixtes',
    mixedStatesBody: 'Contrairement à une superposition, qui est authentiquement quantique, un état mixte représente une incertitude classique sur l\'état quantique dans lequel se trouve réellement un système. Les matrices densité distinguent ces deux situations très différentes.',
    measurementBasisTitle: 'Base de mesure',
    measurementBasisBody: 'Une mesure quantique se fait toujours par rapport à une base choisie. Le même état peut sembler défini dans une base tout en étant une superposition dans une autre, ce qui rend le choix de la base central en informatique quantique.',
    sternGerlachExpTitle: 'Expérience de Stern–Gerlach',
    sternGerlachExpBody: 'L\'expérience de Stern–Gerlach (1922), réalisée par Otto Stern et Walther Gerlach, a démontré que le moment cinétique est quantifié — montrant que des particules comme les électrons possèdent une propriété intrinsèque appelée spin, qui ne peut prendre que des valeurs discrètes lorsqu\'elle est mesurée selon un axe choisi. C\'est l\'une des expériences fondatrices de la mécanique quantique.'
      + '<ul class="quantum-list">'
      + '<li><b>Objectif :</b> déterminer si le moment magnétique d\'un atome pouvait pointer dans n\'importe quelle direction, comme le prédisait la physique classique, ou seulement selon des orientations spécifiques et quantifiées.</li>'
      + '<li><b>Pourquoi des atomes d\'argent ?</b> L\'argent possède un seul électron de valence non apparié et un moment cinétique orbital total quasiment nul, de sorte que le moment magnétique mesuré provient presque entièrement du spin de cet unique électron — ce qui rend le résultat beaucoup plus facile à interpréter.</li>'
      + '<li><b>Prédiction classique :</b> un moment magnétique orienté aléatoirement devrait dévier d\'une quantité quelconque, étalant le faisceau en une bande continue sur l\'écran.</li>'
      + '<li><b>Ce qui a été réellement observé :</b> le faisceau s\'est séparé en exactement deux points distincts, et non en une bande continue — montrant que seules deux orientations de spin sont possibles selon l\'axe de mesure, spin up (+ħ/2) et spin down (−ħ/2).</li>'
      + '</ul>'
      + 'Explorez cela vous-même, y compris ce qui se passe lorsque vous mesurez le spin selon un second axe incompatible, dans l\'onglet Stern–Gerlach.',
    eprParadoxTitle: 'Paradoxe EPR',
    eprParadoxBody: 'Le paradoxe EPR (1935), proposé par Albert Einstein, Boris Podolsky et Nathan Rosen, est une expérience de pensée soutenant que la mécanique quantique, telle qu\'elle se présentait, devait être une description incomplète de la réalité physique — non pas parce que ses prédictions étaient fausses, mais à cause de ce qu\'elles semblaient impliquer.'
      + '<ul class="quantum-list">'
      + '<li><b>Objectif :</b> montrer que si la mécanique quantique est correcte et que le « réalisme local » est vrai — c\'est-à-dire qu\'une particule possède des propriétés définies indépendamment de la mesure, et qu\'aucune influence ne voyage plus vite que la lumière — alors la mécanique quantique doit manquer quelque chose.</li>'
      + '<li><b>Le dispositif :</b> deux particules sont préparées dans un état intriqué puis séparées par une distance arbitrairement grande. Mesurer une propriété de l\'une révèle instantanément la propriété correspondante de l\'autre, avec certitude.</li>'
      + '<li><b>L\'argument :</b> puisque mesurer la particule A permet de prédire avec certitude le résultat de la particule B sans jamais la toucher, EPR ont raisonné que cette propriété de B devait déjà être fixée avant la mesure — sinon, mesurer A devrait affecter B instantanément, ce qui ressemblait à une « action fantôme à distance ».</li>'
      + '<li><b>Le paradoxe :</b> la mécanique quantique affirme que les deux particules partagent un unique état conjoint indéterminé jusqu\'à la mesure. Le raisonnement même d\'EPR affirmait que cela était impossible si la localité est respectée — donc soit la mécanique quantique est incomplète, soit la nature est réellement non locale en ce sens précis.</li>'
      + '</ul>'
      + 'Pendant trente ans, cela est resté une question d\'interprétation sans réponse expérimentale — jusqu\'à ce que le théorème de Bell (voir ci-dessus) en fasse une question testable, et les expériences ont tranché nettement contre l\'intuition d\'Einstein sur les variables cachées.',
    qubitTitle: 'Qubit',
    qubitBody: 'L\'unité fondamentale de l\'information quantique — comme un bit classique, mais capable d\'exister en superposition de 0 et de 1 plutôt que d\'être figé sur une seule valeur. L\'état exact d\'un qubit est décrit par deux amplitudes complexes et représenté comme un point sur la sphère de Bloch, exploré dans l\'onglet Bits & Qubits.',
    blochSphereTitle: 'Sphère de Bloch',
    blochSphereBody: 'Une représentation géométrique de tout état possible d\'un qubit unique sous forme de point à la surface d\'une sphère — les pôles nord et sud sont |0⟩ et |1⟩, et tout autre point est une certaine superposition des deux. Elle transforme l\'algèbre abstraite des amplitudes en quelque chose que l\'on peut littéralement voir et manipuler.',
    gateTitle: 'Porte quantique',
    gateBody: 'L\'équivalent quantique d\'une porte logique classique — une opération qui transforme l\'état d\'un qubit, géométriquement une rotation de son point sur la sphère de Bloch. Contrairement aux portes classiques, chaque porte quantique est réversible : aucune d\'elles ne jette jamais d\'information. Voir l\'onglet Portes pour les six portes fixes (H, X, Y, Z, S, T) et leurs effets.',
    unitarityTitle: 'Unitarité et réversibilité',
    unitarityBody: 'Toute porte quantique valide doit être une matrice unitaire (U†U = I) — la condition mathématique qui garantit qu\'elle préserve la probabilité totale et peut toujours être défaite par sa propre transposée conjuguée. C\'est pourquoi le calcul quantique, contrairement à la logique classique ET/OU, ne détruit jamais d\'information en cours de route.',
    circuitTitle: 'Circuit quantique',
    circuitBody: 'Une séquence de portes quantiques appliquées à un ou plusieurs qubits, lue de gauche à droite — l\'équivalent quantique d\'un circuit logique classique. Comme l\'ordre des portes compte généralement (les rotations ne commutent pas), le même ensemble de portes dans un ordre différent peut mener les qubits vers un état final entièrement différent ; construisez-en un vous-même dans l\'onglet Circuits.',
    bellGhzTitle: 'États de Bell et états GHZ',
    bellGhzBody: 'Les états de Bell sont les quatre états spécifiques, maximalement intriqués, de deux qubits — Φ⁺, Φ⁻, Ψ⁺ et Ψ⁻ — formant une base orthonormée fondamentale en information quantique et la ressource centrale de protocoles comme la téléportation quantique et le codage superdense. Les quatre sont produits par la même recette à deux portes (une porte Hadamard sur un qubit, puis une porte CNOT contrôlée par celui-ci), en partant simplement d\'un état de base à deux qubits différent à chaque fois.'
      + '<br><br>Les quatre états de Bell sont :'
      + '<ul class="quantum-list">'
      + '<li><b>Φ⁺ = (|00⟩ + |11⟩)/√2</b> — les qubits correspondent et restent en phase.</li>'
      + '<li><b>Φ⁻ = (|00⟩ − |11⟩)/√2</b> — les qubits correspondent, avec une inversion de phase.</li>'
      + '<li><b>Ψ⁺ = (|01⟩ + |10⟩)/√2</b> — les qubits sont opposés et en phase.</li>'
      + '<li><b>Ψ⁻ = (|01⟩ − |10⟩)/√2</b> — les qubits sont opposés, avec une inversion de phase.</li>'
      + '</ul>'
      + 'Mesurer l\'un des deux qubits, dans n\'importe lequel des quatre états, détermine instantanément le résultat de l\'autre. Les états GHZ généralisent la même idée à trois qubits ou plus, tous corrélés ensemble — construisez des paires de Bell et des triplets GHZ à partir de zéro avec des portes Hadamard et CNOT dans l\'onglet Circuits.',
    noCloningTitle: 'Théorème de non-clonage',
    noCloningBody: 'Il est physiquement impossible de créer une copie exacte et indépendante d\'un état quantique inconnu arbitraire — une conséquence directe de la linéarité de la mécanique quantique. C\'est pourquoi l\'information quantique doit être traitée si différemment des bits classiques, qui peuvent toujours être copiés librement.',
    algorithmsTitle: 'Algorithmes quantiques',
    algorithmsBody: 'Des procédures pas à pas construites à partir de portes quantiques qui exploitent la superposition et l\'interférence pour résoudre certains problèmes bien plus rapidement que n\'importe quel algorithme classique connu — l\'algorithme de Shor factorise efficacement de grands nombres, et l\'algorithme de Grover parcourt une liste non triée de façon quadratiquement plus rapide que n\'importe quelle recherche classique.',
    errorCorrectionTitle: 'Correction d\'erreurs quantiques',
    errorCorrectionBody: 'Un ensemble de techniques permettant de protéger l\'information quantique fragile contre la décohérence et le bruit en répartissant l\'état d\'un seul qubit logique de manière redondante sur de nombreux qubits physiques, sans jamais mesurer directement — et donc effondrer — l\'information elle-même. L\'un des principaux défis techniques qui séparent les ordinateurs quantiques bruités d\'aujourd\'hui des machines fiables à grande échelle.',
    supremacyTitle: 'Suprématie / avantage quantique',
    supremacyBody: 'Le seuil à partir duquel un ordinateur quantique accomplit une tâche spécifique plus rapidement que n\'importe quel supercalculateur classique ne pourrait raisonnablement le faire — « suprématie » pour une tâche de référence (potentiellement artificielle), « avantage » pour une tâche réellement utile. Cela démontre que les effets quantiques peuvent être exploités pour une puissance de calcul réelle, et non simplement simulés sur une machine classique.',
    teleportationTitle: 'Téléportation quantique',
    teleportationBody: 'Un protocole permettant de transférer l\'état exact d\'un qubit inconnu vers un qubit distant, en utilisant une paire intriquée partagée ainsi que deux bits classiques de communication — sans jamais mesurer directement (et donc détruire) l\'état d\'origine. Malgré son nom, rien ne voyage plus vite que la lumière : le récepteur ne peut reconstruire l\'état qu\'une fois les bits classiques ordinaires arrivés, et l\'état du qubit d\'origine est inévitablement détruit dans le processus, conformément au théorème de non-clonage.',
    qkdTitle: 'Cryptographie quantique (QKD)',
    qkdBody: 'La distribution quantique de clés permet à deux parties de convenir d\'une clé secrète partagée dont la sécurité est garantie par la physique plutôt que par la difficulté de calcul — des protocoles comme BB84 encodent les bits de la clé dans des états de qubits de telle sorte que toute mesure d\'un espion les perturbe inévitablement, révélant l\'intrusion. C\'est une application pratique directe du théorème de non-clonage : un espion ne peut pas copier secrètement les qubits pour les examiner sans être détecté.',
    qftTitle: 'Transformée de Fourier quantique (QFT)',
    qftBody: 'L\'équivalent quantique de la transformée de Fourier discrète classique, mise en œuvre comme un circuit quantique s\'exécutant exponentiellement plus vite que tout équivalent classique. C\'est la sous-routine clé de l\'algorithme de Shor — l\'étape qui extrait la périodicité cachée utilisée pour factoriser de grands nombres — et elle apparaît dans de nombreux algorithmes quantiques partout où un motif caché doit être extrait d\'une superposition.',
    tensorProductTitle: 'Produit tensoriel',
    tensorProductBody: 'Plusieurs qubits se combinent par produit tensoriel plutôt que par addition ordinaire. Deux qubits nécessitent donc quatre amplitudes, trois qubits en nécessitent huit, et n qubits en nécessitent 2ⁿ — c\'est l\'origine de l\'énorme espace d\'états de l\'informatique quantique.',
    multiQubitStatesTitle: 'États à plusieurs qubits',
    multiQubitStatesBody: 'Un système de plusieurs qubits ne peut pas toujours être décrit comme des états indépendants à un seul qubit. Certains états se factorisent en qubits séparés, tandis que d\'autres deviennent intriqués et nécessitent une description conjointe unique.',
    controlledGatesTitle: 'Portes contrôlées',
    controlledGatesBody: 'Les portes contrôlées n\'effectuent une opération que lorsqu\'un autre qubit a une valeur particulière. La porte CNOT en est l\'exemple le plus simple et constitue le bloc de construction essentiel pour créer de l\'intrication.',
    swapGateTitle: 'Porte SWAP',
    swapGateBody: 'La porte SWAP échange les états quantiques de deux qubits sans les mesurer. Elle est largement utilisée pour déplacer l\'information au sein d\'un processeur quantique.',
    universalGateSetsTitle: 'Ensembles de portes universels',
    universalGateSetsBody: 'Une petite collection de portes suffit à approximer n\'importe quel calcul quantique avec une précision arbitraire. Les exemples incluent {H, T, CNOT} et {Rx, Ry, CNOT}.',
    quantumParallelismTitle: 'Parallélisme quantique',
    quantumParallelismBody: 'Parce qu\'un ordinateur quantique peut préparer une superposition de nombreuses entrées simultanément, une seule opération agit sur toutes à la fois. Le défi consiste à extraire une information utile par interférence plutôt que d\'essayer de lire chaque résultat.',
    oracleTitle: 'Oracle',
    oracleBody: 'De nombreux algorithmes quantiques traitent une partie d\'un problème comme une fonction boîte noire appelée oracle. L\'algorithme gagne en rapidité en interrogeant l\'oracle en superposition quantique.',
    ancillaQubitsTitle: 'Qubits ancillaires',
    ancillaQubitsBody: 'Les qubits ancillaires sont des qubits auxiliaires temporaires utilisés pendant les calculs, la correction d\'erreurs et l\'arithmétique, avant d\'être réinitialisés ou abandonnés.',
    quantumMeasurementTitle: 'Mesure quantique',
    quantumMeasurementBody: 'Bien que la mesure ait déjà été abordée, l\'informatique quantique la traite de façon opérationnelle. Mesurer un qubit convertit une information quantique fragile en un bit classique ordinaire, mettant fin à l\'évolution cohérente.',
    midCircuitMeasurementTitle: 'Mesure en cours de circuit',
    midCircuitMeasurementBody: 'Certains ordinateurs quantiques permettent des mesures pendant le calcul plutôt qu\'uniquement à la fin. Les portes suivantes peuvent dépendre de ces résultats de mesure, ce qui permet la correction d\'erreurs et les algorithmes adaptatifs.',
    classicalFeedforwardTitle: 'Rétroaction classique (feedforward)',
    classicalFeedforwardBody: 'Les résultats de mesure obtenus pendant un circuit quantique peuvent déterminer quelles portes suivantes doivent être appliquées, combinant contrôle classique et évolution quantique.',
    quantumInfoGroupTitle: 'Théorie de l\'information quantique',
    quantumInformationTitle: 'Information quantique',
    quantumInformationBody: 'L\'information quantique est une information stockée dans des états quantiques. Contrairement à l\'information classique, elle peut exploiter la superposition et l\'intrication, permettant des formes entièrement nouvelles de calcul et de communication.',
    quantumChannelTitle: 'Canal quantique',
    quantumChannelBody: 'Un canal quantique décrit mathématiquement comment l\'information quantique change lorsqu\'elle voyage dans l\'espace ou interagit avec du bruit.',
    fidelityTitle: 'Fidélité',
    fidelityBody: 'La fidélité mesure à quel point deux états quantiques se ressemblent. Elle est largement utilisée pour évaluer le matériel quantique, les portes et la correction d\'erreurs.',
    traceDistanceTitle: 'Distance de trace',
    traceDistanceBody: 'La distance de trace quantifie à quel point deux états quantiques sont distinguables. Elle donne la probabilité maximale de les distinguer à l\'aide de n\'importe quelle mesure possible.',
    entanglementEntropyTitle: 'Entropie d\'intrication',
    entanglementEntropyBody: 'Une mesure numérique de l\'intensité avec laquelle différentes parties d\'un système quantique sont intriquées. Elle joue un rôle central en physique de la matière condensée, en théorie quantique des champs et en gravité quantique.',
    stateTomographyTitle: 'Tomographie d\'état quantique',
    stateTomographyBody: 'Une technique permettant de reconstruire un état quantique inconnu en effectuant de nombreuses mesures dans différentes bases.',
    processTomographyTitle: 'Tomographie de processus',
    processTomographyBody: 'Plutôt que de reconstruire un état, la tomographie de processus reconstruit une porte ou une opération quantique inconnue en étudiant comment elle transforme de nombreux états d\'entrée connus.',
    advancedGroupTitle: 'Informatique quantique avancée',
    vqeQaoaTitle: 'Algorithmes quantiques variationnels (VQE et QAOA)',
    vqeQaoaBody: 'Les algorithmes quantiques variationnels sont des algorithmes hybrides quantique-classique dans lesquels un ordinateur quantique prépare des états quantiques paramétrés pendant qu\'un ordinateur classique ajuste de façon répétée ces paramètres pour optimiser un objectif donné. Cette boucle de rétroaction itérative les rend particulièrement adaptés au matériel quantique bruité d\'aujourd\'hui (dispositifs NISQ).'
      + '<br><br>Les deux exemples les plus connus sont :'
      + '<ul class="quantum-list">'
      + '<li><b>Variational Quantum Eigensolver (VQE) :</b> Conçu pour estimer l\'état de plus basse énergie (état fondamental) d\'un système quantique. Il est largement utilisé en chimie quantique, en science des matériaux et en simulation hamiltonienne pour étudier les molécules et les matériaux quantiques.</li>'
      + '<li><b>Quantum Approximate Optimization Algorithm (QAOA) :</b> Conçu pour trouver des solutions approchées de haute qualité à des problèmes d\'optimisation combinatoire difficiles — comme le routage, la planification, le partitionnement de graphes et l\'optimisation de portefeuille — en alternant des opérations quantiques spécifiques au problème et des opérations de mélange.</li>'
      + '</ul>'
      + 'Le VQE et le QAOA sont parmi les algorithmes quantiques les plus prometteurs pour les ordinateurs quantiques bruités à échelle intermédiaire (NISQ) d\'aujourd\'hui, car ils réduisent la profondeur des circuits quantiques tout en tirant parti de l\'optimisation classique.',
    nisqTitle: 'Informatique NISQ',
    nisqBody: 'L\'ère actuelle des ordinateurs quantiques est appelée l\'ère NISQ (Noisy Intermediate-Scale Quantum, quantique bruité à échelle intermédiaire) : les dispositifs contiennent de dizaines à milliers de qubits imparfaits, mais ne peuvent pas encore exécuter d\'algorithmes pleinement tolérants aux fautes.',
    faultTolerantTitle: 'Informatique quantique tolérante aux fautes',
    faultTolerantBody: 'Une future génération d\'ordinateurs quantiques capables d\'effectuer des calculs de longueur arbitraire malgré les erreurs matérielles, grâce à la correction d\'erreurs quantiques.',
    surfaceCodeTitle: 'Code de surface',
    surfaceCodeBody: 'Le principal code de correction d\'erreurs quantiques, encodant un qubit logique dans de nombreux qubits physiques disposés sur un réseau bidimensionnel.',
    logicalPhysicalQubitsTitle: 'Qubits logiques et qubits physiques',
    logicalPhysicalQubitsBody: 'Les qubits physiques sont les qubits matériels qui subissent le bruit. Les qubits logiques sont des qubits protégés, corrigés contre les erreurs, encodés à travers de nombreux qubits physiques.',
    magicStatesTitle: 'États magiques',
    magicStatesBody: 'Certaines portes quantiques ne peuvent pas être mises en œuvre directement dans de nombreuses architectures tolérantes aux fautes. À la place, des « états magiques » spécialement préparés sont consommés pour les réaliser, ce qui fait de la distillation d\'états magiques l\'un des coûts les plus importants de l\'informatique quantique à grande échelle.',
    hamiltonianSimulationTitle: 'Simulation hamiltonienne',
    hamiltonianSimulationBody: 'L\'une des motivations d\'origine de l\'informatique quantique : simuler efficacement la dynamique de molécules, de matériaux et de théories quantiques des champs régies par un hamiltonien. De nombreux chercheurs — y compris ceux travaillant sur les théories de jauge sur réseau et la chimie quantique — considèrent cela comme l\'une des applications à long terme les plus importantes des ordinateurs quantiques.',
    qpeTitle: 'Estimation de phase quantique (QPE)',
    qpeBody: 'Un algorithme quantique fondamental permettant d\'estimer les valeurs propres d\'opérateurs unitaires. Il sous-tend l\'algorithme de Shor ainsi que de nombreux algorithmes de chimie quantique et de simulation hamiltonienne.',
    adiabaticQCTitle: 'Informatique quantique adiabatique',
    adiabaticQCBody: 'Un modèle de calcul dans lequel le système reste dans son état fondamental pendant que son hamiltonien évolue lentement. Si l\'évolution est suffisamment lente, l\'état fondamental final encode la solution d\'un problème d\'optimisation.',
    mbqcTitle: 'Informatique quantique basée sur la mesure',
    mbqcBody: 'Plutôt que de calculer principalement avec des portes, le calcul se déroule en préparant un grand état ressource intriqué (un état de cluster), puis en effectuant des mesures soigneusement choisies. Ce sont les mesures elles-mêmes qui pilotent le calcul.'
  },
  measure: {
    title: 'Mesure',
    subtitle: 'Les barres ci-dessous représentent des probabilités, pas un aperçu — mesurer force le qubit à répondre à une question dont il était réellement indécis, et il n\'y a pas de retour en arrière possible',
    quantumState: 'État quantique',
    measureButton: 'MESURER',
    postulateTitle: 'Le postulat de mesure',
    postulateBody1: 'Ce n\'est pas une simple simplification de l\'application — c\'est l\'un des axiomes de la mécanique quantique. Mesurer un qubit |ψ⟩ = α|0⟩ + β|1⟩ renvoie 0 avec une probabilité |α|² et 1 avec une probabilité |β|² (la règle de Born), et immédiatement après, l\'état s\'est effondré sur le résultat obtenu — l\'autre possibilité a tout simplement disparu, pas seulement été cachée.',
    postulateFormula: 'P(0) = |α|²&nbsp;&nbsp;&nbsp; P(1) = |β|²&nbsp;&nbsp;&nbsp; α|0⟩ + β|1⟩ → |0⟩ ou |1⟩',
    postulateBody2: 'Remarquez ce qui manque : rien dans cette règle n\'indique quel résultat vous obtiendrez lors d\'un essai unique — seulement les probabilités sur de nombreux qubits identiques, ce à quoi sert exactement l\'histogramme ci-dessous.',
    measurementStatistics: 'Statistiques de mesure',
    confirmOddsBody: 'C\'est la seule façon de réellement confirmer ces probabilités — poser la même question à de nombreux qubits identiques et observer l\'histogramme se stabiliser selon la répartition prédite. Un seul qubit ne donne jamais qu\'une seule réponse ; le motif n\'apparaît qu\'à travers une foule de mesures.'
  },
  entangle: {
    title: 'Intrication quantique',
    subtitle: 'État de Bell (|00⟩ + |11⟩)/√2 — aucun des deux qubits n\'a d\'état défini seul ; mesurer l\'un détermine instantanément l\'autre',
    bannerAlt: 'Illustration de l\'analogie du lancer de pièce pour l\'intrication quantique : deux personnes lancent chacune une pièce à des détecteurs séparés, reliés par une sphère lumineuse de cônes de corrélation — quel que soit le côté sur lequel tombe la pièce A, la pièce B tombe instantanément du côté opposé, l\'état restant indéterminé jusqu\'à la mesure.',
    jointStateLabel: 'état conjoint des deux qubits',
    explainerTitle: 'Qu\'est-ce que l\'intrication quantique ?',
    explainerBody1: 'L\'intrication quantique est un phénomène dans lequel deux particules ou plus deviennent liées de telle sorte que leurs états quantiques ne peuvent plus être décrits indépendamment l\'un de l\'autre — même lorsque les particules sont séparées par d\'énormes distances. Plutôt que deux qubits séparés, chacun portant son propre état, la paire partage un unique état conjoint, comme l\'état de Bell (|00⟩ + |11⟩)/√2 montré ci-dessus : un mélange 50/50 de « les deux mesurés à 0 » et « les deux mesurés à 1 », sans aucun moyen de le décomposer en ce que fait le qubit A ou le qubit B pris séparément.',
    explainerBody2: 'L\'intrication n\'est pas produite par une quelconque force mystérieuse qui relierait les particules — elle est créée localement, au moment où deux qubits interagissent (ici, avec une porte Hadamard suivie d\'une porte CNOT — construisez la même recette porte par porte dans l\'onglet Circuits), et elle persiste ensuite, quelle que soit la distance que les qubits parcourent par la suite. Einstein qualifiait célèbrement les corrélations qui en résultent d\'« action fantôme à distance », car mesurer un qubit semble affecter instantanément l\'autre.',
    explainerBody3: 'Les deux cartes ci-dessous détaillent ce qui se cache derrière cette intuition : pourquoi un tel état ne peut vraiment pas être décrit comme deux qubits séparés, et pourquoi la corrélation instantanée ne peut toujours pas être utilisée pour envoyer un signal plus rapide que la lumière.',
    mapCaption: 'Deux lieux différents, arbitrairement éloignés — la corrélation tient quelle que soit la distance qui les sépare.',
    entangledLabel: 'Intriqué',
    measureBoth: 'Mesurer les deux',
    measureAOnly: 'Mesurer A seulement',
    tensorTitle: 'Pourquoi ce n\'est pas juste deux qubits ? (Produits tensoriels)',
    tensorBody1: 'Deux qubits indépendants se combinent toujours par <span class="key-term">produit tensoriel</span> (⊗) : on empile le vecteur à 2 entrées du qubit A contre celui du qubit B, en multipliant chaque paire d\'entrées pour construire un vecteur conjoint à 4 entrées. Tout état produit — tout ce que vous pouvez construire dans le panneau Deux Qubits de l\'onglet Bits & Qubits — se factorise ainsi en deux qubits séparés :',
    tensorFormula1: '|0⟩⊗|0⟩ = [1,0]<sup>T</sup>⊗[1,0]<sup>T</sup> = [1,0,0,0]<sup>T</sup> = |00⟩',
    tensorBody2: 'L\'état de Bell ci-dessus est lui aussi un vecteur à 4 entrées — [1,0,0,1]<sup>T</sup>/√2 — mais essayez de le factoriser en [a,b]<sup>T</sup>⊗[c,d]<sup>T</sup> = [ac,ad,bc,bd]<sup>T</sup> : il n\'existe aucune solution. <em>ad</em> = 0 et <em>bc</em> = 0 obligent l\'un des deux facteurs de chaque paire à être nul, ce qui annulerait aussi <em>ac</em> ou <em>bd</em> — aucun couple d\'états à un qubit A et B ne se multiplie pour le reproduire.',
    tensorFormula2: '(|00⟩ + |11⟩) / √2 = [1, 0, 0, 1]ᵀ/√2 ≠ [a,b]ᵀ ⊗ [c,d]ᵀ pour tous a, b, c, d',
    tensorBody3: 'C\'est la définition littérale et vérifiable de l\'intrication : un état conjoint qui ne peut pas être décomposé à nouveau en deux facteurs indépendants à un seul qubit. Aucun des deux qubits n\'a de son côté un état bien défini — seule la paire en a un.',
    relativityTitle: 'Pourquoi cela ne viole pas la relativité',
    relativityBody1: 'Ce dispositif est une version de l\'expérience de pensée d\'Einstein-Podolsky-Rosen (EPR) : Alice mesure le qubit A et connaît instantanément le résultat du qubit B, même si B se trouve à des années-lumière. Cela ressemble à une transmission d\'information plus rapide que la lumière — mais ce n\'en est pas une.',
    relativityBody2: 'Alice ne peut pas choisir le résultat qu\'elle obtient — celui-ci reste aléatoire, avec les mêmes probabilités de 50/50 que n\'importe quel qubit seul. Il n\'y a donc rien qu\'elle puisse contrôler, et donc rien qu\'elle puisse encoder dans un message. La corrélation n\'est visible qu\'après coup, une fois qu\'Alice et Bob comparent leurs résultats via un canal ordinaire (plus lent que la lumière). Aucune énergie, aucune information, et aucun signal ne traverse réellement la distance qui les sépare au moment de la mesure.',
    cernTitle: 'Pourquoi le CERN S\'intéresse à l\'Intrication',
    cernBody1: 'Ce n\'est pas qu\'un exemple pédagogique. Les physiciens du LHC ont mesuré une véritable intrication quantique directement dans les particules produites par les collisions proton-proton — notamment entre un quark top et son antiquark, créés et se désintégrant en une fraction de billionième de billionième de seconde. La même mathématique d\'état de Bell présentée sur cette page, (|00⟩ + |11⟩)/√2, décrit une corrélation réelle, mesurée, dans l\'environnement de plus haute énergie jamais construit par l\'humanité.',
    cernBody2: 'L\'Initiative Technologie Quantique du CERN traite l\'intrication et la superposition comme des ressources d\'ingénierie, pas de simples curiosités : des ordinateurs quantiques pour simuler les théories quantiques des champs derrière la physique des particules elle-même — un problème qui passe mal à l\'échelle sur des ordinateurs classiques — et des capteurs quantiques construits à partir d\'états intriqués ou comprimés, visant le type de mesures de précision extrême dont dépendent les recherches de matière noire et d\'autre nouvelle physique.'
  },
  bellstates: {
    title: 'États de Bell',
    subtitle: 'Les quatre états à deux qubits maximalement intriqués — choisissez-en un pour voir comment il est construit, comment il est classé, et ce qu\'il prédit exactement',
    pickTitle: 'Choisissez un état de Bell',
    circuitTitle: 'Schéma du circuit',
    recipe: {
      phiplus: 'Partez de |00⟩, appliquez H au qubit A, puis CNOT (A → B).',
      phiminus: 'Partez de |00⟩, appliquez X au qubit A, puis H au qubit A, puis CNOT (A → B).',
      psiplus: 'Partez de |00⟩, appliquez X au qubit B, puis H au qubit A, puis CNOT (A → B).',
      psiminus: 'Partez de |00⟩, appliquez X aux deux qubits, puis H au qubit A, puis CNOT (A → B).'
    },
    familyTitle: 'La famille de Bell',
    familyBody: 'Chaque état de Bell occupe l\'un des quatre coins, déterminé par deux choix indépendants : la ligne (résultats de mesure identiques ou opposés) et la colonne (une phase relative + ou −). Cliquez sur un coin pour le préparer.',
    plusPhase: 'phase +',
    minusPhase: 'phase −',
    sameRow: 'Identiques',
    oppositeRow: 'Opposés',
    distributionTitle: 'Distribution de probabilité',
    distributionNote: 'Probabilités exactes issues de la règle de Born pour {symbol} — aucun échantillonnage nécessaire, elles découlent directement du carré de chaque amplitude.',
    definitionsTitle: 'Les quatre états de Bell',
    definitionsBody: 'Les quatre sont construits à partir du même point de départ |00⟩ avec la même recette à deux portes — une porte Hadamard sur le qubit A, puis un CNOT contrôlé par celui-ci — précédée simplement d\'une porte X sur le ou les qubits à inverser d\'abord :'
      + '<ul class="quantum-list">'
      + '<li><b>Φ⁺ = (|00⟩ + |11⟩)/√2</b> — aucune porte X. Les résultats correspondent toujours.</li>'
      + '<li><b>Φ⁻ = (|00⟩ − |11⟩)/√2</b> — porte X sur le qubit A d\'abord. Les résultats correspondent toujours.</li>'
      + '<li><b>Ψ⁺ = (|01⟩ + |10⟩)/√2</b> — porte X sur le qubit B d\'abord. Les résultats sont toujours opposés.</li>'
      + '<li><b>Ψ⁻ = (|01⟩ − |10⟩)/√2</b> — porte X sur les deux qubits d\'abord. Les résultats sont toujours opposés.</li>'
      + '</ul>'
      + 'Ensemble, ils forment une base orthonormée complète pour deux qubits — la ressource centrale derrière la téléportation quantique et le codage superdense.',
    phaseNoteTitle: 'Pourquoi le signe moins n\'apparaît-il pas ?',
    phaseNoteBody: 'Φ⁺ et Φ⁻ (de même que Ψ⁺ et Ψ⁻) donnent des distributions de probabilité identiques ci-dessus, car une phase relative — le signe − — ne change aucune probabilité dans la base de calcul ; seul |amplitude|² compte. Les deux états restent physiquement distincts : la phase devient visible dès que l\'on fait interférer les qubits entre eux, par exemple en appliquant une porte Hadamard à chacun avant de mesurer — c\'est exactement l\'étape supplémentaire sur laquelle s\'appuient les tests des inégalités de Bell et le codage superdense pour distinguer les quatre états.'
  },
  tunnel: {
    title: 'Effet tunnel quantique',
    subtitle: 'Envoyez un paquet d\'ondes contre un mur plus haut que sa propre énergie. Classiquement, il rebondit toujours. Quantiquement, une partie le traverse malgré tout',
    reflected: 'Réfléchi',
    transmitted: 'Transmis',
    barrier: 'Barrière',
    fireAgain: '↻ Relancer',
    runHistory: 'Historique des tirs',
    clearHistory: 'Effacer',
    historyEmpty: 'Aucun tir terminé pour l\'instant.',
    historyCount: '· {count} tirs',
    validationNote: 'Solveur validé automatiquement : probabilité conservée à <0,3 % sur une exécution complète ; la transmission chute correctement de >10 % à V₀=E vers <2 % à V₀=2,5E.'
  },
  interference: {
    title: 'Interférence des ondes',
    subtitle: 'Deux chemins ouverts et un écran qui compte les points. Chaque point à droite est une particule qui atterrit — pourtant, ensemble, elles dessinent une onde',
    screen: 'Écran',
    setup: 'Configuration',
    doubleSlit: 'Double fente',
    singleSlit: 'Fente unique',
    whichPath: 'Chemin connu',
    wave: 'Onde',
    clearAccumulation: 'Effacer l\'accumulation',
    physicsInDetail: 'La physique, en détail',
    body1: 'Chaque point sur l\'écran est une particule qui atterrit à un endroit précis — cela, en soi, n\'a rien d\'inhabituel. Ce qui n\'est pas ordinaire, c\'est <em>où</em> ces points sont autorisés à atterrir. Envoyez des particules une par une vers la double fente, sans aucune possibilité que deux particules se croisent en plein vol, et les points s\'accumulent quand même en bandes. Il n\'y a pas de foule de particules qui interfèrent entre elles — la fonction d\'onde de chaque particule individuelle passe par <em>les deux</em> fentes à la fois et interfère avec elle-même. C\'est là le véritable mystère, pas seulement le fait que « les ondes créent des motifs ».',
    formula: 'I(y) = |A<sub>1</sub>(y) + A<sub>2</sub>(y)|² = |A<sub>1</sub>|² + |A<sub>2</sub>|² + 2|A<sub>1</sub>||A<sub>2</sub>|cos φ(y)',
    body2: 'A<sub>1</sub> et A<sub>2</sub> sont les amplitudes pour « la particule est passée par la fente 1 » et « par la fente 2 », et φ(y) est la distance supplémentaire que parcourt l\'un des chemins pour atteindre le point y, convertie en phase. Les probabilités classiques s\'additionneraient simplement : P = P<sub>1</sub> + P<sub>2</sub>, un tas plat sans bandes. Les amplitudes quantiques s\'additionnent d\'abord et sont élevées au carré ensuite — et élever une somme au carré produit ce terme croisé <strong>2|A<sub>1</sub>||A<sub>2</sub>|cos φ</strong>, positif en certains points y (franges brillantes), négatif en d\'autres (franges sombres), et c\'est la seule raison pour laquelle les bandes existent.',
    body3: '<strong>Double fente</strong> — les deux chemins restent ouverts et véritablement indiscernables, donc le terme croisé subsiste et l\'on obtient des franges. <strong>Fente unique</strong> — une seule amplitude existe, donc elle n\'a rien avec quoi interférer ; I = |A<sub>1</sub>|², une simple tache de diffraction. <strong>Chemin connu</strong> — les deux fentes restent physiquement ouvertes, mais marquer le chemin de chaque particule (les petits points de détecteur sur la plaque) fait qu\'une mesure du chemin existe désormais pour chaque impact. Moyenné sur ces mesures, le terme croisé s\'annule exactement, laissant le I = |A<sub>1</sub>|² + |A<sub>2</sub>|² plat auquel on s\'attendrait pour des particules ordinaires — deux bosses, aucune bande. Il n\'est nul besoin de perturber physiquement la particule pour que cela se produise ; rendre simplement le chemin <em>connaissable en principe</em> suffit à effacer le motif.',
    body4: 'C\'est pourquoi l\'animation d\'ondulations à gauche et l\'écran point par point à droite sont montrés côte à côte : les ondulations représentent l\'image ondulatoire continue qui prédit où le terme croisé est constructif ou destructif, et l\'écran est ce qui est réellement mesuré — un clic aléatoire, tout ou rien, à la fois. L\'onde n\'atterrit jamais nulle part ; seule la particule le fait. Les bandes sont l\'empreinte de l\'onde sur les endroits où les particules ont pu, ou n\'ont pas pu, cliquer.'
  },
  beamsplitter: {
    title: 'Séparateur de faisceau',
    subtitle: 'Un photon unique frappe un séparateur de faisceau 50/50 et est réfléchi de façon aléatoire vers le détecteur A ou transmis vers le détecteur B — un photon, un résultat aléatoire, jamais un photon divisé en deux',
    svgAlt: 'Diagramme d\'une source de photons tirant sur un séparateur de faisceau 50/50, réfléchi vers le haut vers le détecteur A ou transmis vers la droite vers le détecteur B. Un faible duplicata apparaît brièvement sur le chemin non emprunté, illustrant la superposition qui existait avant la détection du photon.',
    photonSource: 'Source de photons',
    reflected: 'réfléchi',
    transmitted: 'transmis',
    beamSplitterLabel: 'Séparateur de faisceau',
    detectorA: 'Détecteur de photons A',
    detectorB: 'Détecteur de photons B',
    firePhoton: 'Émettre un photon',
    detectorTally: 'Décompte des détecteurs'
  },
  sterngerlach: {
    title: 'Expérience de Stern–Gerlach',
    subtitle: 'Envoyez des atomes un par un à travers un champ magnétique et observez le spin — une propriété purement quantique — se révéler sous la forme d\'un petit nombre de points discrets, jamais d\'une traînée continue',
    definitionTitle: 'Qu\'est-ce que le Spin ?',
    definitionBody1: 'Le spin est une forme intrinsèque de moment cinétique portée par chaque particule élémentaire et chaque atome — non une rotation physique littérale, mais une propriété authentique et permanente présente même pour une particule sans aucune structure interne susceptible de tourner. Il est quantifié : une mesure du spin selon n\'importe quel axe choisi ne peut renvoyer qu\'une valeur parmi un petit ensemble fixe de valeurs discrètes, jamais une valeur continûment variable. Pour une particule de spin ½, comme l\'électron non apparié responsable du moment magnétique d\'un atome d\'argent, cette mesure a exactement deux résultats possibles — classiquement appelés « haut » et « bas » selon l\'axe mesuré — avec une probabilité pour chacun fixée par l\'état quantique de l\'atome via la règle de Born, la même règle qui régit chaque résultat de mesure ailleurs dans cette application.',
    definitionBody2: 'L\'expérience de Stern–Gerlach (1922) fut la première observation directe de cette quantification : un faisceau d\'atomes d\'argent envoyé à travers un champ magnétique à fort gradient spatial s\'est séparé en exactement deux points discrets sur un écran détecteur, plutôt que la traînée continue qu\'aurait produite un moment magnétique classique orienté arbitrairement. L\'appareil interactif ci-dessous reproduit cette même mesure, un atome à la fois.',
    svgAlt: 'Schéma d\'atomes d\'argent entrant dans un aimant de Stern-Gerlach avec un pôle sud en arête de couteau au-dessus et un pôle nord large et incurvé en dessous, séparant le faisceau vers un résultat Haut ou Bas. Les atomes peuvent venir directement d\'un four avec un angle de spin d\'entrée réglable, ou être déjà prémesurés avec l\'axe de cet aimant sélectionnable, pour tester si une seconde mesure perturbe un spin déjà défini.',
    atomSource: 'Four',
    silverAtomsArrow: 'Atomes d\'argent',
    collimatingSlits: 'Fentes de collimation',
    magnetLabel: 'Champ inhomogène',
    detectorUp: 'Détecteur Haut',
    detectorDown: 'Détecteur Bas',
    detectorPlus: 'Détecteur « + »',
    detectorMinus: 'Détecteur « − »',
    fireAtom: 'Tirer un atome',
    magnetCountTitle: 'Nombre d\'aimants',
    oneMagnet: '1 aimant',
    twoMagnets: '2 aimants (séquentiel)',
    inputSpinTitle: 'Angle de spin d\'entrée',
    inputSpinBody: 'Le même θ que sur la sphère de Bloch — θ = 0° prépare un spin certainement vers le haut, θ = 180° certainement vers le bas, et toute valeur intermédiaire est une véritable superposition des deux.',
    detectorTally: 'Décompte des détecteurs',
    whyTwoSpotsTitle: 'Pourquoi seulement deux points ?',
    whyTwoSpotsBody: 'La force de déviation provient du <em>gradient</em> du champ, pas seulement de son intensité : F<sub>z</sub> ≈ μ<sub>z</sub>·∂B<sub>z</sub>/∂z, où μ<sub>z</sub> est le moment magnétique de l\'atome selon l\'axe du champ. Un champ uniforme (∂B<sub>z</sub>/∂z = 0) n\'exercerait aucune force nette, quelle que soit la direction du moment — c\'est exactement pourquoi les deux pôles ci-dessus sont façonnés différemment plutôt que d\'être simplement de puissants aimants : seul un champ véritablement inhomogène produit une déviation.',
    whyTwoSpotsFormula: 'F<sub>z</sub> ≈ μ<sub>z</sub> (∂B<sub>z</sub> / ∂z) &nbsp;&nbsp;&nbsp; si B est uniforme ⇒ F = 0',
    whyTwoSpotsBody2: 'Classiquement, μ<sub>z</sub> pourrait pointer dans n\'importe quelle direction, donc un faisceau d\'atomes orientés aléatoirement devrait s\'étaler continûment sur l\'écran, d\'une déviation totale vers le haut à une déviation totale vers le bas. Lorsque Stern et Gerlach ont réellement mené cette expérience en 1922, les atomes d\'argent ont atterri en exactement deux points discrets — rien entre les deux, quelle que soit l\'inclinaison de l\'aimant. C\'est la même quantification déjà intégrée à chaque qubit de cette application : une mesure renvoie l\'un de exactement deux résultats, jamais un résultat partiel.',
    sequentialTitle: 'Mesurer deux fois : pourquoi l\'ordre compte',
    sequentialIntro: 'L\'atome ci-dessus a déjà un spin défini — c\'est la sortie « haut » d\'un premier aimant (non représenté), la moitié « bas » étant physiquement bloquée. Choisissez l\'axe de cet aimant pour voir si le mesurer à nouveau le perturbe.',
    sameAxis: 'Même axe (Z)',
    differentAxis: 'Axe différent (X)',
    preparedLabel: 'préparé : spin ↑ (Z)',
    blockedLabel: '(moitié « bas » bloquée)',
    magnet2AxisZ: 'Aimant 2 — axe Z',
    magnet2AxisX: 'Aimant 2 — axe X',
    resultTravelling: 'en vol…',
    resultUp: 'Le détecteur Haut a cliqué',
    resultDown: 'Le détecteur Bas a cliqué',
    explainerUp: 'Le détecteur Haut a cliqué — l\'un des exactement deux résultats possibles, jamais une déviation partielle. Tirez à nouveau et le même état d\'atome peut encore atterrir en bas ; seules les probabilités sont fixes, pas un résultat particulier.',
    explainerDown: 'Le détecteur Bas a cliqué — l\'un des exactement deux résultats possibles, jamais une déviation partielle. Tirez à nouveau et le même état d\'atome peut encore atterrir en haut ; seules les probabilités sont fixes, pas un résultat particulier.',
    explainerDefault: 'Un atome est sur le point d\'entrer dans l\'aimant. Tirez-le et observez quel détecteur clique.',
    trialCount: '· {count} atomes',
    sequentialExplainerZ: 'Même axe qu\'avant — tirez un atome pour confirmer qu\'il atterrit toujours de la même façon.',
    sequentialExplainerX: 'Un axe différent cette fois — tirez un atome pour voir ce qui arrive à un spin qui était déjà défini selon Z.',
    result2Plus: 'Le détecteur « + » a cliqué',
    result2Minus: 'Le détecteur « − » a cliqué',
    explainer2Z: 'Mesurer deux fois le même axe de suite ne fait que confirmer le résultat précédent — rien de surprenant ici. Tirez autant de fois que vous le souhaitez : le résultat sera toujours « + ».',
    explainer2X: 'Bien que cet atome ait eu un spin parfaitement défini selon Z, mesurer un axe différent et incompatible (X) a effacé cette information et produit un résultat nouveau, authentiquement aléatoire. C\'est le cœur de la découverte de Stern–Gerlach : mesurer une propriété peut perturber une autre propriété qui ne commute pas avec elle.'
  },
  teleport: {
    title: 'Téléportation Quantique',
    subtitle: 'Transférer l\'état exact d\'un qubit sur un second qubit, physiquement distinct — au moyen d\'une paire intriquée partagée et de deux bits classiques, sans jamais transporter le qubit lui-même',
    definitionTitle: 'Qu\'est-ce que la Téléportation Quantique ?',
    definitionBody1: 'La téléportation quantique est un protocole permettant de transférer l\'état exact d\'un qubit sur un second qubit, physiquement distinct, au moyen d\'une paire de qubits intriqués partagée au préalable et de deux bits de communication classique — sans que le qubit d\'origine soit jamais physiquement transporté ni mesuré directement. Elle déplace de l\'information quantique, pas de la matière ni de l\'énergie, et ne peut pas servir à envoyer un signal plus rapide que la lumière : récupérer l\'état transféré côté récepteur exige que ces deux bits classiques arrivent réellement, et ils ne voyagent pas plus vite qu\'un signal ordinaire.',
    definitionBody2: 'Elle ne crée pas non plus de copie. L\'état du qubit source est nécessairement détruit par la mesure qu\'exige le protocole, conformément au théorème de non-clonage, qui interdit à toute procédure de dupliquer un état quantique inconnu tout en laissant l\'original intact. Dans le déroulé ci-dessous, les deux parties qui échangent le qubit reçoivent les noms conventionnels utilisés dans toute la théorie de l\'information quantique — Alice pour l\'émettrice, Bob pour le récepteur.',
    circuitTitle: 'Le Protocole',
    svgAlt: 'Schéma de circuit : le qubit-message d\'Alice et les deux moitiés d\'une paire intriquée. Une porte Hadamard et une CNOT créent la paire intriquée entre le second qubit d\'Alice et le qubit de Bob. Une CNOT et une Hadamard placent le qubit-message d\'Alice et sa moitié de la paire dans la base de Bell. Les deux sont mesurés, et les deux résultats classiques voyagent par des doubles lignes vers des portes de correction Z et X appliquées conditionnellement sur le qubit de Bob.',
    finalLabel: 'Le qubit de Bob ≡ ψ',
    teleportBtn: 'Téléporter',
    aliceBadge: 'Message d\'Alice',
    aliceDesc: 'Fixez n\'importe quel état — c\'est lui qui sera téléporté',
    bobBadge: 'Qubit de Bob',
    bobDescWaiting: 'Pas encore intriqué — appuyez sur Téléporter',
    bobDescEntangled: 'Intriqué avec Alice — indéterminé à lui seul',
    bobDescWrong: 'Défini maintenant, mais pas encore ψ — en attente des bits d\'Alice',
    bobDescMatch: 'Correspond exactement au message d\'Alice',
    bobFormulaUndetermined: '|ψ⟩ = ?',
    classicalBitsTitle: 'Bits Classiques',
    classicalBitsBody: 'Alice doit physiquement envoyer ces deux bits à Bob — par téléphone, radio, courrier postal, n\'importe quel moyen classique. Sans eux, le qubit de Bob ne lui sert à rien, même s\'il l\'a déjà sous la main.',
    outcomeTally: 'Décompte des Résultats',
    resultRunning: 'en cours…',
    resultDone: 'Téléportation terminée',
    stepPair: 'Alice et Bob partagent une paire intriquée, préparée avant même l\'existence d\'un message.',
    stepBell: 'Alice intrique son qubit-message avec sa moitié de la paire — cela lit ψ au regard de l\'intrication, ça ne le copie pas.',
    stepMeasure: 'Alice mesure ses deux qubits, les faisant s\'effondrer en deux bits classiques authentiquement aléatoires — et effondrant le qubit de Bob en un état défini au même instant.',
    stepSend: 'Alice envoie ses deux bits classiques à Bob — un canal ordinaire, jamais plus rapide que la lumière. Il applique conditionnellement Z et/ou X pour corriger son qubit.',
    stepDone: 'Le qubit de Bob est maintenant exactement égal au message original d\'Alice — téléporté, pas copié : son propre qubit a été détruit par la mesure de l\'étape 2, donc le théorème de non-clonage reste intact. Alice n\'a jamais appris ψ non plus ; elle a juste transmis deux bits aléatoires, m₀={m0}, m₁={m1}, qui se sont avérés être exactement ce dont Bob avait besoin.',
    explainerDefault: 'Fixez ci-dessus l\'état du message d\'Alice, puis appuyez sur Téléporter. Observez la sphère de Bob : elle démarre indéterminée, saute vers un point défini mais incorrect à l\'instant où Alice mesure, puis se cale exactement sur celle d\'Alice dès que ses bits classiques arrivent et que Bob les corrige.',
    trialCount: '· {count} essais',
    whyNotFtlTitle: 'Pourquoi Ce N\'est Pas Plus Rapide Que la Lumière',
    whyNotFtlBody: 'À l\'instant où Alice mesure ses deux qubits, le qubit de Bob devient bien un état défini — mais lequel reste un mystère sans les deux bits classiques d\'Alice, qui ne peuvent voyager qu\'à la vitesse de la lumière ou moins vite, comme un appel téléphonique. Tant qu\'ils n\'arrivent pas, le qubit de Bob n\'est que du bruit pur : le mesurer trop tôt donnerait juste un résultat aléatoire à 50/50, quel qu\'ait été ψ. L\'intrication rend la téléportation possible ; elle ne la rend pas instantanée.',
    noCloningTitle: 'Pas une Copie — le Théorème de Non-Clonage',
    noCloningBody: 'Le qubit-message original d\'Alice ne survit pas à cela : sa mesure dans la base de Bell à l\'Étape 2 l\'effondre avec sa moitié de la paire, effaçant définitivement ce qu\'était ψ de son côté. Ce n\'est pas une limitation propre à ce protocole — le théorème de non-clonage démontre qu\'<em>aucune</em> procédure quantique ne peut jamais copier un état inconnu tout en laissant l\'original intact. La téléportation déplace un état ; elle n\'en duplique jamais un.'
  },
  superdense: {
    title: 'Codage Superdense',
    subtitle: 'Transmettre deux bits classiques d\'information en n\'envoyant physiquement qu\'un seul qubit, étant donné une paire intriquée partagée à l\'avance',
    definitionTitle: 'Qu\'est-ce que le Codage Superdense ?',
    definitionBody1: 'Le codage superdense est un protocole de communication quantique qui transmet deux bits classiques d\'information en n\'envoyant physiquement qu\'un seul qubit, à condition que l\'émetteur et le récepteur partagent déjà chacun une moitié d\'une paire intriquée préparée à l\'avance. C\'est le réciproque logique de la téléportation quantique : la téléportation dépense deux bits classiques et une paire intriquée partagée pour déplacer 1 qubit d\'information quantique, tandis que le codage superdense dépense 1 qubit et ce même type de paire partagée pour déplacer deux bits classiques.',
    definitionBody2: 'Ce n\'est pas une faille dans les limites de la communication classique — un qubit physique réel doit encore voyager de l\'émetteur au récepteur pour que le protocole fonctionne, donc la transmission reste limitée par la vitesse ordinaire du signal. Comme dans l\'onglet Téléportation, les deux parties ci-dessous reçoivent leurs noms conventionnels de la théorie de l\'information quantique : Alice pour l\'émettrice, Bob pour le récepteur.',
    circuitTitle: 'Le Protocole',
    svgAlt: 'Schéma de circuit : le qubit d\'Alice et le qubit de Bob. Une Hadamard et une CNOT créent une paire intriquée. Alice applique conditionnellement X et/ou Z à son propre qubit uniquement, codant deux bits classiques. Elle envoie ensuite physiquement ce qubit à Bob par un canal quantique. Bob, ayant désormais les deux qubits, applique une CNOT et une Hadamard pour décoder, puis mesure les deux pour récupérer les deux bits exacts d\'Alice.',
    channelLabel: 'canal quantique',
    finalLabelA: 'd₀',
    finalLabelB: 'd₁',
    sendBtn: 'Envoyer',
    messageTitle: 'Message à Envoyer',
    messageBody: 'Choisissez n\'importe quel message de 2 bits — c\'est ce qu\'Alice code sur son unique qubit avant de l\'envoyer à Bob.',
    sentLabel: 'Alice a envoyé',
    receivedLabel: 'Bob a décodé',
    resultRunning: 'en cours…',
    resultMatch: 'Décodé exactement',
    resultMismatch: 'Écart — vérifiez la console, ceci ne devrait jamais arriver',
    stepPair: 'Alice et Bob partagent une paire intriquée, préparée à l\'avance.',
    stepEncode: 'Alice code son message uniquement sur son propre qubit — la moitié de la paire de Bob n\'est jamais touchée.',
    stepSend: 'Alice envoie physiquement cet unique qubit à Bob par un vrai canal quantique — la seule étape sans substitut classique.',
    stepDecode: 'Bob, ayant désormais les deux qubits, exécute le même circuit de base de Bell que l\'Alice de Téléporter — une CNOT puis une Hadamard — pour distinguer les quatre messages possibles.',
    stepMeasure: 'Bob mesure les deux qubits et lit les deux bits exacts d\'Alice.',
    stepDone: 'Bob a décodé {received} — exactement ce qu\'Alice a envoyé, {sent}. Rien n\'était aléatoire ici : les quatre messages possibles tombent sur quatre états mutuellement orthogonaux, si bien que la mesure de Bob n\'a plus aucune incertitude une fois le qubit arrivé.',
    explainerDefault: 'Choisissez un message de 2 bits ci-dessus, puis appuyez sur Envoyer. Observez Alice le coder uniquement sur son propre qubit, remettre physiquement ce qubit à Bob, et Bob décoder les deux bits exactement — rien ici n\'est aléatoire.',
    tally: '{sent} envoyés · {match}/{sent} décodés correctement',
    whyChannelTitle: 'Pourquoi Cela Nécessite Toujours un Canal Quantique',
    whyChannelBody: 'La téléportation a déplacé l\'équivalent d\'un qubit d\'information en utilisant seulement des bits classiques, c\'est pourquoi elle ne peut pas dépasser la vitesse de la lumière. Le codage superdense va dans le sens inverse — il déplace 2 bits classiques en utilisant seulement 1 qubit de communication, ce qui semble dépasser la limite classique, mais ce n\'est pas une faille : un qubit physique réel doit encore voyager d\'Alice à Bob pour que cela fonctionne. L\'« économie » est réelle (1 qubit au lieu de 2 bits classiques de signal séparé), mais elle reste limitée par la vitesse à laquelle ce qubit peut lui-même voyager.',
    compareTitle: 'Téléportation contre Codage Superdense',
    compareBody: 'La même ressource — une paire intriquée partagée à l\'avance — dépensée dans des directions opposées. La téléportation envoie 1 qubit d\'information quantique en utilisant 2 bits classiques ; le codage superdense envoie 2 bits classiques d\'information en utilisant 1 qubit. Les deux nécessitent cette paire intriquée préparée à l\'avance, et les deux finissent par exécuter essentiellement le même circuit de base de Bell (une CNOT puis une Hadamard) — la téléportation l\'exécute côté émetteur pour lire un état, le codage superdense l\'exécute côté récepteur pour lire un message.'
  },
  noise: {
    title: 'Bruit et Décohérence',
    subtitle: 'La perte de cohérence quantique par interaction non désirée avec l\'environnement — l\'obstacle pratique dominant à la construction d\'ordinateurs quantiques fiables et à grande échelle',
    definitionTitle: 'Qu\'est-ce que la Décohérence Quantique ?',
    definitionBody1: 'La décohérence quantique est la perte de cohérence quantique : le processus par lequel l\'information de phase d\'un système fuit vers son environnement par une interaction non désirée, si bien qu\'un état authentiquement en superposition en vient à se comporter, à toutes fins pratiques, comme un mélange classique bien défini. Un système parfaitement isolé reste dans un état pur — décrit exactement par un unique vecteur d\'état |ψ⟩ — indéfiniment. Dès qu\'il interagit avec un environnement incontrôlé, cette garantie disparaît : le système s\'intrique avec les nombreux degrés de liberté propres à l\'environnement, et tracer tout sauf le système lui-même laisse un état mixte, décrit par une matrice de densité ρ plutôt que par un unique vecteur. Tous les autres onglets de cette application traitent les portes et les qubits comme parfaitement isolés exactement en ce premier sens ; celui-ci modélise ce qui se passe quand ils cessent de l\'être.',
    definitionBody2: 'Sur la sphère de Bloch déjà utilisée dans toute cette application, cette perte de pureté se traduit par un vecteur qui rétrécit — la même signature déjà observée pour un qubit intriqué avec un autre (voir les sphères de Bloch réduites des onglets Intriquer et Circuits), causée ici par un environnement incontrôlé plutôt que par un second qubit délibéré. La décohérence est l\'obstacle pratique dominant à la construction d\'ordinateurs quantiques fiables et à grande échelle : chaque porte d\'un circuit réel doit se terminer avant que la cohérence dont elle dépend n\'ait fui. La simulation ci-dessous modélise deux de ses canaux phénoménologiques standards, T₁ (relaxation) et T₂ (déphasage), faisant évoluer en temps réel le vecteur de Bloch d\'un unique qubit.',
    qubitBadge: 'Qubit en décohérence',
    statsTitle: 'Lecture en Direct',
    elapsed: 'Temps écoulé',
    vectorLength: 'Longueur du vecteur de Bloch',
    purity: 'Pureté Tr(ρ²)',
    densityMatrix: 'Matrice de Densité ρ',
    initialStateTitle: 'État Initial',
    decayTimesTitle: 'Temps de Décroissance',
    t2CapNote: 'T₂ plafonné à {eff} μs (2×T₁) — le déphasage ne peut pas être plus lent que la relaxation.',
    pauseBtn: '⏸ Pause',
    playBtn: '▶ Lecture',
    restartBtn: '↻ Redémarrer',
    explainerDefault: 'Observez le vecteur de Bloch rétrécir et dériver vers le pôle nord — ce rétrécissement est une véritable perte d\'information, pas seulement un effet visuel. Un vecteur plus court signifie que l\'état du qubit est authentiquement plus incertain, exactement la même idée d\'« état mixte » déjà utilisée pour les qubits intriqués ailleurs dans cette application.',
    explainerSettled: 'Stabilisé à |0⟩ — et la pureté est en fait remontée près de 100 %, elle n\'a pas touché son minimum. Ce n\'est pas un sauvetage : la relaxation T₁ attire le qubit vers son état fondamental, donc avec assez de temps il finit toujours par redevenir pur, mais pur et inutile. Un qubit posé sur |0⟩ a l\'air identique qu\'il ait commencé en |+⟩, |−⟩ ou autre chose — l\'information de phase que T₂ a effacée en chemin ne revient jamais, pureté ou pas.',
    t1t2Title: 'T₁ vs. T₂ — Deux Façons Différentes d\'Oublier',
    t1t2Body: 'T₁ (relaxation) est le temps que met le qubit à laisser fuir de l\'énergie vers son environnement et à se stabiliser vers |0⟩ — c\'est pourquoi la composante z du vecteur de Bloch dérive vers le pôle nord. T₂ (déphasage) est le temps pendant lequel le qubit conserve la phase relative entre |0⟩ et |1⟩ — c\'est pourquoi les composantes x/y, celles qui portent réellement l\'information de superposition, s\'estompent. Perdre T₂ est souvent le problème pratique le plus important : un qubit peut rester « majoritairement » |0⟩ ou |1⟩ longtemps après avoir perdu toute trace d\'une superposition authentique.',
    t1t2Formula: 'T₂ ≤ 2×T₁ &nbsp;&nbsp;&nbsp; (le déphasage ne peut jamais être plus lent que ce que permet la relaxation)',
    whyMattersTitle: 'Pourquoi Ce Combat Ne S\'arrête Jamais sur le Matériel Réel',
    whyMattersBody: 'Toutes les autres simulations de cette application exécutent portes et mesures comme des opérations mathématiquement parfaites, car c\'est la bonne façon d\'apprendre les idées d\'abord. Les processeurs quantiques réels — y compris les dispositifs supraconducteurs et à ions piégés avec lesquels l\'Initiative Technologie Quantique du CERN expérimente pour la simulation de physique des particules — ne restent cohérents que pendant une fenêtre limitée, mesurée exactement par ces nombres T₁/T₂, typiquement de quelques dizaines à quelques centaines de microsecondes. Chaque porte d\'un circuit réel doit se terminer bien à l\'intérieur de cette fenêtre, ce qui est la raison même pour laquelle la correction d\'erreurs quantiques et la conception de circuits adaptée au matériel sont des problèmes d\'ingénierie actifs, non résolus.'
  },
  grover: {
    title: 'Recherche de Grover',
    subtitle: 'Trouver un élément marqué parmi quatre en une seule requête, en amplifiant son amplitude plutôt qu\'en les vérifiant un par un',
    definitionTitle: 'Qu\'est-ce que la Recherche de Grover ?',
    definitionBody1: 'L\'algorithme de Grover recherche dans une liste non triée de N éléments celui qui est marqué, en utilisant environ √N requêtes à l\'oracle, au lieu de jusqu\'à N pour une recherche classique dans le pire des cas. Il fonctionne par amplification d\'amplitude : tous les éléments commencent en superposition égale, un oracle inverse le signe de l\'amplitude de l\'élément marqué, puis une étape fixe de « diffusion » transforme ce changement de signe invisible en une hausse visible de la probabilité de mesure.',
    definitionBody2: 'Basculez ci-dessous entre deux cas concrets. N = 4 (2 qubits) est le plus petit cas où le résultat est exact : une seule requête porte la probabilité de l\'élément marqué exactement à 1. N = 8 (3 qubits) est le plus petit cas où ce n\'est visiblement pas le cas : il faut deux requêtes pour atteindre un maximum d\'environ 94,5 % seulement, et — preuve que ce n\'est pas simplement « pas assez de requêtes » — une troisième requête dépasserait ce maximum au lieu de l\'améliorer.',
    targetTitle: 'Élément à Trouver',
    targetBody: 'Choisissez quel élément est « marqué » — c\'est ce que l\'oracle reconnaît, et ce que la recherche ci-dessous devrait trouver.',
    targetLabel: 'Élément marqué',
    foundLabel: 'Trouvé',
    circuitTitle: 'Le Circuit',
    oracleGateLabel: 'Oracle',
    diffuserGateLabel: 'Diffuseur',
    oracleMarks: 'marque {t}',
    repeatBracketLabel: 'répéter ×2',
    iterationBadge: 'Itération {iter} sur {total}',
    modeN4Btn: 'N = 4 (exact)',
    modeN8Btn: 'N = 8 (2 itérations)',
    modeN4Desc: '2 qubits, 1 élément marqué — une seule requête est exacte.',
    modeN8Desc: '3 qubits, 1 élément marqué — nécessite 2 requêtes, et même ainsi plafonne sous les 100 %.',
    chartTitle: 'Amplitudes Tout au Long de la Recherche',
    searchBtn: 'Rechercher',
    resultRunning: 'en cours…',
    resultMatch: 'Trouvé dès la première requête',
    resultMismatch: 'Échec — vérifiez la console, cela ne devrait jamais arriver pour N=4',
    resultMatchN8: 'Trouvé après 2 requêtes',
    resultMismatchN8: 'Échec cette fois — véritablement possible environ 1 fois sur 20 pour N=8, ce n\'est pas un bug',
    stepStart: 'Toute recherche commence dans un état défini et sans intérêt — que des zéros, exactement comme un registre classique avant d\'avoir rien regardé.',
    stepSuperpose: 'Une porte Hadamard sur chaque qubit répartit l\'amplitude également entre les {n} éléments à la fois — chaque candidat est « actif » simultanément, et non vérifié un par un.',
    stepOracle: 'L\'oracle reconnaît l\'élément marqué et inverse le signe de son amplitude seule. Regardez bien : aucune barre n\'a bougé — une probabilité est le carré de la taille d\'une amplitude, et une amplitude négative donne exactement la même probabilité au carré qu\'une amplitude positive de même taille. Cette étape est totalement invisible pour toute mesure effectuée maintenant.',
    stepDiffuse: 'La diffusion reflète chaque amplitude autour de leur moyenne commune. Les autres amplitudes, déjà proches de cette moyenne, s\'effondrent vers zéro ; celle marquée, à l\'opposé après son changement de signe, est projetée au-delà de la moyenne du double de l\'écart — transformant ce basculement de phase invisible en une réponse visible.',
    stepDiffuseIteration: 'La diffusion reflète chaque amplitude autour de leur moyenne commune, toujours la même règle. Itération {iter} sur {total} terminée : la probabilité de l\'élément marqué est maintenant de {pct} %.',
    overshootNote: 'C\'est le maximum pour N=8 — une troisième itération dépasserait ce maximum, faisant retomber la probabilité à environ 33 %, pas en l\'augmentant.',
    stepMeasure: 'Une requête, une mesure, terminé : {found} — pour {n} éléments avec 1 marqué, une seule itération de Grover porte la probabilité de l\'élément marqué à 1, une mesure réelle sur une distribution sans aucune incertitude réelle restante.',
    stepMeasureApprox: '2 requêtes, une mesure, terminé : {found} — pour 8 éléments avec 1 marqué, 2 itérations de Grover portent la probabilité de l\'élément marqué à environ 94,5 %, pas exactement 1 cette fois ; mesurée ainsi, c\'est quand même un tirage réel selon la règle de Born, avec simplement une chance réelle de manquer.',
    explainerDefault: 'Choisissez un élément à gauche, puis appuyez sur Rechercher. Observez les barres d\'amplitude à chaque étape — l\'oracle change un signe que rien ici ne peut voir, et la diffusion est ce qui transforme ce changement invisible en une réponse visible.',
    tally: '{n} recherches · {found}/{n} trouvés dès la première requête',
    tallyN8: '{n} recherches · {found}/{n} trouvés après 2 requêtes',
    whyFasterTitle: 'Pourquoi Une Seule Requête Est Réellement Plus Rapide',
    whyFasterBody: 'Classiquement, trouver un élément marqué parmi 4 en les vérifiant un par un prend jusqu\'à 3 requêtes réelles dans le pire des cas — si les 3 premiers éléments vérifiés ne sont pas le bon, vous ne savez que le 4e est la réponse que par élimination, mais il vous a quand même fallu ces 3 requêtes réelles pour y arriver. L\'algorithme de Grover n\'a besoin que d\'exactement 1 appel à l\'oracle pour ce même cas N = 4. L\'écart se creuse, et ne se réduit pas, à mesure que la liste s\'agrandit : pour N éléments, la recherche classique nécessite de l\'ordre de N requêtes dans le pire des cas, alors que l\'algorithme de Grover n\'en nécessite que de l\'ordre de √N — la même accélération quadratique déjà décrite dans la propre section Algorithmes de cette application.',
    whyFasterBodyN8: 'Le mode N = 8 ci-dessus montre à quoi ressemble réellement ce schéma général : 2 requêtes au lieu de jusqu\'à 7, une véritable avance quadratique — mais l\'algorithme de Grover ne promet pas la certitude en général, seulement cette avance. Sa propre probabilité plafonne à environ 94,5 % et redescendrait si on continuait ; N = 4 est le cas particulier, plus petit, où 1 requête tombe exactement sur ce maximum plutôt que simplement près de lui.'
  },
  // Reflète exactement ROADMAP_LESSONS dans js/roadmap.js (mêmes ids, même
  // contenu titre/corps) — ce fichier conserve ses propres copies anglaises
  // comme repli pour t() (voir buildLessonInfoHTML()), donc les deux n'ont
  // besoin de correspondre qu'au moment de cette extraction initiale, sans
  // synchronisation manuelle continue.
  lessons: {
    qubit: {
      title: 'Bits',
      body: 'Un bit classique vaut toujours de manière définitive 0 ou 1. Un qubit peut être en superposition des deux à la fois, décrit par deux amplitudes plutôt qu\'une seule valeur. La sphère de Bloch attribue à chaque état de qubit possible un point sur sa surface.'
    },
    'maths-complex': {
      title: 'Nombres complexes',
      body: 'Les amplitudes d\'un qubit sont des nombres complexes, pas seulement réels — chacun a une partie réelle et une partie imaginaire, z = a + bi. Seul le module au carré |z|² est directement observable en tant que probabilité ; la phase est invisible à une seule mesure, mais c\'est exactement elle qui entraîne l\'interférence.'
    },
    'maths-vectors': {
      title: 'Vecteurs',
      body: 'L\'état d\'un qubit est un vecteur colonne [α, β] dans un espace vectoriel complexe à 2 dimensions, avec |0⟩ et |1⟩ comme base. La normalisation |α|² + |β|² = 1 maintient la probabilité totale à 100 %, et le produit scalaire mesure à quel point deux états se recouvrent.'
    },
    'maths-matrices': {
      title: 'Matrices',
      body: 'Chaque porte quantique est une matrice unitaire (U†U = I) agissant sur le vecteur d\'état par multiplication matricielle. L\'unitarité garantit qu\'une porte ne détruit ni ne crée de probabilité — c\'est exactement pourquoi chaque porte quantique est réversible.'
    },
    'maths-statevector': {
      title: 'Vecteur d\'état',
      body: 'Le vecteur d\'état |ψ⟩ = α|0⟩ + β|1⟩ est la description complète d\'un qubit. Sous forme de sphère de Bloch, |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩ — θ et φ sont exactement les deux curseurs de la sphère de Bloch dans l\'onglet Bits & Qubits.'
    },
    'maths-dirac': {
      title: 'Notation de Dirac',
      body: 'La notation bra-ket de Dirac est un raccourci pour les vecteurs et leurs produits scalaires : |ψ⟩ est un ket, ⟨ψ| son bra, et ⟨φ|ψ⟩ leur produit scalaire. |0⟩ et |1⟩ sont orthonormés — ⟨0|1⟩ = 0, ⟨0|0⟩ = ⟨1|1⟩ = 1.'
    },
    'maths-tensor': {
      title: 'Produits tensoriels',
      body: 'Deux vecteurs indépendants se combinent via le produit tensoriel (⊗) en un seul vecteur conjoint plus grand — on empile chaque entrée du premier contre chaque entrée du second, en multipliant chaque paire. Deux qubits se combinent ainsi en un état conjoint à 4 entrées ; tous les états conjoints ne peuvent pas être décomposés à nouveau, et ceux qui ne le peuvent pas sont précisément ceux qui sont intriqués.'
    },
    gates: {
      title: 'Portes quantiques',
      body: 'Les portes sont les opérations qui déplacent un qubit sur la sphère de Bloch — des rotations réversibles plutôt que la logique destructive des portes classiques. Chacune (H, X, Y, Z, S, T) a un effet géométrique précis que vous pouvez observer en action.'
    },
    circuit: {
      title: 'Circuits',
      body: 'Un circuit est une séquence de portes appliquées de gauche à droite. Dans un circuit classique, les portes logiques comme ET/OU/OU exclusif combinent des bits selon des règles strictes — la même entrée donne toujours la même sortie. Dans un circuit quantique, l\'ordre compte d\'une manière plus profonde : exécuter les mêmes portes dans un ordre différent peut placer le qubit dans un état complètement différent, tout comme des virages sur un trajet. Passez à 2 ou 3 qubits et ajoutez une porte CNOT pour construire des états intriqués — paires de Bell et états GHZ — porte par porte, les mêmes recettes qui se cachent derrière l\'onglet Intrication.'
    },
    measure: {
      title: 'Mesure',
      body: 'Mesurer un qubit le force à se fixer sur un résultat défini, 0 ou 1, avec des probabilités déterminées par ses amplitudes juste avant la mesure. C\'est l\'effondrement de la superposition — irréversible et probabiliste, et non une valeur préexistante cachée.'
    },
    entangle: {
      title: 'Intrication',
      body: 'Deux qubits peuvent être liés de telle sorte que mesurer l\'un détermine instantanément le résultat de l\'autre, quelle que soit la distance qui les sépare. Cette corrélation est plus forte que tout ce qui est possible entre des bits classiques.'
    },
    bellstates: {
      title: 'États de Bell',
      body: 'Les quatre états de Bell — Φ⁺, Φ⁻, Ψ⁺ et Ψ⁻ — sont les états à deux qubits maximalement intriqués, tous construits à partir de la même recette Hadamard-puis-CNOT en partant d\'un état de base différent parmi les quatre. Φ⁺/Φ⁻ donnent toujours des résultats identiques à la mesure, Ψ⁺/Ψ⁻ toujours des résultats opposés — la phase relative derrière chaque signe ± est invisible à une mesure directe, et n\'apparaît qu\'une fois les qubits mis en interférence l\'un avec l\'autre.'
    },
    tunnel: {
      title: 'Effet tunnel quantique',
      body: 'Un paquet d\'ondes quantique a une probabilité non nulle d\'apparaître de l\'autre côté d\'une barrière qu\'il ne devrait classiquement pas pouvoir franchir, car son nuage de probabilité s\'étend à travers la barrière au lieu de s\'arrêter net.'
    },
    interference: {
      title: 'Interférence',
      body: 'Lorsque deux chemins menant au même résultat sont indiscernables, leurs amplitudes de probabilité se combinent et peuvent se renforcer ou s\'annuler — produisant des bandes sur un écran au lieu de deux simples tas. Marquer le chemin emprunté détruit le motif.'
    },
    beamsplitter: {
      title: 'Séparateur de faisceau',
      body: 'Un séparateur de faisceau 50/50 envoie un photon unique sur l\'un de deux chemins avec une probabilité égale — réfléchi vers un détecteur ou transmis vers l\'autre. Le photon n\'est pas secrètement divisé entre les deux chemins ; un seul détecteur clique jamais par photon, et lequel est authentiquement aléatoire à chaque fois.'
    },
    sterngerlach: {
      title: 'Expérience de Stern–Gerlach',
      body: 'Un faisceau d\'atomes d\'argent traversant un champ magnétique inhomogène se sépare en exactement deux points discrets, jamais une traînée continue — une preuve directe que le spin est quantifié, avec seulement deux résultats possibles selon n\'importe quel axe de mesure, exactement comme les résultats de mesure |0⟩/|1⟩ d\'un qubit.'
    },
    teleport: {
      title: 'Téléportation Quantique',
      body: 'Alice peut envoyer à Bob l\'état exact d\'un qubit sans jamais envoyer le qubit lui-même — grâce à une paire intriquée partagée à l\'avance et deux bits classiques. Son propre qubit est détruit par la mesure que cela exige, si bien qu\'aucune copie n\'existe jamais aux deux extrémités à la fois, exactement comme l\'exige le théorème de non-clonage.'
    },
    superdense: {
      title: 'Codage Superdense',
      body: 'L\'image miroir de la téléportation : Alice envoie à Bob deux bits classiques en utilisant seulement un qubit, en codant son message sur sa moitié d\'une paire intriquée partagée à l\'avance et en envoyant physiquement à Bob cet unique qubit. Bob décode les deux bits exactement, à chaque fois — rien dans ce protocole n\'est probabiliste.'
    },
    noise: {
      title: 'Bruit et Décohérence',
      body: 'Les qubits réels ne sont pas parfaitement isolés : la relaxation T₁ leur permet de laisser fuir de l\'énergie vers |0⟩, et le déphasage T₂ efface la phase relative qui donne son sens à une superposition. Les deux rétrécissent le vecteur de Bloch vers le centre — la même signature d\'« état mixte » déjà vue en traçant un qubit intriqué, mais causée ici par un environnement incontrôlé plutôt que par une mesure délibérée.'
    },
    grover: {
      title: 'Recherche de Grover',
      body: 'L\'algorithme de Grover trouve un élément marqué parmi N par amplification d\'amplitude plutôt qu\'en les vérifiant un par un : un oracle inverse le signe de l\'amplitude de l\'élément marqué (invisible pour toute mesure, puisque la probabilité ne dépend que de la taille de l\'amplitude), puis une étape fixe de « diffusion » transforme ce changement invisible en une hausse visible. Pour N=4 avec un élément marqué, une seule requête porte sa probabilité de mesure exactement à 1 — une véritable accélération quadratique par rapport au meilleur qu\'une recherche classique puisse faire.'
    }
  },
  // Reflète exactement ROADMAP_QUIZ dans js/roadmap.js — mêmes lessonIds
  // que les clés de `lessons` ci-dessus, même contenu q/options/explanation.
  quiz: {
    qubit: {
      q: 'Un bit classique et un qubit commencent tous deux dans un état défini. Quelle est la principale différence entre eux ?',
      options: ['Les qubits peuvent contenir une superposition de 0 et de 1 à la fois', 'Les qubits ne sont que des bits plus rapides', 'Les qubits ne peuvent être mesurés qu\'une seule fois, jamais plus', 'Il n\'y a aucune vraie différence'],
      explanation: 'Les amplitudes d\'un qubit lui permettent d\'être véritablement un mélange des deux états de base jusqu\'à la mesure — un bit classique n\'a jamais cette possibilité.'
    },
    'maths-complex': {
      q: 'Pourquoi les amplitudes d\'un qubit doivent-elles être des nombres complexes plutôt que de simples nombres réels ?',
      options: ['Les nombres complexes sont plus précis que les nombres réels', 'La phase supplémentaire d\'un nombre complexe est ce qui rend possible l\'interférence entre les chemins', 'Les nombres réels ne peuvent pas être négatifs', 'C\'est simplement une convention mathématique sans signification physique'],
      explanation: 'Deux amplitudes réelles pourraient encore s\'annuler par leur signe, mais seule une phase complexe permet aux amplitudes de se renforcer ou de s\'annuler selon n\'importe quel angle relatif — cette liberté plus riche est exactement ce qu\'exploite l\'interférence.'
    },
    'maths-vectors': {
      q: 'Que garantit la condition de normalisation |α|² + |β|² = 1 pour un état de qubit ?',
      options: ['Que le qubit est intriqué', 'Que la probabilité totale de mesure sur |0⟩ et |1⟩ s\'élève exactement à 100 %', 'Que le qubit a été mesuré', 'Que α et β sont tous deux des nombres réels'],
      explanation: 'P(0) + P(1) = |α|² + |β|² doit être égal à 1 pour que la règle de Born ait un sens en tant que distribution de probabilité — chaque point valide de la sphère de Bloch satisfait déjà automatiquement cette condition.'
    },
    'maths-matrices': {
      q: 'Quelle propriété toute matrice de porte quantique valide U doit-elle satisfaire ?',
      options: ['det(U) = 0', 'U†U = I (U est unitaire)', 'U doit être une matrice à valeurs réelles', 'U doit avoir exactement deux lignes'],
      explanation: 'L\'unitarité est ce qui maintient le vecteur d\'état normalisé après l\'application de la porte — c\'est aussi exactement la condition qui rend chaque porte quantique réversible, contrairement à une porte ET classique.'
    },
    'maths-statevector': {
      q: 'Dans la forme de sphère de Bloch |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩, à quoi correspondent θ et φ ?',
      options: ['À deux qubits indépendants', 'Exactement aux mêmes curseurs θ/φ utilisés pour fixer un état sur la sphère de Bloch', 'Au nombre de portes appliquées jusqu\'à présent', 'Au résultat de la mesure'],
      explanation: 'Chaque point de la sphère de Bloch n\'est rien d\'autre que cette équation avec une paire (θ,φ) donnée — la sphère est une représentation visuelle de la formule, pas une chose distincte.'
    },
    'maths-dirac': {
      q: 'Que signifie ⟨0|1⟩ = 0 ?',
      options: ['|0⟩ et |1⟩ sont le même état', '|0⟩ et |1⟩ sont orthogonaux — des résultats complètement distincts', 'Le qubit est en superposition', 'Une erreur de mesure s\'est produite'],
      explanation: 'L\'orthogonalité explique exactement pourquoi une mesure renvoie toujours un 0 ou un 1 net, jamais quelque chose « entre les deux » — |0⟩ et |1⟩ n\'ont aucun recouvrement.'
    },
    'maths-tensor': {
      q: 'Deux qubits indépendants, chacun un vecteur à 2 entrées, se combinent via le produit tensoriel en un état conjoint. Combien d\'entrées cet état conjoint a-t-il ?',
      options: ['2', '4', '8', 'Cela dépend des amplitudes des qubits'],
      explanation: 'Le produit tensoriel d\'un vecteur à 2 entrées avec un autre vecteur à 2 entrées a toujours 2×2 = 4 entrées — une pour chaque combinaison de résultats de base, |00⟩, |01⟩, |10⟩, |11⟩ — quelles que soient les amplitudes réelles.'
    },
    gates: {
      q: 'Que fait la porte de Hadamard (H) à un qubit qui commence à |0⟩ ?',
      options: ['Elle le fait basculer directement vers |1⟩', 'Elle le place dans une superposition égale de |0⟩ et de |1⟩', 'Elle le mesure immédiatement', 'Elle l\'intrique avec un autre qubit'],
      explanation: 'H fait tourner |0⟩ jusqu\'à l\'équateur de la sphère de Bloch — des probabilités de 50/50, avec une relation de phase fixe entre les deux amplitudes.'
    },
    circuit: {
      q: 'Dans un circuit quantique, pourquoi l\'ordre des portes est-il important ?',
      options: ['Ce n\'est pas le cas — les portes commutent toujours', 'Chaque porte fait tourner l\'état, et les rotations ne commutent généralement pas', 'Seule la dernière porte a un quelconque effet', 'L\'ordre n\'a d\'importance que pour la mesure'],
      explanation: 'Chaque porte est une rotation de la sphère de Bloch, et les rotations en 3D ne commutent généralement pas — X puis Z n\'aboutit pas au même endroit que Z puis X.'
    },
    measure: {
      q: 'Que se passe-t-il pour la superposition d\'un qubit lorsque vous le mesurez ?',
      options: ['Rien ne change', 'Elle s\'effondre sur un seul résultat défini', 'Elle se divise en deux qubits', 'Elle devient automatiquement intriquée'],
      explanation: 'Il n\'existe aucun fait caché sur ce que le résultat était « réellement » auparavant — mesurer est ce qui produit une réponse définie, pondérée par les amplitudes.'
    },
    entangle: {
      q: 'Deux qubits sont intriqués. Vous mesurez le premier et obtenez |1⟩. Que se passe-t-il pour le second ?',
      options: ['Rien — ils sont indépendants', 'Son résultat est désormais instantanément corrélé au premier, selon leur état intriqué', 'Il est détruit', 'Il devient un bit classique'],
      explanation: 'Leurs amplitudes étaient liées dès l\'instant où ils sont devenus intriqués — mesurer l\'un n\'envoie aucun signal, cela révèle simplement une corrélation présente depuis le début.'
    },
    bellstates: {
      q: 'Φ⁺ = (|00⟩ + |11⟩)/√2 et Φ⁻ = (|00⟩ − |11⟩)/√2 sont des états différents, pourtant mesurer l\'un ou l\'autre dans cette démonstration donne des statistiques identiques. Pourquoi ?',
      options: ['Ce sont en réalité le même état écrit de deux façons', 'Une phase relative (le signe −) ne change aucune probabilité dans la base de calcul ; seul |amplitude|² compte', 'La démonstration a un bug et ne peut pas les distinguer', 'Seul Φ⁺ est un véritable état de Bell'],
      explanation: 'Les probabilités proviennent de |amplitude|², qui est identique pour +1/√2 et −1/√2. Les deux états restent physiquement distincts — la phase devient visible dès que l\'on fait interférer les qubits entre eux, par exemple en appliquant une porte Hadamard à chacun avant de mesurer.'
    },
    tunnel: {
      q: 'Qu\'est-ce que l\'effet tunnel quantique ?',
      options: ['Un qubit qui se téléporte instantanément à travers l\'espace', 'Un paquet d\'ondes ayant une probabilité non nulle d\'apparaître au-delà d\'une barrière classiquement infranchissable', 'Une porte qui supprime un qubit', 'Une erreur de mesure'],
      explanation: 'La fonction d\'onde ne s\'arrête pas net contre une barrière — elle décroît de façon exponentielle à l\'intérieur, si bien qu\'une barrière suffisamment fine laisse encore une amplitude non nulle de l\'autre côté.'
    },
    interference: {
      q: 'Dans l\'expérience de la double fente, qu\'est-ce qui provoque les franges d\'interférence sur l\'écran ?',
      options: ['Deux particules distinctes qui entrent en collision', 'Les amplitudes de probabilité de chemins indiscernables qui s\'additionnent ou s\'annulent', 'Le matériau de l\'écran', 'Un effondrement de mesure survenant trop tôt'],
      explanation: 'Chaque point de l\'écran correspond à deux chemins possibles ; lorsqu\'ils sont indiscernables, leurs amplitudes s\'additionnent et peuvent se renforcer ou s\'annuler, produisant les franges.'
    },
    beamsplitter: {
      q: 'Un photon unique frappe un séparateur de faisceau 50/50. Que se passe-t-il réellement ?',
      options: ['Le photon se divise en deux, la moitié allant vers chaque détecteur', 'Le photon va vers exactement un détecteur, choisi au hasard avec des probabilités de 50/50', 'Les deux détecteurs cliquent toujours ensemble', 'Aucun détecteur ne clique à moins de mesurer deux fois'],
      explanation: 'Un photon n\'est jamais divisé entre les chemins — le séparateur de faisceau le place dans une superposition de « réfléchi » et « transmis », et la mesure (le clic du détecteur) force un résultat défini, tout comme la mesure d\'un qubit.'
    },
    sterngerlach: {
      q: 'Un faisceau d\'atomes d\'argent traverse un aimant de Stern–Gerlach. Que montre réellement l\'expérience sur l\'écran du détecteur ?',
      options: ['Une traînée continue d\'un extrême à l\'autre', 'Exactement deux points discrets, jamais rien entre les deux', 'Un seul point au centre exact', 'Aucun motif du tout — les atomes sont absorbés'],
      explanation: 'Classiquement, un dipôle magnétique orienté aléatoirement devrait dévier d\'une quantité quelconque, produisant une traînée continue. Stern et Gerlach n\'ont trouvé que deux points discrets — une preuve directe que le spin, comme les résultats de mesure d\'un qubit lui-même, est quantifié en seulement deux possibilités selon n\'importe quel axe.'
    },
    teleport: {
      q: 'Après que Bob applique ses portes de correction, comment son qubit se compare-t-il au message original d\'Alice ?',
      options: ['C\'est une bonne approximation, proche mais pas exacte', 'Il correspond exactement — mêmes amplitudes, même état', 'C\'est une copie classique, pas un véritable état quantique', 'Il ne correspond que la moitié du temps'],
      explanation: 'Une fois la bonne correction Z/X appliquée, le qubit de Bob est exactement égal à l\'original d\'Alice, pas une approximation — c\'est précisément le but de l\'étape de correction contrôlée classiquement.'
    },
    superdense: {
      q: 'Dans le codage superdense, qu\'est-ce qui doit réellement voyager physiquement d\'Alice à Bob ?',
      options: ['Deux bits classiques, envoyés par radio ou téléphone', 'Un unique qubit', 'Rien — la paire intriquée seule suffit', 'Quatre qubits, un par message possible'],
      explanation: 'Seul l\'unique qubit d\'Alice voyage. La paire intriquée a été partagée à l\'avance, et son message est codé sur cet unique qubit avant qu\'elle ne l\'envoie — c\'est ce qui rend ce protocole « superdense » : 2 bits d\'information à partir d\'un seul qubit de communication.'
    },
    noise: {
      q: 'Un qubit démarre dans une superposition authentique. Une fois complètement décohéré (T₂ écoulé plusieurs fois), qu\'arrive-t-il à son vecteur de Bloch ?',
      options: ['Rien — la décohérence n\'affecte que la mesure, pas l\'état', 'Il rétrécit vers le centre, la même signature qu\'un état mixte/intriqué', 'Il devient plus long que 1', 'Il saute instantanément au pôle sud'],
      explanation: 'Perdre la cohérence face à l\'environnement est mathématiquement identique à s\'intriquer avec quelque chose que l\'on ne peut pas suivre — les deux laissent le vecteur de Bloch propre du qubit plus court que 1, un état véritablement mixte, pas seulement un état pur randomisé.'
    },
    grover: {
      q: 'Juste après que l\'oracle de Grover inverse le signe de l\'amplitude de l\'élément marqué, que devient la probabilité mesurée de le trouver ?',
      options: ['Elle saute directement à 1', 'Elle reste exactement la même qu\'avant l\'action de l\'oracle', 'Elle tombe à 0', 'Elle devient aléatoire'],
      explanation: 'La probabilité provient de |amplitude|², et un simple changement de signe ne change rien à cela : (−0,5)² = (0,5)². Le basculement de phase de l\'oracle est totalement invisible pour une mesure jusqu\'à ce que l\'étape de diffusion le transforme en une réelle hausse de probabilité.'
    }
  }
});
