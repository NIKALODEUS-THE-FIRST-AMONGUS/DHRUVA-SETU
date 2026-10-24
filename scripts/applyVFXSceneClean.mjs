import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/3d/VFXScene.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import and scratchpads
const importTarget = "import { Navigation, RefreshCw } from 'lucide-react';";
const scratchpads = `import { Navigation, RefreshCw } from 'lucide-react';
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
const _currentFlow = { x: 0, z: 0 };`;

if (content.includes(importTarget)) {
  content = content.replace(importTarget, scratchpads);
}

// 2. Replace state definitions
const oldStateBlock = `  const lastBuoyPosRef = useRef(null);

  // Regional Prydz Bay MIZ current & drift telemetry state
  const [currentTelemetry, setCurrentTelemetry] = useState(() => {
    const initData = currentModel.get(0);
    return {
      headingDeg: initData.headingDeg,
      speedMps: initData.speedMps,
      speedCmpSec: initData.speedCmpSec,
      seed: currentModel.getSeed(),
      seasonName: initData.seasonName
    };
  });`;

const newStateBlock = `  const lastBuoyPosRef = useRef(new THREE.Vector3());
  const telemetrySubscriberRef = useRef(null);`;

if (content.includes(oldStateBlock)) {
  content = content.replace(oldStateBlock, newStateBlock);
}

// 3. Update handleRerollSeed
const oldReroll = `      setCurrentTelemetry({
        headingDeg: data.headingDeg,
        speedMps: data.speedMps,
        speedCmpSec: data.speedCmpSec,
        seed: newSeed,
        seasonName: data.seasonName
      });`;

const newReroll = `      if (telemetrySubscriberRef.current) {
        telemetrySubscriberRef.current({
          headingDeg: data.headingDeg,
          speedMps: data.speedMps,
          speedCmpSec: data.speedCmpSec,
          seed: newSeed,
          seasonName: data.seasonName
        });
      }`;

if (content.includes(oldReroll)) {
  content = content.replace(oldReroll, newReroll);
}

// 4. Update window.__debug.setSeed
const oldDebugSeed = `      setCurrentTelemetry({
        headingDeg: data.headingDeg,
        speedMps: data.speedMps,
        speedCmpSec: data.speedCmpSec,
        seed: Number(n),
        seasonName: data.seasonName
      });`;

const newDebugSeed = `      if (telemetrySubscriberRef.current) {
        telemetrySubscriberRef.current({
          headingDeg: data.headingDeg,
          speedMps: data.speedMps,
          speedCmpSec: data.speedCmpSec,
          seed: Number(n),
          seasonName: data.seasonName
        });
      }`;

if (content.includes(oldDebugSeed)) {
  content = content.replace(oldDebugSeed, newDebugSeed);
}

// 5. Update animate top (delta clamping & visibility gating)
const oldAnimateTop = `    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const rawTime = sceneElementsRef.current.clock.getElapsedTime();
      const time = isTimeFrozen ? frozenTimestamp : rawTime;
      const delta = isTimeFrozen ? 0.0 : Math.min(0.1, time - lastTime);
      lastTime = rawTime;`;

const newAnimateTop = `    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Clamp delta to prevent integration spikes when switching tabs or recovering from frame hitches
      const rawTime = sceneElementsRef.current.clock.getElapsedTime();
      const time = isTimeFrozen ? frozenTimestamp : rawTime;
      const delta = isTimeFrozen ? 0.0 : Math.min(0.05, Math.max(0.001, time - lastTime));
      lastTime = rawTime;

      // Visibility gating: skip heavy render passes when tab is hidden
      if (document.hidden) {
        return;
      }`;

if (content.includes(oldAnimateTop)) {
  content = content.replace(oldAnimateTop, newAnimateTop);
}

// 6. Hoisted sky / fog colors
const oldSkyColors = `        const targetColor = new THREE.Color(skyHex);
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
        renderer.setClearColor(scene.fog.color, 1.0);`;

const newSkyColors = `        _targetColor.set(skyHex);
        scene.fog.color.lerp(_targetColor, 0.08);
        scene.fog.density = season === 'autumn' ? 0.016 : 0.0065;
        renderer.setClearColor(scene.fog.color, 1.0);
      } else {
        // Underwater: Physical Beer-Lambert Ocean Depth Extinction Gradient
        const subDepth = Math.min(60.0, Math.abs(camY));
        const depthNorm = Math.min(1.0, subDepth / 45.0);

        _targetSubseaColor.copy(_shallowSubsea).lerp(_deepAbyss, depthNorm);
        scene.fog.color.lerp(_targetSubseaColor, 0.12);
        scene.fog.density = 0.016 + depthNorm * 0.012;
        scene.background = _targetSubseaColor;
        renderer.setClearColor(scene.fog.color, 1.0);`;

if (content.includes(oldSkyColors)) {
  content = content.replace(oldSkyColors, newSkyColors);
}

// 7. currentFlow and telemetry loop update
const oldFlowAndTelemetry = `        const currentData = currentModel.get(t);
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
        underwater.update(t, dt, buoy.buoyRoot.position, currentData, camera.position.y);
        splash.update(dt, currentData.wind);

        // Update telemetry readout HUD state every 10 frames
        if (frameCount % 10 === 0) {
          setCurrentTelemetry({
            headingDeg: currentData.headingDeg,
            speedMps: currentData.speedMps,
            speedCmpSec: currentData.speedCmpSec,
            seed: currentData.seed,
            seasonName: currentData.seasonName
          });
        }`;

const newFlowAndTelemetry = `        const currentData = currentModel.get(t);
        _currentFlow.x = currentData.x;
        _currentFlow.z = currentData.z;
        const currentFlow = _currentFlow;

        // Updates
        if (ocean.setFlowDirection) {
          ocean.setFlowDirection(currentData.x, currentData.z);
        }
        ocean.material.uniforms.u_buoyPos.value.set(buoyX, buoyZ);
        ocean.update(t, dt);
        seaIceFloes.update(t, currentData);
        bharatiStation.update(t);
        atmosphere.update(t);
        underwater.update(t, dt, buoy.buoyRoot.position, currentData, camera.position.y);
        splash.update(dt, currentData.wind);

        // Update telemetry readout HUD state every 10 frames without re-rendering VFXScene
        if (frameCount % 10 === 0 && telemetrySubscriberRef.current) {
          telemetrySubscriberRef.current({
            headingDeg: currentData.headingDeg,
            speedMps: currentData.speedMps,
            speedCmpSec: currentData.speedCmpSec,
            seed: currentData.seed,
            seasonName: currentData.seasonName
          });
        }`;

if (content.includes(oldFlowAndTelemetry)) {
  content = content.replace(oldFlowAndTelemetry, newFlowAndTelemetry);
}

// 8. Replace camera tracking allocations
const oldTracking = `          const sondePos = new THREE.Vector3();
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
          camera.position.copy(idealCamPos);`;

const newTracking = `          ctd.sondeGroup.getWorldPosition(_sondePos);

          controls.target.x += (_sondePos.x - controls.target.x) * 0.14;
          controls.target.y += (_sondePos.y + 0.15 - controls.target.y) * 0.14;
          controls.target.z += (_sondePos.z - controls.target.z) * 0.14;

          const desiredCamX = _sondePos.x + 0.4;
          const desiredCamY = _sondePos.y - 0.20;
          const desiredCamZ = _sondePos.z + 3.2;
          camera.position.x += (desiredCamX - camera.position.x) * 0.14;
          camera.position.y += (desiredCamY - camera.position.y) * 0.14;
          camera.position.z += (desiredCamZ - camera.position.z) * 0.14;
        } else if (sceneElementsRef.current.cameraPreset?.startsWith('electronics')) {
          // Macro inspection angle (Parts A, B, C) - Rigid Zero-Shake Frame of Reference Lock
          buoy.buoyRoot.updateMatrixWorld(true);

          if (sceneElementsRef.current.cameraPreset === 'electronics_a') {
            _idealCamPos.copy(_localCamA).applyMatrix4(buoy.buoyRoot.matrixWorld);
            _idealTarget.copy(_localTargetA).applyMatrix4(buoy.buoyRoot.matrixWorld);
          } else if (sceneElementsRef.current.cameraPreset === 'electronics_c') {
            _idealCamPos.copy(_localCamC).applyMatrix4(buoy.buoyRoot.matrixWorld);
            _idealTarget.copy(_localTargetC).applyMatrix4(buoy.buoyRoot.matrixWorld);
          } else {
            _idealCamPos.copy(_localCamB).applyMatrix4(buoy.buoyRoot.matrixWorld);
            _idealTarget.copy(_localTargetB).applyMatrix4(buoy.buoyRoot.matrixWorld);
          }

          // Rigid zero-shake lock: zero relative wobble or vibration relative to the buoy
          controls.target.copy(_idealTarget);
          camera.position.copy(_idealCamPos);`;

if (content.includes(oldTracking)) {
  content = content.replace(oldTracking, newTracking);
}

// 9. Replace lastBuoyPosRef allocation
const oldBuoyClone = `lastBuoyPosRef.current = buoy.buoyRoot.position.clone();`;
const newBuoyClone = `lastBuoyPosRef.current.copy(buoy.buoyRoot.position);`;
if (content.includes(oldBuoyClone)) {
  content = content.replace(oldBuoyClone, newBuoyClone);
}

// 10. Replace connected parts allocation
const oldConnAlloc = `          const selMesh = findMeshForPart(selectedPartIdRef.current);
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
          }`;

const newConnAlloc = `          const selMesh = findMeshForPart(selectedPartIdRef.current);
          if (selMesh) {
            selMesh.getWorldPosition(_selWorld);
            _selProj.copy(_selWorld).project(camera);
            const w = container.clientWidth;
            const h = container.clientHeight;
            const targetX = (_selProj.x * 0.5 + 0.5) * w;
            const targetY = (-_selProj.y * 0.5 + 0.5) * h;

            const nodes = [];
            for (const connId of (selPart.connectsTo || [])) {
              const connPart = getPartById(connId);
              const connMesh = findMeshForPart(connId);
              if (connPart && connMesh) {
                connMesh.getWorldPosition(_cWorld);
                _cProj.copy(_cWorld).project(camera);
                if (_cProj.z < 1.0) {
                  nodes.push({
                    id: connId,
                    name: connPart.name,
                    x: (_cProj.x * 0.5 + 0.5) * w,
                    y: (-_cProj.y * 0.5 + 0.5) * h,
                    targetX,
                    targetY
                  });
                }
              }
            }
            setConnectedPartPositions(nodes);
          }`;

if (content.includes(oldConnAlloc)) {
  content = content.replace(oldConnAlloc, newConnAlloc);
}

// 11. Cleanup function with recursive scene traversal
const oldCleanup = `    return () => {
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
    };`;

const newCleanup = `    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);

      // Recursive scene resource disposal to prevent WebGL VRAM leaks
      scene.traverse(obj => {
        if (obj.geometry && typeof obj.geometry.dispose === 'function') {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => {
              if (m.map) m.map.dispose();
              if (m.bumpMap) m.bumpMap.dispose();
              if (m.normalMap) m.normalMap.dispose();
              m.dispose();
            });
          } else {
            if (obj.material.map) obj.material.map.dispose();
            if (obj.material.bumpMap) obj.material.bumpMap.dispose();
            if (obj.material.normalMap) obj.material.normalMap.dispose();
            obj.material.dispose();
          }
        }
      });

      if (postProcessing && typeof postProcessing.dispose === 'function') {
        postProcessing.dispose();
      }

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
    };`;

if (content.includes(oldCleanup)) {
  content = content.replace(oldCleanup, newCleanup);
}

// 12. Replace inline current-drift-hud in JSX
const hudRegex = /\{\/\* ── Regional Ocean Current & Drift Readout \(Prydz Bay MIZ\) ── \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
const newHUDComponentJSX = `{/* ── Regional Ocean Current & Drift Readout (Prydz Bay MIZ) ── */}
      <CurrentDriftHUD
        selectedPartId={selectedPartId}
        isTourRunning={isTourRunning}
        onRerollSeed={handleRerollSeed}
        telemetrySubscriberRef={telemetrySubscriberRef}
      />`;

if (hudRegex.test(content)) {
  content = content.replace(hudRegex, newHUDComponentJSX);
} else {
  console.log('hudRegex did not match');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('VFXScene.jsx updated successfully!');
