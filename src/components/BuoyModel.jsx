import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * BuoyModel.jsx — Recreates the exact 3-tier cutaway buoy from the reference design.
 * Features:
 * - Conical POM Delrin/HDPE yellow hull with cutaway window & "WATERLINE" stencil
 * - Dark blue photovoltaic solar panels on slanted upper ring
 * - Anti-bird spikes around top rim
 * - Top glass dome housing antenna and white tiered solar radiation shield
 * - Tier 1: Glossy green PCB with ESP32-S3 (silver shield), screw terminals & wiring harness
 * - Tier 2: Dual LiFePO4 battery packs in translucent amber/gold Kapton thermal foil
 * - Tier 3: Cast aluminum worm gearbox, winch cable drum & stepper motor
 * - Keel watertight cable gland & sub-sea CTD probe array
 */
export function BuoyModel({ exploded = 0, onSelectComponent, selectedId }) {
  const buoyRef = useRef();
  const ctdRef = useRef();

  // Materials
  const materials = useMemo(() => {
    // High-gloss POM Delrin Yellow Hull
    const yellowHull = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.18,
      metalness: 0.08,
      side: THREE.DoubleSide
    });

    // Dark Blue Photovoltaic Solar Cells
    const solarCell = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.12,
      metalness: 0.85,
      emissive: 0x0f172a,
      emissiveIntensity: 0.2
    });

    // White Stevenson Solar Radiation Shield / Delrin
    const whiteDelrin = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.05
    });

    // Cast Aluminum Gearbox / Structural Frame
    const castAluminum = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.35,
      metalness: 0.9
    });

    // Polished Stainless Steel (Spikes, shafts, brackets)
    const stainlessSteel = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.1,
      metalness: 0.98
    });

    // Glossy Green FR4 PCB
    const greenPCB = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.25,
      metalness: 0.35
    });

    // Amber / Gold Kapton Thermal Polyimide Tape
    const kaptonTape = new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.65,
      opacity: 0.85,
      transparent: true,
      thickness: 0.5
    });

    // Transparent Glass Dome Polycarbonate
    const glassDome = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      roughness: 0.05,
      transmission: 0.92,
      thickness: 1.2,
      ior: 1.52,
      transparent: true,
      opacity: 0.75
    });

    // Black Delrin / Stepper Motor / Cable Gland
    const blackDelrin = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.6
    });

    // Green Screw Terminals
    const terminalGreen = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.3,
      metalness: 0.2
    });

    // Copper Busbars & Wiring
    const copper = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.2,
      metalness: 0.95
    });

    return {
      yellowHull,
      solarCell,
      whiteDelrin,
      castAluminum,
      stainlessSteel,
      greenPCB,
      kaptonTape,
      glassDome,
      blackDelrin,
      terminalGreen,
      copper
    };
  }, []);

  return (
    <group ref={buoyRef} dispose={null}>
      {/* =========================================================
          1. EXTERIOR HULL (CONICAL POM DELRIN WITH CUTAWAY & SOLAR)
          ========================================================= */}
      <group position={[0, exploded * 0.4, 0]}>
        {/* Main Conical Body with 180° Cutaway Window */}
        <mesh
          material={materials.yellowHull}
          position={[0, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectComponent?.('hull');
          }}
        >
          {/* Double-tapered cone shell */}
          <cylinderGeometry args={[2.8, 3.8, 1.8, 32, 1, true, Math.PI * 0.05, Math.PI * 0.9]} />
        </mesh>
        <mesh material={materials.yellowHull} position={[0, -1.2, 0]}>
          <cylinderGeometry args={[3.8, 2.2, 1.2, 32, 1, true, Math.PI * 0.05, Math.PI * 0.9]} />
        </mesh>

        {/* Slanted Upper Photovoltaic Solar Panels */}
        {[-1.2, -0.6, 0.6, 1.2].map((xOffset, idx) => (
          <mesh
            key={`solar-${idx}`}
            material={materials.solarCell}
            position={[xOffset * 1.8, 0.45, xOffset * 0.4 + 1.6]}
            rotation={[-0.55, 0, xOffset * 0.15]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectComponent?.('solar');
            }}
          >
            <boxGeometry args={[1.0, 0.8, 0.04]} />
          </mesh>
        ))}

        {/* Anti-Bird Spikes Ring around Top Rim */}
        <group position={[0, 1.1, 0]}>
          {Array.from({ length: 28 }).map((_, i) => {
            const angle = (i / 28) * Math.PI * 2;
            return (
              <mesh
                key={`spike-${i}`}
                material={materials.stainlessSteel}
                position={[Math.cos(angle) * 2.7, 0.35, Math.sin(angle) * 2.7]}
              >
                <cylinderGeometry args={[0.015, 0.02, 0.7, 8]} />
              </mesh>
            );
          })}
        </group>
      </group>

      {/* =========================================================
          2. TOP DECK: GLASS DOME & VENTILATED RADIATION SHIELD
          ========================================================= */}
      <group position={[0, 1.0 + exploded * 1.5, 0]}>
        {/* Transparent Polycarbonate Dome */}
        <mesh
          material={materials.glassDome}
          position={[0, 0.6, 0.2]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectComponent?.('dome');
          }}
        >
          <cylinderGeometry args={[0.65, 0.65, 0.9, 24]} />
        </mesh>
        {/* Bronze Disk Antenna inside Dome */}
        <mesh material={materials.copper} position={[0, 0.75, 0.2]}>
          <cylinderGeometry args={[0.45, 0.45, 0.18, 24]} />
        </mesh>

        {/* Multi-Tier White Solar Radiation Shield (Stevenson Cupola) */}
        <group position={[0.9, 0.55, 0.2]}>
          {[0, 0.15, 0.3, 0.45, 0.6].map((y, idx) => (
            <mesh key={`shield-tier-${idx}`} material={materials.whiteDelrin} position={[0, y, 0]}>
              <cylinderGeometry args={[0.22 - idx * 0.02, 0.35 - idx * 0.03, 0.08, 16]} />
            </mesh>
          ))}
          <mesh material={materials.whiteDelrin} position={[0, 0.72, 0]}>
            <sphereGeometry args={[0.16, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          </mesh>
        </group>
      </group>

      {/* =========================================================
          3. INTERNAL 3-TIER BULKHEAD FRAME
          ========================================================= */}
      {/* Aluminum Structural Dividing Shelves */}
      <group position={[0, 0, 0]}>
        {/* Tier 1 / Top Bulkhead Shelf */}
        <mesh material={materials.whiteDelrin} position={[0, 0.7, 0]}>
          <cylinderGeometry args={[2.5, 2.5, 0.06, 24]} />
        </mesh>
        {/* Tier 2 / Middle Bulkhead Shelf */}
        <mesh material={materials.whiteDelrin} position={[0, -0.15, 0]}>
          <cylinderGeometry args={[2.8, 2.8, 0.06, 24]} />
        </mesh>
        {/* Tier 3 / Bottom Keel Plate */}
        <mesh material={materials.whiteDelrin} position={[0, -1.0, 0]}>
          <cylinderGeometry args={[2.2, 2.2, 0.08, 24]} />
        </mesh>
        {/* Vertical Cavity Partitions */}
        <mesh material={materials.castAluminum} position={[-0.8, -0.58, 0]}>
          <boxGeometry args={[0.06, 0.8, 1.8]} />
        </mesh>
        <mesh material={materials.castAluminum} position={[0.8, -0.58, 0]}>
          <boxGeometry args={[0.06, 0.8, 1.8]} />
        </mesh>
      </group>

      {/* =========================================================
          4. TIER 1: COMPUTE DECK (ESP32-S3, TERMINALS, WIRING HARNESS)
          ========================================================= */}
      <group
        position={[0, 0.75 + exploded * 0.9, 0.2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectComponent?.('esp32');
        }}
      >
        {/* FR4 Green PCB Mainboard */}
        <mesh material={materials.greenPCB} position={[0, 0.1, 0]}>
          <boxGeometry args={[3.2, 0.06, 1.4]} />
        </mesh>

        {/* ESP32-S3 WROOM MCU with Silver RF Shield */}
        <mesh material={materials.stainlessSteel} position={[0, 0.18, -0.1]}>
          <boxGeometry args={[0.7, 0.08, 0.9]} />
        </mesh>

        {/* Green Screw Terminal Blocks along PCB front edge */}
        <mesh material={materials.terminalGreen} position={[0, 0.18, 0.45]}>
          <boxGeometry args={[2.4, 0.14, 0.22]} />
        </mesh>

        {/* Wiring Harness with Black Ribbed Loom & Discrete Insulated Wires */}
        <group position={[-1.0, 0.18, 0.1]}>
          <mesh material={materials.blackDelrin} rotation={[0, 0, Math.PI * 0.2]}>
            <torusGeometry args={[0.4, 0.06, 12, 24, Math.PI * 1.2]} />
          </mesh>
          {/* Power Lead Wires */}
          <mesh material={materials.copper} position={[0.2, 0, 0.1]}>
            <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
          </mesh>
        </group>

        {/* Status LEDs with Point Lights */}
        <mesh position={[0.6, 0.16, -0.1]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#00e5ff" />
        </mesh>
        <pointLight position={[0.6, 0.3, -0.1]} color="#00e5ff" intensity={1.5} distance={1.2} />
      </group>

      {/* =========================================================
          5. TIER 2: POWER CORE (DUAL LiFePO4 KAPTON BATTERY PACKS)
          ========================================================= */}
      <group
        position={[0, -0.55 + exploded * 0.4, 0.1]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectComponent?.('battery');
        }}
      >
        {/* Left Battery Bay LiFePO4 Pack in Amber Kapton Foil */}
        <group position={[-1.45, 0, 0]}>
          <mesh material={materials.kaptonTape}>
            <boxGeometry args={[0.95, 0.55, 1.1]} />
          </mesh>
          {/* Copper Busbars */}
          <mesh material={materials.copper} position={[0, 0.3, 0]}>
            <boxGeometry args={[0.75, 0.03, 0.8]} />
          </mesh>
        </group>

        {/* Right Battery Bay LiFePO4 Pack in Amber Kapton Foil */}
        <group position={[1.45, 0, 0]}>
          <mesh material={materials.kaptonTape}>
            <boxGeometry args={[0.95, 0.55, 1.1]} />
          </mesh>
          {/* Copper Busbars */}
          <mesh material={materials.copper} position={[0, 0.3, 0]}>
            <boxGeometry args={[0.75, 0.03, 0.8]} />
          </mesh>
        </group>
      </group>

      {/* =========================================================
          6. TIER 3: ACTUATION DECK (WORM GEARBOX, WINCH DRUM, STEPPER)
          ========================================================= */}
      <group
        position={[0, -1.35 - exploded * 0.5, 0.1]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectComponent?.('winch');
        }}
      >
        {/* Cast Aluminum Worm Gearbox (Left) */}
        <group position={[-1.3, 0, 0]}>
          <mesh material={materials.castAluminum}>
            <boxGeometry args={[0.75, 0.65, 0.7]} />
          </mesh>
          {/* Output Shaft Bearing Flange */}
          <mesh material={materials.stainlessSteel} position={[0.4, 0, 0]} rotation={[0, 0, Math.PI * 0.5]}>
            <cylinderGeometry args={[0.18, 0.18, 0.12, 16]} />
          </mesh>
        </group>

        {/* Winch Cable Drum / Spool with Black Kevlar Cable (Center) */}
        <group position={[0, 0, 0]}>
          {/* Spool Flanges */}
          <mesh material={materials.whiteDelrin} position={[-0.45, 0, 0]} rotation={[0, 0, Math.PI * 0.5]}>
            <cylinderGeometry args={[0.42, 0.42, 0.06, 24]} />
          </mesh>
          <mesh material={materials.whiteDelrin} position={[0.45, 0, 0]} rotation={[0, 0, Math.PI * 0.5]}>
            <cylinderGeometry args={[0.42, 0.42, 0.06, 24]} />
          </mesh>
          {/* Wrapped Kevlar Cable Core */}
          <mesh material={materials.blackDelrin} rotation={[0, 0, Math.PI * 0.5]}>
            <cylinderGeometry args={[0.38, 0.38, 0.84, 24]} />
          </mesh>
        </group>

        {/* Stepper Motor (Right) */}
        <group position={[1.3, 0, 0]}>
          <mesh material={materials.blackDelrin} rotation={[0, 0, Math.PI * 0.5]}>
            <cylinderGeometry args={[0.3, 0.3, 0.65, 24]} />
          </mesh>
          <mesh material={materials.stainlessSteel} position={[0.35, 0, 0]} rotation={[0, 0, Math.PI * 0.5]}>
            <cylinderGeometry args={[0.22, 0.22, 0.08, 16]} />
          </mesh>
        </group>
      </group>

      {/* =========================================================
          7. KEEL & SUB-SEA PAYLOAD (CABLE GLAND & CTD PROBE)
          ========================================================= */}
      <group position={[0, -1.8, 0]}>
        {/* Watertight Compression Cable Gland at Keel */}
        <mesh material={materials.blackDelrin} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.34, 0.4, 16]} />
        </mesh>

        {/* Lowered Tether Cable */}
        <mesh material={materials.blackDelrin} position={[0, -1.2, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 2.0, 8]} />
        </mesh>

        {/* Tethered Sub-Sea CTD Profiler Probe */}
        <group
          ref={ctdRef}
          position={[0, -2.5, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectComponent?.('ctd');
          }}
        >
          {/* White Delrin Sensor Body */}
          <mesh material={materials.whiteDelrin} position={[0, 0, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.9, 24]} />
          </mesh>
          {/* Black Rubber O-Ring Bumpers */}
          <mesh material={materials.blackDelrin} position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.33, 0.33, 0.06, 24]} />
          </mesh>
          <mesh material={materials.blackDelrin} position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.33, 0.33, 0.06, 24]} />
          </mesh>
          {/* Metallic Sensor Head (Conductivity Toroid & Temp Needle) */}
          <mesh material={materials.stainlessSteel} position={[0, -0.5, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.15, 24]} />
          </mesh>
          <mesh material={materials.stainlessSteel} position={[0.08, -0.62, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.18, 8]} />
          </mesh>
          <mesh material={materials.copper} position={[-0.08, -0.62, 0]}>
            <torusGeometry args={[0.06, 0.02, 8, 16]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
