import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { createOceanSurface } from './OceanVFX';
import { createAtmosphere } from './AtmosphereVFX';
import { createPolarGlaciers } from './GlacierIceVFX';
import { createUnderwaterVFX } from './UnderwaterVFX';
import { createAutonomousBuoy } from './AutonomousBuoyVFX';
import { createCTDSonde } from './CTDSondeVFX';
import { createBiologgerSeal } from './BiologgerSealVFX';
import { createSplashSystem } from './SplashVFX';
import { createSeaIceFloes } from './SeaIceFloesVFX';
import { createBharatiStation } from './BharatiStationVFX';
import { setupPostProcessing } from './PostProcessingVFX';
import { generatePolarEnvironmentMap } from './ProceduralTextures';
import { CONFIG } from '../../constants/config';

export default function VFXScene({
  currentDepth,
  cameraPreset,
  explodedView,
  vfxSettings,
  activeRegion,
  seaControls,
  onSelectComponent,
  onSealBreachUpdate,
  isFollowingCTD,
  onDisengageCTD,
  season = 'summer'
}) {
  const containerRef = useRef(null);
  const sceneElementsRef = useRef(null);
  const sealBreachRef = useRef({ isBreaching: false });
  const isTransitioningRef = useRef(false);
  const [hoveredSubsystem, setHoveredSubsystem] = useState(null);

  // Initialize 3D Engine & Scene on Mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Polar Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040914);
    scene.fog = new THREE.FogExp2(0x071526, 0.008);

    // 2. Camera — starts from Front Overview (cinematic eye-level polar vista)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 800);
    camera.position.set(0, 6.5, 22.0);

    // 3. Renderer with High-Precision Shadows & PBR Pipeline
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 220;
    controls.minDistance = 2.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.35; // Allow looking slightly upward from underwater
    controls.target.set(0, 0.6, 0);

    // 5. Cinematic Lighting
    // Directional Arctic Sun (low angle on horizon)
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    sunLight.position.set(45, 28, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 140;
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Polar Sky Ambient Fill (cold cyan)
    const skyLight = new THREE.HemisphereLight(0x38bdf8, 0x021329, 0.75);
    scene.add(skyLight);

    // Subsea upward bounce light (deep abyss glow)
    const abyssLight = new THREE.DirectionalLight(0x0284c7, 0.4);
    abyssLight.position.set(0, -50, 0);
    scene.add(abyssLight);

    // 5B. Dynamic Polar Sky & Oceanic Beer-Lambert Depth Extinction Fog
    const sceneFog = new THREE.FogExp2(0x071526, 0.0075);
    scene.fog = sceneFog;
    scene.background = new THREE.Color(0x071526);

    // 5C. Studio-Grade Polar IBL Environment Map (PMREM Filtered Specular Radiance)
    const polarEnvMap = generatePolarEnvironmentMap(renderer);
    scene.environment = polarEnvMap;

    // 6. Instantiate VFX Modules
    const initialPhysics = (activeRegion && activeRegion.seaPhysics) ? activeRegion.seaPhysics : {};
    const ocean = createOceanSurface(initialPhysics);
    scene.add(ocean.mesh);

    const seaIceFloes = createSeaIceFloes(ocean);
    scene.add(seaIceFloes.group);
    if (initialPhysics.iceFloeDensity !== undefined) {
      seaIceFloes.setDensity(initialPhysics.iceFloeDensity);
    }

    const atmosphere = createAtmosphere();
    scene.add(atmosphere.group);

    const glaciers = createPolarGlaciers();
    scene.add(glaciers);
    if (initialPhysics.icebergDist) {
      glaciers.setDistanceScale(initialPhysics.icebergDist / 115);
    }

    const underwater = createUnderwaterVFX();
    scene.add(underwater.group);

    const buoy = createAutonomousBuoy();
    scene.add(buoy.buoyRoot);
    if (buoy.mooringGroup) {
      scene.add(buoy.mooringGroup);
    }

    const ctd = createCTDSonde();
    scene.add(ctd.sondeGroup);
    scene.add(ctd.cableMesh);
    scene.add(ctd.trailGroup);
    if (ctd.abyssGroup) {
      scene.add(ctd.abyssGroup);
    }

    const splash = createSplashSystem();
    scene.add(splash.group);

    const seal = createBiologgerSeal(splash);
    if (seal.podGroup) {
      scene.add(seal.podGroup);
    } else {
      scene.add(seal.sealRoot);
      scene.add(seal.signalBeam);
      scene.add(seal.hopSphere);
    }

    // Indian Research Base (Bharati Station) & Polar Expedition Fleet
    const bharatiStation = createBharatiStation(ocean);
    scene.add(bharatiStation.group);
    bharatiStation.setTargetRegion(activeRegion ? activeRegion.id : 'prydz_bay_miz');

    // ── EASTER EGG 1: ISRO Oceansat-3 Polar Relay Satellite in Orbit ──
    const isroSatellite = new THREE.Group();
    const satBus = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.9, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.92, roughness: 0.15 })
    );
    isroSatellite.add(satBus);

    // Blue monocrystalline solar wings
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.85, roughness: 0.25 });
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.04, 1.1), wingMat);
    wingL.position.set(-2.2, 0, 0);
    isroSatellite.add(wingL);
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.04, 1.1), wingMat);
    wingR.position.set(2.2, 0, 0);
    isroSatellite.add(wingR);

    // High-frequency telemetry antenna dish
    const satDish = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.1, 0.25, 12, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, side: THREE.DoubleSide })
    );
    satDish.position.set(0, -0.5, 0);
    isroSatellite.add(satDish);

    // Illuminated Green Telemetry Laser Beam Downlink to Buoy Antenna
    const laserBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 4.2, 75, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide
      })
    );
    laserBeam.position.set(0, -37.5, 0);
    isroSatellite.add(laserBeam);

    scene.add(isroSatellite);

    // 7. Post-Processing Pipeline
    const postProcessing = setupPostProcessing(renderer, scene, camera, width, height);

    sceneElementsRef.current = {
      scene,
      camera,
      renderer,
      controls,
      postProcessing,
      sunLight,
      skyLight,
      abyssLight,
      ocean,
      seaIceFloes,
      bharatiStation,
      glaciers,
      atmosphere,
      underwater,
      buoy,
      ctd,
      seal,
      splash,
      isroSatellite,
      laserBeam,
      isFollowingCTD: false,
      cameraPreset: 'wide',
      explodedFactor: 0.0,
      targetDepth: currentDepth || 0.0,
      bloomEnabled: vfxSettings.bloom,
      clock: new THREE.Clock()
    };

    // User interaction disengages locked chase cam
    controls.addEventListener('start', () => {
      if (sceneElementsRef.current.isFollowingCTD && onDisengageCTD) {
        onDisengageCTD();
      }
    });

    // ── 3D Subsystem Raycasting & Interactive Inspection Click Listener ──
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      if (!renderer || !camera || !buoy) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const candidates = buoy.interactiveMeshes || [];
      const intersects = raycaster.intersectObjects(candidates, true);

      if (intersects.length > 0) {
        let hit = null;
        for (const inter of intersects) {
          if (inter.object.userData?.subsystemId) {
            hit = inter.object;
            break;
          }
        }
        if (hit) {
          renderer.domElement.style.cursor = 'pointer';
          setHoveredSubsystem({
            name: hit.userData.name,
            subsystemId: hit.userData.subsystemId,
            x: e.clientX,
            y: e.clientY
          });
          return;
        }
      }
      renderer.domElement.style.cursor = 'default';
      setHoveredSubsystem(null);
    };

    const onPointerUp = (e) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 8) return; // User was dragging/orbiting the scene

      if (!renderer || !camera || !buoy) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const candidates = buoy.interactiveMeshes || [];
      const intersects = raycaster.intersectObjects(candidates, true);

      if (intersects.length > 0) {
        for (const inter of intersects) {
          if (inter.object.userData?.subsystemId) {
            if (onSelectComponent) {
              onSelectComponent(inter.object.userData.subsystemId);
            }
            break;
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // 8. Render Loop
    let animationFrameId;
    let lastTime = 0;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = sceneElementsRef.current.clock.getElapsedTime();
      const delta = Math.min(0.1, time - lastTime);
      lastTime = time;

      // ── Physical Atmospheric Horizon vs. Subsea Ocean Depth Extinction ──
      const camY = camera.position.y;
      if (camY >= 0.0) {
        // Above water: Polar sky horizon haze matching active season
        const skyHex = season === 'winter' ? 0x030712 : (season === 'autumn' ? 0x071526 : 0x091e38);
        const targetColor = new THREE.Color(skyHex);
        scene.fog.color.lerp(targetColor, 0.08);
        scene.fog.density = 0.0075;
        scene.background.lerp(targetColor, 0.08);
        renderer.setClearColor(scene.fog.color, 1.0);
      } else {
        // Underwater: Physical Beer-Lambert Ocean Depth Extinction Gradient
        const subDepth = Math.min(60.0, Math.abs(camY));
        const depthNorm = Math.min(1.0, subDepth / 45.0);

        // Subsea Antarctic Water Colors:
        // Shallow (0-15m): Luminous glacier turquoise-sapphire (0x0284c7 to 0x025687)
        // Deep Halocline/Abyss (15-60m): Deep Antarctic marine navy (0x011a38 to 0x010e1f)
        const shallowSubsea = new THREE.Color(0x025687);
        const deepAbyss = new THREE.Color(0x011326);
        const targetSubseaColor = shallowSubsea.clone().lerp(deepAbyss, depthNorm);

        scene.fog.color.lerp(targetSubseaColor, 0.12);
        // Rich subsea turbidity so objects naturally emerge from the glowing blue haze
        scene.fog.density = 0.016 + depthNorm * 0.012;
        scene.background.lerp(targetSubseaColor, 0.12);
        renderer.setClearColor(scene.fog.color, 1.0);
      }

      // Buoyancy Wave Displacement & Surface Slope Normal at buoy's instantaneous position!
      const buoyX = buoy.buoyRoot.position.x;
      const buoyZ = buoy.buoyRoot.position.z;

      const waveElev = ocean.getWaveHeight(buoyX, buoyZ);
      const waveSlopeX = (ocean.getWaveHeight(buoyX + 1.0, buoyZ) - ocean.getWaveHeight(buoyX - 1.0, buoyZ)) * 0.5;
      const waveSlopeZ = (ocean.getWaveHeight(buoyX, buoyZ + 1.0) - ocean.getWaveHeight(buoyX, buoyZ - 1.0)) * 0.5;
      const pitch = -waveSlopeZ * 0.32;
      const roll = waveSlopeX * 0.32;

      // Wave orbital horizontal surge velocity from wave gradients
      const waveSurgeX = -waveSlopeX * 1.8;
      const waveSurgeZ = -waveSlopeZ * 1.8;

      // Current flow vector based on active polar region
      const currentFlow = (activeRegion && activeRegion.id === 'southern_ocean_open')
        ? { x: 0.85, z: 0.35 }
        : (activeRegion && activeRegion.id === 'bharati_station')
        ? { x: 0.22, z: 0.14 }
        : { x: 0.45, z: 0.25 }; // Prydz Bay MIZ

      // Updates
      ocean.material.uniforms.u_buoyPos.value.set(buoyX, buoyZ);
      ocean.update(time, delta);
      seaIceFloes.update(time);
      bharatiStation.update(time);
      atmosphere.update(time);
      underwater.update(time);
      splash.update(delta);

      // Orbiting ISRO Oceansat-3 satellite trajectory
      const satAngle = time * 0.12;
      isroSatellite.position.set(Math.cos(satAngle) * 58, 68 + Math.sin(time * 0.5) * 2.5, Math.sin(satAngle) * 58);
      isroSatellite.lookAt(buoy.buoyRoot.position.x, buoy.buoyRoot.position.y + 1.2, buoy.buoyRoot.position.z);
      laserBeam.rotation.x = Math.PI / 2;

      // Update Buoy with damped 6-DOF spar hydrodynamics, current drift, and watch circle
      const isBursting = sealBreachRef.current ? sealBreachRef.current.isBreaching : false;
      const isInspecting = !!(sceneElementsRef.current.cameraPreset?.startsWith('electronics'));
      buoy.update(time, waveElev, waveSurgeX, waveSurgeZ, sceneElementsRef.current.explodedFactor || 0, pitch, roll, isBursting, delta, currentFlow, isInspecting);

      const targetDepth = sceneElementsRef.current.targetDepth || 0;
      ctd.update(time, targetDepth, buoy.buoyRoot.position);

      const sealData = seal.update(time, buoy.buoyRoot.position);
      if (onSealBreachUpdate) {
        onSealBreachUpdate(sealData);
      }

      // Continuous Dead-Center Gimbal Camera Tracking (Zero Disturbances)
      if (!isTransitioningRef.current) {
        if (sceneElementsRef.current.isFollowingCTD || sceneElementsRef.current.cameraPreset === 'ctd') {
          // Unobstructed Underwater CTD View: Positioned below buoy hull, looking at titanium rosette & flow cell
          const sondePos = new THREE.Vector3();
          ctd.sondeGroup.getWorldPosition(sondePos);

          controls.target.x += (sondePos.x - controls.target.x) * 0.14;
          controls.target.y += (sondePos.y + 0.15 - controls.target.y) * 0.14;
          controls.target.z += (sondePos.z - controls.target.z) * 0.14;

          const desiredCamX = sondePos.x + 0.4;
          const desiredCamY = sondePos.y - 0.20;
          const desiredCamZ = sondePos.z + 3.2;
          camera.position.x += (desiredCamX - camera.position.x) * 0.14;
          camera.position.y += (desiredCamY - camera.position.y) * 0.14;
          camera.position.z += (desiredCamZ - camera.position.z) * 0.14;
        } else if (sceneElementsRef.current.cameraPreset?.startsWith('electronics')) {
          // Macro inspection angle (Parts A, B, C) - Rigid Zero-Shake Frame of Reference Lock
          buoy.buoyRoot.updateMatrixWorld(true);
          let localCam, localTarget;

          if (sceneElementsRef.current.cameraPreset === 'electronics_a') {
            // Part A: Gateway Mast, Whip Antenna & Flexible Solar Panels Wiring
            localCam = new THREE.Vector3(1.20, CONFIG.BUOY_RADIUS_3D + 0.90, 2.10);
            localTarget = new THREE.Vector3(0, CONFIG.BUOY_RADIUS_3D + 0.35, 0.10);
          } else if (sceneElementsRef.current.cameraPreset === 'electronics_c') {
            // Part C: Subsea Winch Motor, Rotary Slip Rings & HDPE Keel Tubes
            localCam = new THREE.Vector3(1.35, -CONFIG.BUOY_RADIUS_3D - 0.45, 1.95);
            localTarget = new THREE.Vector3(0, -CONFIG.BUOY_RADIUS_3D - 0.75, 0);
          } else {
            // Part B (Default): Main Hull with Motherboard PCB, Electronics & Kapton Heating Pads
            localCam = new THREE.Vector3(0, 0.32, 1.70);
            localTarget = new THREE.Vector3(0, 0.14, 0.0);
          }

          const idealCamPos = localCam.clone().applyMatrix4(buoy.buoyRoot.matrixWorld);
          const idealTarget = localTarget.clone().applyMatrix4(buoy.buoyRoot.matrixWorld);

          // Rigid zero-shake lock: zero relative wobble or vibration relative to the buoy
          controls.target.copy(idealTarget);
          camera.position.copy(idealCamPos);
        } else if (sceneElementsRef.current.cameraPreset === 'buoy') {
          // Elevated hero tracking on floating spar buoy high above waves, with full hull and polar vista
          const bp = buoy.buoyRoot.position;
          controls.target.x += (bp.x - controls.target.x) * 0.12;
          controls.target.y += (bp.y + 0.70 - controls.target.y) * 0.12;
          controls.target.z += (bp.z - controls.target.z) * 0.12;

          const targetX = bp.x + 4.2;
          const targetY = bp.y + 4.2;
          const targetZ = bp.z + 7.5;
          camera.position.x += (targetX - camera.position.x) * 0.10;
          camera.position.y += (targetY - camera.position.y) * 0.10;
          camera.position.z += (targetZ - camera.position.z) * 0.10;
        } else if (sceneElementsRef.current.cameraPreset === 'seal') {
          // Continuous track on swimming Weddell seal
          const sp = seal.sealRoot.position;
          controls.target.x += (sp.x - controls.target.x) * 0.12;
          controls.target.y += (sp.y - 0.20 - controls.target.y) * 0.12;
          controls.target.z += (sp.z - controls.target.z) * 0.12;

          const targetX = sp.x + 3.2;
          const targetY = sp.y + 1.0;
          const targetZ = sp.z + 3.8;
          camera.position.x += (targetX - camera.position.x) * 0.08;
          camera.position.y += (targetY - camera.position.y) * 0.08;
          camera.position.z += (targetZ - camera.position.z) * 0.08;
        } else if (sceneElementsRef.current.cameraPreset === 'anchor') {
          // Benthic Seabed & Clump Anchor tracking at y = -48m
          controls.target.x += (0 - controls.target.x) * 0.08;
          controls.target.y += (-47.2 - controls.target.y) * 0.08;
          controls.target.z += (0 - controls.target.z) * 0.08;
        } else if (sceneElementsRef.current.cameraPreset === 'station') {
          // Centered tracking on Bharati Station architectural complex
          controls.target.x += (-76.0 - controls.target.x) * 0.08;
          controls.target.y += (12.0 - controls.target.y) * 0.08;
          controls.target.z += (-88.0 - controls.target.z) * 0.08;
        } else if (sceneElementsRef.current.cameraPreset === 'wide') {
          // Stable Front Overview: smooth gentle drift centering
          controls.target.x += (0 - controls.target.x) * 0.05;
          controls.target.y += (0.6 - controls.target.y) * 0.05;
          controls.target.z += (0 - controls.target.z) * 0.05;
        }
      }

      // Problem 1: In Part B (PCB & heating pads inspection), ocean is not needed so everything is 100% clear
      // while buoy vertical heave continues naturally
      const isPartB = sceneElementsRef.current.cameraPreset === 'electronics' || sceneElementsRef.current.cameraPreset === 'electronics_b';
      if (ocean && ocean.mesh) {
        ocean.mesh.visible = !isPartB;
      }
      if (splash && splash.group) {
        splash.group.visible = !isPartB;
      }
      if (seaIceFloes && seaIceFloes.group) {
        seaIceFloes.group.visible = !isPartB;
      }

      controls.update();

      // Render via Post-Processing Composer (or direct renderer fallback)
      if (sceneElementsRef.current.bloomEnabled) {
        postProcessing.composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };

    animate();

    // 9. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      postProcessing.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update target depth
  useEffect(() => {
    if (sceneElementsRef.current) {
      sceneElementsRef.current.targetDepth = currentDepth;
    }
  }, [currentDepth]);

  // Update Exploded View
  useEffect(() => {
    if (sceneElementsRef.current) {
      const targetFactor = explodedView ? 1.0 : 0.0;
      gsap.to(sceneElementsRef.current, {
        explodedFactor: targetFactor,
        duration: 1.4,
        ease: "power3.inOut"
      });
    }
  }, [explodedView]);

  // Update VFX Quality Settings
  useEffect(() => {
    if (sceneElementsRef.current && sceneElementsRef.current.postProcessing) {
      sceneElementsRef.current.bloomEnabled = vfxSettings.bloom;
      sceneElementsRef.current.postProcessing.setBloomEnabled(vfxSettings.bloom);
      sceneElementsRef.current.postProcessing.setBloomStrength(vfxSettings.bloomStrength || 0.65);
    }
  }, [vfxSettings]);

  // Handle Active Polar Region Shifts
  useEffect(() => {
    if (!sceneElementsRef.current || !activeRegion) return;
    const { ocean, seaIceFloes, bharatiStation, glaciers, scene } = sceneElementsRef.current;
    if (ocean && activeRegion.seaPhysics) {
      ocean.setRegionPhysics(activeRegion.seaPhysics);
    }
    if (seaIceFloes && activeRegion.seaPhysics) {
      seaIceFloes.setDensity(activeRegion.seaPhysics.iceFloeDensity);
    }
    if (bharatiStation) {
      bharatiStation.setTargetRegion(activeRegion.id);
    }
    if (glaciers && glaciers.setDistanceScale && activeRegion.seaPhysics) {
      glaciers.setDistanceScale(activeRegion.seaPhysics.icebergDist / 115);
    }
    if (scene && scene.fog && activeRegion.seaPhysics) {
      scene.fog.color.setHex(activeRegion.seaPhysics.fogColor);
      scene.fog.density = activeRegion.seaPhysics.fogDensity;
      scene.background.setHex(activeRegion.seaPhysics.fogColor);
    }
  }, [activeRegion]);

  // Handle Fine-Tuned Sea Controls (Wave Height, Foam, Ice Floes)
  useEffect(() => {
    if (!sceneElementsRef.current || !seaControls) return;
    const { ocean, seaIceFloes } = sceneElementsRef.current;
    if (ocean && seaControls.waveHeightScale !== undefined) {
      ocean.setWaveHeightScale(seaControls.waveHeightScale);
    }
    if (ocean && seaControls.foamIntensity !== undefined) {
      ocean.setFoamIntensity(seaControls.foamIntensity);
    }
    if (seaIceFloes && seaControls.iceFloeDensity !== undefined) {
      seaIceFloes.setDensity(seaControls.iceFloeDensity);
    }
  }, [seaControls]);

  // Handle Antarctic Seasonal Weather & Atmospheric Lighting
  useEffect(() => {
    if (!sceneElementsRef.current) return;
    const { sunLight, skyLight, atmosphere, scene } = sceneElementsRef.current;
    if (atmosphere && atmosphere.setSeason) {
      atmosphere.setSeason(season);
    }

    if (sunLight && skyLight) {
      switch (season) {
        case 'summer': // Austral Summer (Midnight Sun — 24h continuous golden polar day)
          gsap.to(sunLight.position, { x: 45, y: 18, z: 40, duration: 2.0, ease: "power2.out" });
          gsap.to(sunLight, { intensity: 2.2, duration: 2.0 });
          sunLight.color.setHex(0xfff7ed);
          skyLight.color.setHex(0x38bdf8);
          skyLight.groundColor.setHex(0x021329);
          if (scene.fog) {
            scene.fog.color.setHex(0x071526);
            scene.fog.density = 0.007;
          }
          break;
        case 'winter': // Austral Winter (Polar Night / No Sun — Aurora Australis glow)
          gsap.to(sunLight.position, { x: 45, y: -24, z: 40, duration: 2.0, ease: "power2.out" });
          gsap.to(sunLight, { intensity: 0.0, duration: 2.0 });
          skyLight.color.setHex(0x10b981); // Emerald aurora sky bounce
          skyLight.groundColor.setHex(0x020817);
          if (scene.fog) {
            scene.fog.color.setHex(0x020612);
            scene.fog.density = 0.009;
          }
          break;
        case 'autumn': // Autumn Freeze-up (Blizzard & Swirling Snow Flurries)
          gsap.to(sunLight.position, { x: 35, y: 12, z: 35, duration: 2.0, ease: "power2.out" });
          gsap.to(sunLight, { intensity: 0.7, duration: 2.0 });
          sunLight.color.setHex(0xe2e8f0);
          skyLight.color.setHex(0x94a3b8);
          skyLight.groundColor.setHex(0x1e293b);
          if (scene.fog) {
            scene.fog.color.setHex(0x1e293b);
            scene.fog.density = 0.018; // Dense whiteout blizzard fog
          }
          break;
        case 'spring': // Austral Spring Thaw (Ice Breakup & Polar Sleet)
          gsap.to(sunLight.position, { x: 45, y: 24, z: 40, duration: 2.0, ease: "power2.out" });
          gsap.to(sunLight, { intensity: 1.8, duration: 2.0 });
          sunLight.color.setHex(0xfef08a);
          skyLight.color.setHex(0x0ea5e9);
          skyLight.groundColor.setHex(0x031830);
          if (scene.fog) {
            scene.fog.color.setHex(0x07192f);
            scene.fog.density = 0.008;
          }
          break;
        default:
          break;
      }
    }
  }, [season]);

  // Animate Camera to Preset Perspectives
  useEffect(() => {
    if (!sceneElementsRef.current) return;
    sceneElementsRef.current.cameraPreset = cameraPreset;
    const { camera, controls, buoy, ctd, seal, bharatiStation } = sceneElementsRef.current;
    if (bharatiStation?.setCameraPreset) {
      bharatiStation.setCameraPreset(cameraPreset);
    }

    isTransitioningRef.current = true;
    let targetCamPos = new THREE.Vector3(0, 6.5, 22.0);
    let targetLookAt = new THREE.Vector3(0, 0.6, 0);
    let localCam, localTarget;

    const bp = buoy.buoyRoot.position;

    // Front-to-back optical zoom presets with dynamic world-space focus
    switch (cameraPreset) {
      case 'wide':
        // Grand panoramic polar horizon — cinematic eye-level framing
        targetCamPos = new THREE.Vector3(0, 6.5, 22.0);
        targetLookAt = new THREE.Vector3(0, 0.6, 0);
        break;
      case 'buoy':
        // Dead-center locked onto the spar buoy surface hull (elevated hero framing showing full buoy and horizon)
        targetLookAt = bp.clone().add(new THREE.Vector3(0, 0.70, 0));
        targetCamPos = bp.clone().add(new THREE.Vector3(4.2, 4.2, 7.5));
        break;
      case 'electronics':
      case 'electronics_b':
      case 'exploded': // backward compatibility for booth view
        // Part B: Main Hull with PCB Electronics & Heating Pads
        buoy.buoyRoot.updateMatrixWorld(true);
        localCam = new THREE.Vector3(0, 0.32, 1.70);
        localTarget = new THREE.Vector3(0, 0.14, 0.0);
        targetCamPos = localCam.clone().applyMatrix4(buoy.buoyRoot.matrixWorld);
        targetLookAt = localTarget.clone().applyMatrix4(buoy.buoyRoot.matrixWorld);
        break;
      case 'electronics_a':
        // Part A: Gateway Mast, Whip Antenna & Flexible Solar PV Conduit Wiring
        buoy.buoyRoot.updateMatrixWorld(true);
        localCam = new THREE.Vector3(1.20, CONFIG.BUOY_RADIUS_3D + 0.90, 2.10);
        localTarget = new THREE.Vector3(0, CONFIG.BUOY_RADIUS_3D + 0.35, 0.10);
        targetCamPos = localCam.clone().applyMatrix4(buoy.buoyRoot.matrixWorld);
        targetLookAt = localTarget.clone().applyMatrix4(buoy.buoyRoot.matrixWorld);
        break;
      case 'electronics_c':
        // Part C: Subsea Winch Motor, Rotary Slip Rings & HDPE Keel Tubes
        buoy.buoyRoot.updateMatrixWorld(true);
        localCam = new THREE.Vector3(1.35, -CONFIG.BUOY_RADIUS_3D - 0.45, 1.95);
        localTarget = new THREE.Vector3(0, -CONFIG.BUOY_RADIUS_3D - 0.75, 0);
        targetCamPos = localCam.clone().applyMatrix4(buoy.buoyRoot.matrixWorld);
        targetLookAt = localTarget.clone().applyMatrix4(buoy.buoyRoot.matrixWorld);
        break;
      case 'ctd':
        // Unobstructed Underwater Hero View: positioned below the hull, looking at titanium sonde and docking receiver
        const sondePos = new THREE.Vector3();
        ctd.sondeGroup.getWorldPosition(sondePos);
        targetLookAt = sondePos.clone().add(new THREE.Vector3(0, 0.15, 0));
        targetCamPos = sondePos.clone().add(new THREE.Vector3(0.4, -0.20, 3.2));
        break;
      case 'seal':
        // Clean lock on swimming Weddell seal
        const sp = seal.sealRoot.position;
        targetLookAt = sp.clone().add(new THREE.Vector3(0, -0.20, 0));
        targetCamPos = sp.clone().add(new THREE.Vector3(3.2, 1.0, 3.8));
        break;
      case 'anchor':
        // Benthic Seabed & Clump Anchor at y = -48m with biofouling macro-algae
        targetLookAt = new THREE.Vector3(0, -47.2, 0);
        targetCamPos = new THREE.Vector3(3.8, -45.5, 4.2);
        break;
      case 'station':
        // Majestic 3/4 elevated hero angle showcasing Bharati Station on Larsemann Hills bedrock & waving Tricolor flag
        targetCamPos = new THREE.Vector3(-46.0, 19.0, -58.0);
        targetLookAt = new THREE.Vector3(-76.0, 12.0, -88.0);
        break;
      case 'ship':
        targetCamPos = new THREE.Vector3(52.0, 10.0, -48.0);
        targetLookAt = new THREE.Vector3(72.0, 4.0, -68.0);
        break;
      default:
        break;
    }

    gsap.to(camera.position, {
      x: targetCamPos.x,
      y: targetCamPos.y,
      z: targetCamPos.z,
      duration: 1.5,
      ease: "power3.inOut",
      onComplete: () => {
        isTransitioningRef.current = false;
      }
    });

    gsap.to(controls.target, {
      x: targetLookAt.x,
      y: targetLookAt.y,
      z: targetLookAt.z,
      duration: 1.5,
      ease: "power3.inOut"
    });
  }, [cameraPreset]);

  // Synchronize isFollowingCTD state
  useEffect(() => {
    if (sceneElementsRef.current) {
      sceneElementsRef.current.isFollowingCTD = isFollowingCTD;
    }
  }, [isFollowingCTD]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 1
      }}
    >
      {/* 3D Interactive Subsystem Hover Tag */}
      {hoveredSubsystem && (
        <div
          className="subsystem-3d-hover-tag"
          style={{
            position: 'fixed',
            left: `${hoveredSubsystem.x + 14}px`,
            top: `${hoveredSubsystem.y - 14}px`,
            pointerEvents: 'none',
            zIndex: 60
          }}
        >
          <span className="hover-tag-dot pulse-anim" />
          <span className="hover-tag-text">{hoveredSubsystem.name}</span>
          <span className="hover-tag-hint">Click 3D Model to Inspect</span>
        </div>
      )}
    </div>
  );
}
