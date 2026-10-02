import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import { BuoyModel } from './BuoyModel';
import { PhysicsOcean } from './PhysicsOcean';

/**
 * BuoyScene.jsx
 * Main 3D WebGL Canvas wrapping:
 * - OrbitControls with damping
 * - Studio / Polar lighting (Sun directional, rim light, ambient)
 * - Physics ocean fluid simulation
 * - 3-tier cutaway buoy model
 */
export function BuoyScene({
  exploded = 0,
  viewMode = 'normal',
  selectedComponent,
  onSelectComponent
}) {
  const isBlizzard = viewMode === 'blizzard';

  return (
    <div className="relative h-screen w-screen bg-[#020510]">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[12, 8, 16]} fov={45} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 + 0.3}
          minDistance={4}
          maxDistance={45}
        />

        {/* Cinematic Polar Studio Lighting */}
        <ambientLight intensity={0.65} color="#8ec8f0" />
        <directionalLight
          position={[30, 40, 20]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          color="#ffffff"
        />
        <directionalLight position={[-20, 30, -20]} intensity={0.8} color="#7c4dff" />
        <pointLight position={[0, 2, 0]} intensity={3.0} distance={15} color="#00e5ff" />
        <pointLight position={[0, -10, 0]} intensity={1.5} distance={25} color="#00ffa0" />

        {/* Polar Sky & Starfield */}
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

        <Suspense fallback={null}>
          {/* Dynamic Ocean Surface & Icebergs */}
          <PhysicsOcean waveStrength={viewMode === 'normal' ? 1.0 : 1.5} isBlizzard={isBlizzard} />

          {/* 3-Tier Cutaway Buoy Model */}
          <BuoyModel
            exploded={exploded}
            selectedId={selectedComponent}
            onSelectComponent={onSelectComponent}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
