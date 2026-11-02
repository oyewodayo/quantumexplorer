import { useEffect } from 'react';
import AppHeader from './components/generated/AppHeader.jsx';
import AppSidebarMarkup from './components/generated/AppSidebarMarkup.jsx';
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
import AppFooterMarkup from './components/generated/AppFooterMarkup.jsx';
import { startEngine } from './engine/engine.js';

export default function App() {
  useEffect(() => { startEngine(); }, []);
  return (
    <>
      <AppHeader />
      <AppSidebarMarkup />
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
      <AppFooterMarkup />
    </>
  );
}
