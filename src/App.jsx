import { useEffect } from 'react';
import AppHeader from './components/AppHeader.jsx';
import Sidebar from './components/Sidebar.jsx';
import IntroductionTab from './components/generated/IntroductionTab.jsx';
import ImportantConceptsTab from './components/generated/ImportantConceptsTab.jsx';
import QubitTab from './components/generated/QubitTab.jsx';
import MathsconceptTab from './components/generated/MathsconceptTab.jsx';
import GatesTab from './components/generated/GatesTab.jsx';
import CircuitTab from './components/generated/CircuitTab.jsx';
import BellstatesTab from './components/generated/BellstatesTab.jsx';
import MeasureTab from './components/generated/MeasureTab.jsx';
import EntangleTab from './components/generated/EntangleTab.jsx';
import TunnelTab from './components/generated/TunnelTab.jsx';
import InterferenceTab from './components/generated/InterferenceTab.jsx';
import BeamsplitterTab from './components/generated/BeamsplitterTab.jsx';
import SterngerlachTab from './components/generated/SterngerlachTab.jsx';
import TeleportTab from './components/generated/TeleportTab.jsx';
import SuperdenseTab from './components/generated/SuperdenseTab.jsx';
import NoiseTab from './components/generated/NoiseTab.jsx';
import GroverTab from './components/generated/GroverTab.jsx';
import RoadmapViewMarkup from './components/generated/RoadmapViewMarkup.jsx';
import AppFooter from './components/AppFooter.jsx';
import { startEngine } from './engine/engine.js';
import { initI18n } from './i18n/index.js';

export default function App() {
  useEffect(() => {
    // Load the saved language first so the engine's first render is translated.
    initI18n().then(startEngine);
  }, []);
  return (
    <>
      <AppHeader />
      <Sidebar />
      <IntroductionTab />
      <ImportantConceptsTab />
      <QubitTab />
      <MathsconceptTab />
      <GatesTab />
      <CircuitTab />
      <BellstatesTab />
      <MeasureTab />
      <EntangleTab />
      <TunnelTab />
      <InterferenceTab />
      <BeamsplitterTab />
      <SterngerlachTab />
      <TeleportTab />
      <SuperdenseTab />
      <NoiseTab />
      <GroverTab />
      <RoadmapViewMarkup />
      <AppFooter />
    </>
  );
}
