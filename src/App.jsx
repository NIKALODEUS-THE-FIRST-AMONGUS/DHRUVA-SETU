import React, { useState } from 'react';
import { BuoyScene } from './components/BuoyScene';
import { HUDOverlay } from './components/HUDOverlay';
import ArchitectureModal from './components/ArchitectureModal';

export default function App() {
  const [exploded, setExploded] = useState(0);
  const [viewMode, setViewMode] = useState('normal');
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas Layer */}
      <BuoyScene
        exploded={exploded}
        viewMode={viewMode}
        selectedComponent={selectedComponent}
        onSelectComponent={setSelectedComponent}
      />

      {/* Industrial Dark Glass HUD Layer */}
      <HUDOverlay
        exploded={exploded}
        setExploded={setExploded}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedComponent={selectedComponent}
        onCloseInspect={() => setSelectedComponent(null)}
        onOpenBlueprint={() => setIsBlueprintOpen(true)}
      />

      {/* Engineering Architecture & CAD Modal */}
      <ArchitectureModal
        isOpen={isBlueprintOpen}
        onClose={() => setIsBlueprintOpen(false)}
      />
    </main>
  );
}
