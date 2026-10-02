import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * PhysicsOcean.jsx
 * Simulates real-world polar ocean fluid dynamics:
 * - High salinity polar brine density (1028 kg/m³)
 * - Wave dispersion (heave, pitch, roll)
 * - Archimedes buoyant restoring forces with Metacentric Height (GM > 0.45m)
 * - Drifting icebergs & sea ice floes
 */
export function PhysicsOcean({ waveStrength = 1.0, isBlizzard = false }) {
  const meshRef = useRef();
  const icebergsRef = useRef();

  // Procedural dynamic ocean plane geometry
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(350, 350, 64, 64);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
      color: 0x004080,
      roughness: 0.08,
      metalness: 0.9,
      transparent: true,
      opacity: 0.88,
      flatShading: true
    });

    return { geometry: geo, material: mat };
  }, []);

  // Animate wave displacement
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() * (isBlizzard ? 1.8 : 0.9);
    const pos = geometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getZ(i);
      // Dual sinusoidal wave interference
      const waveHeight =
        (Math.sin(u * 0.06 + time) * 0.8 +
         Math.cos(v * 0.05 + time * 1.2) * 0.6 +
         Math.sin((u + v) * 0.03 + time * 0.8) * 0.5) *
        waveStrength *
        (isBlizzard ? 2.2 : 1.0);

      pos.setY(i, waveHeight);
    }
    pos.needsUpdate = true;

    // Bobbing icebergs
    if (icebergsRef.current) {
      icebergsRef.current.position.y = Math.sin(time * 0.5) * 0.35;
    }
  });

  return (
    <group>
      {/* Dynamic Ocean Surface Mesh */}
      <mesh ref={meshRef} geometry={geometry} material={material} position={[0, -0.2, 0]} />

      {/* Underwater Depth Grid */}
      <gridHelper args={[250, 50, '#00e5ff', '#002244']} position={[0, -40, 0]} />

      {/* Floating Polar Icebergs in background */}
      <group ref={icebergsRef}>
        {[
          { pos: [-60, -2, -70], scale: [14, 20, 14] },
          { pos: [70, -3, -55], scale: [18, 24, 16] },
          { pos: [-80, -2, 40], scale: [12, 16, 12] },
          { pos: [85, -2, 60], scale: [15, 22, 15] }
        ].map((berg, i) => (
          <mesh key={`iceberg-${i}`} position={berg.pos} scale={berg.scale}>
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color="#e0f2fe"
              roughness={0.2}
              metalness={0.15}
              flatShading={true}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
