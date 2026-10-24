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
import { PARTS_REGISTRY, getPartById } from '../../constants/partsRegistry';
import PartInspector from '../ui/PartInspector';
import { currentModel } from '../../constants/currentModel';
import { CONFIG } from '../../constants/config';
import { Navigation, RefreshCw } from 'lucide-react';
import CurrentDriftHUD from '../ui/CurrentDriftHUD';

// Hoisted static camera offsets & scratchpads to eliminate hot-loop allocations
const _localCamA = new THREE.Vector3(2.10, CONFIG.BUOY_RADIUS_3D + 1.25, 3.60);
const _localTargetA = new THREE.Vector3(0, CONFIG.BUOY_RADIUS_3D + 0.85, 0.05);
const _localCamC = new THREE.Vector3(2.20, -CONFIG.BUOY_RADIUS_3D - 0.50, 3.40);
const _localTargetC = new THREE.Vector3(0.0, -CONFIG.BUOY_RADIUS_3D - 0.90, 0.10);
const _localCamB = new THREE.Vector3(0.70, 0.40, 1.45);
const _localTargetB = new THREE.Vector3(0.0, 0.02, 0.22);

const _idealCamPos = new THREE.Vector3();
const _idealTarget = new THREE.Vector3();
const _sondePos = new THREE.Vector3();
const _selWorld = new THREE.Vector3();
const _selProj = new THREE.Vector3();
const _cWorld = new THREE.Vector3();
const _cProj = new THREE.Vector3();
const _targetColor = new THREE.Color();
const _shallowSubsea = new THREE.Color(0x025687);
const _deepAbyss = new THREE.Color(0x011326);
const _targetSubseaColor = new THREE.Color();
const _currentFlow = { x: 0, z: 0 };

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
  season = 'summer',
  heaterState = null,
  onSetHeaterState,
  onResetTrip,
  onInjectFault,
  isTourRunning = false
}) {
  const containerRef = useRef(null);
  const sceneElementsRef = useRef(null);
  const sealBreachRef = useRef({ isBreaching: false });
  const isTransitioningRef = useRef(false);
  const [selectedPartId, setSelectedPartId] = useState(null);
  const [hoveredPart, setHoveredPart] = useState(null);
  const [connectedPartPositions, setConnectedPartPositions] = useState([]);
  const selectedPartIdRef = useRef(null);
  const hoveredMeshesRef = useRef([]);
  const savedCameraStateRef = useRef(null);
  const selectPartRef = useRef(null);
  const deselectPartRef = useRef(null);
  const heaterStateRef = useRef(heaterState);
  heaterStateRef.current = heaterState;
  const lastBuoyPosRef = useRef(new THREE.Vector3());
  const telemetrySubscriberRef = useRef(null);

  const handleRerollSeed = () => {
    const newSeed = Math.floor(Math.random() * 899999) + 100000;
    if (window.__debug && typeof window.__debug.setSeed === 'function') {
      window.__debug.setSeed(newSeed);
    } else {
      currentModel.setSeed(newSeed);
      const t = sceneElementsRef.current ? sceneElementsRef.current.clock.getElapsedTime() : 0;
      const data = currentModel.get(t);
      if (telemetrySubscriberRef.current) {
        const _telData = typeof data !== 'undefined' ? data : currentData;
        telemetrySubscriberRef.current({
          headingDeg: _telData.headingDeg,
          speedMps: _telData.speedMps,
          speedCmpSec: _telData.speedCmpSec,
          seed: typeof newSeed !== 'undefined' ? newSeed : (typeof n !== 'undefined' ? Number(n) : _telData.seed),
          seasonName: _telData.seasonName
        });
      }
    }
    if (typeof window !== 'undefined' && window.history) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('seed', newSeed);
        window.history.replaceState({}, '', url.toString());
      } catch (e) {}
    }
  };

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
    // Near plane tuned to 0.05 for flawless macro inspection of SMD electronics without clipping
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 800);
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
    window.__renderer = renderer;
    window.__debug = window.__debug || {};
    window.__debug.renderer = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxDistance = 220;
    controls.minDistance = 0.3;
    controls.maxPolarAngle = Math.PI - 0.05; // Full vertical range from zenith to abyssal seabed
    controls.target.set(0, 0.6, 0);

    // 5. Cinematic Lighting
    // Directional Arctic Sun (low angle on horizon with tight, high-res shadow frustum)
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.9);
    sunLight.position.set(38, 20, 32);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 110;
    sunLight.shadow.camera.left = -14;
    sunLight.shadow.camera.right = 14;
    sunLight.shadow.camera.top = 14;
    sunLight.shadow.camera.bottom = -14;
    sunLight.shadow.bias = -0.0003;
    sunLight.shadow.normalBias = 0.025;
    sunLight.shadow.radius = 2.0;
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

    // 5C. Studio-Grade Polar IBL Environment Map (PMREM Filtered Specular Radiance calibrated by season)
    const { envMap: polarEnvMap, skyTexture: initialSkyTexture } = generatePolarEnvironmentMap(renderer, season);
    scene.environment = polarEnvMap;

    // 6. Instantiate VFX Modules & Dedicated Raycasting Pick Group
    const pickGroup = new THREE.Group();
    pickGroup.name = "pickGroup";
    scene.add(pickGroup);

    const initialPhysics = (activeRegion && activeRegion.seaPhysics) ? activeRegion.seaPhysics : {};
    const ocean = createOceanSurface(initialPhysics);
    if (ocean.setSkyTexture) {
      ocean.setSkyTexture(initialSkyTexture);
    }
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
    pickGroup.add(buoy.buoyRoot);
    if (buoy.mooringGroup) {
      pickGroup.add(buoy.mooringGroup);
    }

    const ctd = createCTDSonde();
    pickGroup.add(ctd.sondeGroup);
    scene.add(ctd.cableMesh);
    scene.add(ctd.trailGroup);
    if (ctd.abyssGroup) {
      scene.add(ctd.abyssGroup);
    }

    const splash = createSplashSystem();
    scene.add(splash.group);

    const seal = createBiologgerSeal(splash);
    if (seal.podGroup) {
      pickGroup.add(seal.podGroup);
    } else {
      pickGroup.add(seal.sealRoot);
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
      currentEnvMap: polarEnvMap,
      currentSkyTexture: initialSkyTexture,
      clock: new THREE.Clock()
    };

    // User interaction disengages locked chase cam
    controls.addEventListener('start', () => {
      if (sceneElementsRef.current.isFollowingCTD && onDisengageCTD) {
        onDisengageCTD();
      }
    });

    // ── Helper: Find mesh matching partId in pickGroup ──
    function findMeshForPart(partId) {
      let found = null;
      pickGroup.traverse((child) => {
        if (!found && child.isMesh && child.userData?.partId === partId) {
          found = child;
        }
      });
      return found;
    }

    // ── Helper: Hover Rim/Emissive Boost & Restore ──
    function restoreHoverMaterials() {
      if (!hoveredMeshesRef.current || !hoveredMeshesRef.current.length) return;
      for (const m of hoveredMeshesRef.current) {
        if (m.material) {
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mat) => {
            if (mat.userData._origEmissive !== undefined && mat.emissive) {
              mat.emissive.setHex(mat.userData._origEmissive);
              mat.emissiveIntensity = mat.userData._origEmissiveInt;
              delete mat.userData._origEmissive;
              delete mat.userData._origEmissiveInt;
            }
          });
        }
      }
      hoveredMeshesRef.current = [];
    }

    function applyHoverBoost(partId) {
      restoreHoverMaterials();
      if (!partId) return;
      const matched = [];
      pickGroup.traverse((child) => {
        if (child.isMesh && child.userData?.partId === partId && child.material) {
          matched.push(child);
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            if (mat.emissive) {
              if (mat.userData._origEmissive === undefined) {
                mat.userData._origEmissive = mat.emissive.getHex();
                mat.userData._origEmissiveInt = mat.emissiveIntensity || 0;
              }
              mat.emissive.setHex(0x38bdf8);
              mat.emissiveIntensity = Math.max(0.7, (mat.userData._origEmissiveInt || 0) + 0.55);
            }
          });
        }
      });
      hoveredMeshesRef.current = matched;
    }

    // ── Helper: Dim other parts to ~15% & Restore ──
    function applyDimming(selectedId) {
      pickGroup.traverse((child) => {
        if (child.isMesh && child.material) {
          const isSelected = child.userData?.partId === selectedId;
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            if (!mat.userData._dimSaved) {
              mat.userData._dimSaved = true;
              mat.userData._origOpacity = mat.opacity !== undefined ? mat.opacity : 1.0;
              mat.userData._origTransparent = mat.transparent !== undefined ? mat.transparent : false;
            }
            if (isSelected) {
              mat.opacity = mat.userData._origOpacity;
              mat.transparent = mat.userData._origTransparent;
            } else {
              mat.transparent = true;
              mat.opacity = 0.15;
            }
          });
        }
      });
    }

    function restoreDimming() {
      pickGroup.traverse((child) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            if (mat.userData._dimSaved) {
              mat.opacity = mat.userData._origOpacity;
              mat.transparent = mat.userData._origTransparent;
              delete mat.userData._dimSaved;
              delete mat.userData._origOpacity;
              delete mat.userData._origTransparent;
            }
          });
        }
      });
    }

    // ── Part Selection & Camera Flight ──
    const selectPart = (partId) => {
      if (!partId) {
        deselectPart();
        return;
      }
      const part = getPartById(partId);
      if (!part) return;

      if (!selectedPartIdRef.current) {
        savedCameraStateRef.current = {
          pos: camera.position.clone(),
          target: controls.target.clone(),
          fov: camera.fov
        };
      }

      selectedPartIdRef.current = partId;
      setSelectedPartId(partId);
      restoreHoverMaterials();
      setHoveredPart(null);

      applyDimming(partId);

      const pose = part.cameraPose;
      if (pose) {
        isTransitioningRef.current = true;
        gsap.killTweensOf(camera.position);
        gsap.killTweensOf(controls.target);
        gsap.killTweensOf(camera);

        gsap.to(camera.position, {
          x: pose.pos[0],
          y: pose.pos[1],
          z: pose.pos[2],
          duration: 0.9,
          ease: "power2.inOut",
          onComplete: () => {
            isTransitioningRef.current = false;
          }
        });

        gsap.to(controls.target, {
          x: pose.target[0],
          y: pose.target[1],
          z: pose.target[2],
          duration: 0.9,
          ease: "power2.inOut"
        });

        gsap.to(camera, {
          fov: pose.fov,
          duration: 0.9,
          ease: "power2.inOut",
          onUpdate: () => camera.updateProjectionMatrix()
        });
      }

      if (onSelectComponent) {
        onSelectComponent(part.specKey || partId);
      }
    };

    const deselectPart = () => {
      restoreDimming();
      restoreHoverMaterials();
      setSelectedPartId(null);
      selectedPartIdRef.current = null;
      setConnectedPartPositions([]);

      if (savedCameraStateRef.current) {
        isTransitioningRef.current = true;
        const { pos, target, fov } = savedCameraStateRef.current;
        gsap.killTweensOf(camera.position);
        gsap.killTweensOf(controls.target);
        gsap.killTweensOf(camera);

        gsap.to(camera.position, {
          x: pos.x,
          y: pos.y,
          z: pos.z,
          duration: 0.9,
          ease: "power2.inOut",
          onComplete: () => {
            isTransitioningRef.current = false;
          }
        });

        gsap.to(controls.target, {
          x: target.x,
          y: target.y,
          z: target.z,
          duration: 0.9,
          ease: "power2.inOut"
        });

        gsap.to(camera, {
          fov: fov,
          duration: 0.9,
          ease: "power2.inOut",
          onUpdate: () => camera.updateProjectionMatrix()
        });
      }
    };

    selectPartRef.current = selectPart;
    deselectPartRef.current = deselectPart;

    // ── 3D PickGroup Raycasting & Interactive Inspection Listeners ──
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e) => {
      if (isTransitioningRef.current || e.target !== renderer.domElement) return;
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      if (!renderer || !camera || isTransitioningRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObject(pickGroup, true);

      if (intersects.length > 0) {
        let hitInter = null;
        let hitPartId = null;
        for (const inter of intersects) {
          let cur = inter.object;
          while (cur && cur !== pickGroup && cur !== scene) {
            if (cur.userData?.partId) {
              hitInter = inter;
              hitPartId = cur.userData.partId;
              break;
            }
            cur = cur.parent;
          }
          if (hitPartId) break;
        }

        if (hitPartId && hitInter) {
          const part = getPartById(hitPartId);
          if (part) {
            renderer.domElement.style.cursor = 'pointer';
            applyHoverBoost(hitPartId);
            const screenPos = hitInter.point.clone().project(camera);
            const sx = (screenPos.x * 0.5 + 0.5) * rect.width;
            const sy = (-screenPos.y * 0.5 + 0.5) * rect.height;
            setHoveredPart({
              id: hitPartId,
              name: part.name,
              group: part.group,
              screenX: sx,
              screenY: sy
            });
            return;
          }
        }
      }

      renderer.domElement.style.cursor = 'default';
      restoreHoverMaterials();
      setHoveredPart(null);
    };

    const onPointerUp = (e) => {
      if (isTransitioningRef.current || e.target !== renderer.domElement) return;
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 8) return; // User was dragging/orbiting the scene

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObject(pickGroup, true);

      if (intersects.length > 0) {
        for (const inter of intersects) {
          let cur = inter.object;
          let hitPartId = null;
          while (cur && cur !== pickGroup && cur !== scene) {
            if (cur.userData?.partId) {
              hitPartId = cur.userData.partId;
              break;
            }
            cur = cur.parent;
          }
          if (hitPartId) {
            selectPart(hitPartId);
            break;
          }
        }
      }
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        deselectPart();
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);

    // 8. Render Loop & Deterministic Debug Clock Hook
    let animationFrameId;
    let lastTime = 0;
    let isTimeFrozen = false;
    let frozenTimestamp = 10.0;
    let frameCount = 0;
    let frameTimeSum = 0;
    let probeComplete = false;

    window.__debug = window.__debug || {};
    console.log('VFXScene: window.__debug initialized!');
    window.__debug.selectPart = (id) => {
      if (selectPartRef.current) {
        selectPartRef.current(id);
        return true;
      }
      return false;
    };
    window.__debug.hoverPart = (id) => {
      const p = getPartById(id);
      if (p) {
        const mesh = findMeshForPart(id);
        if (mesh && container) {
          const wp = new THREE.Vector3();
          mesh.getWorldPosition(wp);
          const proj = wp.clone().project(camera);
          const w = container.clientWidth;
          const h = container.clientHeight;
          applyHoverBoost(id);
          setHoveredPart({
            id,
            name: p.name,
            group: p.group,
            screenX: (proj.x * 0.5 + 0.5) * w,
            screenY: (-proj.y * 0.5 + 0.5) * h
          });
          return true;
        }
      }
      return false;
    };
    window.__debug.deselectPart = () => {
      if (deselectPartRef.current) {
        deselectPartRef.current();
      }
    };
    window.__debug.getSelectedPart = () => selectedPartIdRef.current;

    let simTimeOffset = 0;
    window.__debug.setWinchDepth = (m) => {
      sceneElementsRef.current.targetDepth = Number(m);
    };

    window.__debug.stepTime = (seconds) => {
      simTimeOffset += Number(seconds);
      const curTime = (isTimeFrozen ? frozenTimestamp : sceneElementsRef.current.clock.getElapsedTime()) + simTimeOffset;
      if (window.__stepSimFrame) {
        window.__stepSimFrame(curTime, 0.016);
      }
    };

    window.__debug.setSeed = (n) => {
      currentModel.setSeed(n);
      const curTime = (isTimeFrozen ? frozenTimestamp : sceneElementsRef.current.clock.getElapsedTime()) + simTimeOffset;
      const data = currentModel.get(curTime);
      if (telemetrySubscriberRef.current) {
        const _telData = typeof data !== 'undefined' ? data : currentData;
        telemetrySubscriberRef.current({
          headingDeg: _telData.headingDeg,
          speedMps: _telData.speedMps,
          speedCmpSec: _telData.speedCmpSec,
          seed: typeof newSeed !== 'undefined' ? newSeed : (typeof n !== 'undefined' ? Number(n) : _telData.seed),
          seasonName: _telData.seasonName
        });
      }
      return data;
    };

    window.__debug.getSeed = () => currentModel.getSeed();

    window.__debug.getCurrent = () => {
      const curTime = (isTimeFrozen ? frozenTimestamp : sceneElementsRef.current.clock.getElapsedTime()) + simTimeOffset;
      return currentModel.get(curTime);
    };

    window.__debug.setSeason = (s) => {
      const curTime = (isTimeFrozen ? frozenTimestamp : sceneElementsRef.current.clock.getElapsedTime()) + simTimeOffset;
      currentModel.setSeason(s, curTime);
    };

    window.__debug.getPositions = () => {
      const bPos = buoy.buoyRoot.position;
      const sPos = ctd.sondeGroup.position;
      const wExit = buoy.getWinchExitWorldPosition ? buoy.getWinchExitWorldPosition(new THREE.Vector3()) : new THREE.Vector3();
      const cableArr = ctd.cableMesh.geometry.attributes.position.array;
      const topCable = new THREE.Vector3(cableArr[0], cableArr[1], cableArr[2]);
      const bottomIdx = (cableArr.length / 3 - 1) * 3;
      const bottomCable = new THREE.Vector3(cableArr[bottomIdx], cableArr[bottomIdx + 1], cableArr[bottomIdx + 2]);
      
      const topDist = topCable.distanceTo(wExit);
      const eyeletPos = new THREE.Vector3(0, 0.98, 0).applyMatrix4(ctd.sondeGroup.matrixWorld);
      const bottomDist = bottomCable.distanceTo(eyeletPos);
      const tetherConnected = topDist < 0.05 && bottomDist < 0.05;

      return {
        buoy: { x: Number(bPos.x.toFixed(4)), y: Number(bPos.y.toFixed(4)), z: Number(bPos.z.toFixed(4)) },
        sonde: { x: Number(sPos.x.toFixed(4)), y: Number(sPos.y.toFixed(4)), z: Number(sPos.z.toFixed(4)) },
        winchExit: { x: Number(wExit.x.toFixed(4)), y: Number(wExit.y.toFixed(4)), z: Number(wExit.z.toFixed(4)) },
        tetherConnected,
        topDist: Number(topDist.toFixed(4)),
        bottomDist: Number(bottomDist.toFixed(4)),
        depth: sceneElementsRef.current.targetDepth || 0
      };
    };

    window.__debug.renderer = renderer;
    window.__debug.scene = scene;
    window.__debug.postProcessing = postProcessing;

    window.__debugVFX = {
      freezeTime: (freeze = true, fixedT = 10.0) => {
        isTimeFrozen = freeze;
        frozenTimestamp = fixedT;
      }
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const rawTime = sceneElementsRef.current.clock.getElapsedTime();
      const time = isTimeFrozen ? frozenTimestamp : rawTime;
      const delta = isTimeFrozen ? 0.0 : Math.min(0.1, time - lastTime);
      lastTime = rawTime;

      // Quality tier frame-time probe (first 30 frames)
      if (!probeComplete && delta > 0) {
        frameCount++;
        frameTimeSum += delta;
        if (frameCount >= 30) {
          probeComplete = true;
          const avgMs = (frameTimeSum / 30) * 1000;
          let tier = 'high';
          if (avgMs > 28) tier = 'low';
          else if (avgMs > 18) tier = 'medium';
          if (window.__debug) {
            window.__debug.detectedTier = tier;
            window.__debug.avgFrameTimeMs = avgMs.toFixed(1);
          }
        }
      }

      // ── Physical Atmospheric Horizon vs. Subsea Ocean Depth Extinction ──
      const camY = camera.position.y;
      if (camY >= -0.2) {
        // Above water: Render full 360° equirectangular polar sky panorama
        if (sceneElementsRef.current.currentSkyTexture && scene.background !== sceneElementsRef.current.currentSkyTexture) {
          scene.background = sceneElementsRef.current.currentSkyTexture;
        }
        // Atmospheric horizon haze matching active polar season
        const skyHex = season === 'winter'
          ? 0x020617 // Deep polar night obsidian
          : season === 'autumn'
          ? 0x334155 // Slate overcast blizzard haze
          : season === 'spring'
          ? 0x0f2942 // Crisp cyan azure thaw
          : 0x1e3a5f; // Summer midnight sun golden aerosol haze
        const targetColor = new THREE.Color(skyHex);
        scene.fog.color.lerp(targetColor, 0.08);
        scene.fog.density = season === 'autumn' ? 0.016 : 0.0065;
        renderer.setClearColor(scene.fog.color, 1.0);
      } else {
        // Underwater: Physical Beer-Lambert Ocean Depth Extinction Gradient
        const subDepth = Math.min(60.0, Math.abs(camY));
        const depthNorm = Math.min(1.0, subDepth / 45.0);

        // Subsea Antarctic Water Colors:
        // Shallow (0-15m): Luminous glacier turquoise-sapphire (0x025687)
        // Deep Halocline/Abyss (15-60m): Deep Antarctic marine navy (0x011326)
        const shallowSubsea = new THREE.Color(0x025687);
        const deepAbyss = new THREE.Color(0x011326);
        const targetSubseaColor = shallowSubsea.clone().lerp(deepAbyss, depthNorm);

        scene.fog.color.lerp(targetSubseaColor, 0.12);
        // Rich subsea turbidity so objects naturally emerge from the glowing blue haze
        scene.fog.density = 0.016 + depthNorm * 0.012;
        scene.background = targetSubseaColor;
        renderer.setClearColor(scene.fog.color, 1.0);
      }

      const stepSimulationFrame = (t, dt) => {
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

        // Evaluate unified Prydz Bay MIZ current & drift model (one current vector drives all consumers)
        const currentData = currentModel.get(t);
        const currentFlow = { x: currentData.x, z: currentData.z };

        // Updates
        if (ocean.setFlowDirection) {
          ocean.setFlowDirection(currentData.x, currentData.z);
        }
        ocean.material.uniforms.u_buoyPos.value.set(buoyX, buoyZ);
        ocean.update(t, dt);
        seaIceFloes.update(t, currentData);
        bharatiStation.update(t);
        atmosphere.update(t);
        underwater.update(t, dt, buoy.buoyRoot.position, currentData);
        splash.update(dt, currentData.wind);

        // Update telemetry readout HUD state every 10 frames
        if (frameCount % 10 === 0) {
          if (telemetrySubscriberRef.current) {
        const _telData = typeof data !== 'undefined' ? data : currentData;
        telemetrySubscriberRef.current({
          headingDeg: _telData.headingDeg,
          speedMps: _telData.speedMps,
          speedCmpSec: _telData.speedCmpSec,
          seed: typeof newSeed !== 'undefined' ? newSeed : (typeof n !== 'undefined' ? Number(n) : _telData.seed),
          seasonName: _telData.seasonName
        });
      }
        }

        // Orbiting ISRO Oceansat-3 satellite trajectory
        const satAngle = t * 0.12;
        isroSatellite.position.set(Math.cos(satAngle) * 58, 68 + Math.sin(t * 0.5) * 2.5, Math.sin(satAngle) * 58);
        isroSatellite.lookAt(buoy.buoyRoot.position.x, buoy.buoyRoot.position.y + 1.2, buoy.buoyRoot.position.z);
        laserBeam.rotation.x = Math.PI / 2;

        // Update Buoy with damped 6-DOF spar hydrodynamics, current drift, and watch circle
        const isBursting = sealBreachRef.current ? sealBreachRef.current.isBreaching : false;
        const isInspecting = !!(sceneElementsRef.current.cameraPreset?.startsWith('electronics'));
        buoy.update(t, waveElev, waveSurgeX, waveSurgeZ, sceneElementsRef.current.explodedFactor || 0, pitch, roll, isBursting, dt, currentFlow, isInspecting, heaterStateRef.current);

        const targetDepth = sceneElementsRef.current.targetDepth || 0;
        ctd.update(t, targetDepth, buoy, currentFlow, dt);

        const sealData = seal.update(t, buoy.buoyRoot.position);
        if (onSealBreachUpdate) {
          onSealBreachUpdate(sealData);
        }
      };

      window.__stepSimFrame = stepSimulationFrame;
      stepSimulationFrame(time, delta);

      // ── Animate Dynamic Network Dash Lines between Selected Part and Connected Parts ──
      if (selectedPartIdRef.current && (isTransitioningRef.current || frameCount % 3 === 0)) {
        const selPart = getPartById(selectedPartIdRef.current);
        if (selPart && container) {
          const selMesh = findMeshForPart(selectedPartIdRef.current);
          if (selMesh) {
            const selWorld = new THREE.Vector3();
            selMesh.getWorldPosition(selWorld);
            const selProj = selWorld.clone().project(camera);
            const w = container.clientWidth;
            const h = container.clientHeight;
            const targetX = (selProj.x * 0.5 + 0.5) * w;
            const targetY = (-selProj.y * 0.5 + 0.5) * h;

            const nodes = [];
            for (const connId of (selPart.connectsTo || [])) {
              const connPart = getPartById(connId);
              const connMesh = findMeshForPart(connId);
              if (connPart && connMesh) {
                const cWorld = new THREE.Vector3();
                connMesh.getWorldPosition(cWorld);
                const cProj = cWorld.clone().project(camera);
                if (cProj.z < 1.0) {
                  nodes.push({
                    id: connId,
                    name: connPart.name,
                    x: (cProj.x * 0.5 + 0.5) * w,
                    y: (-cProj.y * 0.5 + 0.5) * h,
                    targetX,
                    targetY
                  });
                }
              }
            }
            setConnectedPartPositions(nodes);
          }
        }
      }

      // Continuous Dead-Center Gimbal Camera Tracking (Zero Disturbances)
      if (!isTransitioningRef.current && !selectedPartIdRef.current) {
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
            // Part A: Mast, Whip Antenna, GPS Patch, Anemometer & Flexible Solar Wrap Framing
            localCam = new THREE.Vector3(2.10, CONFIG.BUOY_RADIUS_3D + 1.25, 3.60);
            localTarget = new THREE.Vector3(0, CONFIG.BUOY_RADIUS_3D + 0.85, 0.05);
          } else if (sceneElementsRef.current.cameraPreset === 'electronics_c') {
            // Part C: Subsea Winch Mechanism, BLDC Motor, Slip Rings, HDPE Keel Tubes & Docking Cradle
            localCam = new THREE.Vector3(2.20, -CONFIG.BUOY_RADIUS_3D - 0.50, 3.40);
            localTarget = new THREE.Vector3(0.0, -CONFIG.BUOY_RADIUS_3D - 0.90, 0.10);
          } else {
            // Part B: Watertight Avionics Bay, PCB & LiFePO4 Battery Compartment
            localCam = new THREE.Vector3(0.70, 0.40, 1.45);
            localTarget = new THREE.Vector3(0.0, 0.02, 0.22);
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

      // In Part B (PCB & heating pads macro inspection), hide distracting exterior elements
      // (ocean, glaciers, atmosphere, and outer hull shell) so the internal avionics chamber
      // is 100% crisp, studio-isolated, and free of clipping slabs, floating pad-eyes, or square pixel bands
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
      if (glaciers) {
        glaciers.visible = !isPartB;
      }
      if (atmosphere && atmosphere.group) {
        atmosphere.group.visible = !isPartB;
      }
      if (underwater && underwater.group) {
        underwater.group.visible = !isPartB;
      }
      if (ctd && ctd.sondeGroup) {
        ctd.sondeGroup.visible = !isPartB;
      }
      if (seal && seal.sealRoot) {
        seal.sealRoot.visible = !isPartB;
      }
      if (buoy) {
        if (buoy.acrylicWindow) buoy.acrylicWindow.visible = !isPartB;
        if (buoy.hullGroup) buoy.hullGroup.visible = !isPartB;
        if (buoy.solarGroup) buoy.solarGroup.visible = !isPartB;
      }

      controls.update();

      // Update post-processing uniforms (vignette, analog film grain & lens spray)
      postProcessing.update(time, camera.position.y, sceneElementsRef.current.cameraPreset);

      // Render via Post-Processing Composer (ACES tone mapping, bloom, vignette, grain, FXAA)
      postProcessing.composer.render();
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

    // Deep-link query param support for inspection / hover testing (?inspect=partId or ?hover=partId)
    const urlParams = new URLSearchParams(window.location.search);
    const inspectParam = urlParams.get('inspect');
    const hoverParam = urlParams.get('hover');
    if (inspectParam) {
      setTimeout(() => {
        if (selectPartRef.current) selectPartRef.current(inspectParam);
      }, 800);
    } else if (hoverParam) {
      setTimeout(() => {
        if (window.__debug && window.__debug.hoverPart) window.__debug.hoverPart(hoverParam);
      }, 800);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      if (sceneElementsRef.current.currentEnvMap) {
        sceneElementsRef.current.currentEnvMap.dispose();
      }
      if (sceneElementsRef.current.currentSkyTexture) {
        sceneElementsRef.current.currentSkyTexture.dispose();
      }
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

  // Update VFX Quality Settings & Tier
  useEffect(() => {
    if (sceneElementsRef.current && sceneElementsRef.current.postProcessing) {
      const pp = sceneElementsRef.current.postProcessing;
      sceneElementsRef.current.bloomEnabled = vfxSettings.bloom !== false;
      pp.setBloomEnabled(vfxSettings.bloom !== false);
      if (vfxSettings.bloomStrength !== undefined) {
        pp.setBloomStrength(vfxSettings.bloomStrength);
      }
      if (vfxSettings.quality) {
        pp.setQualityTier(vfxSettings.quality);
        if (sceneElementsRef.current.sunLight) {
          const mapSize = vfxSettings.quality === 'low' ? 512 : (vfxSettings.quality === 'medium' ? 1024 : 2048);
          sceneElementsRef.current.sunLight.shadow.mapSize.set(mapSize, mapSize);
          sceneElementsRef.current.sunLight.castShadow = vfxSettings.quality !== 'low';
        }
      }
      if (vfxSettings.toneMapping) {
        pp.setToneMapping(vfxSettings.toneMapping);
      }
      if (vfxSettings.vignette !== undefined) {
        pp.setVignetteGrainEnabled(vfxSettings.vignette);
      }
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
      if (scene.background && scene.background.isColor) {
        scene.background.setHex(activeRegion.seaPhysics.fogColor);
      }
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
    const curTime = sceneElementsRef.current?.clock ? sceneElementsRef.current.clock.getElapsedTime() : 0;
    currentModel.setSeason(season, curTime);

    const { sunLight, skyLight, atmosphere, scene, renderer } = sceneElementsRef.current;
    if (atmosphere && atmosphere.setSeason) {
      atmosphere.setSeason(season);
    }

    // Update Seasonal HDR Polar Environment Map
    if (renderer && scene) {
      if (sceneElementsRef.current.currentEnvMap) {
        sceneElementsRef.current.currentEnvMap.dispose();
      }
      if (sceneElementsRef.current.currentSkyTexture) {
        sceneElementsRef.current.currentSkyTexture.dispose();
      }
      const { envMap: newEnvMap, skyTexture: newSkyTexture } = generatePolarEnvironmentMap(renderer, season);
      sceneElementsRef.current.currentEnvMap = newEnvMap;
      sceneElementsRef.current.currentSkyTexture = newSkyTexture;
      scene.environment = newEnvMap;
      if (sceneElementsRef.current.ocean && sceneElementsRef.current.ocean.setSkyTexture) {
        sceneElementsRef.current.ocean.setSkyTexture(newSkyTexture);
      }
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
        // Part B: Watertight Avionics Bay, PCB & LiFePO4 Battery Compartment
        buoy.buoyRoot.updateMatrixWorld(true);
        localCam = new THREE.Vector3(0.70, 0.40, 1.45);
        localTarget = new THREE.Vector3(0.0, 0.02, 0.22);
        targetCamPos = localCam.clone().applyMatrix4(buoy.buoyRoot.matrixWorld);
        targetLookAt = localTarget.clone().applyMatrix4(buoy.buoyRoot.matrixWorld);
        break;
      case 'electronics_a':
        // Part A: Mast, Whip Antenna, GPS Patch, Anemometer & Flexible Solar Wrap Framing
        buoy.buoyRoot.updateMatrixWorld(true);
        localCam = new THREE.Vector3(2.10, CONFIG.BUOY_RADIUS_3D + 1.25, 3.60);
        localTarget = new THREE.Vector3(0, CONFIG.BUOY_RADIUS_3D + 0.85, 0.05);
        targetCamPos = localCam.clone().applyMatrix4(buoy.buoyRoot.matrixWorld);
        targetLookAt = localTarget.clone().applyMatrix4(buoy.buoyRoot.matrixWorld);
        break;
      case 'electronics_c':
        // Part C: Subsea Winch Mechanism, BLDC Motor, Slip Rings, HDPE Keel Tubes & Docking Cradle
        buoy.buoyRoot.updateMatrixWorld(true);
        localCam = new THREE.Vector3(2.20, -CONFIG.BUOY_RADIUS_3D - 0.50, 3.40);
        localTarget = new THREE.Vector3(0.0, -CONFIG.BUOY_RADIUS_3D - 0.90, 0.10);
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

    let targetFov = 45;
    switch (cameraPreset) {
      case 'wide': targetFov = 52; break;
      case 'buoy': targetFov = 44; break;
      case 'electronics':
      case 'electronics_b':
      case 'exploded': targetFov = 40; break;
      case 'electronics_a': targetFov = 44; break;
      case 'electronics_c': targetFov = 42; break;
      case 'ctd': targetFov = 38; break;
      case 'seal': targetFov = 42; break;
      case 'anchor': targetFov = 38; break;
      case 'station': targetFov = 50; break;
      case 'ship': targetFov = 48; break;
      default: targetFov = 45; break;
    }

    gsap.to(camera, {
      fov: targetFov,
      duration: 1.5,
      ease: "power3.inOut",
      onUpdate: () => camera.updateProjectionMatrix()
    });

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
      <PartInspector
        selectedPartId={selectedPartId}
        hoveredPart={hoveredPart}
        onSelectPart={(id) => {
          if (selectPartRef.current) selectPartRef.current(id);
        }}
        onDeselectPart={() => {
          if (deselectPartRef.current) deselectPartRef.current();
        }}
        connectedPartPositions={connectedPartPositions}
        heaterState={heaterState}
        onSetHeaterState={onSetHeaterState}
        onResetTrip={onResetTrip}
        onInjectFault={onInjectFault}
      />

      {/* ── Regional Ocean Current & Drift Readout (Prydz Bay MIZ) ── */}
      <CurrentDriftHUD
        selectedPartId={selectedPartId}
        isTourRunning={isTourRunning}
        onRerollSeed={handleRerollSeed}
        telemetrySubscriberRef={telemetrySubscriberRef}
      />
    </div>
  );
}
